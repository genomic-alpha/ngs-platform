import { createContext, useContext } from 'react';
import type { DataContextType } from '@/core/types';

export const DataContext = createContext<DataContextType | null>(null);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a DataContext.Provider');
  }
  return ctx;
}
