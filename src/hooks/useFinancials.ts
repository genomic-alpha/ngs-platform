import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DEFAULT_FINANCIALS } from '@/core/data/financials';
import type { FinancialProfile } from '@/core/types';

export function useFinancials() {
  return useQuery({
    queryKey: ['financials'],
    queryFn: () => api.get<Record<string, FinancialProfile>>('/financials'),
    placeholderData: DEFAULT_FINANCIALS,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateFinancial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticker,
      data,
    }: {
      ticker: string;
      data: Partial<FinancialProfile>;
    }) => api.put<FinancialProfile>(`/financials/${ticker}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financials'] });
    },
  });
}
