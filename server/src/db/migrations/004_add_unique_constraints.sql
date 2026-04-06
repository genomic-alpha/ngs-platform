-- Add missing UNIQUE constraints needed for ON CONFLICT upserts in seed/sync

ALTER TABLE financial_profiles
  ADD CONSTRAINT financial_profiles_vendor_key_unique UNIQUE (vendor_key);
