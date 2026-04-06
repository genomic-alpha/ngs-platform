-- Fix category CHECK constraint to match the platform's 7 workflow categories
-- Original monolith used: WES, WGS, Panel, RNA-seq, Long-read, Spatial, Single-cell
-- Rebuilt platform uses: Extraction, Library Prep, Automation, Sequencing, Analysis, Reporting, Diagnostic Services

ALTER TABLE products DROP CONSTRAINT products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check
  CHECK (category IN ('Extraction', 'Library Prep', 'Automation', 'Sequencing', 'Analysis', 'Reporting', 'Diagnostic Services'));
