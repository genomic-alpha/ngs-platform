import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

interface ScenarioAdjustment {
  productId: string;
  parameter: 'share' | 'pricing' | 'tam_growth' | 'regulatory' | 'new_product';
  originalValue: number | string;
  newValue: number | string;
  change?: number;
}

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  creator_name: string | null;
  is_shared: boolean;
  adjustments: ScenarioAdjustment[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface CreateScenarioInput {
  name: string;
  description?: string;
  adjustments: ScenarioAdjustment[];
  tags?: string[];
  is_shared?: boolean;
}

export function useScenarios() {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: () => api.get<Scenario[]>('/scenarios'),
    staleTime: 60 * 1000,
  });
}

export function useSharedScenarios() {
  return useQuery({
    queryKey: ['scenarios', 'shared'],
    queryFn: () => api.get<Scenario[]>('/scenarios?shared_only=true'),
    staleTime: 60 * 1000,
  });
}

export function useScenario(id: string) {
  return useQuery({
    queryKey: ['scenarios', id],
    queryFn: () => api.get<Scenario>(`/scenarios/${id}`),
    enabled: !!id,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScenarioInput) => api.post<Scenario>('/scenarios', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateScenarioInput> }) =>
      api.put<Scenario>(`/scenarios/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/scenarios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}

export type { Scenario, ScenarioAdjustment, CreateScenarioInput };
