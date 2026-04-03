/**
 * Executive Report Generation Service
 *
 * Generates professional reports in PPTX and PDF formats from platform data.
 *
 * Report Types:
 * 1. Quarterly Market Update — TAM, share movements, top vendor changes, signals
 * 2. Vendor Deep Dive — Single-vendor profile with financial data, portfolio, SWOT
 * 3. Indication Landscape — Indication-specific coverage, vendor penetration, pipeline
 * 4. Competitive Battlecard — Head-to-head comparison for sales team use
 */

import type { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Types
// ============================================

export type ReportType = 'quarterly_update' | 'vendor_deep_dive' | 'indication_landscape' | 'competitive_battlecard';
export type ReportFormat = 'pptx' | 'pdf' | 'xlsx';

export interface ReportParameters {
  // Quarterly Update
  quarter?: string;  // e.g. 'Q1 2026'
  // Vendor Deep Dive
  vendorKey?: string;
  // Indication Landscape
  indicationKey?: string;
  // Competitive Battlecard
  vendorKeys?: string[];  // 2-3 vendors to compare
  // Common
  includeFinancials?: boolean;
  includeSignals?: boolean;
  dateRange?: { start: string; end: string };
}

export interface ReportData {
  title: string;
  subtitle: string;
  generatedAt: string;
  sections: ReportSection[];
}

export interface ReportSection {
  heading: string;
  type: 'summary' | 'table' | 'metrics' | 'chart_data' | 'text';
  content: unknown;
}

interface MetricItem {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
}

interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

// Output directory for generated reports
const REPORTS_DIR = path.join(process.cwd(), 'generated-reports');

/**
 * Ensure output directory exists
 */
function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

// ============================================
// Data Fetchers
// ============================================

async function fetchMarketOverview(db: Pool): Promise<ReportSection> {
  const marketSize = await db.query('SELECT * FROM market_size ORDER BY year DESC LIMIT 1');
  const ms = marketSize.rows[0];

  const vendorCount = await db.query('SELECT COUNT(*) FROM vendors');
  const productCount = await db.query('SELECT COUNT(*) FROM products');

  const metrics: MetricItem[] = [
    { label: 'Total NGS Market', value: `$${((ms?.total_ngs || 0) / 1e9).toFixed(1)}B`, trend: 'up' },
    { label: 'CAGR', value: `${(ms?.cagr || 0).toFixed(1)}%`, trend: 'up' },
    { label: 'Tracked Vendors', value: vendorCount.rows[0].count },
    { label: 'Tracked Products', value: productCount.rows[0].count },
  ];

  return { heading: 'Market Overview', type: 'metrics', content: metrics };
}

async function fetchTopVendorsByShare(db: Pool, limit = 10): Promise<ReportSection> {
  const result = await db.query(
    `SELECT p.vendor_key, v.label as vendor_name, SUM(p.share) as total_share, COUNT(*) as product_count
     FROM products p JOIN vendors v ON p.vendor_key = v.key
     GROUP BY p.vendor_key, v.label
     ORDER BY total_share DESC LIMIT $1`,
    [limit],
  );

  const table: TableData = {
    headers: ['Rank', 'Vendor', 'Total Share (%)', 'Products'],
    rows: result.rows.map((r, i) => [
      i + 1,
      r.vendor_name,
      parseFloat(r.total_share).toFixed(1),
      r.product_count,
    ]),
  };

  return { heading: 'Top Vendors by Market Share', type: 'table', content: table };
}

async function fetchRecentSignals(db: Pool, limit = 10, vendorKey?: string): Promise<ReportSection> {
  let query = 'SELECT * FROM intel_signals';
  const params: unknown[] = [];

  if (vendorKey) {
    query += ' WHERE vendor = $1';
    params.push(vendorKey);
  }

  query += ' ORDER BY date DESC LIMIT $' + (params.length + 1);
  params.push(limit);

  const result = await db.query(query, params);

  const table: TableData = {
    headers: ['Date', 'Type', 'Vendor', 'Title', 'Impact'],
    rows: result.rows.map((r) => [
      r.date ? new Date(r.date).toISOString().split('T')[0] : 'N/A',
      r.type,
      r.vendor || 'N/A',
      r.title,
      r.impact || 'N/A',
    ]),
  };

  return { heading: 'Recent Intelligence Signals', type: 'table', content: table };
}

async function fetchVendorProfile(db: Pool, vendorKey: string): Promise<ReportSection[]> {
  const sections: ReportSection[] = [];

  // Vendor info
  const vendor = await db.query('SELECT * FROM vendors WHERE key = $1', [vendorKey]);
  if (vendor.rows.length === 0) throw new Error(`Vendor not found: ${vendorKey}`);

  const v = vendor.rows[0];
  sections.push({
    heading: `${v.label} — Company Profile`,
    type: 'summary',
    content: {
      strength: v.strength,
      weakness: v.weakness,
      recentMove: v.recent_move,
    },
  });

  // Products
  const products = await db.query(
    `SELECT name, category, tier, share, pricing, regulatory, growth
     FROM products WHERE vendor_key = $1 ORDER BY share DESC`,
    [vendorKey],
  );

  sections.push({
    heading: 'Product Portfolio',
    type: 'table',
    content: {
      headers: ['Product', 'Category', 'Tier', 'Share (%)', 'Pricing ($)', 'Regulatory', 'Growth'],
      rows: products.rows.map((p) => [
        p.name, p.category, p.tier || 'N/A', p.share, p.pricing, p.regulatory || 'N/A', p.growth || 'N/A',
      ]),
    } as TableData,
  });

  // Financials
  const fin = await db.query('SELECT * FROM financial_profiles WHERE vendor_key = $1', [vendorKey]);
  if (fin.rows.length > 0) {
    const f = fin.rows[0];
    const metrics: MetricItem[] = [
      { label: 'Revenue', value: f.revenue ? `$${(f.revenue / 1e9).toFixed(2)}B` : 'N/A' },
      { label: 'Gross Margin', value: f.gross_margin ? `${f.gross_margin}%` : 'N/A' },
      { label: 'Operating Margin', value: f.op_margin ? `${f.op_margin}%` : 'N/A' },
      { label: 'R&D Spend', value: f.rd_spend ? `$${(f.rd_spend / 1e6).toFixed(0)}M` : 'N/A' },
      { label: 'Cash', value: f.cash ? `$${(f.cash / 1e9).toFixed(2)}B` : 'N/A' },
      { label: 'Market Cap', value: f.market_cap ? `$${(f.market_cap / 1e9).toFixed(1)}B` : 'N/A' },
    ];
    sections.push({ heading: 'Financial Overview', type: 'metrics', content: metrics });
  }

  return sections;
}

async function fetchCategoryShareData(db: Pool): Promise<ReportSection> {
  const result = await db.query(
    `SELECT category, SUM(share) as total_share, COUNT(*) as products,
            AVG(pricing) as avg_pricing
     FROM products GROUP BY category ORDER BY total_share DESC`,
  );

  const table: TableData = {
    headers: ['Category', 'Total Share (%)', 'Products', 'Avg Pricing ($)'],
    rows: result.rows.map((r) => [
      r.category,
      parseFloat(r.total_share).toFixed(1),
      r.products,
      parseFloat(r.avg_pricing).toFixed(0),
    ]),
  };

  return { heading: 'Market Share by Category', type: 'table', content: table };
}

// ============================================
// Report Builders
// ============================================

async function buildQuarterlyUpdate(db: Pool, params: ReportParameters): Promise<ReportData> {
  const quarter = params.quarter || `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;

  const sections: ReportSection[] = [
    await fetchMarketOverview(db),
    await fetchCategoryShareData(db),
    await fetchTopVendorsByShare(db, 12),
  ];

  if (params.includeSignals !== false) {
    sections.push(await fetchRecentSignals(db, 15));
  }

  return {
    title: `NGS Market Update — ${quarter}`,
    subtitle: 'Competitive Intelligence Platform',
    generatedAt: new Date().toISOString(),
    sections,
  };
}

async function buildVendorDeepDive(db: Pool, params: ReportParameters): Promise<ReportData> {
  if (!params.vendorKey) throw new Error('vendorKey required for vendor deep dive report');

  const vendorResult = await db.query('SELECT label FROM vendors WHERE key = $1', [params.vendorKey]);
  const vendorLabel = vendorResult.rows[0]?.label || params.vendorKey;

  const sections = await fetchVendorProfile(db, params.vendorKey);

  if (params.includeSignals !== false) {
    sections.push(await fetchRecentSignals(db, 10, params.vendorKey));
  }

  return {
    title: `Vendor Deep Dive — ${vendorLabel}`,
    subtitle: 'NGS Competitive Intelligence Platform',
    generatedAt: new Date().toISOString(),
    sections,
  };
}

async function buildIndicationLandscape(db: Pool, params: ReportParameters): Promise<ReportData> {
  if (!params.indicationKey) throw new Error('indicationKey required for indication landscape report');

  const products = await db.query(
    `SELECT p.*, v.label as vendor_name
     FROM products p
     JOIN product_indications pi ON p.id = pi.product_id
     JOIN vendors v ON p.vendor_key = v.key
     WHERE pi.indication_key = $1
     ORDER BY p.share DESC`,
    [params.indicationKey],
  );

  const sections: ReportSection[] = [
    {
      heading: 'Products Serving This Indication',
      type: 'table',
      content: {
        headers: ['Product', 'Vendor', 'Category', 'Share (%)', 'Tier', 'Regulatory'],
        rows: products.rows.map((p) => [
          p.name, p.vendor_name, p.category, p.share, p.tier || 'N/A', p.regulatory || 'N/A',
        ]),
      } as TableData,
    },
  ];

  // Vendor penetration summary
  const vendorPen = await db.query(
    `SELECT v.label, COUNT(*) as products, SUM(p.share) as total_share
     FROM products p JOIN product_indications pi ON p.id = pi.product_id
     JOIN vendors v ON p.vendor_key = v.key
     WHERE pi.indication_key = $1
     GROUP BY v.label ORDER BY total_share DESC`,
    [params.indicationKey],
  );

  sections.push({
    heading: 'Vendor Penetration',
    type: 'table',
    content: {
      headers: ['Vendor', 'Products', 'Combined Share (%)'],
      rows: vendorPen.rows.map((r) => [r.label, r.products, parseFloat(r.total_share).toFixed(1)]),
    } as TableData,
  });

  return {
    title: `Indication Landscape — ${params.indicationKey.replace(/_/g, ' ')}`,
    subtitle: 'NGS Competitive Intelligence Platform',
    generatedAt: new Date().toISOString(),
    sections,
  };
}

async function buildCompetitiveBattlecard(db: Pool, params: ReportParameters): Promise<ReportData> {
  const keys = params.vendorKeys || [];
  if (keys.length < 2) throw new Error('At least 2 vendorKeys required for battlecard');

  const sections: ReportSection[] = [];

  // Fetch all vendors
  const vendors = await db.query(
    'SELECT * FROM vendors WHERE key = ANY($1)',
    [keys],
  );

  // Comparison table
  const comparisonRows: (string | number)[][] = [];
  const vendorProfiles: Record<string, unknown>[] = [];

  for (const v of vendors.rows) {
    const products = await db.query(
      'SELECT COUNT(*) as count, SUM(share) as total_share, AVG(pricing) as avg_price FROM products WHERE vendor_key = $1',
      [v.key],
    );
    const fin = await db.query('SELECT * FROM financial_profiles WHERE vendor_key = $1', [v.key]);

    const p = products.rows[0];
    const f = fin.rows[0] || {};

    comparisonRows.push([
      v.label,
      p.count,
      parseFloat(p.total_share || '0').toFixed(1),
      parseFloat(p.avg_price || '0').toFixed(0),
      f.revenue ? `$${(f.revenue / 1e9).toFixed(2)}B` : 'N/A',
      f.gross_margin ? `${f.gross_margin}%` : 'N/A',
    ]);

    vendorProfiles.push({
      key: v.key,
      label: v.label,
      strength: v.strength,
      weakness: v.weakness,
      recentMove: v.recent_move,
    });
  }

  sections.push({
    heading: 'Head-to-Head Comparison',
    type: 'table',
    content: {
      headers: ['Vendor', 'Products', 'Total Share (%)', 'Avg Pricing ($)', 'Revenue', 'Gross Margin'],
      rows: comparisonRows,
    } as TableData,
  });

  // SWOT for each
  for (const vp of vendorProfiles) {
    sections.push({
      heading: `${(vp as Record<string, string>).label} — Positioning`,
      type: 'summary',
      content: vp,
    });
  }

  const vendorLabels = vendors.rows.map((v) => v.label).join(' vs ');

  return {
    title: `Competitive Battlecard — ${vendorLabels}`,
    subtitle: 'NGS Competitive Intelligence Platform',
    generatedAt: new Date().toISOString(),
    sections,
  };
}

// ============================================
// Public API
// ============================================

/**
 * Generate a report and return structured data.
 * The actual PPTX/PDF rendering happens client-side or via a dedicated renderer.
 */
export async function generateReport(
  db: Pool,
  reportType: ReportType,
  format: ReportFormat,
  params: ReportParameters,
  userId?: string,
): Promise<{ reportId: string; data: ReportData; filePath?: string }> {
  // Create report record
  const reportResult = await db.query(
    `INSERT INTO generated_reports (report_type, format, title, generated_by, parameters, status)
     VALUES ($1, $2, $3, $4, $5, 'generating')
     RETURNING id`,
    [reportType, format, `${reportType} report`, userId || null, JSON.stringify(params)],
  );
  const reportId = reportResult.rows[0].id as string;

  try {
    let data: ReportData;

    switch (reportType) {
      case 'quarterly_update':
        data = await buildQuarterlyUpdate(db, params);
        break;
      case 'vendor_deep_dive':
        data = await buildVendorDeepDive(db, params);
        break;
      case 'indication_landscape':
        data = await buildIndicationLandscape(db, params);
        break;
      case 'competitive_battlecard':
        data = await buildCompetitiveBattlecard(db, params);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    // Update report title
    await db.query(
      `UPDATE generated_reports SET title = $1, status = 'completed' WHERE id = $2`,
      [data.title, reportId],
    );

    // If PPTX or PDF format, write JSON data to disk for rendering
    ensureReportsDir();
    const jsonPath = path.join(REPORTS_DIR, `${reportId}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

    return { reportId, data, filePath: jsonPath };
  } catch (error) {
    await db.query(
      `UPDATE generated_reports SET status = 'failed', error_message = $1 WHERE id = $2`,
      [error instanceof Error ? error.message : 'Unknown error', reportId],
    );
    throw error;
  }
}

export { fetchMarketOverview, fetchTopVendorsByShare, fetchVendorProfile };
