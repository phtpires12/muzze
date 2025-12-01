-- Add onboarding_data field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT NULL;

COMMENT ON COLUMN public.profiles.onboarding_data IS 'Stores user onboarding responses and calculated metrics';

-- Create index for better query performance on onboarding_data
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_data ON public.profiles USING GIN (onboarding_data);