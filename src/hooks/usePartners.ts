import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DEFAULT_PARTNERS } from '@/core/data/partners';
import type { Partner } from '@/core/types';

export function usePartners() {
  return useQuery({
    queryKey: ['partners'],
    queryFn: () => api.get<Partner[]>('/partners'),
    placeholderData: DEFAULT_PARTNERS,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Partner, 'id'>) =>
      api.post<Partner>('/partners', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Partner> }) =>
      api.put<Partner>(`/partners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });
}
