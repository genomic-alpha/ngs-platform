import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DEFAULT_INTEL_SIGNALS } from '@/core/data/signals';
import { DEFAULT_TIMELINE_EVENTS } from '@/core/data/timeline';
import type { IntelSignal, TimelineEvent } from '@/core/types';

interface SignalFilters {
  type?: string;
  vendor?: string;
  impact?: string;
}

export function useIntelSignals(filters?: SignalFilters) {
  const queryString = filters
    ? `?${new URLSearchParams(filters as Record<string, string>).toString()}`
    : '';

  return useQuery({
    queryKey: ['intelSignals', filters],
    queryFn: () => api.get<IntelSignal[]>(`/intel-signals${queryString}`),
    placeholderData: DEFAULT_INTEL_SIGNALS,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<IntelSignal, 'id'>) =>
      api.post<IntelSignal>('/intel-signals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelSignals'] });
    },
  });
}

export function useTimelineEvents() {
  return useQuery({
    queryKey: ['timelineEvents'],
    queryFn: () => api.get<TimelineEvent[]>('/timeline-events'),
    placeholderData: DEFAULT_TIMELINE_EVENTS,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateTimelineEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TimelineEvent) =>
      api.post<TimelineEvent>('/timeline-events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelineEvents'] });
    },
  });
}
