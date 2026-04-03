import type { Dispatch, SetStateAction } from 'react';

// ============================================
// ENUMS & LITERAL TYPES
// ============================================

export type Category = 'Extraction' | 'Library Prep' | 'Automation' | 'Sequencing' | 'Analysis' | 'Reporting' | 'Diagnostic Services';

export type RegionKey = 'global' | 'na' | 'we' | 'hg' | 'od';

export type IndicationKey = 'solid_tumor' | 'liquid_biopsy' | 'hereditary_cancer' | 'heme_malig' | 'rare_disease' | 'pharmacogenomics' | 'hla_typing' | 'infectious_disease';

export type Tier = 'A' | 'B' | 'C';

export type GrowthStatus = 'growing' | 'stable' | 'declining' | 'emerging' | 'pre-launch';

export type RegulatoryStatus = 'RUO' | 'CE-IVD' | 'CE-IVDR' | 'FDA PMA' | 'FDA 510(k)' | 'CLIA/CAP' | 'ISO 13485';

export type ConfidenceLevel = 'verified' | 'estimated' | 'approximate' | 'unverified' | 'low';

export type SampleType = 'ffpe' | 'blood' | 'cfdna' | 'tissue' | 'saliva';

export type NucleicAcid = 'dna' | 'rna';

export type CompatibilityLevel = 'validated' | 'compatible' | 'theoretical';

export type SignalType = 'regulatory' | 'pricing' | 'product_launch' | 'partnership' | 'ma' | 'clinical_data' | 'market_entry' | 'acquisition';

export type ImpactLevel = 'high' | 'medium' | 'low';

export type PartnerStatus = 'active' | 'evaluating' | 'prospect';

export type PartnerTier = 'strategic' | 'preferred' | 'approved' | 'evaluating';

export type IntegrationStatus = 'validated' | 'in_progress' | 'planned';

// ============================================
// CORE DATA INTERFACES
// ============================================

export interface Region {
  key: RegionKey;
  label: string;
  color: string;
}

export interface Indication {
  key: IndicationKey;
  label: string;
  icon: string;
  color: string;
}

export interface ConfidenceMetadata {
  level: ConfidenceLevel;
  source: string;
  date: string;
}

export interface ProductConfidence {
  share: ConfidenceMetadata;
  pricing: ConfidenceMetadata;
  regulatory: ConfidenceMetadata;
}

export interface RegionalShareMap {
  na: number;
  we: number;
  hg: number;
  od: number;
}

export interface IndicationShareDetail {
  global: number;
  na: number;
  we: number;
  hg: number;
  od: number;
}

export interface Vendor {
  key: string;
  label: string;
  color: string;
  strength: string;
  weakness: string;
  recentMove: string;
}

export interface Product {
  id: string;
  vendor: string;
  name: string;
  category: Category;
  tier: Tier;
  share: number;
  pricing: number;
  regulatory: string;
  region: string;
  sampleTypes: SampleType[];
  nucleicAcids: NucleicAcid[];
  regionalShare: RegionalShareMap;
  growth: GrowthStatus;
  indications: IndicationKey[];
  indicationShare: Record<string, IndicationShareDetail>;
  confidence: ProductConfidence;
}

export interface TimelineEvent {
  year: number;
  event: string;
  vendor: string;
  impact: string;
}

export interface CompatibilityLayer {
  key: string;
  label: string;
  source: Category;
  target: Category;
}

export interface CompatibilityEntry {
  source: string;
  target: string;
  layer: string;
  level: CompatibilityLevel;
  notes: string;
  protocol?: string;
}

export interface HistoricalSnapshot {
  quarter: string;
  data: Record<string, { share: number; pricing: number }>;
}

export interface MarketSize {
  byCategory: Record<string, number>;
  byIndication: Record<string, number>;
  byRegion: Record<string, number>;
  totalNGS: number;
  cagr: number;
  year: number;
  futureCategories: Record<string, number>;
}

export interface IntelSignal {
  id: string;
  date: string;
  type: SignalType;
  vendor: string;
  title: string;
  impact: ImpactLevel;
  summary: string;
  source: string;
  products: string[];
}

export interface CostComponent {
  reagents: number;
  instrument_amortized: number;
  labor: number;
  qc: number;
  total: number;
}

export interface QuarterlyRevenue {
  quarter: string;
  revenue: number;
}

export interface BalanceSheet {
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
}

export interface InstalledBase {
  total: number;
  note?: string;
}

export interface FinancialProfile {
  ticker: string;
  vendorKey: string;
  lastFY: string;
  revenue: number;
  segmentRevenue: number | null;
  revenueGrowth: number;
  grossMargin: number;
  opMargin: number;
  rdSpend: number;
  rdPct: number;
  epsNonGaap: number | null;
  cash: number;
  totalDebt: number;
  marketCap: number;
  guidanceRevenue: [number, number] | null;
  guidanceEps: [number, number] | null;
  keyCommentary: string;
  filingSource: string;
  lastUpdated: string;
  profitable: boolean;
  quarterly: QuarterlyRevenue[];
  balanceSheet: BalanceSheet;
  installedBase?: InstalledBase;
}

export interface MeetingNote {
  date: string;
  type: string;
  notes: string;
}

export interface PipelineActivity {
  id: string;
  description: string;
  status: 'in_progress' | 'approved' | 'evaluating' | 'planned';
  startDate: string;
  targetDate: string;
  value: number;
}

export interface Partner {
  id: string;
  vendorKey: string;
  status: PartnerStatus;
  tier: PartnerTier;
  contractStart: string;
  contractEnd: string;
  contractValue: number;
  pricingTier: string;
  discountPct: number;
  paymentTerms: string;
  autoRenew: boolean;
  primaryContact: string;
  primaryContactRole: string;
  primaryContactEmail: string;
  integrationStatus: IntegrationStatus;
  validatedProducts: string[];
  integrationNotes: string;
  technicalContact: string;
  technicalContactRole: string;
  healthScore: number;
  lastMeeting: string;
  nextReview: string;
  meetingNotes: MeetingNote[];
  pipelineActivities: PipelineActivity[];
  riskFactors: string[];
  categories: string[];
}

// ============================================
// CONTEXT TYPES
// ============================================

export interface DataContextType {
  vendors: Vendor[];
  setVendors: Dispatch<SetStateAction<Vendor[]>>;
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  timelineEvents: TimelineEvent[];
  setTimelineEvents: Dispatch<SetStateAction<TimelineEvent[]>>;
  compatibility: CompatibilityEntry[];
  setCompatibility: Dispatch<SetStateAction<CompatibilityEntry[]>>;
  compatibilityLayers: CompatibilityLayer[];
  setCompatibilityLayers: Dispatch<SetStateAction<CompatibilityLayer[]>>;
  historicalSnapshots: HistoricalSnapshot[];
  setHistoricalSnapshots: Dispatch<SetStateAction<HistoricalSnapshot[]>>;
  marketSize: MarketSize;
  setMarketSize: Dispatch<SetStateAction<MarketSize>>;
  intelSignals: IntelSignal[];
  setIntelSignals: Dispatch<SetStateAction<IntelSignal[]>>;
  costComponents: Record<string, CostComponent>;
  setCostComponents: Dispatch<SetStateAction<Record<string, CostComponent>>>;
  partners: Partner[];
  setPartners: Dispatch<SetStateAction<Partner[]>>;
  financials: Record<string, FinancialProfile>;
  setFinancials: Dispatch<SetStateAction<Record<string, FinancialProfile>>>;
}

export interface ScenarioContextType {
  adjustments: Record<string, number>;
  setAdjustments: Dispatch<SetStateAction<Record<string, number>>>;
}

// ============================================
// VIEW TYPES
// ============================================

export type ViewId =
  | 'dashboard'
  | 'products'
  | 'vendors'
  | 'compare'
  | 'compatibility'
  | 'tco'
  | 'indication'
  | 'scenarios'
  | 'signals'
  | 'regulatory'
  | 'timeline'
  | 'data quality'
  | 'partners'
  | 'validation'
  | 'admin';

// ============================================
// UTILITY TYPES
// ============================================

export interface CategoryConfig {
  key: Category;
  label: string;
  color: string;
  icon: string;
}

export interface VendorConfig {
  key: string;
  label: string;
  color: string;
}

export interface IndicationConfig {
  key: IndicationKey;
  label: string;
  color: string;
  icon: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export type ExpandedRows = Record<string, boolean>;
