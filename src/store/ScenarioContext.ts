import { createContext, useContext } from 'react';
import type { ScenarioContextType } from '@/core/types';

export const ScenarioContext = createContext<ScenarioContextType>({
  adjustments: {},
  setAdjustments: () => {},
});

export function useScenario(): ScenarioContextType {
  return useContext(ScenarioContext);
}
