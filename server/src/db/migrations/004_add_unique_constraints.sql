-- Add missing UNIQUE constraints needed for ON CONFLICT upserts in seed/sync
-- Uses CREATE UNIQUE INDEX which supports IF NOT EXISTS (ALTER TABLE ADD CONSTRAINT does not)

CREATE UNIQUE INDEX IF NOT EXISTS financial_profiles_vendor_key_unique ON financial_profiles (vendor_key);
