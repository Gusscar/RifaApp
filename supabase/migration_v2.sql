-- =============================================
-- RifaApp - Migration v2
-- Run this in the Supabase SQL Editor
-- =============================================

-- Add color customization columns to raffles
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS bg_color VARCHAR(7) DEFAULT '#0f0520';
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7) DEFAULT '#7c3aed';

-- =============================================
-- Storage bucket for raffle cover images
-- =============================================

-- Create public bucket for raffle covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('raffle-covers', 'raffle-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload raffle covers" ON storage.objects;
CREATE POLICY "Authenticated users can upload raffle covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'raffle-covers');

-- Allow authenticated users to update their uploads
DROP POLICY IF EXISTS "Authenticated users can update raffle covers" ON storage.objects;
CREATE POLICY "Authenticated users can update raffle covers"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'raffle-covers');

-- Allow authenticated users to delete their uploads
DROP POLICY IF EXISTS "Authenticated users can delete raffle covers" ON storage.objects;
CREATE POLICY "Authenticated users can delete raffle covers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'raffle-covers');

-- Allow public read access to raffle covers
DROP POLICY IF EXISTS "Public can view raffle covers" ON storage.objects;
CREATE POLICY "Public can view raffle covers"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'raffle-covers');
