import type { Category, IndicationKey, ConfidenceLevel } from './types';

// ============================================
// CATEGORY CONFIGURATION
// Single source of truth for category metadata.
// Adding a new category requires ONLY a change here.
// ============================================

export interface CategoryConfigEntry {
  key: Category;
  label: string;
  color: string;
  icon: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfigEntry> = {
  'Extraction': { key: 'Extraction', label: 'Extraction', color: '#f59e0b', icon: 'Zap' },
  'Library Prep': { key: 'Library Prep', label: 'Library Prep', color: '#3b82f6', icon: 'Package' },
  'Automation': { key: 'Automation', label: 'Automation', color: '#8b5cf6', icon: 'RefreshCw' },
  'Sequencing': { key: 'Sequencing', label: 'Sequencing', color: '#ef4444', icon: 'Activity' },
  'Analysis': { key: 'Analysis', label: 'Analysis', color: '#10b981', icon: 'BarChart3' },
  'Reporting': { key: 'Reporting', label: 'Reporting', color: '#ec4899', icon: 'FileText' },
  'Diagnostic Services': { key: 'Diagnostic Services', label: 'Diagnostic Services', color: '#f97316', icon: 'Heart' },
} as const;

/** Ordered list of all categories for iteration */
export const CATEGORIES: Category[] = [
  'Extraction',
  'Library Prep',
  'Automation',
  'Sequencing',
  'Analysis',
  'Reporting',
  'Diagnostic Services',
];

/** Quick color lookup: getCategoryColor('Extraction') => '#f59e0b' */
export function getCategoryColor(category: string): string {
  return (CATEGORY_CONFIG as Record<string, CategoryConfigEntry>)[category]?.color ?? '#9ca3af';
}

/** catColors-compatible map for legacy chart code (includes 'All' key) */
export const CATEGORY_COLORS: Record<string, string> = {
  All: '#9ca3af',
  ...Object.fromEntries(CATEGORIES.map((c) => [c, CATEGORY_CONFIG[c].color])),
};

// ============================================
// INDICATION CONFIGURATION
// ============================================

export interface IndicationConfigEntry {
  key: IndicationKey;
  label: string;
  color: string;
  icon: string;
}

export const INDICATION_CONFIG: Record<IndicationKey, IndicationConfigEntry> = {
  solid_tumor: { key: 'solid_tumor', label: 'Solid Tumor', color: '#ef4444', icon: '🎯' },
  liquid_biopsy: { key: 'liquid_biopsy', label: 'Liquid Biopsy', color: '#f97316', icon: '🩸' },
  hereditary_cancer: { key: 'hereditary_cancer', label: 'Hereditary Cancer', color: '#a855f7', icon: '🧬' },
  heme_malig: { key: 'heme_malig', label: 'Heme Malignancies', color: '#ec4899', icon: '🔬' },
  rare_disease: { key: 'rare_disease', label: 'Rare Disease', color: '#14b8a6', icon: '🔍' },
  pharmacogenomics: { key: 'pharmacogenomics', label: 'Pharmacogenomics', color: '#6366f1', icon: '💊' },
  hla_typing: { key: 'hla_typing', label: 'HLA Typing', color: '#0ea5e9', icon: '🏥' },
  infectious_disease: { key: 'infectious_disease', label: 'Infectious Disease', color: '#84cc16', icon: '🦠' },
} as const;


/** Quick color lookup */
export function getIndicationColor(key: string): string {
  return (INDICATION_CONFIG as Record<string, IndicationConfigEntry>)[key]?.color ?? '#6b7280';
}

// ============================================
// CONFIDENCE CONFIGURATION
// ============================================

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  verified: '#34d399',
  estimated: '#6c8cff',
  approximate: '#fbbf24',
  unverified: '#ef4444',
  low: '#ef4444',
};

// ============================================
// REGULATORY STATUS CONFIGURATION
// ============================================

export const REGULATORY_COLORS: Record<string, string> = {
  'FDA PMA': '#16a34a',
  'FDA 510(k)': '#22c55e',
  'CE-IVD': '#3b82f6',
  'CE-IVDR': '#6366f1',
  'RUO': '#9ca3af',
  'CLIA/CAP': '#f59e0b',
  'ISO 13485': '#06b6d4',
};

// ============================================
// REGION CONFIGURATION
// ============================================

export const REGION_CONFIG = {
  global: { key: 'global' as const, label: 'Global', color: '#3b82f6' },
  na: { key: 'na' as const, label: 'North America', color: '#ef4444' },
  we: { key: 'we' as const, label: 'Western Europe', color: '#10b981' },
  hg: { key: 'hg' as const, label: 'High-Growth', color: '#f59e0b' },
  od: { key: 'od' as const, label: 'Other Dev.', color: '#8b5cf6' },
} as const;

// ============================================
// DISPLAY LABELS
// ============================================

export const SAMPLE_TYPE_LABELS: Record<string, string> = {
  ffpe: 'FFPE',
  blood: 'Blood',
  cfdna: 'cfDNA',
  tissue: 'Tissue',
  saliva: 'Saliva',
};

export const NUCLEIC_ACID_LABELS: Record<string, string> = {
  dna: 'DNA',
  rna: 'RNA',
};

export const GROWTH_LABELS: Record<string, string> = {
  growing: 'Growing',
  stable: 'Stable',
  declining: 'Declining',
  emerging: 'Emerging',
  'pre-launch': 'Pre-Launch',
};

export const GROWTH_COLORS: Record<string, string> = {
  growing: '#22c55e',
  stable: '#3b82f6',
  declining: '#ef4444',
  emerging: '#f59e0b',
  'pre-launch': '#8b5cf6',
};
