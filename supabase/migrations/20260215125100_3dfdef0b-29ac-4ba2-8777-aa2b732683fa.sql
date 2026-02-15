
CREATE TABLE public.holiday_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  holidays JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(country_code, year)
);

ALTER TABLE public.holiday_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read holiday cache"
  ON public.holiday_cache FOR SELECT USING (true);
