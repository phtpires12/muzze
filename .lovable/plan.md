
# Diagnóstico e Melhorias no Fluxo de Criação de Conta

## O que aconteceu

O email `guilhermebagatini@hotmail.com` **nao existe** no banco de dados — nem na tabela de autenticacao, nem na de perfis. Isso significa que a conta nunca foi criada com sucesso.

### Causa provavel

O trigger `handle_new_user` (que cria perfil, streak, settings e workspace automaticamente) esta tecnicamente correto. Todas as tabelas tem valores padrao adequados. O cenario mais provavel e:

1. **Instabilidade temporaria na conexao** — Um erro 503 foi detectado nos logs de rede recentes, indicando que o banco estava temporariamente indisponivel no momento do signup.
2. **Rollback automatico** — Quando o trigger falha por qualquer motivo (timeout, conexao perdida), o sistema de autenticacao faz rollback completo e o usuario nao e criado em nenhuma tabela.

### O que NAO foi a causa
- Nao ha limite de usuarios no banco
- Nao ha campo obrigatorio sem valor padrao
- Nao ha constraint violada
- O trigger esta sintaticamente correto

## Plano de melhorias

### 1. Melhorar tratamento de erros no signup (Screen21Signup e DesktopOnboarding)

Traduzir mensagens de erro genéricas como "Database error saving new user" para mensagens claras em portugues, com orientacao para o usuario tentar novamente.

**Arquivos**: 
- `src/components/onboarding/screens/phase6/Screen21Signup.tsx`
- `src/components/onboarding/DesktopOnboarding.tsx`

Adicionar na funcao `translateAuthError`:
```
'Database error saving new user': 'Erro temporario ao criar sua conta. Por favor, tente novamente em alguns segundos.'
```

### 2. Adicionar retry automatico no signup

Quando o erro for do tipo "Database error", tentar automaticamente mais uma vez apos 2 segundos antes de mostrar o erro ao usuario.

**Arquivos**:
- `src/components/onboarding/screens/phase6/Screen21Signup.tsx`
- `src/components/onboarding/DesktopOnboarding.tsx`

### 3. Tornar o trigger handle_new_user mais resiliente

Adicionar tratamento de excecao (`EXCEPTION`) dentro do trigger para que, se uma das insercoes secundarias falhar (ex: workspace), as insercoes essenciais (perfil) ainda sejam salvas.

**Mudanca no banco**: Migration SQL para atualizar a funcao `handle_new_user` com bloco `BEGIN...EXCEPTION`.

### 4. Registrar erros de signup no error-logger

Usar o `logJavaScriptError` existente para registrar erros de signup na tabela `analytics_events`, facilitando debug futuro.

**Arquivo**: `src/components/onboarding/screens/phase6/Screen21Signup.tsx`, `src/components/onboarding/DesktopOnboarding.tsx`

## Detalhes tecnicos

### Trigger atualizado (handle_new_user)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Essencial: criar perfil
  INSERT INTO public.profiles (user_id, timezone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Sao_Paulo'));

  -- Secundarios: se falharem, nao impedem a criacao do usuario
  BEGIN
    INSERT INTO public.streaks (user_id) VALUES (NEW.id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.settings (user_id) VALUES (NEW.id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.workspaces (owner_id, name) VALUES (NEW.id, 'Meu Workspace');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$function$
```

### Retry no signup

```typescript
// Logica de retry: se o erro for "Database error", tentar mais uma vez
const signupWithRetry = async (email, password, retries = 1) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error && error.message.includes('Database error') && retries > 0) {
    await new Promise(r => setTimeout(r, 2000));
    return signupWithRetry(email, password, retries - 1);
  }
  return { data, error };
};
```

### Mapa de erros expandido

```typescript
const translateAuthError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'User already registered': 'Este email ja esta cadastrado. Tente fazer login.',
    'Database error saving new user': 'Erro temporario. Tente novamente em alguns segundos.',
    'Database error creating new user': 'Erro temporario. Tente novamente em alguns segundos.',
    // ... demais erros existentes
  };
};
```

## Resumo dos arquivos afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/onboarding/screens/phase6/Screen21Signup.tsx` | Retry automatico + erros traduzidos + log de erro |
| `src/components/onboarding/DesktopOnboarding.tsx` | Retry automatico + erros traduzidos + log de erro |
| Migration SQL | Trigger `handle_new_user` com tratamento de excecao |

## Sobre o usuario afetado

O usuario `guilhermebagatini@hotmail.com` pode simplesmente tentar criar a conta novamente — como nenhum registro foi salvo, nao ha conflito. Com as melhorias acima, se o mesmo erro temporario acontecer, o sistema vai tentar automaticamente de novo.
