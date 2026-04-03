import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DEFAULT_VENDORS } from '@/core/data/vendors';
import type { Vendor } from '@/core/types';

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: () => api.get<Vendor[]>('/vendors'),
    placeholderData: DEFAULT_VENDORS,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: Partial<Vendor> }) =>
      api.put<Vendor>(`/vendors/${key}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}
