

## Plano: Corrigir Sistema de Verificacao de Versao

### Problema Identificado

O sistema de atualizacao forcada esta em loop infinito porque a edge function `app-version` gera um timestamp novo **a cada requisicao**, nao a cada deploy.

```typescript
// O BUG - Linha 10 de app-version/index.ts
const APP_VERSION = new Date().toISOString();
// Isso e executado CADA VEZ que a funcao e chamada!
```

**Resultado:** A cada 60 segundos o app detecta uma "nova versao" e forca atualizacao.

---

### Por que isso acontece no preview e NAO afetara producao

| Ambiente | Comportamento | Risco |
|----------|--------------|-------|
| Preview | Cada request = timestamp diferente = loop | Alto - inutilizavel |
| Producao | Cada request = timestamp diferente = loop | Alto - mesmo problema |

O problema **afetara producao** sim! A edge function e a mesma. Precisa ser corrigido antes de publicar.

---

### Solucao: Usar Build Timestamp Estatico

Em vez de gerar timestamp dinamicamente na edge function, usaremos uma abordagem hibrida:

1. **Remover a edge function `app-version`** - ela e fundamentalmente falha
2. **Usar o timestamp de build do Vite** - que ja esta definido em `vite.config.ts`
3. **Simplificar para PWA-only updates** - o service worker ja detecta mudancas corretamente

---

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/app-version/index.ts` | Excluir (funcao fundamentalmente falha) |
| `src/hooks/useVersionCheck.ts` | Excluir (depende da edge function) |
| `src/App.tsx` | Remover import e uso do useVersionCheck |
| `src/components/UpdateOverlay.tsx` | Manter (usado pelo PWA update) |
| `src/hooks/usePWAUpdate.ts` | Atualizar para ser o unico mecanismo de update |
| `index.html` | Remover script de cache clear (redundante e problematico) |

---

### Como o PWA Update Funciona (Mecanismo Correto)

O `vite-plugin-pwa` ja implementa deteccao de versao corretamente:

1. Cada build gera um novo service worker com hash unico
2. O browser detecta mudanca no SW automaticamente
3. `useRegisterSW` dispara `needRefresh` quando ha atualizacao
4. O overlay aparece e atualiza automaticamente

```text
   BUILD 1                    BUILD 2
┌─────────────┐           ┌─────────────┐
│  sw.js      │           │  sw.js      │
│  hash: abc  │    →      │  hash: xyz  │
└─────────────┘           └─────────────┘
       │                         │
       └───────────┬─────────────┘
                   ↓
          Browser detecta mudanca
                   ↓
          needRefresh = true
                   ↓
          Overlay + Auto-reload
```

---

### Mudancas Detalhadas

**1. src/App.tsx**
- Remover import de `useVersionCheck`
- Remover chamada `const { isUpdating } = useVersionCheck();`
- Manter apenas `const { needRefresh } = usePWAUpdate();`
- Simplificar `showUpdateOverlay = needRefresh`

**2. src/hooks/usePWAUpdate.ts**
- Aumentar intervalo de check de 15s para 60s (menos agressivo)
- Manter auto-update quando detecta nova versao

**3. index.html**
- Remover o script inline de cache clear (linhas 40-84)
- O script usa `Date.now()` que muda a cada load, causando problemas similares

---

### Nova Arquitetura de Updates

```text
ANTES (3 sistemas conflitantes):
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  index.html     │  │ useVersionCheck │  │  usePWAUpdate   │
│  cache clear    │  │ edge function   │  │  service worker │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────┬───────┴────────────────────┘
                      ↓
              Conflitos e loops!

DEPOIS (1 sistema limpo):
┌─────────────────────────────────────────────────────────┐
│                    usePWAUpdate                          │
│  • Usa service worker nativo do browser                  │
│  • Hash de arquivos muda apenas em novos builds          │
│  • Verifica a cada 60s se ha nova versao                 │
│  • Auto-reload quando detecta mudanca                    │
└─────────────────────────────────────────────────────────┘
```

---

### Ordem de Execucao

1. Excluir edge function `supabase/functions/app-version/`
2. Excluir hook `src/hooks/useVersionCheck.ts`
3. Atualizar `src/App.tsx` removendo useVersionCheck
4. Atualizar `src/hooks/usePWAUpdate.ts` (intervalo 60s)
5. Limpar script inline do `index.html`
6. Manter `UpdateOverlay.tsx` (ainda usado pelo PWA)

---

### Secao Tecnica

**Por que a edge function nao pode ser "consertada"?**

Edge functions Deno sao "cold start" - cada instancia pode ter um timestamp diferente. Mesmo salvando em variavel no topo do arquivo, multiplas instancias podem rodar simultaneamente. A unica forma de ter versao estavel seria:
- Salvar em banco de dados (complexo, overhead)
- Usar arquivo estatico (melhor, mas ja temos via PWA)

**Por que o service worker funciona?**

O Vite gera um arquivo `sw.js` com hash baseado no conteudo dos assets. Quando voce faz build, o hash muda. O browser compara automaticamente o SW atual com o novo e dispara evento de atualizacao.

**Sobre o Preview:**

No ambiente de preview da Lovable, cada mudanca de codigo gera um novo build. O PWA vai detectar isso normalmente, mas com intervalo de 60s (nao 15s), o que e muito menos intrusivo.

