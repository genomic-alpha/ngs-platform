-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  display_name varchar(255),
  role varchar(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'analyst', 'admin')),
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create vendors table
CREATE TABLE vendors (
  id serial PRIMARY KEY,
  key varchar(50) UNIQUE NOT NULL,
  label varchar(255) NOT NULL,
  color varchar(20) NOT NULL,
  strength text,
  weakness text,
  recent_move text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Create products table
CREATE TABLE products (
  id varchar(100) PRIMARY KEY,
  vendor_key varchar(50) NOT NULL REFERENCES vendors(key) ON DELETE RESTRICT,
  name varchar(255) NOT NULL,
  category varchar(50) NOT NULL CHECK (category IN ('WES', 'WGS', 'Panel', 'RNA-seq', 'Long-read', 'Spatial', 'Single-cell')),
  tier char(1) CHECK (tier IN ('A', 'B', 'C')),
  share numeric(6, 3) DEFAULT 0 CHECK (share >= 0 AND share <= 100),
  pricing numeric(10, 2) DEFAULT 0 CHECK (pricing >= 0),
  regulatory varchar(100),
  region varchar(50) DEFAULT 'global',
  growth varchar(30) CHECK (growth IN ('stable', 'growing', 'declining', 'emerging', 'mature')),
  regional_share jsonb DEFAULT '{}',
  confidence jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT valid_name CHECK (name ~ '.{2,}')
);

-- Create product_indications junction table
CREATE TABLE product_indications (
  product_id varchar(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  indication_key varchar(100) NOT NULL,
  indication_share jsonb DEFAULT '{}',
  PRIMARY KEY (product_id, indication_key)
);

-- Create product_sample_types junction table
CREATE TABLE product_sample_types (
  product_id varchar(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sample_type varchar(50) NOT NULL CHECK (sample_type IN ('ffpe', 'blood', 'cfdna', 'tissue', 'saliva')),
  PRIMARY KEY (product_id, sample_type)
);

-- Create product_nucleic_acids junction table
CREATE TABLE product_nucleic_acids (
  product_id varchar(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  nucleic_acid varchar(20) NOT NULL CHECK (nucleic_acid IN ('dna', 'rna')),
  PRIMARY KEY (product_id, nucleic_acid)
);

-- Create compatibility table
CREATE TABLE compatibility (
  id serial PRIMARY KEY,
  source_product varchar(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_product varchar(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  layer varchar(100) NOT NULL,
  level varchar(50) CHECK (level IN ('validated', 'compatible', 'theoretical')),
  notes text,
  protocol varchar(255),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_products CHECK (source_product != target_product),
  CONSTRAINT unique_compatibility UNIQUE (source_product, target_product, layer)
);

-- Create compatibility_layers table
CREATE TABLE compatibility_layers (
  key varchar(100) PRIMARY KEY,
  label varchar(255) NOT NULL,
  source_category varchar(50) NOT NULL,
  target_category varchar(50) NOT NULL
);

-- Create market_size table
CREATE TABLE market_size (
  id serial PRIMARY KEY,
  total_ngs numeric,
  cagr numeric CHECK (cagr >= 0 AND cagr <= 100),
  year integer NOT NULL CHECK (year >= 2000 AND year <= 2100),
  by_category jsonb,
  by_indication jsonb,
  by_region jsonb,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_year UNIQUE (year)
);

-- Create financial_profiles table
CREATE TABLE financial_profiles (
  id serial PRIMARY KEY,
  vendor_key varchar(50) NOT NULL REFERENCES vendors(key) ON DELETE CASCADE,
  ticker varchar(20),
  last_fy varchar(10),
  revenue numeric(15, 2),
  segment_revenue numeric(15, 2),
  revenue_growth numeric(6, 2),
  gross_margin numeric(5, 2),
  op_margin numeric(5, 2),
  rd_spend numeric(15, 2),
  rd_pct numeric(5, 2),
  eps_non_gaap numeric(10, 2),
  cash numeric(15, 2),
  total_debt numeric(15, 2),
  market_cap numeric(18, 2),
  guidance_revenue jsonb,
  guidance_eps jsonb,
  key_commentary text,
  filing_source varchar(100),
  last_updated date,
  profitable boolean,
  quarterly jsonb,
  balance_sheet jsonb,
  installed_base jsonb,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_vendor_fy UNIQUE (vendor_key, last_fy)
);

-- Create intel_signals table
CREATE TABLE intel_signals (
  id varchar(100) PRIMARY KEY,
  date date NOT NULL,
  type varchar(50) NOT NULL,
  vendor varchar(100),
  title varchar(500) NOT NULL,
  impact varchar(20) CHECK (impact IN ('high', 'medium', 'low')),
  summary text,
  source varchar(255),
  confidence varchar(20),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cost_components table
CREATE TABLE cost_components (
  id varchar(100) PRIMARY KEY,
  category varchar(100) NOT NULL,
  component varchar(255) NOT NULL,
  per_sample numeric(10, 2),
  per_run numeric(10, 2),
  annual numeric(12, 2),
  notes text,
  CONSTRAINT has_cost CHECK (per_sample IS NOT NULL OR per_run IS NOT NULL OR annual IS NOT NULL)
);

-- Create timeline_events table
CREATE TABLE timeline_events (
  id serial PRIMARY KEY,
  year integer NOT NULL CHECK (year >= 1990 AND year <= 2100),
  event text NOT NULL,
  vendor varchar(100),
  impact varchar(100)
);

-- Create historical_snapshots table
CREATE TABLE historical_snapshots (
  id serial PRIMARY KEY,
  quarter varchar(10) NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_quarter UNIQUE (quarter)
);

-- Create partners table
CREATE TABLE partners (
  id varchar(100) PRIMARY KEY,
  name varchar(255) NOT NULL,
  vendor_key varchar(50) REFERENCES vendors(key) ON DELETE SET NULL,
  status varchar(50) CHECK (status IN ('active', 'evaluating', 'prospect')),
  tier varchar(50) CHECK (tier IN ('strategic', 'preferred', 'approved', 'evaluating')),
  health_score integer CHECK (health_score >= 0 AND health_score <= 100),
  contract_start date,
  contract_end date,
  annual_value numeric(12, 2),
  products_used jsonb DEFAULT '[]',
  integration_status varchar(100),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_log table
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  table_name varchar(100) NOT NULL,
  record_id varchar(255) NOT NULL,
  action varchar(20) NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  old_value jsonb,
  new_value jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Create _migrations table for tracking applied migrations
CREATE TABLE _migrations (
  id serial PRIMARY KEY,
  name varchar(255) UNIQUE NOT NULL,
  executed_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_vendors_key ON vendors(key);
CREATE INDEX idx_products_vendor_key ON products(vendor_key);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_compatibility_source ON compatibility(source_product);
CREATE INDEX idx_compatibility_target ON compatibility(target_product);
CREATE INDEX idx_financial_profiles_vendor ON financial_profiles(vendor_key);
CREATE INDEX idx_intel_signals_date ON intel_signals(date);
CREATE INDEX idx_intel_signals_type ON intel_signals(type);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_partners_vendor ON partners(vendor_key);
CREATE INDEX idx_partners_status ON partners(status);

-- Create timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to tables
CREATE TRIGGER trigger_vendors_updated_at
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_compatibility_updated_at
BEFORE UPDATE ON compatibility
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_financial_profiles_updated_at
BEFORE UPDATE ON financial_profiles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_intel_signals_updated_at
BEFORE UPDATE ON intel_signals
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_partners_updated_at
BEFORE UPDATE ON partners
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
