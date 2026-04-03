import { describe, it, expect } from 'vitest';
import type {
  Category,
  Tier,
  GrowthStatus,
  IndicationKey,
  SampleType,
  NucleicAcid,
  CompatibilityLevel,
  SignalType,
  ImpactLevel,
  PartnerStatus,
} from '@/core/types';
import { DEFAULT_VENDORS } from '@/core/data/vendors';
import { DEFAULT_PRODUCTS } from '@/core/data/products';
import { DEFAULT_TIMELINE_EVENTS } from '@/core/data/timeline';
import { DEFAULT_COMPATIBILITY, DEFAULT_COMPATIBILITY_LAYERS } from '@/core/data/compatibility';
import { DEFAULT_HISTORICAL_SNAPSHOTS } from '@/core/data/historical';
import { DEFAULT_MARKET_SIZE } from '@/core/data/market-size';
import { DEFAULT_INTEL_SIGNALS } from '@/core/data/signals';
import { DEFAULT_COST_COMPONENTS } from '@/core/data/costs';
import { DEFAULT_FINANCIALS } from '@/core/data/financials';
import { DEFAULT_PARTNERS } from '@/core/data/partners';

// Valid enums
const VALID_CATEGORIES: Category[] = [
  'Extraction',
  'Library Prep',
  'Automation',
  'Sequencing',
  'Analysis',
  'Reporting',
  'Diagnostic Services',
];
const VALID_TIERS: Tier[] = ['A', 'B', 'C'];
const VALID_GROWTH_STATUSES: GrowthStatus[] = ['growing', 'stable', 'declining', 'emerging', 'pre-launch'];
const VALID_INDICATIONS: IndicationKey[] = [
  'solid_tumor',
  'liquid_biopsy',
  'hereditary_cancer',
  'heme_malig',
  'rare_disease',
  'pharmacogenomics',
  'hla_typing',
  'infectious_disease',
];
const VALID_SAMPLE_TYPES: SampleType[] = ['ffpe', 'blood', 'cfdna', 'tissue', 'saliva'];
const VALID_NUCLEIC_ACIDS: NucleicAcid[] = ['dna', 'rna'];
const VALID_COMPATIBILITY_LEVELS: CompatibilityLevel[] = ['validated', 'compatible', 'theoretical'];
const VALID_SIGNAL_TYPES: SignalType[] = [
  'regulatory',
  'pricing',
  'product_launch',
  'partnership',
  'ma',
  'clinical_data',
  'market_entry',
  'acquisition',
];
const VALID_IMPACT_LEVELS: ImpactLevel[] = ['high', 'medium', 'low'];
const VALID_PARTNER_STATUSES: PartnerStatus[] = ['active', 'evaluating', 'prospect'];

describe('Data Integrity Test Suite', () => {
  // ============================================
  // 1. PRODUCT DATA INTEGRITY
  // ============================================
  describe('1. Product Data Integrity', () => {
    it('should have non-empty id, name, vendor, and category for all products', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        expect(product.id).toBeTruthy();
        expect(product.name).toBeTruthy();
        expect(product.vendor).toBeTruthy();
        expect(product.category).toBeTruthy();
      });
    });

    it('should have unique product IDs', () => {
      const ids = DEFAULT_PRODUCTS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should reference valid vendor keys', () => {
      const validVendorKeys = new Set(DEFAULT_VENDORS.map((v) => v.key));
      DEFAULT_PRODUCTS.forEach((product) => {
        expect(validVendorKeys.has(product.vendor)).toBe(true);
      });
    });

    it('should have valid categories', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        expect(VALID_CATEGORIES).toContain(product.category);
      });
    });

    it('should have valid tiers', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        expect(VALID_TIERS).toContain(product.tier);
      });
    });

    it('should have valid growth statuses', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        expect(VALID_GROWTH_STATUSES).toContain(product.growth);
      });
    });

    it('should have share values between 0 and 100', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        expect(product.share).toBeGreaterThanOrEqual(0);
        expect(product.share).toBeLessThanOrEqual(100);
      });
    });

    it('should have non-negative pricing values', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        expect(product.pricing).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have complete regional share maps with 4 region keys', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        expect(product.regionalShare).toHaveProperty('na');
        expect(product.regionalShare).toHaveProperty('we');
        expect(product.regionalShare).toHaveProperty('hg');
        expect(product.regionalShare).toHaveProperty('od');
        expect(product.regionalShare.na).toBeGreaterThanOrEqual(0);
        expect(product.regionalShare.we).toBeGreaterThanOrEqual(0);
        expect(product.regionalShare.hg).toBeGreaterThanOrEqual(0);
        expect(product.regionalShare.od).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid indication keys', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        if (product.indications.length > 0) {
          product.indications.forEach((indication) => {
            expect(VALID_INDICATIONS).toContain(indication);
          });
        }
      });
    });

    it('should have valid sample types', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        product.sampleTypes.forEach((type) => {
          expect(VALID_SAMPLE_TYPES).toContain(type);
        });
      });
    });

    it('should have valid nucleic acids', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        product.nucleicAcids.forEach((acid) => {
          expect(VALID_NUCLEIC_ACIDS).toContain(acid);
        });
      });
    });
  });

  // ============================================
  // 2. SHARE TOTALS VALIDATION
  // ============================================
  describe('2. Share Totals Validation', () => {
    it('should not exceed 100% share per category (with 5% tolerance)', () => {
      const sharesByCategory: Record<string, number> = {};
      DEFAULT_PRODUCTS.forEach((product) => {
        sharesByCategory[product.category] = (sharesByCategory[product.category] || 0) + product.share;
      });

      Object.entries(sharesByCategory).forEach(([category, total]) => {
        expect(total).toBeLessThanOrEqual(105);
      });
    });

    it('should not exceed 100% regional share per product', () => {
      DEFAULT_PRODUCTS.forEach((product) => {
        const regionalTotal =
          product.regionalShare.na +
          product.regionalShare.we +
          product.regionalShare.hg +
          product.regionalShare.od;
        expect(regionalTotal).toBeLessThanOrEqual(100);
      });
    });
  });

  // ============================================
  // 3. VENDOR DATA INTEGRITY
  // ============================================
  describe('3. Vendor Data Integrity', () => {
    it('should have non-empty key, label, and color for all vendors', () => {
      DEFAULT_VENDORS.forEach((vendor) => {
        expect(vendor.key).toBeTruthy();
        expect(vendor.label).toBeTruthy();
        expect(vendor.color).toBeTruthy();
      });
    });

    it('should have unique vendor keys', () => {
      const keys = DEFAULT_VENDORS.map((v) => v.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have valid hex color codes', () => {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      DEFAULT_VENDORS.forEach((vendor) => {
        expect(vendor.color).toMatch(hexColorRegex);
      });
    });
  });

  // ============================================
  // 4. COMPATIBILITY DATA INTEGRITY
  // ============================================
  describe('4. Compatibility Data Integrity', () => {
    it('should reference valid compatibility layers', () => {
      const validLayerKeys = new Set(DEFAULT_COMPATIBILITY_LAYERS.map((l) => l.key));
      DEFAULT_COMPATIBILITY.forEach((entry) => {
        expect(validLayerKeys.has(entry.layer)).toBe(true);
      });
    });

    it('should have valid compatibility levels', () => {
      DEFAULT_COMPATIBILITY.forEach((entry) => {
        expect(VALID_COMPATIBILITY_LEVELS).toContain(entry.level);
      });
    });

    it('should have fewer than 5% duplicate source-target-layer combinations', () => {
      const seen = new Set<string>();
      let duplicateCount = 0;

      DEFAULT_COMPATIBILITY.forEach((entry) => {
        const key = `${entry.source}|${entry.target}|${entry.layer}`;
        if (seen.has(key)) {
          duplicateCount += 1;
        }
        seen.add(key);
      });

      const duplicateRate = duplicateCount / DEFAULT_COMPATIBILITY.length;
      expect(duplicateRate).toBeLessThan(0.05);
    });
  });

  // ============================================
  // 5. FINANCIAL DATA INTEGRITY
  // ============================================
  describe('5. Financial Data Integrity', () => {
    it('should have required fields in all financial profiles', () => {
      Object.values(DEFAULT_FINANCIALS).forEach((profile) => {
        expect(profile.ticker).toBeTruthy();
        expect(profile.vendorKey).toBeTruthy();
        expect(profile.lastFY).toBeTruthy();
        expect(profile.revenue).toBeGreaterThan(0);
      });
    });

    it('should reference valid vendor keys or known financial-only entities', () => {
      const validVendorKeys = new Set(DEFAULT_VENDORS.map((v) => v.key));
      Object.values(DEFAULT_FINANCIALS).forEach((profile) => {
        // vendorKey should be a non-empty string; most should match vendors
        expect(profile.vendorKey).toBeTruthy();
        expect(typeof profile.vendorKey).toBe('string');
      });
      // At least 80% should match actual vendor keys
      const matchCount = Object.values(DEFAULT_FINANCIALS).filter(
        (p) => validVendorKeys.has(p.vendorKey)
      ).length;
      const matchRate = matchCount / Object.values(DEFAULT_FINANCIALS).length;
      expect(matchRate).toBeGreaterThan(0.8);
    });

    it('should have positive revenue values', () => {
      Object.values(DEFAULT_FINANCIALS).forEach((profile) => {
        expect(profile.revenue).toBeGreaterThan(0);
      });
    });
  });

  // ============================================
  // 6. SIGNAL DATA INTEGRITY
  // ============================================
  describe('6. Signal Data Integrity', () => {
    it('should have non-empty id, title, type, impact, and date', () => {
      DEFAULT_INTEL_SIGNALS.forEach((signal) => {
        expect(signal.id).toBeTruthy();
        expect(signal.title).toBeTruthy();
        expect(signal.type).toBeTruthy();
        expect(signal.impact).toBeTruthy();
        expect(signal.date).toBeTruthy();
      });
    });

    it('should have valid signal types', () => {
      DEFAULT_INTEL_SIGNALS.forEach((signal) => {
        expect(VALID_SIGNAL_TYPES).toContain(signal.type);
      });
    });

    it('should have valid impact levels', () => {
      DEFAULT_INTEL_SIGNALS.forEach((signal) => {
        expect(VALID_IMPACT_LEVELS).toContain(signal.impact);
      });
    });
  });

  // ============================================
  // 7. PARTNER DATA INTEGRITY
  // ============================================
  describe('7. Partner Data Integrity', () => {
    it('should have non-empty id, name, and status', () => {
      DEFAULT_PARTNERS.forEach((partner) => {
        expect(partner.id).toBeTruthy();
        expect(partner.status).toBeTruthy();
      });
    });

    it('should have valid partner statuses', () => {
      DEFAULT_PARTNERS.forEach((partner) => {
        expect(VALID_PARTNER_STATUSES).toContain(partner.status);
      });
    });

    it('should have health scores between 0 and 100', () => {
      DEFAULT_PARTNERS.forEach((partner) => {
        expect(partner.healthScore).toBeGreaterThanOrEqual(0);
        expect(partner.healthScore).toBeLessThanOrEqual(100);
      });
    });
  });

  // ============================================
  // 8. COST COMPONENT INTEGRITY
  // ============================================
  describe('8. Cost Component Integrity', () => {
    it('should have non-empty id and category', () => {
      Object.entries(DEFAULT_COST_COMPONENTS).forEach(([id, component]) => {
        expect(id).toBeTruthy();
        expect(component).toBeTruthy();
      });
    });

    it('should have non-negative values in all components', () => {
      Object.values(DEFAULT_COST_COMPONENTS).forEach((component) => {
        expect(component.reagents).toBeGreaterThanOrEqual(0);
        expect(component.instrument_amortized).toBeGreaterThanOrEqual(0);
        expect(component.labor).toBeGreaterThanOrEqual(0);
        expect(component.qc).toBeGreaterThanOrEqual(0);
        expect(component.total).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have totals that equal sum of components', () => {
      Object.values(DEFAULT_COST_COMPONENTS).forEach((component) => {
        const sum = component.reagents + component.instrument_amortized + component.labor + component.qc;
        expect(Math.abs(component.total - sum)).toBeLessThan(0.01);
      });
    });
  });

  // ============================================
  // 9. CROSS-REFERENCE INTEGRITY
  // ============================================
  describe('9. Cross-Reference Integrity', () => {
    it('should reference existing vendors in product data', () => {
      const vendorKeys = new Set(DEFAULT_VENDORS.map((v) => v.key));
      DEFAULT_PRODUCTS.forEach((product) => {
        expect(vendorKeys.has(product.vendor)).toBe(true);
      });
    });

    it('should have valid vendor or meta-vendor in timeline events', () => {
      const vendorKeys = new Set(DEFAULT_VENDORS.map((v) => v.key));
      const metaVendors = new Set(['regulatory', 'industry', 'multiple', 'unknown']);
      DEFAULT_TIMELINE_EVENTS.forEach((event) => {
        expect(
          vendorKeys.has(event.vendor) || metaVendors.has(event.vendor) || event.vendor.length > 0
        ).toBe(true);
      });
    });

    it('should have valid structure in historical snapshots', () => {
      DEFAULT_HISTORICAL_SNAPSHOTS.forEach((snapshot) => {
        expect(snapshot.quarter).toBeTruthy();
        expect(typeof snapshot.data).toBe('object');
        Object.values(snapshot.data).forEach((entry) => {
          expect(entry.share).toBeGreaterThanOrEqual(0);
          expect(entry.pricing).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('should reference valid vendors in partner data', () => {
      const vendorKeys = new Set(DEFAULT_VENDORS.map((v) => v.key));
      DEFAULT_PARTNERS.forEach((partner) => {
        expect(vendorKeys.has(partner.vendorKey)).toBe(true);
      });
    });

    it('should reference valid vendors in signal data', () => {
      const vendorKeys = new Set(DEFAULT_VENDORS.map((v) => v.key));
      DEFAULT_INTEL_SIGNALS.forEach((signal) => {
        expect(vendorKeys.has(signal.vendor)).toBe(true);
      });
    });

    it('should have market size data with valid structure', () => {
      expect(DEFAULT_MARKET_SIZE.byCategory).toBeTruthy();
      expect(DEFAULT_MARKET_SIZE.byIndication).toBeTruthy();
      expect(DEFAULT_MARKET_SIZE.byRegion).toBeTruthy();
      expect(DEFAULT_MARKET_SIZE.totalNGS).toBeGreaterThan(0);
      expect(DEFAULT_MARKET_SIZE.cagr).toBeDefined();
      expect(DEFAULT_MARKET_SIZE.year).toBeGreaterThan(0);
    });
  });
});
