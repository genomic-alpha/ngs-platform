import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DEFAULT_COMPATIBILITY } from '@/core/data/compatibility';
import { DEFAULT_COMPATIBILITY_LAYERS } from '@/core/data/compatibility-layers';
import type { CompatibilityEntry, CompatibilityLayer } from '@/core/types';

interface CompatibilityData {
  entries: CompatibilityEntry[];
  layers: CompatibilityLayer[];
}

export function useCompatibility() {
  return useQuery({
    queryKey: ['compatibility'],
    queryFn: () => api.get<CompatibilityData>('/compatibility'),
    placeholderData: {
      entries: DEFAULT_COMPATIBILITY,
      layers: DEFAULT_COMPATIBILITY_LAYERS,
    },
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCompatibilityLayers() {
  return useQuery({
    queryKey: ['compatibilityLayers'],
    queryFn: () => api.get<CompatibilityLayer[]>('/compatibility-layers'),
    placeholderData: DEFAULT_COMPATIBILITY_LAYERS,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCompatibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CompatibilityEntry) =>
      api.post<CompatibilityEntry>('/compatibility', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compatibility'] });
    },
  });
}
