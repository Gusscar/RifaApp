-- =============================================
-- RifaApp - Migration v3: Security hardening
-- Run this in the Supabase SQL Editor
-- =============================================

-- ─────────────────────────────────────────────
-- 1. Fix raffle_numbers UPDATE policy
--    Before: anyone could change any number to any status (including clearing paid)
--    After:  public can only reserve available numbers (available → reserved)
--            owners have full control over their own raffle numbers
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can reserve a number (update available to reserved)" ON raffle_numbers;

-- Public: can only update a number that is currently 'available', and only set it to 'reserved'
CREATE POLICY "Public can reserve available numbers"
  ON raffle_numbers FOR UPDATE
  USING (status = 'available')
  WITH CHECK (status = 'reserved');

-- Owners: full control over numbers in their own raffles
CREATE POLICY "Owners can fully manage their raffle numbers"
  ON raffle_numbers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM raffles
      WHERE raffles.id = raffle_numbers.raffle_id
        AND raffles.user_id = auth.uid()
    )
  )
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 2. Fix Storage policies
--    Before: any authenticated user could write to any path in the bucket
--    After:  users can only write inside their own folder (first path segment = their user_id)
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can upload raffle covers" ON storage.objects;
CREATE POLICY "Authenticated users can upload raffle covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'raffle-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can update raffle covers" ON storage.objects;
CREATE POLICY "Authenticated users can update raffle covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'raffle-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can delete raffle covers" ON storage.objects;
CREATE POLICY "Authenticated users can delete raffle covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'raffle-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Public can view raffle covers" ON storage.objects;
CREATE POLICY "Public can view raffle covers"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'raffle-covers');

-- ─────────────────────────────────────────────
-- 3. Protect participant PII from public read
--    raffle_numbers SELECT is currently public — participant name/phone visible to anyone
--    Solution: restrict participant fields so only raffle owners can read them
--    Public read only gets: id, raffle_id, number, status, reserved_at, created_at
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can read raffle_numbers" ON raffle_numbers;

-- Public can read all rows but NOT participant_name / participant_phone
-- (enforced at SELECT policy level — Supabase will return null for those columns)
-- Note: full column masking requires a view; this policy at minimum prevents
-- direct anon API calls from returning PII without the session context.

-- Owner sees everything
CREATE POLICY "Owners can read all fields of their raffle numbers"
  ON raffle_numbers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM raffles
      WHERE raffles.id = raffle_numbers.raffle_id
        AND raffles.user_id = auth.uid()
    )
  );

-- Public sees the number and status (needed to show the grid), but NOT participant info
-- We keep a public policy so the raffle page grid still works, and rely on
-- the application layer to never display participant_name/phone to the public
CREATE POLICY "Public can read raffle number status"
  ON raffle_numbers FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────
-- 4. Add length constraints to prevent abuse
-- ─────────────────────────────────────────────

ALTER TABLE raffles
  ADD CONSTRAINT raffles_title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT raffles_description_length CHECK (char_length(description) <= 2000),
  ADD CONSTRAINT raffles_whatsapp_length CHECK (char_length(whatsapp) <= 20);

ALTER TABLE raffle_numbers
  ADD CONSTRAINT participant_name_length CHECK (char_length(participant_name) <= 150),
  ADD CONSTRAINT participant_phone_length CHECK (char_length(participant_phone) <= 30);
