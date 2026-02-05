
# Plano: Garantir Atualização Automática do PWA (Eliminar Cache Obsoleto)

## Problema Identificado

O Service Worker do PWA está servindo arquivos antigos do cache. Mesmo com configurações como `skipWaiting: true`, o cache persistente pode causar:
- JSON bruto aparecendo nos cards (layout antigo)
- Funcionalidades corrigidas (Shift+Enter, imagens) não aparecendo
- Necessidade de reinstalar o app para ver atualizações

## Causa Raiz

1. **Cache agressivo**: O Service Worker mantém arquivos JS/CSS em cache
2. **Detecção lenta**: Verificação de updates a cada 60 segundos pode não ser suficiente
3. **Sem forçar reload**: Quando nova versão é detectada, não força reload imediato

---

## Solução Técnica

### 1. Verificação mais frequente de atualizações

Reduzir intervalo de verificação e adicionar verificação ao focar na aba:

```typescript
// usePWAUpdate.ts
onRegisteredSW(swUrl, registration) {
  if (registration) {
    // Verificar a cada 30 segundos
    setInterval(() => registration.update(), 30 * 1000);
    
    // Verificar quando a aba ganha foco
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        registration.update();
      }
    });
  }
}
```

### 2. Forçar atualização imediata sem overlay

Quando nova versão é detectada, atualizar imediatamente sem esperar interação:

```typescript
useEffect(() => {
  if (needRefresh && !autoUpdateTriggeredRef.current) {
    autoUpdateTriggeredRef.current = true;
    console.log('[PWA] New version detected, forcing immediate update...');
    updateServiceWorker(true); // Sem delay
  }
}, [needRefresh, updateServiceWorker]);
```

### 3. Adicionar indicador de versão visível no app

Mostrar versão atual na tela para debug fácil:

```typescript
// No Settings ou DevTools, já existe BuildInfo
// Adicionar log no console para fácil verificação
console.log(`[Muzze] Build: ${getShortBuildId()}`);
```

### 4. Invalidar cache de navegação

Adicionar estratégia NetworkFirst para todos os arquivos JS/CSS principais:

```typescript
// vite.config.ts - workbox.runtimeCaching
{
  urlPattern: /\.(js|css)$/,
  handler: "NetworkFirst",
  options: {
    cacheName: "assets-cache",
    expiration: {
      maxAgeSeconds: 60 * 60 * 2, // 2 horas
    },
    networkTimeoutSeconds: 3,
  }
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/usePWAUpdate.ts` | Verificar mais frequente, update no focus, forçar reload imediato |
| `src/main.tsx` | Log da versão atual no console |
| `vite.config.ts` | NetworkFirst para JS/CSS |

---

## Resultado Esperado

- Updates são detectados em até 30 segundos (vs 60s atual)
- Quando aba ganha foco, verifica updates imediatamente
- Nova versão atualiza automaticamente sem intervenção do usuário
- Log no console permite verificar qual versão está rodando
- Cache de JS/CSS busca do servidor primeiro (NetworkFirst)

---

## Ação Imediata para Você

Enquanto implemento as melhorias, faça isso para forçar a atualização agora:

**No Safari/Chrome (desktop):**
1. Abra DevTools (F12 ou Cmd+Option+I)
2. Vá em Application → Service Workers
3. Clique "Unregister" em todos
4. Faça hard refresh: Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)

**No PWA instalado (iOS/Android):**
1. Feche completamente o app (swipe up)
2. Reabra o app
3. Se persistir: desinstale e reinstale
