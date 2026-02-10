

# Fix: Cache-Busting para Resolver SW Antigo do Luis

## Por que o fix atual pode nao estar funcionando

O problema tem duas camadas que criam um ciclo vicioso:

### Camada 1: CDN pode estar cacheando o arquivo do SW
O browser do Luis faz o byte-check do `firebase-messaging-sw.js` a cada navegacao. Desde o Chrome 68, o browser ignora o HTTP cache para esse check. Porem, a CDN do Lovable pode estar servindo a versao ANTIGA do arquivo antes que o request chegue ao servidor de origem. Ou seja: o browser pede a versao nova, mas a CDN responde com a velha.

### Camada 2: O codigo de limpeza nunca executa
O codigo de limpeza em `main.tsx` so roda se o Luis receber o `index.html` novo, que referencia os bundles JS novos. Mas se o browser dele tem o `index.html` antigo no HTTP cache, ele carrega os bundles antigos (que nao tem o codigo de limpeza).

Porem, o SW antigo do Firebase NAO tem `fetch` handler - requests passam direto pro browser. Entao o `index.html` deveria vir da rede... a menos que esteja cacheado pelo HTTP cache do browser.

## Solucao: Script inline no HTML + Headers de cache

### 1. `index.html` - Script inline de emergencia

Adicionar um `<script>` tag (nao `type="module"`) no `<head>` do `index.html`, ANTES do script principal. Este script:

- Roda sincronamente, antes de qualquer modulo
- Detecta e remove qualquer SW rogue (`firebase-messaging-sw.js`)
- Limpa TODOS os caches do CacheStorage (remove versoes antigas cacheadas)
- Forca reload apos limpeza

```html
<script>
// Emergency SW cleanup v1
(function() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    var dominated = false;
    for (var i = 0; i < regs.length; i++) {
      if (regs[i].active && regs[i].active.scriptURL &&
          regs[i].active.scriptURL.indexOf('firebase-messaging-sw.js') !== -1) {
        dominated = true;
        regs[i].unregister();
      }
    }
    if (dominated && 'caches' in window) {
      caches.keys().then(function(names) {
        return Promise.all(names.map(function(n) { return caches.delete(n); }));
      }).then(function() { location.reload(); });
    } else if (dominated) {
      location.reload();
    }
  });
})();
</script>
```

Este script e a defesa mais confiavel porque:
- Esta embutido no HTML, nao em um arquivo JS separado que pode estar cacheado
- Usa sintaxe ES5 pura (compativel com qualquer browser)
- Roda antes de qualquer outro JS da aplicacao

### 2. `public/_headers` - Prevenir cache da CDN em arquivos de SW

Criar arquivo `_headers` (convencao Netlify, que Lovable suporta via `_redirects`) para garantir que arquivos de Service Worker nunca sejam cacheados pela CDN:

```
/firebase-messaging-sw.js
  Cache-Control: no-cache, no-store, must-revalidate

/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
```

Isso garante que futuros updates do SW sejam entregues imediatamente, sem cache da CDN.

### 3. `src/main.tsx` - Simplificar cleanup (manter como backup)

O cleanup existente em `main.tsx` permanece como camada extra de seguranca, sem alteracoes.

## Fluxo de recuperacao para o Luis

```text
Luis visita muzze.lovable.app
  |
  v
Browser faz request HTTP (SW antigo nao intercepta - sem fetch handler)
  |
  v
CDN/servidor entrega index.html (HTML tem TTL curto ou no-cache)
  |
  v
Script inline roda ANTES dos modulos JS
  |
  v
Detecta firebase-messaging-sw.js como SW ativo
  |
  v
Desregistra o SW rogue + limpa todos os caches
  |
  v
Forca reload da pagina
  |
  v
Pagina recarrega limpa: sem SW, sem caches antigos
  |
  v
Workbox registra sw.js como SW principal
  |
  v
App funciona com versao mais recente
```

## Defesa em profundidade (4 camadas)

| Camada | Arquivo | Quando atua |
|--------|---------|-------------|
| 1 (primaria) | `index.html` inline script | Assim que o HTML carrega, antes de qualquer JS |
| 2 | `firebase-messaging-sw.js` self-destruct | Quando o browser baixa a versao nova do SW |
| 3 | `main.tsx` cleanup | Quando os modulos JS carregam |
| 4 | `usePWAUpdate.ts` cleanup | Quando o React monta |

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `index.html` | Adicionar script inline de limpeza no `<head>` |
| `public/_headers` | Novo arquivo - cache headers para SWs |

Nenhuma mudanca em arquivos existentes alem de `index.html`.

