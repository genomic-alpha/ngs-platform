import { describe, it, expect } from 'vitest';
import type { Region, Indication, IndicationKey } from '@/core/types';
import { REGIONS, INDICATIONS, INDICATION_KEYS } from '@/core/constants';

describe('Constants Module', () => {
  describe('REGIONS', () => {
    it('should have exactly 5 regions', () => {
      expect(REGIONS).toHaveLength(5);
    });

    it('should have correct region keys', () => {
      const keys = REGIONS.map((r) => r.key);
      expect(keys).toContain('global');
      expect(keys).toContain('na');
      expect(keys).toContain('we');
      expect(keys).toContain('hg');
      expect(keys).toContain('od');
    });

    it('each region should have key, label, and color properties', () => {
      REGIONS.forEach((region: Region) => {
        expect(region).toHaveProperty('key');
        expect(region).toHaveProperty('label');
        expect(region).toHaveProperty('color');
        expect(typeof region.key).toBe('string');
        expect(typeof region.label).toBe('string');
        expect(typeof region.color).toBe('string');
      });
    });

    it('each region should have valid hex color', () => {
      REGIONS.forEach((region: Region) => {
        expect(region.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('each region label should be non-empty', () => {
      REGIONS.forEach((region: Region) => {
        expect(region.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('INDICATIONS', () => {
    it('should have exactly 8 indications', () => {
      expect(INDICATIONS).toHaveLength(8);
    });

    it('should have all expected indication keys', () => {
      const keys = INDICATIONS.map((i) => i.key);
      expect(keys).toContain('solid_tumor');
      expect(keys).toContain('liquid_biopsy');
      expect(keys).toContain('hereditary_cancer');
      expect(keys).toContain('heme_malig');
      expect(keys).toContain('rare_disease');
      expect(keys).toContain('pharmacogenomics');
      expect(keys).toContain('hla_typing');
      expect(keys).toContain('infectious_disease');
    });

    it('each indication should have key, label, icon, and color properties', () => {
      INDICATIONS.forEach((indication: Indication) => {
        expect(indication).toHaveProperty('key');
        expect(indication).toHaveProperty('label');
        expect(indication).toHaveProperty('icon');
        expect(indication).toHaveProperty('color');
        expect(typeof indication.key).toBe('string');
        expect(typeof indication.label).toBe('string');
        expect(typeof indication.icon).toBe('string');
        expect(typeof indication.color).toBe('string');
      });
    });

    it('each indication should have valid hex color', () => {
      INDICATIONS.forEach((indication: Indication) => {
        expect(indication.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('each indication label should be non-empty', () => {
      INDICATIONS.forEach((indication: Indication) => {
        expect(indication.label.length).toBeGreaterThan(0);
      });
    });

    it('each indication icon should be non-empty', () => {
      INDICATIONS.forEach((indication: Indication) => {
        expect(indication.icon.length).toBeGreaterThan(0);
      });
    });
  });

  describe('INDICATION_KEYS', () => {
    it('should have exactly 8 keys', () => {
      expect(INDICATION_KEYS).toHaveLength(8);
    });

    it('should contain all expected keys', () => {
      expect(INDICATION_KEYS).toContain('solid_tumor');
      expect(INDICATION_KEYS).toContain('liquid_biopsy');
      expect(INDICATION_KEYS).toContain('hereditary_cancer');
      expect(INDICATION_KEYS).toContain('heme_malig');
      expect(INDICATION_KEYS).toContain('rare_disease');
      expect(INDICATION_KEYS).toContain('pharmacogenomics');
      expect(INDICATION_KEYS).toContain('hla_typing');
      expect(INDICATION_KEYS).toContain('infectious_disease');
    });

    it('should match keys from INDICATIONS array', () => {
      const indicationKeys = INDICATIONS.map((i) => i.key);
      expect(INDICATION_KEYS).toEqual(indicationKeys);
    });

    it('all keys should be strings', () => {
      INDICATION_KEYS.forEach((key: IndicationKey) => {
        expect(typeof key).toBe('string');
      });
    });
  });

  describe('Region and Indication consistency', () => {
    it('all regions should have unique keys', () => {
      const keys = REGIONS.map((r) => r.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('all indications should have unique keys', () => {
      const keys = INDICATIONS.map((i) => i.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('INDICATION_KEYS should reference existing indications', () => {
      const validKeys = INDICATIONS.map((i) => i.key);
      INDICATION_KEYS.forEach((key) => {
        expect(validKeys).toContain(key);
      });
    });
  });
});
