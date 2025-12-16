-- Add email column to workspace_members to store member's email
ALTER TABLE public.workspace_members ADD COLUMN IF NOT EXISTS email TEXT;

-- Policy to allow users to delete their own invite after accepting
CREATE POLICY "Users can delete own invite after accepting"
ON public.workspace_invites
FOR DELETE
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);