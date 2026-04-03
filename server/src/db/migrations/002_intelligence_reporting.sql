-- Migration 002: Intelligence & Reporting tables
-- Phase 3: SEC EDGAR pipeline, FDA pipeline, clinical trials, scenarios, reports

-- ============================================
-- Pipeline Run Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id            BIGSERIAL PRIMARY KEY,
  pipeline      VARCHAR(50) NOT NULL CHECK (pipeline IN ('sec_edgar', 'fda_regulatory', 'clinical_trials', 'market_intel')),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'review')),
  triggered_by  UUID REFERENCES users(id),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  records_found INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_runs_pipeline ON pipeline_runs(pipeline);
CREATE INDEX idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX idx_pipeline_runs_created ON pipeline_runs(created_at DESC);

-- ============================================
-- SEC EDGAR Financial Filings
-- ============================================

CREATE TABLE IF NOT EXISTS sec_filings (
  id              BIGSERIAL PRIMARY KEY,
  vendor_key      VARCHAR(100) NOT NULL,
  cik             VARCHAR(20),
  accession_number VARCHAR(30) UNIQUE,
  filing_type     VARCHAR(10) NOT NULL CHECK (filing_type IN ('10-K', '10-Q', '8-K', '20-F')),
  filing_date     DATE NOT NULL,
  period_end      DATE,
  fiscal_year     INTEGER,
  fiscal_quarter  INTEGER,
  -- Parsed financial data
  revenue         NUMERIC(15,2),
  cost_of_revenue NUMERIC(15,2),
  gross_profit    NUMERIC(15,2),
  operating_income NUMERIC(15,2),
  net_income      NUMERIC(15,2),
  r_and_d         NUMERIC(15,2),
  total_assets    NUMERIC(15,2),
  total_debt      NUMERIC(15,2),
  cash_equivalents NUMERIC(15,2),
  shares_outstanding BIGINT,
  eps             NUMERIC(10,4),
  -- Segment data (for conglomerates)
  segment_name    VARCHAR(200),
  segment_revenue NUMERIC(15,2),
  -- Pipeline metadata
  raw_xbrl        JSONB,
  review_status   VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  pipeline_run_id BIGINT REFERENCES pipeline_runs(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sec_filings_vendor ON sec_filings(vendor_key);
CREATE INDEX idx_sec_filings_date ON sec_filings(filing_date DESC);
CREATE INDEX idx_sec_filings_review ON sec_filings(review_status);

-- ============================================
-- SEC Vendor CIK Mapping
-- ============================================

CREATE TABLE IF NOT EXISTS sec_vendor_map (
  vendor_key      VARCHAR(100) PRIMARY KEY,
  cik             VARCHAR(20) NOT NULL,
  company_name    VARCHAR(300) NOT NULL,
  is_conglomerate BOOLEAN DEFAULT false,
  segment_keywords TEXT[],  -- keywords to identify NGS-relevant segments
  notes           TEXT
);

-- Seed SEC vendor mappings for 16 publicly traded NGS vendors
INSERT INTO sec_vendor_map (vendor_key, cik, company_name, is_conglomerate, segment_keywords) VALUES
  ('illumina',   '1110803', 'Illumina Inc',                false, ARRAY['sequencing', 'genomics']),
  ('roche',      '1585521', 'Roche Holding AG',            true,  ARRAY['diagnostics', 'sequencing', 'genomics']),
  ('thermo',     '97745',   'Thermo Fisher Scientific',    true,  ARRAY['genetic sciences', 'genomics', 'sequencing']),
  ('qiagen',     '1386858', 'Qiagen NV',                   false, ARRAY['sample technologies', 'molecular diagnostics']),
  ('agilent',    '1047469', 'Agilent Technologies',         true,  ARRAY['diagnostics genomics', 'target enrichment']),
  ('twist',      '1679363', 'Twist Bioscience',             false, ARRAY['synthetic biology', 'ngs']),
  ('pacbio',     '1299130', 'Pacific Biosciences',          false, ARRAY['long-read', 'sequencing']),
  ('oxford',     '1878365', 'Oxford Nanopore Technologies', false, ARRAY['nanopore', 'sequencing']),
  ('10x',        '1770787', '10x Genomics',                 false, ARRAY['single-cell', 'spatial']),
  ('guardant',   '1576280', 'Guardant Health',              false, ARRAY['liquid biopsy', 'genomic testing']),
  ('natera',     '1604821', 'Natera Inc',                   false, ARRAY['cell-free dna', 'genetic testing']),
  ('myriad',     '899923',  'Myriad Genetics',              false, ARRAY['genetic testing', 'molecular diagnostics']),
  ('tempus',     '1786431', 'Tempus AI',                    false, ARRAY['genomic', 'precision medicine']),
  ('sophia',     '1868507', 'SOPHiA Genetics',              false, ARRAY['genomic analysis', 'bioinformatics']),
  ('danaher',    '313616',  'Danaher Corp',                 true,  ARRAY['life sciences', 'genomics', 'idt', 'beckman']),
  ('biorad',     '12208',   'Bio-Rad Laboratories',         true,  ARRAY['life science', 'clinical diagnostics'])
ON CONFLICT (vendor_key) DO NOTHING;

-- ============================================
-- FDA Regulatory Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS fda_submissions (
  id                BIGSERIAL PRIMARY KEY,
  submission_type   VARCHAR(20) NOT NULL CHECK (submission_type IN ('510k', 'pma', 'de_novo', 'eua')),
  submission_number VARCHAR(30) UNIQUE,
  vendor_key        VARCHAR(100),
  product_id        VARCHAR(200),
  device_name       VARCHAR(500) NOT NULL,
  applicant         VARCHAR(500),
  decision          VARCHAR(50),  -- cleared, approved, denied, pending, withdrawn
  decision_date     DATE,
  submission_date   DATE,
  product_code      VARCHAR(10),
  review_panel      VARCHAR(100),
  -- Matching
  matched_product_id VARCHAR(200),
  match_confidence   NUMERIC(3,2),  -- 0.00 - 1.00
  -- Pipeline metadata
  raw_data          JSONB,
  review_status     VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'auto_matched')),
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  pipeline_run_id   BIGINT REFERENCES pipeline_runs(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fda_vendor ON fda_submissions(vendor_key);
CREATE INDEX idx_fda_decision_date ON fda_submissions(decision_date DESC);
CREATE INDEX idx_fda_review ON fda_submissions(review_status);

-- ============================================
-- Clinical Trial Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS clinical_trials (
  id              BIGSERIAL PRIMARY KEY,
  nct_id          VARCHAR(20) UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  status          VARCHAR(50),  -- recruiting, active, completed, etc.
  phase           VARCHAR(20),
  sponsor         VARCHAR(500),
  -- NGS-specific fields
  vendor_key      VARCHAR(100),
  product_name    VARCHAR(300),
  cdx_product     VARCHAR(300),  -- companion diagnostic product
  indication      VARCHAR(300),
  intervention    TEXT,
  -- Dates
  start_date      DATE,
  completion_date DATE,
  last_update     DATE,
  -- Matching & metadata
  matched_product_id VARCHAR(200),
  raw_data        JSONB,
  review_status   VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  pipeline_run_id BIGINT REFERENCES pipeline_runs(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trials_vendor ON clinical_trials(vendor_key);
CREATE INDEX idx_trials_status ON clinical_trials(status);
CREATE INDEX idx_trials_nct ON clinical_trials(nct_id);

-- ============================================
-- Saved Scenarios
-- ============================================

CREATE TABLE IF NOT EXISTS scenarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  created_by      UUID REFERENCES users(id),
  is_shared       BOOLEAN DEFAULT false,
  -- Scenario parameters stored as JSONB
  adjustments     JSONB NOT NULL DEFAULT '[]',
  -- Each adjustment: { productId, parameter, originalValue, newValue, change }
  -- parameter: 'share' | 'pricing' | 'tam_growth' | 'regulatory' | 'new_product'
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scenarios_creator ON scenarios(created_by);
CREATE INDEX idx_scenarios_shared ON scenarios(is_shared) WHERE is_shared = true;

-- ============================================
-- Report Generation History
-- ============================================

CREATE TABLE IF NOT EXISTS generated_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type     VARCHAR(50) NOT NULL CHECK (report_type IN (
    'quarterly_update', 'vendor_deep_dive', 'indication_landscape', 'competitive_battlecard'
  )),
  format          VARCHAR(10) NOT NULL CHECK (format IN ('pptx', 'pdf', 'xlsx')),
  title           VARCHAR(300) NOT NULL,
  generated_by    UUID REFERENCES users(id),
  -- Parameters used to generate the report
  parameters      JSONB NOT NULL DEFAULT '{}',
  -- File storage
  file_path       VARCHAR(500),
  file_size_bytes BIGINT,
  -- Metadata
  status          VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_type ON generated_reports(report_type);
CREATE INDEX idx_reports_creator ON generated_reports(generated_by);
CREATE INDEX idx_reports_created ON generated_reports(created_at DESC);
