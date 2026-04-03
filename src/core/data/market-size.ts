import type { MarketSize } from '../types';

export const DEFAULT_MARKET_SIZE: MarketSize = {
  byCategory: {
    'Extraction': 1300,
    'Library Prep': 1600,
    'Automation': 900,
    'Sequencing': 6200,
    'Analysis': 2300,
    'Reporting': 1000,
    'Diagnostic Services': 5200,
  },
  byIndication: {
    solid_tumor: 3800,
    liquid_biopsy: 2800,
    hereditary_cancer: 1500,
    heme_malig: 1200,
    rare_disease: 1300,
    pharmacogenomics: 650,
    hla_typing: 450,
    infectious_disease: 1800,
  },
  byRegion: {
    na: 0.46,
    we: 0.27,
    hg: 0.20,
    od: 0.07,
  },
  totalNGS: 13500,
  cagr: 0.142,
  year: 2026,
  futureCategories: {
    'Proteomics': 2800,
    'Spatial Biology': 1200,
    'Long-Read Sequencing': 1800,
    'Epigenomics': 600,
    'Single-Cell Multi-omics': 900,
  },
};
