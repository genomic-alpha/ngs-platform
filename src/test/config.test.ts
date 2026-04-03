import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  getCategoryColor,
  getIndicationColor,
  CONFIDENCE_COLORS,
  REGION_CONFIG,
  SAMPLE_TYPE_LABELS,
  NUCLEIC_ACID_LABELS,
  GROWTH_LABELS,
  GROWTH_COLORS,
} from '@/core/config';

describe('Config Module', () => {
  describe('CATEGORIES', () => {
    it('should have exactly 7 entries', () => {
      expect(CATEGORIES).toHaveLength(7);
    });

    it('should contain all expected category names', () => {
      expect(CATEGORIES).toContain('Extraction');
      expect(CATEGORIES).toContain('Library Prep');
      expect(CATEGORIES).toContain('Automation');
      expect(CATEGORIES).toContain('Sequencing');
      expect(CATEGORIES).toContain('Analysis');
      expect(CATEGORIES).toContain('Reporting');
      expect(CATEGORIES).toContain('Diagnostic Services');
    });
  });

  describe('getCategoryColor', () => {
    it('should return valid hex color for each category', () => {
      CATEGORIES.forEach((category) => {
        const color = getCategoryColor(category);
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should return default color for unknown category', () => {
      const color = getCategoryColor('Unknown');
      expect(color).toBe('#9ca3af');
    });

    it('should return correct colors for specific categories', () => {
      expect(getCategoryColor('Extraction')).toBe('#f59e0b');
      expect(getCategoryColor('Library Prep')).toBe('#3b82f6');
      expect(getCategoryColor('Sequencing')).toBe('#ef4444');
    });
  });

  describe('getIndicationColor', () => {
    const indicationKeys = [
      'solid_tumor',
      'liquid_biopsy',
      'hereditary_cancer',
      'heme_malig',
      'rare_disease',
      'pharmacogenomics',
      'hla_typing',
      'infectious_disease',
    ];

    it('should return valid hex color for each indication', () => {
      indicationKeys.forEach((key) => {
        const color = getIndicationColor(key);
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should return default color for unknown indication', () => {
      const color = getIndicationColor('unknown_indication');
      expect(color).toBe('#6b7280');
    });

    it('should return correct colors for specific indications', () => {
      expect(getIndicationColor('solid_tumor')).toBe('#ef4444');
      expect(getIndicationColor('liquid_biopsy')).toBe('#f97316');
      expect(getIndicationColor('pharmacogenomics')).toBe('#6366f1');
    });
  });

  describe('CONFIDENCE_COLORS', () => {
    it('should have all required keys', () => {
      expect(CONFIDENCE_COLORS).toHaveProperty('verified');
      expect(CONFIDENCE_COLORS).toHaveProperty('estimated');
      expect(CONFIDENCE_COLORS).toHaveProperty('approximate');
      expect(CONFIDENCE_COLORS).toHaveProperty('unverified');
      expect(CONFIDENCE_COLORS).toHaveProperty('low');
    });

    it('should have exactly 5 keys', () => {
      expect(Object.keys(CONFIDENCE_COLORS)).toHaveLength(5);
    });

    it('should return valid hex colors for all confidence levels', () => {
      Object.values(CONFIDENCE_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('REGION_CONFIG', () => {
    it('should have exactly 4 region keys', () => {
      const keys = Object.keys(REGION_CONFIG);
      expect(keys).toHaveLength(5);
      expect(keys).toContain('global');
      expect(keys).toContain('na');
      expect(keys).toContain('we');
      expect(keys).toContain('hg');
      expect(keys).toContain('od');
    });

    it('should have valid properties for each region', () => {
      Object.values(REGION_CONFIG).forEach((region) => {
        expect(region).toHaveProperty('key');
        expect(region).toHaveProperty('label');
        expect(region).toHaveProperty('color');
        expect(typeof region.label).toBe('string');
        expect(region.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should have correct region labels', () => {
      expect(REGION_CONFIG.global.label).toBe('Global');
      expect(REGION_CONFIG.na.label).toBe('North America');
      expect(REGION_CONFIG.we.label).toBe('Western Europe');
      expect(REGION_CONFIG.hg.label).toBe('High-Growth');
      expect(REGION_CONFIG.od.label).toBe('Other Dev.');
    });
  });

  describe('SAMPLE_TYPE_LABELS', () => {
    it('should have all sample type keys', () => {
      expect(SAMPLE_TYPE_LABELS).toHaveProperty('ffpe');
      expect(SAMPLE_TYPE_LABELS).toHaveProperty('blood');
      expect(SAMPLE_TYPE_LABELS).toHaveProperty('cfdna');
      expect(SAMPLE_TYPE_LABELS).toHaveProperty('tissue');
      expect(SAMPLE_TYPE_LABELS).toHaveProperty('saliva');
    });

    it('should have exactly 5 sample types', () => {
      expect(Object.keys(SAMPLE_TYPE_LABELS)).toHaveLength(5);
    });

    it('should have non-empty label values', () => {
      Object.values(SAMPLE_TYPE_LABELS).forEach((label) => {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('NUCLEIC_ACID_LABELS', () => {
    it('should have both dna and rna', () => {
      expect(NUCLEIC_ACID_LABELS).toHaveProperty('dna');
      expect(NUCLEIC_ACID_LABELS).toHaveProperty('rna');
    });

    it('should have exactly 2 nucleic acid types', () => {
      expect(Object.keys(NUCLEIC_ACID_LABELS)).toHaveLength(2);
    });
  });

  describe('GROWTH_LABELS', () => {
    it('should have all 5 growth status keys', () => {
      expect(GROWTH_LABELS).toHaveProperty('growing');
      expect(GROWTH_LABELS).toHaveProperty('stable');
      expect(GROWTH_LABELS).toHaveProperty('declining');
      expect(GROWTH_LABELS).toHaveProperty('emerging');
      expect(GROWTH_LABELS).toHaveProperty('pre-launch');
    });

    it('should have exactly 5 growth statuses', () => {
      expect(Object.keys(GROWTH_LABELS)).toHaveLength(5);
    });
  });

  describe('GROWTH_COLORS', () => {
    it('should have all 5 growth status keys', () => {
      expect(GROWTH_COLORS).toHaveProperty('growing');
      expect(GROWTH_COLORS).toHaveProperty('stable');
      expect(GROWTH_COLORS).toHaveProperty('declining');
      expect(GROWTH_COLORS).toHaveProperty('emerging');
      expect(GROWTH_COLORS).toHaveProperty('pre-launch');
    });

    it('should have exactly 5 growth status colors', () => {
      expect(Object.keys(GROWTH_COLORS)).toHaveLength(5);
    });

    it('should return valid hex colors for all growth statuses', () => {
      Object.values(GROWTH_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });
});
