-- Fix CHECK constraints to match actual platform data
-- Category: workflow-based categories instead of assay types
ALTER TABLE products DROP CONSTRAINT products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check
  CHECK (category IN ('Extraction', 'Library Prep', 'Automation', 'Sequencing', 'Analysis', 'Reporting', 'Diagnostic Services'));

-- Growth: add 'pre-launch', remove 'mature'
ALTER TABLE products DROP CONSTRAINT products_growth_check;
ALTER TABLE products ADD CONSTRAINT products_growth_check
  CHECK (growth IN ('stable', 'growing', 'declining', 'emerging', 'pre-launch'));

-- Partner status: expand to include all used values
ALTER TABLE partners DROP CONSTRAINT partners_status_check;
ALTER TABLE partners ADD CONSTRAINT partners_status_check
  CHECK (status IN ('active', 'evaluating', 'prospect', 'in_progress', 'planned', 'approved', 'expired'));
