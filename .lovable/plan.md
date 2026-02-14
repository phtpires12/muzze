

## Correcao Urgente: Cadastro de Novos Usuarios Falhando

### Diagnostico

A causa raiz foi identificada: a coluna `current_workflow` na tabela `profiles` tem um valor padrao `'A'`, mas existe uma CHECK constraint que so aceita `classic`, `freestyle` ou `minimalist`. Quando um novo usuario se cadastra, o trigger `handle_new_user` insere um perfil sem especificar `current_workflow`, e o valor padrao `'A'` viola a constraint, fazendo todo o signup falhar.

### Correcoes necessarias

**1. Corrigir o default da coluna `current_workflow` (CRITICO)**

Executar uma migration SQL para alterar o valor padrao:

```sql
ALTER TABLE public.profiles 
ALTER COLUMN current_workflow SET DEFAULT 'classic';
```

Isso garante que novos usuarios recebam um valor valido automaticamente.

**2. Melhorar a resiliencia do error logger para signups**

Editar `src/lib/error-logger.ts`:

- Quando `user_id` for null (como durante signup falhado), inserir o log com `user_id = null` usando um fallback que nao dependa do RLS
- Alternativa: adicionar um `console.error` explicito para que erros de signup pelo menos aparecam no console do navegador

Editar a RLS policy de `analytics_events`:

```sql
DROP POLICY "Users can insert own analytics events" ON analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);
```

Isso permite que erros sejam logados mesmo sem autenticacao.

### Impacto

- A correcao principal (item 1) resolve imediatamente o problema de cadastro para todos os usuarios
- A correcao secundaria (item 2) garante que futuros erros de signup sejam visíveis nos logs
