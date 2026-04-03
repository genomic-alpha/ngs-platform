import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

type ReportType = 'quarterly_update' | 'vendor_deep_dive' | 'indication_landscape' | 'competitive_battlecard';
type ReportFormat = 'pptx' | 'pdf' | 'xlsx';

interface ReportParameters {
  quarter?: string;
  vendorKey?: string;
  indicationKey?: string;
  vendorKeys?: string[];
  includeFinancials?: boolean;
  includeSignals?: boolean;
  dateRange?: { start: string; end: string };
}

interface ReportSection {
  heading: string;
  type: 'summary' | 'table' | 'metrics' | 'chart_data' | 'text';
  content: unknown;
}

interface ReportData {
  title: string;
  subtitle: string;
  generatedAt: string;
  sections: ReportSection[];
}

interface GeneratedReport {
  id: string;
  report_type: ReportType;
  format: ReportFormat;
  title: string;
  generated_by: string | null;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  file_size_bytes: number | null;
}

interface GenerateReportResponse {
  reportId: string;
  data: ReportData;
  filePath?: string;
}

// List generated reports
export function useGeneratedReports(reportType?: ReportType) {
  return useQuery({
    queryKey: ['reports', reportType],
    queryFn: () => api.get<GeneratedReport[]>(`/reports${reportType ? `?report_type=${reportType}` : ''}`),
    staleTime: 30 * 1000,
  });
}

// Get report data
export function useReportData(reportId: string) {
  return useQuery({
    queryKey: ['reports', reportId, 'data'],
    queryFn: () => api.get<ReportData>(`/reports/${reportId}/data`),
    enabled: !!reportId,
  });
}

// Generate a new report
export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      reportType: ReportType;
      format: ReportFormat;
      parameters: ReportParameters;
    }) => api.post<GenerateReportResponse>('/reports/generate', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export type { ReportType, ReportFormat, ReportParameters, ReportData, ReportSection, GeneratedReport };
