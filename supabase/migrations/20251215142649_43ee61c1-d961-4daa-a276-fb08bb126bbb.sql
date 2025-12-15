-- Remover política problemática que tenta acessar auth.users
DROP POLICY IF EXISTS "Invitees can view own invites" ON workspace_invites;

-- Recriar usando auth.email() em vez de subquery em auth.users
CREATE POLICY "Invitees can view own invites"
ON workspace_invites
FOR SELECT
USING (
  email = auth.email()
);