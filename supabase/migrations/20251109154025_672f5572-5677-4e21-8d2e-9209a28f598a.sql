-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_workflow text DEFAULT 'A' CHECK (current_workflow IN ('A', 'B', 'C')),
  daily_goal_minutes integer DEFAULT 60,
  weekly_goal_minutes integer DEFAULT 420,
  min_streak_minutes integer DEFAULT 20,
  notifications_enabled boolean DEFAULT true,
  reminder_time time DEFAULT '09:00:00',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  preferred_session_minutes integer DEFAULT 25,
  username text,
  first_login boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create streaks table
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_event_date date,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_day integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create stage_times table
CREATE TABLE IF NOT EXISTS public.stage_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_item_id uuid,
  stage text CHECK (stage IN ('ideation', 'script', 'record', 'edit', 'review')),
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  duration_seconds integer,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.stage_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stage times"
  ON public.stage_times FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stage times"
  ON public.stage_times FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stage times"
  ON public.stage_times FOR UPDATE
  USING (auth.uid() = user_id);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics events"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Sao_Paulo')
  );
  
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();