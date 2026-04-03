/**
 * Database schema type definitions
 * Mirrors the PostgreSQL tables for type-safe database operations
 */

// Users table
export interface DbUser {
  id: string; // uuid
  email: string;
  password_hash: string;
  display_name?: string;
  role: 'viewer' | 'analyst' | 'admin';
  created_at: Date;
  last_login_at?: Date;
}

// Vendors table
export interface DbVendor {
  id: number;
  key: string;
  label: string;
  color: string;
  strength?: string;
  weakness?: string;
  recent_move?: string;
  created_at: Date;
  updated_at: Date;
  updated_by?: string; // uuid FK
}

// Products table
export interface DbProduct {
  id: string;
  vendor_key: string;
  name: string;
  category: 'WES' | 'WGS' | 'Panel' | 'RNA-seq' | 'Long-read' | 'Spatial' | 'Single-cell';
  tier?: 'A' | 'B' | 'C';
  share: number;
  pricing: number;
  regulatory?: string;
  region: string;
  growth?: 'stable' | 'growing' | 'declining' | 'emerging' | 'mature';
  regional_share: Record<string, any>;
  confidence: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  updated_by?: string; // uuid FK
}

// Product Indications junction table
export interface DbProductIndication {
  product_id: string;
  indication_key: string;
  indication_share: Record<string, any>;
}

// Product Sample Types junction table
export interface DbProductSampleType {
  product_id: string;
  sample_type: 'ffpe' | 'blood' | 'cfdna' | 'tissue' | 'saliva';
}

// Product Nucleic Acids junction table
export interface DbProductNucleicAcid {
  product_id: string;
  nucleic_acid: 'dna' | 'rna';
}

// Compatibility table
export interface DbCompatibility {
  id: number;
  source_product: string;
  target_product: string;
  layer: string;
  level?: 'validated' | 'compatible' | 'theoretical';
  notes?: string;
  protocol?: string;
  created_at: Date;
  updated_at: Date;
}

// Compatibility Layers table
export interface DbCompatibilityLayer {
  key: string;
  label: string;
  source_category: string;
  target_category: string;
}

// Market Size table
export interface DbMarketSize {
  id: number;
  total_ngs?: number;
  cagr?: number;
  year: number;
  by_category?: Record<string, any>;
  by_indication?: Record<string, any>;
  by_region?: Record<string, any>;
  updated_at: Date;
}

// Financial Profiles table
export interface DbFinancialProfile {
  id: number;
  vendor_key: string;
  ticker?: string;
  last_fy?: string;
  revenue?: number;
  segment_revenue?: number;
  revenue_growth?: number;
  gross_margin?: number;
  op_margin?: number;
  rd_spend?: number;
  rd_pct?: number;
  eps_non_gaap?: number;
  cash?: number;
  total_debt?: number;
  market_cap?: number;
  guidance_revenue?: Record<string, any>;
  guidance_eps?: Record<string, any>;
  key_commentary?: string;
  filing_source?: string;
  last_updated?: Date;
  profitable?: boolean;
  quarterly?: Record<string, any>;
  balance_sheet?: Record<string, any>;
  installed_base?: Record<string, any>;
  updated_at: Date;
}

// Intel Signals table
export interface DbIntelSignal {
  id: string;
  date: Date;
  type: string;
  vendor?: string;
  title: string;
  impact?: 'high' | 'medium' | 'low';
  summary?: string;
  source?: string;
  confidence?: string;
  created_at: Date;
  updated_at: Date;
}

// Cost Components table
export interface DbCostComponent {
  id: string;
  category: string;
  component: string;
  per_sample?: number;
  per_run?: number;
  annual?: number;
  notes?: string;
}

// Timeline Events table
export interface DbTimelineEvent {
  id: number;
  year: number;
  event: string;
  vendor?: string;
  impact?: string;
}

// Historical Snapshots table
export interface DbHistoricalSnapshot {
  id: number;
  quarter: string;
  data: Record<string, any>;
  created_at: Date;
}

// Partners table
export interface DbPartner {
  id: string;
  name: string;
  vendor_key?: string;
  status?: 'active' | 'evaluating' | 'prospect';
  tier?: 'strategic' | 'preferred' | 'approved' | 'evaluating';
  health_score?: number;
  contract_start?: Date;
  contract_end?: Date;
  annual_value?: number;
  products_used: string[];
  integration_status?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Audit Log table
export interface DbAuditLog {
  id: bigint;
  user_id?: string; // uuid FK
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'delete';
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  timestamp: Date;
}

// Migration tracking table
export interface DbMigration {
  id: number;
  name: string;
  executed_at: Date;
}
