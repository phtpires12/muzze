-- Add DELETE policy to profiles table to allow users to delete their own profile
-- This is required for GDPR/LGPD compliance (right to be forgotten)

CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);