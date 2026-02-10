

# Fix: Forçar limpeza para usuários presos no SW antigo

## Diagnóstico

O Luis estava preso num ciclo onde o Service Worker antigo servia o `index.html` do cache, impedindo que o script de limpeza de emergência (que adicionamos no `<body>`) chegasse até ele. Limpar cookies/cache manualmente quebrou o ciclo.

O script de emergência no `index.html` protege novos usuários, mas não alcança quem já está preso com o SW antigo servindo HTML cacheado.

## Solução

Transformar o `firebase-messaging-sw.js` em uma arma de auto-destruição mais agressiva. Como o Workbox importa esse arquivo via `importScripts`, qualquer mudança nele faz o browser detectar que o SW mudou (byte-check) e baixar a versão atualizada. Quando o SW atualizado roda, ele pode forçar a limpeza dos caches e o reload dos clients.

### Mudanças

#### 1. `public/firebase-messaging-sw.js` - Auto-destruição mais agressiva

Atualizar o script de self-destruct para:
- Na ativação: limpar TODOS os caches do CacheStorage (não só desregistrar)
- Forçar reload de todos os clients abertos
- Incrementar o comentário de versão (de `v2` para `v3`) para garantir que o byte-check detecte a mudança

```javascript
// Self-destruct v3 - aggressive cache cleanup
if (self.registration && self.registration.active &&
    self.registration.active.scriptURL.includes('firebase-messaging-sw.js')) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      // Limpar TODOS os caches antes de desregistrar
      caches.keys()
        .then(names => Promise.all(names.map(n => caches.delete(n))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll())
        .then(clients => {
          clients.forEach(client => client.navigate(client.url));
        })
    );
  });
}
```

Isso garante que mesmo os usuários presos no ciclo do SW antigo recebam a limpeza automaticamente, sem precisar limpar cookies manualmente.

#### 2. Nenhuma outra mudança necessária

O `index.html` com o script de emergência no `<body>` e o `_headers` com cache-busting já estão corretos e funcionam como camadas extras de proteção.

## Fluxo de recuperação automática

```text
Usuario preso com SW antigo
  |
  v
Browser faz byte-check periodico do sw.js (a cada 24h ou navegação)
  |
  v
sw.js importa firebase-messaging-sw.js (versão v3, diferente da v2)
  |
  v
Browser detecta mudança no SW → instala versão nova
  |
  v
skipWaiting() → ativa imediatamente
  |
  v
Evento 'activate': limpa TODOS os caches + desregistra SW
  |
  v
Força reload de todos os clients
  |
  v
Página recarrega sem SW, sem caches → recebe HTML novo
  |
  v
Script de emergência no body roda (camada extra)
  |
  v
Workbox registra sw.js limpo como SW principal
```

## Resumo

| Arquivo | Mudança |
|---------|---------|
| `public/firebase-messaging-sw.js` | Atualizar self-destruct para v3: limpar caches + forçar reload |

