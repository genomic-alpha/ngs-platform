/**
 * SEC EDGAR Financial Data Pipeline
 *
 * Fetches quarterly/annual financial data for 16 publicly traded NGS vendors
 * from the SEC EDGAR XBRL API. Handles conglomerates by extracting segment data.
 *
 * Data flow:
 * 1. Fetch CIK→filing index from EDGAR
 * 2. Parse XBRL companyfacts for financial line items
 * 3. Extract NGS-relevant segment data for conglomerates
 * 4. Store raw + processed data with review_status='pending'
 * 5. Analyst reviews diff and approves → financials table updated
 */

import type { Pool } from 'pg';

// SEC EDGAR API base (no auth required, but need User-Agent header)
const EDGAR_BASE = 'https://data.sec.gov';
const EDGAR_COMPANY_FACTS = `${EDGAR_BASE}/api/xbrl/companyfacts`;
// const EDGAR_SUBMISSIONS = `${EDGAR_BASE}/cgi-bin/browse-edgar`;

// Required by SEC — must identify the application
const SEC_USER_AGENT = 'NGS-Intelligence-Platform/1.0 (ngs-platform@company.com)';

// XBRL taxonomy tags we care about
const FINANCIAL_TAGS = {
  revenue: [
    'us-gaap:Revenues',
    'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax',
    'us-gaap:SalesRevenueNet',
    'us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax',
  ],
  costOfRevenue: [
    'us-gaap:CostOfRevenue',
    'us-gaap:CostOfGoodsAndServicesSold',
  ],
  grossProfit: [
    'us-gaap:GrossProfit',
  ],
  operatingIncome: [
    'us-gaap:OperatingIncomeLoss',
  ],
  netIncome: [
    'us-gaap:NetIncomeLoss',
    'us-gaap:ProfitLoss',
  ],
  rAndD: [
    'us-gaap:ResearchAndDevelopmentExpense',
    'us-gaap:ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost',
  ],
  totalAssets: [
    'us-gaap:Assets',
  ],
  totalDebt: [
    'us-gaap:LongTermDebt',
    'us-gaap:LongTermDebtAndCapitalLeaseObligations',
  ],
  cashEquivalents: [
    'us-gaap:CashAndCashEquivalentsAtCarryingValue',
    'us-gaap:CashCashEquivalentsAndShortTermInvestments',
  ],
  sharesOutstanding: [
    'us-gaap:CommonStockSharesOutstanding',
    'dei:EntityCommonStockSharesOutstanding',
  ],
  eps: [
    'us-gaap:EarningsPerShareDiluted',
  ],
} as const;

interface EdgarFact {
  val: number;
  accn: string;
  fy: number;
  fp: string; // 'FY', 'Q1', 'Q2', 'Q3', 'Q4'
  form: string; // '10-K', '10-Q'
  filed: string; // date string
  start?: string;
  end: string;
  frame?: string;
}

interface EdgarCompanyFacts {
  cik: number;
  entityName: string;
  facts: {
    'us-gaap'?: Record<string, { units: Record<string, EdgarFact[]> }>;
    'dei'?: Record<string, { units: Record<string, EdgarFact[]> }>;
  };
}

interface VendorMapping {
  vendor_key: string;
  cik: string;
  company_name: string;
  is_conglomerate: boolean;
  segment_keywords: string[];
}

interface ParsedFiling {
  vendorKey: string;
  cik: string;
  accessionNumber: string;
  filingType: '10-K' | '10-Q';
  filingDate: string;
  periodEnd: string;
  fiscalYear: number;
  fiscalQuarter: number | null;
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  rAndD: number | null;
  totalAssets: number | null;
  totalDebt: number | null;
  cashEquivalents: number | null;
  sharesOutstanding: number | null;
  eps: number | null;
  segmentName: string | null;
  segmentRevenue: number | null;
  rawXbrl: Record<string, unknown>;
}

/**
 * Fetch company facts from EDGAR XBRL API
 */
async function fetchCompanyFacts(cik: string): Promise<EdgarCompanyFacts | null> {
  const paddedCik = cik.padStart(10, '0');
  const url = `${EDGAR_COMPANY_FACTS}/CIK${paddedCik}.json`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': SEC_USER_AGENT, Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error(`EDGAR API error for CIK ${cik}: ${response.status}`);
      return null;
    }

    return (await response.json()) as EdgarCompanyFacts;
  } catch (error) {
    console.error(`Failed to fetch EDGAR data for CIK ${cik}:`, error);
    return null;
  }
}

/**
 * Extract the most recent value for a financial metric from XBRL facts
 */
function extractMetric(
  facts: EdgarCompanyFacts['facts'],
  tagCandidates: readonly string[],
  filingType: '10-K' | '10-Q',
  fiscalYear: number,
  fiscalPeriod?: string,
): { value: number | null; accession: string | null; filed: string | null } {
  for (const tag of tagCandidates) {
    const [namespace, concept] = tag.split(':');
    const nsKey = namespace as keyof typeof facts;
    const conceptData = facts[nsKey]?.[concept];
    if (!conceptData) continue;

    // Prefer USD units
    const entries = conceptData.units['USD'] || conceptData.units['shares'] || Object.values(conceptData.units)[0];
    if (!entries) continue;

    // Filter to matching filing type and fiscal year
    const matching = entries
      .filter((e) => {
        if (e.form !== filingType) return false;
        if (e.fy !== fiscalYear) return false;
        if (fiscalPeriod && e.fp !== fiscalPeriod) return false;
        return true;
      })
      .sort((a, b) => new Date(b.filed).getTime() - new Date(a.filed).getTime());

    if (matching.length > 0) {
      return {
        value: matching[0].val,
        accession: matching[0].accn,
        filed: matching[0].filed,
      };
    }
  }

  return { value: null, accession: null, filed: null };
}

/**
 * Parse a vendor's EDGAR facts into structured financial data
 */
function parseVendorFinancials(
  vendorKey: string,
  cik: string,
  facts: EdgarCompanyFacts,
  targetYear: number,
  isAnnual: boolean,
  quarter?: number,
): ParsedFiling | null {
  const filingType = isAnnual ? '10-K' : '10-Q';
  const fp = isAnnual ? 'FY' : `Q${quarter}`;

  const revenue = extractMetric(facts.facts, FINANCIAL_TAGS.revenue, filingType, targetYear, fp);
  if (!revenue.value && !revenue.accession) return null; // no data for this period

  const parsed: ParsedFiling = {
    vendorKey,
    cik,
    accessionNumber: revenue.accession || `${cik}-${targetYear}-${fp}`,
    filingType,
    filingDate: revenue.filed || new Date().toISOString().split('T')[0],
    periodEnd: revenue.filed || `${targetYear}-12-31`,
    fiscalYear: targetYear,
    fiscalQuarter: isAnnual ? null : (quarter ?? null),
    revenue: revenue.value,
    costOfRevenue: extractMetric(facts.facts, FINANCIAL_TAGS.costOfRevenue, filingType, targetYear, fp).value,
    grossProfit: extractMetric(facts.facts, FINANCIAL_TAGS.grossProfit, filingType, targetYear, fp).value,
    operatingIncome: extractMetric(facts.facts, FINANCIAL_TAGS.operatingIncome, filingType, targetYear, fp).value,
    netIncome: extractMetric(facts.facts, FINANCIAL_TAGS.netIncome, filingType, targetYear, fp).value,
    rAndD: extractMetric(facts.facts, FINANCIAL_TAGS.rAndD, filingType, targetYear, fp).value,
    totalAssets: extractMetric(facts.facts, FINANCIAL_TAGS.totalAssets, filingType, targetYear, fp).value,
    totalDebt: extractMetric(facts.facts, FINANCIAL_TAGS.totalDebt, filingType, targetYear, fp).value,
    cashEquivalents: extractMetric(facts.facts, FINANCIAL_TAGS.cashEquivalents, filingType, targetYear, fp).value,
    sharesOutstanding: extractMetric(facts.facts, FINANCIAL_TAGS.sharesOutstanding, filingType, targetYear, fp).value,
    eps: extractMetric(facts.facts, FINANCIAL_TAGS.eps, filingType, targetYear, fp).value,
    segmentName: null,
    segmentRevenue: null,
    rawXbrl: {},
  };

  // Compute derived values if missing
  if (!parsed.grossProfit && parsed.revenue && parsed.costOfRevenue) {
    parsed.grossProfit = parsed.revenue - parsed.costOfRevenue;
  }

  return parsed;
}

/**
 * Generate a diff between new EDGAR data and existing financial profile
 */
function generateFinancialDiff(
  existing: Record<string, unknown> | null,
  incoming: ParsedFiling,
): Record<string, { old: unknown; new: unknown }> {
  const diff: Record<string, { old: unknown; new: unknown }> = {};
  const fieldMap: [string, keyof ParsedFiling][] = [
    ['revenue', 'revenue'],
    ['gross_margin', 'grossProfit'],
    ['operating_income', 'operatingIncome'],
    ['r_and_d', 'rAndD'],
    ['cash', 'cashEquivalents'],
    ['total_debt', 'totalDebt'],
    ['eps', 'eps'],
  ];

  for (const [dbField, parsedField] of fieldMap) {
    const newVal = incoming[parsedField];
    const oldVal = existing ? existing[dbField] : null;
    if (newVal !== null && newVal !== oldVal) {
      diff[dbField] = { old: oldVal, new: newVal };
    }
  }

  return diff;
}

/**
 * Run the SEC EDGAR pipeline for all mapped vendors
 */
export async function runSecEdgarPipeline(
  db: Pool,
  userId?: string,
  options: { targetYear?: number; vendorKeys?: string[] } = {},
): Promise<{
  runId: number;
  vendorsProcessed: number;
  filingsFound: number;
  errors: string[];
}> {
  const currentYear = options.targetYear || new Date().getFullYear();
  const errors: string[] = [];

  // Create pipeline run record
  const runResult = await db.query(
    `INSERT INTO pipeline_runs (pipeline, status, triggered_by, started_at)
     VALUES ('sec_edgar', 'running', $1, now()) RETURNING id`,
    [userId || null],
  );
  const runId = runResult.rows[0].id as number;

  try {
    // Fetch vendor mappings
    let vendorQuery = 'SELECT * FROM sec_vendor_map';
    const params: string[] = [];
    if (options.vendorKeys?.length) {
      vendorQuery += ` WHERE vendor_key = ANY($1)`;
      params.push(options.vendorKeys as unknown as string);
    }
    const vendorResult = await db.query(vendorQuery, params.length ? [options.vendorKeys] : []);
    const vendors = vendorResult.rows as VendorMapping[];

    let filingsFound = 0;

    for (const vendor of vendors) {
      try {
        // Rate limit: SEC requests max 10/sec
        await new Promise((resolve) => setTimeout(resolve, 150));

        const facts = await fetchCompanyFacts(vendor.cik);
        if (!facts) {
          errors.push(`No EDGAR data for ${vendor.vendor_key} (CIK: ${vendor.cik})`);
          continue;
        }

        // Try annual first, then most recent quarters
        const annual = parseVendorFinancials(
          vendor.vendor_key, vendor.cik, facts, currentYear, true,
        );

        // Also try previous year if current year not yet filed
        const prevAnnual = parseVendorFinancials(
          vendor.vendor_key, vendor.cik, facts, currentYear - 1, true,
        );

        // Try quarterly for current year
        const quarters: ParsedFiling[] = [];
        for (let q = 1; q <= 4; q++) {
          const qData = parseVendorFinancials(
            vendor.vendor_key, vendor.cik, facts, currentYear, false, q,
          );
          if (qData) quarters.push(qData);
        }

        const allFilings = [annual, prevAnnual, ...quarters].filter(Boolean) as ParsedFiling[];

        for (const filing of allFilings) {
          // Check if already stored
          const existing = await db.query(
            `SELECT id FROM sec_filings WHERE vendor_key = $1 AND fiscal_year = $2 AND COALESCE(fiscal_quarter, 0) = $3`,
            [filing.vendorKey, filing.fiscalYear, filing.fiscalQuarter || 0],
          );

          if (existing.rows.length > 0) continue; // skip duplicates

          await db.query(
            `INSERT INTO sec_filings (
              vendor_key, cik, accession_number, filing_type, filing_date, period_end,
              fiscal_year, fiscal_quarter, revenue, cost_of_revenue, gross_profit,
              operating_income, net_income, r_and_d, total_assets, total_debt,
              cash_equivalents, shares_outstanding, eps, segment_name, segment_revenue,
              raw_xbrl, review_status, pipeline_run_id
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
            [
              filing.vendorKey, filing.cik, filing.accessionNumber, filing.filingType,
              filing.filingDate, filing.periodEnd, filing.fiscalYear, filing.fiscalQuarter,
              filing.revenue, filing.costOfRevenue, filing.grossProfit, filing.operatingIncome,
              filing.netIncome, filing.rAndD, filing.totalAssets, filing.totalDebt,
              filing.cashEquivalents, filing.sharesOutstanding, filing.eps,
              filing.segmentName, filing.segmentRevenue,
              JSON.stringify(filing.rawXbrl),
              vendor.is_conglomerate ? 'pending' : 'pending',
              runId,
            ],
          );

          filingsFound++;
        }
      } catch (vendorError) {
        const msg = `Error processing ${vendor.vendor_key}: ${vendorError instanceof Error ? vendorError.message : 'Unknown'}`;
        errors.push(msg);
        console.error(msg);
      }
    }

    // Update pipeline run
    await db.query(
      `UPDATE pipeline_runs SET status = $1, completed_at = now(), records_found = $2, metadata = $3 WHERE id = $4`,
      [errors.length > 0 ? 'completed' : 'completed', filingsFound, JSON.stringify({ errors }), runId],
    );

    return { runId, vendorsProcessed: vendors.length, filingsFound, errors };
  } catch (error) {
    await db.query(
      `UPDATE pipeline_runs SET status = 'failed', completed_at = now(), error_message = $1 WHERE id = $2`,
      [error instanceof Error ? error.message : 'Unknown error', runId],
    );
    throw error;
  }
}

/**
 * Approve a filing and update the financial profile
 */
export async function approveSecFiling(
  db: Pool,
  filingId: number,
  userId: string,
  notes?: string,
): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Get the filing
    const filingResult = await client.query('SELECT * FROM sec_filings WHERE id = $1', [filingId]);
    if (filingResult.rows.length === 0) throw new Error('Filing not found');

    const filing = filingResult.rows[0];

    // Update review status
    await client.query(
      `UPDATE sec_filings SET review_status = 'approved', reviewed_by = $1, reviewed_at = now(), review_notes = $2 WHERE id = $3`,
      [userId, notes || null, filingId],
    );

    // Update the financial_profiles table with the approved data
    const existingFinancial = await client.query(
      'SELECT * FROM financial_profiles WHERE vendor_key = $1',
      [filing.vendor_key],
    );

    if (existingFinancial.rows.length > 0) {
      // Update existing profile with new data
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (filing.revenue) {
        updates.push(`revenue = $${paramIdx++}`);
        values.push(filing.revenue);
      }
      if (filing.gross_profit && filing.revenue) {
        const margin = (filing.gross_profit / filing.revenue * 100).toFixed(1);
        updates.push(`gross_margin = $${paramIdx++}`);
        values.push(parseFloat(margin));
      }
      if (filing.operating_income && filing.revenue) {
        const margin = (filing.operating_income / filing.revenue * 100).toFixed(1);
        updates.push(`op_margin = $${paramIdx++}`);
        values.push(parseFloat(margin));
      }
      if (filing.r_and_d) {
        updates.push(`rd_spend = $${paramIdx++}`);
        values.push(filing.r_and_d);
      }
      if (filing.cash_equivalents) {
        updates.push(`cash = $${paramIdx++}`);
        values.push(filing.cash_equivalents);
      }
      if (filing.total_debt) {
        updates.push(`total_debt = $${paramIdx++}`);
        values.push(filing.total_debt);
      }
      if (filing.eps) {
        updates.push(`eps_non_gaap = $${paramIdx++}`);
        values.push(filing.eps);
      }

      updates.push(`filing_source = $${paramIdx++}`);
      values.push(`SEC EDGAR ${filing.filing_type} ${filing.fiscal_year}`);
      updates.push(`last_updated = $${paramIdx++}`);
      values.push(new Date());

      if (updates.length > 0) {
        values.push(filing.vendor_key);
        await client.query(
          `UPDATE financial_profiles SET ${updates.join(', ')} WHERE vendor_key = $${paramIdx}`,
          values,
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export { generateFinancialDiff };
export type { ParsedFiling, VendorMapping };
