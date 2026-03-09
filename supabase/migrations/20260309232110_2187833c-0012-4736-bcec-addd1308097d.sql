ALTER TABLE public.scripts ADD COLUMN notion_page_id text DEFAULT NULL;
ALTER TABLE public.scripts ADD COLUMN date_manually_set boolean DEFAULT true;