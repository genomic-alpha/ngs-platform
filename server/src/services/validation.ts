import { z } from 'zod';

// Vendor schema
export const vendorSchema = z.object({
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  strength: z.string().optional(),
  weakness: z.string().optional(),
  recentMove: z.string().optional(),
});

// Product schema
export const productSchema = z.object({
  id: z.string().min(1),
  vendor: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  tier: z.number().int().min(1).max(5),
  share: z.number().min(0).max(100),
  pricing: z.string().min(1),
  regulatory: z.string().min(1),
  region: z.string().min(1),
  growth: z.number().min(-100).max(500),
  sampleTypes: z.array(z.string()).min(0),
  nucleicAcids: z.array(z.string()).min(0),
  indications: z.array(z.string()).min(0),
  regionalShare: z.record(z.number()).optional(),
  confidence: z.number().min(0).max(100).optional(),
});

// Financial schema
export const financialSchema = z.object({
  vendorKey: z.string().min(1),
  ticker: z.string().min(1),
  lastFY: z.number().int().min(1900),
  revenue: z.number().min(0),
  grossMargin: z.number().min(0).max(100).optional(),
  operatingMargin: z.number().min(0).max(100).optional(),
  rd: z.number().min(0).optional(),
  capex: z.number().min(0).optional(),
  debtToEquity: z.number().min(0).optional(),
  peRatio: z.number().min(0).optional(),
});

// Signal schema
export const signalSchema = z.object({
  id: z.string().optional(),
  date: z.string().datetime(),
  type: z.enum(['acquisition', 'partnership', 'launch', 'regulatory', 'patent', 'other']),
  vendor: z.string().optional(),
  title: z.string().min(1),
  impact: z.enum(['high', 'medium', 'low']),
  summary: z.string().optional(),
  source: z.string().min(1),
});

// Partner schema
export const partnerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  vendorKey: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']),
  tier: z.enum(['strategic', 'standard', 'integrations']).optional(),
  healthScore: z.number().min(0).max(100),
  contractStart: z.string().datetime().optional(),
  contractEnd: z.string().datetime().optional(),
  annualValue: z.number().min(0).optional(),
  productsUsed: z.array(z.string()).optional(),
  integrationStatus: z.enum(['integrated', 'pending', 'planned']).optional(),
  notes: z.string().optional(),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).optional(),
});

// Market size schema
export const marketSizeSchema = z.object({
  totalNGS: z.number().min(0),
  cagr: z.number().min(-100).max(500),
  year: z.number().int().min(1900),
  byCategory: z.record(z.number()).optional(),
  byIndication: z.record(z.number()).optional(),
  byRegion: z.record(z.number()).optional(),
});

// Cost component schema
export const costComponentSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1),
  component: z.string().min(1),
  perSample: z.number().min(0).optional(),
  perRun: z.number().min(0).optional(),
  annual: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Compatibility schema
export const compatibilitySchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  layer: z.enum(['sample', 'workflow', 'platform', 'data']),
  level: z.enum(['full', 'partial', 'none']),
  notes: z.string().optional(),
  protocol: z.string().optional(),
});

// Timeline schema
export const timelineSchema = z.object({
  year: z.number().int().min(1900),
  event: z.string().min(1),
  vendor: z.string().optional(),
  impact: z.enum(['high', 'medium', 'low']).optional(),
});
