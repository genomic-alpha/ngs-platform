import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

interface PipelineRun {
  id: number;
  pipeline: string;
  status: string;
  triggered_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  records_found: number;
  records_updated: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface SecFiling {
  id: number;
  vendor_key: string;
  filing_type: string;
  filing_date: string;
  fiscal_year: number;
  fiscal_quarter: number | null;
  revenue: number | null;
  gross_profit: number | null;
  operating_income: number | null;
  r_and_d: number | null;
  review_status: string;
  review_notes: string | null;
}

interface PipelineResult {
  runId: number;
  vendorsProcessed?: number;
  filingsFound?: number;
  submissionsFound?: number;
  trialsFound?: number;
  signalsGenerated?: number;
  errors: string[];
}

// Pipeline runs
export function usePipelineRuns(pipeline?: string) {
  return useQuery({
    queryKey: ['pipeline-runs', pipeline],
    queryFn: () => api.get<PipelineRun[]>(`/pipelines/runs${pipeline ? `?pipeline=${pipeline}` : ''}`),
    staleTime: 30 * 1000,
  });
}

// SEC EDGAR
export function useSecFilings(vendorKey?: string, reviewStatus?: string) {
  const params = new URLSearchParams();
  if (vendorKey) params.set('vendor_key', vendorKey);
  if (reviewStatus) params.set('review_status', reviewStatus);
  const query = params.toString();

  return useQuery({
    queryKey: ['sec-filings', vendorKey, reviewStatus],
    queryFn: () => api.get<SecFiling[]>(`/pipelines/sec-edgar/filings${query ? `?${query}` : ''}`),
    staleTime: 60 * 1000,
  });
}

export function useRunSecEdgar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { targetYear?: number; vendorKeys?: string[] }) =>
      api.post<PipelineResult>('/pipelines/sec-edgar/run', params || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-runs'] });
      queryClient.invalidateQueries({ queryKey: ['sec-filings'] });
    },
  });
}

export function useApproveSecFiling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filingId, notes }: { filingId: number; notes?: string }) =>
      api.post(`/pipelines/sec-edgar/filings/${filingId}/approve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sec-filings'] });
      queryClient.invalidateQueries({ queryKey: ['financials'] });
    },
  });
}

// FDA Pipeline
export function useRunFdaPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { lookbackDays?: number }) =>
      api.post<PipelineResult>('/pipelines/fda/run', params || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-runs'] });
      queryClient.invalidateQueries({ queryKey: ['intel-signals'] });
    },
  });
}

// Clinical Trials Pipeline
export function useRunClinicalTrials() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { lookbackDays?: number }) =>
      api.post<PipelineResult>('/pipelines/clinical-trials/run', params || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-runs'] });
      queryClient.invalidateQueries({ queryKey: ['intel-signals'] });
    },
  });
}
