-- Create Production Settings table
CREATE TABLE IF NOT EXISTS public.production_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT false,
    work_days INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5], -- Monday to Friday by default (0 is Sunday, 6 is Saturday)
    stage_slas JSONB DEFAULT '{"ideation": 1, "script": 1, "review": 1, "recording": 1, "editing": 1, "design": 1}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for production_settings
ALTER TABLE public.production_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for production_settings
CREATE POLICY "Users can view their own production settings"
    ON public.production_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own production settings"
    ON public.production_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own production settings"
    ON public.production_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create Production Schedules table
CREATE TABLE IF NOT EXISTS public.production_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stage TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for production_schedules
ALTER TABLE public.production_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for production_schedules
CREATE POLICY "Users can view their own production schedules"
    ON public.production_schedules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own production schedules"
    ON public.production_schedules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own production schedules"
    ON public.production_schedules FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own production schedules"
    ON public.production_schedules FOR DELETE
    USING (auth.uid() = user_id);

-- Add stage_progress column to scripts if it doesn't exist
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS stage_progress JSONB DEFAULT '{}'::jsonb;
