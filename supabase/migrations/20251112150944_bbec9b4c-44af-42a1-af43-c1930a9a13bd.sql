-- Create storage bucket for shot list reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('shot-references', 'shot-references', true);

-- Create RLS policies for shot-references bucket
CREATE POLICY "Users can view shot reference images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'shot-references');

CREATE POLICY "Users can upload their own shot reference images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'shot-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own shot reference images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'shot-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own shot reference images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'shot-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);