
## Correção: Comemoração de upgrade aparece em todo login

### Causa raiz

O `useUpgradeDetector` usa `sessionStorage` para evitar repetição dentro da mesma sessão. Porém o `sessionStorage` é zerado quando o usuário fecha o browser ou abre uma nova aba. Na próxima sessão, o hook detecta uma "transição" de `null → pro` (enquanto o plan carrega) e, por isso, exibe a comemoração novamente — indefinidamente, a cada novo login.

### Solução

Adicionar uma coluna `upgrade_celebrated` (do tipo `jsonb`, default `{}`) na tabela `profiles` para registrar, por plano, se o usuário já assistiu à comemoração. Ao exibir a celebração, grava `{ "pro": true }` ou `{ "studio": true }` no banco. Na próxima vez que o usuário logar, o hook consulta esse campo e não exibe novamente.

Isso é server-side, persistente e seguro, seguindo exatamente o padrão recomendado.

### Detalhes técnicos

**1. Migração de banco**

Nova coluna na tabela `profiles`:
```sql
ALTER TABLE public.profiles 
ADD COLUMN upgrade_celebrated JSONB NOT NULL DEFAULT '{}';
```

**2. Hook `useUpgradeDetector.ts` — reescrita da lógica**

Fluxo novo:
- Ao detectar que o `planType` é `pro` ou `studio` (ao carregar o perfil), consultar a coluna `upgrade_celebrated` do perfil
- Se `upgrade_celebrated['pro']` for `true`, **não** disparar a celebração
- Se for `false` ou ausente, disparar a celebração e gravar `{ pro: true }` no banco via `UPDATE profiles SET upgrade_celebrated = upgrade_celebrated || '{"pro": true}'`
- Manter `sessionStorage` como proteção redundante (evita disparar duas vezes na mesma sessão enquanto o UPDATE ainda não chegou)

Para detectar se foi um upgrade real (e não apenas o primeiro load do usuário com plano pago), o hook verifica:
- O plano atual é `pro` ou `studio`
- A coluna `upgrade_celebrated` NÃO contém a flag para esse plano
- O usuário **não** é recém-cadastrado (tem `created_at` há mais de 1 minuto, por exemplo — evita disparar para contas novas que já entram como pro)

**3. Lógica de dismiss no `UpgradeCelebration.tsx`**

Ao clicar "Começar a criar" (último step), além do `dismiss()` atual, chamar um novo callback que grava no banco:
```typescript
await supabase
  .from('profiles')
  .update({ upgrade_celebrated: { ...current, [planType]: true } })
  .eq('user_id', userId);
```

**4. Função `dismiss` atualizada no hook**

O `dismiss` do hook aceitará um parâmetro `{ persist: boolean }`:
- `persist: true` → grava no banco (clicou "Começar a criar")
- `persist: false` → apenas fecha o overlay sem gravar (usado pelo `simulateUpgrade` do DevTools, para poder simular múltiplas vezes)

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar — coluna `upgrade_celebrated JSONB` na `profiles` |
| `src/hooks/useUpgradeDetector.ts` | Alterar — ler e gravar `upgrade_celebrated` no banco |
| `src/components/upgrade/UpgradeCelebration.tsx` | Alterar — chamar `dismiss({ persist: true })` no último step |

### O que NÃO muda

- A simulação via DevTools (`simulateUpgrade`) continua funcionando (usa `dismiss({ persist: false })`)
- O fluxo de slides e animações é idêntico
- Nenhuma outra parte do sistema é afetada
