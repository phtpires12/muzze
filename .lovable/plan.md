

## Painel de Gerenciamento de Usuarios no Dev Tools

### O que sera criado
Um novo card dentro da pagina Dev Tools com uma lista de todos os usuarios cadastrados, mostrando email, username, plano atual e permitindo alterar o plano de qualquer usuario diretamente.

### Abordagem tecnica

**1. Nova funcao no banco de dados (SECURITY DEFINER)**

Criar `admin_list_users` -- uma funcao que retorna todos os perfis com email, username e plan_type. Apenas admins/developers podem chama-la (validacao interna via `has_role`). Isso contorna o RLS da tabela `profiles` de forma segura.

```sql
CREATE FUNCTION admin_list_users()
RETURNS TABLE(user_id uuid, email text, username text, plan_type text, created_at timestamptz)
SECURITY DEFINER
-- Valida internamente que o caller e admin ou developer
```

**2. Novo componente: `src/components/dev/AdminUserManager.tsx`**

- Lista todos os usuarios em uma tabela compacta
- Colunas: Email, Username, Plano Atual, Acoes
- Campo de busca por email/username para filtrar a lista
- Botoes inline (Free / Pro / Studio) para trocar o plano de cada usuario
- Usa o RPC `admin_set_plan_type` ja existente para alterar planos
- Badge colorido indicando o plano atual de cada usuario
- Botao de refresh para atualizar a lista

**3. Editar `src/pages/DevTools.tsx`**

- Importar e renderizar o `AdminUserManager` como um novo card na pagina

### Seguranca
- A funcao `admin_list_users` valida que o chamador tem role `admin` ou `developer` antes de retornar dados
- O RPC `admin_set_plan_type` ja possui essa mesma validacao
- Nenhum dado sensivel (senha, tokens) e exposto -- apenas email, username e plan_type
