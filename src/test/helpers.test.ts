import { describe, it, expect } from 'vitest';
import type { Product } from '@/core/types';
import { getTier, getGrowthIcon, getRegulatoryBadge } from '@/components/ui/helpers';

// Mock product for getTier tests
const createMockProduct = (tier: string): Product => ({
  id: 'mock-product',
  vendor: 'test-vendor',
  name: 'Test Product',
  category: 'Sequencing',
  tier: tier as 'A' | 'B' | 'C',
  share: 10,
  pricing: 5000,
  regulatory: 'FDA PMA',
  region: 'global',
  sampleTypes: ['blood'],
  nucleicAcids: ['dna'],
  regionalShare: { na: 40, we: 30, hg: 20, od: 10 },
  growth: 'growing',
  indications: ['solid_tumor'],
  indicationShare: {
    solid_tumor: { global: 100, na: 40, we: 30, hg: 20, od: 10 },
  },
  confidence: {
    share: { level: 'verified', source: 'test', date: '2026-04-01' },
    pricing: { level: 'verified', source: 'test', date: '2026-04-01' },
    regulatory: { level: 'verified', source: 'test', date: '2026-04-01' },
  },
});

describe('UI Helpers', () => {
  describe('getTier', () => {
    it('should return 1 for tier A', () => {
      const product = createMockProduct('A');
      expect(getTier(product)).toBe(1);
    });

    it('should return 2 for tier B', () => {
      const product = createMockProduct('B');
      expect(getTier(product)).toBe(2);
    });

    it('should return 3 for tier C', () => {
      const product = createMockProduct('C');
      expect(getTier(product)).toBe(3);
    });

    it('should return 3 for unknown tier', () => {
      const product = createMockProduct('D');
      expect(getTier(product)).toBe(3);
    });

    it('should handle all valid tier inputs', () => {
      const tierA = createMockProduct('A');
      const tierB = createMockProduct('B');
      const tierC = createMockProduct('C');

      expect(getTier(tierA)).toBeLessThan(getTier(tierB));
      expect(getTier(tierB)).toBeLessThan(getTier(tierC));
    });
  });

  describe('getGrowthIcon', () => {
    it('should return ReactElement for High impact', () => {
      const icon = getGrowthIcon('High');
      expect(icon).toBeDefined();
      expect(typeof icon).toBe('object');
      expect(icon).toHaveProperty('type');
    });

    it('should return ReactElement for Low impact', () => {
      const icon = getGrowthIcon('Low');
      expect(icon).toBeDefined();
      expect(typeof icon).toBe('object');
      expect(icon).toHaveProperty('type');
    });

    it('should return ReactElement for unknown impact', () => {
      const icon = getGrowthIcon('Unknown');
      expect(icon).toBeDefined();
      expect(typeof icon).toBe('object');
    });

    it('should return object with icon and label for each growth status', () => {
      const growthStatuses = ['High', 'Medium', 'Low'];
      growthStatuses.forEach((status) => {
        const icon = getGrowthIcon(status);
        expect(icon).toBeDefined();
        expect(typeof icon).toBe('object');
      });
    });
  });

  describe('getRegulatoryBadge', () => {
    it('should return color class for FDA PMA', () => {
      const badge = getRegulatoryBadge('FDA PMA');
      expect(badge).toBe('bg-blue-900 text-blue-200');
    });

    it('should return color class for FDA 510(k)', () => {
      const badge = getRegulatoryBadge('FDA 510(k)');
      expect(badge).toBe('bg-blue-800 text-blue-200');
    });

    it('should return color class for CE-IVDR', () => {
      const badge = getRegulatoryBadge('CE-IVDR');
      expect(badge).toBe('bg-green-900 text-green-200');
    });

    it('should return color class for CE-IVD', () => {
      const badge = getRegulatoryBadge('CE-IVD');
      expect(badge).toBe('bg-green-800 text-green-300');
    });

    it('should return color class for CLIA/CAP', () => {
      const badge = getRegulatoryBadge('CLIA/CAP');
      expect(badge).toBe('bg-yellow-900 text-yellow-200');
    });

    it('should return color class for ISO 13485', () => {
      const badge = getRegulatoryBadge('ISO 13485');
      expect(badge).toBe('bg-gray-700 text-gray-300');
    });

    it('should return color class for RUO', () => {
      const badge = getRegulatoryBadge('RUO');
      expect(badge).toBe('bg-gray-800 text-gray-400');
    });

    it('should return color class for FDA EUA', () => {
      const badge = getRegulatoryBadge('FDA EUA');
      expect(badge).toBe('bg-purple-900 text-purple-200');
    });

    it('should return default color class for unknown status', () => {
      const badge = getRegulatoryBadge('Unknown');
      expect(badge).toBe('bg-gray-800 text-gray-400');
    });

    it('should return object with color and label for known statuses', () => {
      const knownStatuses = ['FDA PMA', 'CE-IVD', 'CLIA/CAP', 'RUO'];
      knownStatuses.forEach((status) => {
        const badge = getRegulatoryBadge(status);
        expect(badge).toBeDefined();
        expect(typeof badge).toBe('string');
        expect(badge.length).toBeGreaterThan(0);
      });
    });
  });
});
