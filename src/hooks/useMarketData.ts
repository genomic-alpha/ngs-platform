import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DEFAULT_MARKET_SIZE } from '@/core/data/market-size';
import { DEFAULT_HISTORICAL_SNAPSHOTS } from '@/core/data/historical';
import { DEFAULT_COST_COMPONENTS } from '@/core/data/costs';
import type { MarketSize, HistoricalSnapshot, CostComponent } from '@/core/types';

export function useMarketSize() {
  return useQuery({
    queryKey: ['marketSize'],
    queryFn: () => api.get<MarketSize>('/market-size'),
    placeholderData: DEFAULT_MARKET_SIZE,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateMarketSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MarketSize>) =>
      api.put<MarketSize>('/market-size', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketSize'] });
    },
  });
}

export function useHistoricalSnapshots() {
  return useQuery({
    queryKey: ['historicalSnapshots'],
    queryFn: () => api.get<HistoricalSnapshot[]>('/historical-snapshots'),
    placeholderData: DEFAULT_HISTORICAL_SNAPSHOTS,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCostComponents() {
  return useQuery({
    queryKey: ['costComponents'],
    queryFn: () => api.get<Record<string, CostComponent>>('/cost-components'),
    placeholderData: DEFAULT_COST_COMPONENTS,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateCostComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      data,
    }: {
      key: string;
      data: Partial<CostComponent>;
    }) => api.put<CostComponent>(`/cost-components/${key}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costComponents'] });
    },
  });
}
