import type { Region, Indication, IndicationKey } from './types';

export const REGIONS: Region[] = [
  { key: 'global', label: 'Global', color: '#3b82f6' },
  { key: 'na', label: 'North America', color: '#ef4444' },
  { key: 'we', label: 'Western Europe', color: '#10b981' },
  { key: 'hg', label: 'High-Growth', color: '#f59e0b' },
  { key: 'od', label: 'Other Dev.', color: '#8b5cf6' },
];

export const INDICATIONS: Indication[] = [
  { key: 'solid_tumor', label: 'Solid Tumor', icon: '🎯', color: '#ef4444' },
  { key: 'liquid_biopsy', label: 'Liquid Biopsy', icon: '🩸', color: '#f97316' },
  { key: 'hereditary_cancer', label: 'Hereditary Cancer', icon: '🧬', color: '#a855f7' },
  { key: 'heme_malig', label: 'Heme Malignancies', icon: '🔬', color: '#ec4899' },
  { key: 'rare_disease', label: 'Rare Disease', icon: '🔍', color: '#14b8a6' },
  { key: 'pharmacogenomics', label: 'Pharmacogenomics', icon: '💊', color: '#6366f1' },
  { key: 'hla_typing', label: 'HLA Typing', icon: '🏥', color: '#0ea5e9' },
  { key: 'infectious_disease', label: 'Infectious Disease', icon: '🦠', color: '#84cc16' },
];

export const INDICATION_KEYS: IndicationKey[] = INDICATIONS.map((i) => i.key);
