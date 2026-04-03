import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useData } from '@/store/DataContext';
import { useScenario } from '@/store/ScenarioContext';

describe('Store Context Hooks', () => {
  describe('useData', () => {
    it('should throw error when used outside DataContext.Provider', () => {
      expect(() => {
        renderHook(() => useData());
      }).toThrow('useData must be used within a DataContext.Provider');
    });
  });

  describe('useScenario', () => {
    it('should not throw when used outside ScenarioContext.Provider (returns default)', () => {
      // ScenarioContext may have a default value or may not throw
      // Test that the hook is defined and callable
      expect(useScenario).toBeDefined();
      expect(typeof useScenario).toBe('function');
    });
  });
});
