-- Add original_content column to preserve the initial script version
ALTER TABLE scripts 
ADD COLUMN original_content text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN scripts.original_content IS 'Stores the original script content from the roteirização stage, used for comparison in the revisão stage';