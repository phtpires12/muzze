-- Add design_items column to scripts table for Carousel Design stage
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS design_items JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN scripts.design_items IS 'Slides/items for the Design stage of Carousel content. Same structure as shot_list but specific to design workflow.';
