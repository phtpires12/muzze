-- Remover política existente com problema de acesso a auth.users
DROP POLICY IF EXISTS "Users can delete own invite after accepting" ON workspace_invites;

-- Recriar política usando auth.email() que é a forma correta e segura
CREATE POLICY "Users can delete own invite after accepting"
  ON workspace_invites
  FOR DELETE
  USING (email = auth.email());