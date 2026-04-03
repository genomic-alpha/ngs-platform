/**
 * FDA Regulatory Status Pipeline
 *
 * Scans openFDA API for 510(k), PMA, and De Novo submissions
 * related to NGS products. Matches new clearances/approvals to
 * existing products and auto-generates intel signals.
 *
 * Sources:
 * - openFDA 510(k) clearances API
 * - openFDA PMA approvals API
 * - openFDA Device Classification
 */

import type { Pool } from 'pg';

const OPENFDA_BASE = 'https://api.fda.gov/device';

// NGS-related product codes and search terms
const NGS_PRODUCT_CODES = [
  'QJR', // Next generation sequencing oncology panel
  'QKQ', // Nucleic acid sequencing system
  'OYC', // Sequencing system, DNA
  'PCA', // Multiplex nucleic acid assay
  'QMR', // Pharmacogenomic test system
  'MNY', // Genetic health risk assessment
  'LIE', // Human DNA analysis reagent
  'QAS', // IVD companion diagnostic
];

const NGS_SEARCH_TERMS = [
  'next generation sequencing',
  'NGS',
  'whole exome sequencing',
  'whole genome sequencing',
  'targeted gene panel',
  'companion diagnostic',
  'liquid biopsy',
  'cell-free DNA',
  'tumor profiling',
  'somatic mutation',
  'germline',
];

// Map FDA applicant names to vendor keys
const APPLICANT_VENDOR_MAP: Record<string, string> = {
  'illumina': 'illumina',
  'roche': 'roche',
  'foundation medicine': 'roche',
  'thermo fisher': 'thermo',
  'life technologies': 'thermo',
  'ion torrent': 'thermo',
  'qiagen': 'qiagen',
  'agilent': 'agilent',
  'pacific biosciences': 'pacbio',
  'oxford nanopore': 'oxford',
  '10x genomics': '10x',
  'guardant health': 'guardant',
  'natera': 'natera',
  'myriad': 'myriad',
  'tempus': 'tempus',
  'sophia genetics': 'sophia',
  'idt': 'danaher',
  'integrated dna': 'danaher',
  'archer': 'danaher',
  'invivoscribe': 'danaher',
  'twist bioscience': 'twist',
  'bio-rad': 'biorad',
};

interface FdaDevice510k {
  k_number: string;
  applicant: string;
  device_name: string;
  product_code: string;
  decision_description: string;
  decision_date: string;
  date_received: string;
  review_panel: string;
  openfda?: {
    device_name?: string;
    medical_specialty_description?: string;
  };
}

interface FdaDevicePma {
  pma_number: string;
  applicant: string;
  trade_name: string;
  product_code: string;
  decision_code: string;
  decision_date: string;
  date_received?: string;
  advisory_committee_description: string;
}

interface FdaSearchResult<T> {
  meta: {
    results: { skip: number; limit: number; total: number };
  };
  results: T[];
}

/**
 * Search openFDA 510(k) clearances for NGS-related devices
 */
async function search510k(
  afterDate?: string,
  limit = 100,
): Promise<FdaDevice510k[]> {
  const dateFilter = afterDate
    ? `+AND+decision_date:[${afterDate.replace(/-/g, '')}+TO+${new Date().toISOString().split('T')[0].replace(/-/g, '')}]`
    : '';

  // Search by product codes OR device name keywords
  const productCodeSearch = NGS_PRODUCT_CODES.map((c) => `product_code:"${c}"`).join('+OR+');
  const keywordSearch = NGS_SEARCH_TERMS.slice(0, 5).map((t) => `device_name:"${t}"`).join('+OR+');

  const searchQuery = `(${productCodeSearch}+OR+${keywordSearch})${dateFilter}`;
  const url = `${OPENFDA_BASE}/510k.json?search=${searchQuery}&limit=${limit}&sort=decision_date:desc`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) return []; // no results
      console.error(`openFDA 510k error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as FdaSearchResult<FdaDevice510k>;
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch 510(k) data:', error);
    return [];
  }
}

/**
 * Search openFDA PMA approvals for NGS-related devices
 */
async function searchPma(
  afterDate?: string,
  limit = 50,
): Promise<FdaDevicePma[]> {
  const dateFilter = afterDate
    ? `+AND+decision_date:[${afterDate.replace(/-/g, '')}+TO+${new Date().toISOString().split('T')[0].replace(/-/g, '')}]`
    : '';

  const productCodeSearch = NGS_PRODUCT_CODES.map((c) => `product_code:"${c}"`).join('+OR+');
  const url = `${OPENFDA_BASE}/pma.json?search=(${productCodeSearch})${dateFilter}&limit=${limit}&sort=decision_date:desc`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      console.error(`openFDA PMA error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as FdaSearchResult<FdaDevicePma>;
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch PMA data:', error);
    return [];
  }
}

/**
 * Match an FDA applicant name to a vendor key
 */
function matchVendor(applicant: string): string | null {
  const lower = applicant.toLowerCase();
  for (const [pattern, vendorKey] of Object.entries(APPLICANT_VENDOR_MAP)) {
    if (lower.includes(pattern)) return vendorKey;
  }
  return null;
}

/**
 * Attempt to match an FDA device to an existing product in the DB
 */
async function matchProduct(
  db: Pool,
  deviceName: string,
  vendorKey: string | null,
): Promise<{ productId: string; confidence: number } | null> {
  if (!vendorKey) return null;

  // Try exact vendor match + fuzzy name matching
  const result = await db.query(
    `SELECT id, name FROM products WHERE vendor_key = $1`,
    [vendorKey],
  );

  if (result.rows.length === 0) return null;

  const deviceLower = deviceName.toLowerCase();
  let bestMatch: { productId: string; confidence: number } | null = null;

  for (const row of result.rows) {
    const productLower = (row.name as string).toLowerCase();

    // Check if product name appears in device name or vice versa
    if (deviceLower.includes(productLower) || productLower.includes(deviceLower)) {
      return { productId: row.id as string, confidence: 0.9 };
    }

    // Check for common words (excluding stopwords)
    const deviceWords = new Set(deviceLower.split(/\s+/).filter((w) => w.length > 3));
    const productWords = new Set(productLower.split(/\s+/).filter((w) => w.length > 3));
    const overlap = [...deviceWords].filter((w) => productWords.has(w)).length;
    const maxWords = Math.max(deviceWords.size, productWords.size);

    if (maxWords > 0) {
      const score = overlap / maxWords;
      if (score > 0.3 && (!bestMatch || score > bestMatch.confidence)) {
        bestMatch = { productId: row.id as string, confidence: Math.round(score * 100) / 100 };
      }
    }
  }

  return bestMatch;
}

/**
 * Run the FDA regulatory pipeline
 */
export async function runFdaPipeline(
  db: Pool,
  userId?: string,
  options: { lookbackDays?: number } = {},
): Promise<{
  runId: number;
  submissionsFound: number;
  signalsGenerated: number;
  errors: string[];
}> {
  const lookbackDays = options.lookbackDays || 90;
  const afterDate = new Date(Date.now() - lookbackDays * 86400000).toISOString().split('T')[0];
  const errors: string[] = [];
  let signalsGenerated = 0;

  // Create pipeline run record
  const runResult = await db.query(
    `INSERT INTO pipeline_runs (pipeline, status, triggered_by, started_at)
     VALUES ('fda_regulatory', 'running', $1, now()) RETURNING id`,
    [userId || null],
  );
  const runId = runResult.rows[0].id as number;

  try {
    // Fetch 510(k) and PMA data in parallel
    const [clearances, approvals] = await Promise.all([
      search510k(afterDate),
      searchPma(afterDate),
    ]);

    let submissionsFound = 0;

    // Process 510(k) clearances
    for (const clearance of clearances) {
      const existing = await db.query(
        'SELECT id FROM fda_submissions WHERE submission_number = $1',
        [clearance.k_number],
      );
      if (existing.rows.length > 0) continue;

      const vendorKey = matchVendor(clearance.applicant);
      const productMatch = await matchProduct(db, clearance.device_name, vendorKey);

      await db.query(
        `INSERT INTO fda_submissions (
          submission_type, submission_number, vendor_key, device_name, applicant,
          decision, decision_date, submission_date, product_code, review_panel,
          matched_product_id, match_confidence, raw_data, review_status, pipeline_run_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          '510k', clearance.k_number, vendorKey, clearance.device_name,
          clearance.applicant, clearance.decision_description,
          clearance.decision_date || null, clearance.date_received || null,
          clearance.product_code, clearance.review_panel,
          productMatch?.productId || null, productMatch?.confidence || null,
          JSON.stringify(clearance),
          productMatch && productMatch.confidence >= 0.8 ? 'auto_matched' : 'pending',
          runId,
        ],
      );

      submissionsFound++;

      // Generate intel signal for new clearances
      if (vendorKey) {
        await db.query(
          `INSERT INTO intel_signals (id, date, type, vendor, title, impact, summary, source, confidence)
           VALUES ($1, $2, 'regulatory', $3, $4, $5, $6, $7, 'verified')`,
          [
            `fda-${clearance.k_number}`,
            clearance.decision_date || new Date().toISOString().split('T')[0],
            vendorKey,
            `FDA 510(k) Clearance: ${clearance.device_name}`,
            'medium',
            `${clearance.applicant} received 510(k) clearance (${clearance.k_number}) for ${clearance.device_name}. Product code: ${clearance.product_code}.`,
            `FDA openFDA API - 510(k) ${clearance.k_number}`,
          ],
        );
        signalsGenerated++;
      }
    }

    // Process PMA approvals
    for (const approval of approvals) {
      const existing = await db.query(
        'SELECT id FROM fda_submissions WHERE submission_number = $1',
        [approval.pma_number],
      );
      if (existing.rows.length > 0) continue;

      const vendorKey = matchVendor(approval.applicant);
      const productMatch = await matchProduct(db, approval.trade_name, vendorKey);

      await db.query(
        `INSERT INTO fda_submissions (
          submission_type, submission_number, vendor_key, device_name, applicant,
          decision, decision_date, product_code,
          matched_product_id, match_confidence, raw_data, review_status, pipeline_run_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          'pma', approval.pma_number, vendorKey, approval.trade_name,
          approval.applicant, approval.decision_code,
          approval.decision_date || null, approval.product_code,
          productMatch?.productId || null, productMatch?.confidence || null,
          JSON.stringify(approval),
          productMatch && productMatch.confidence >= 0.8 ? 'auto_matched' : 'pending',
          runId,
        ],
      );

      submissionsFound++;

      // PMA approvals are higher impact than 510(k) clearances
      if (vendorKey) {
        await db.query(
          `INSERT INTO intel_signals (id, date, type, vendor, title, impact, summary, source, confidence)
           VALUES ($1, $2, 'regulatory', $3, $4, $5, $6, $7, 'verified')`,
          [
            `fda-${approval.pma_number}`,
            approval.decision_date || new Date().toISOString().split('T')[0],
            vendorKey,
            `FDA PMA Approval: ${approval.trade_name}`,
            'high',
            `${approval.applicant} received PMA approval (${approval.pma_number}) for ${approval.trade_name}. This is a significant regulatory milestone.`,
            `FDA openFDA API - PMA ${approval.pma_number}`,
          ],
        );
        signalsGenerated++;
      }
    }

    await db.query(
      `UPDATE pipeline_runs SET status = 'completed', completed_at = now(), records_found = $1, records_updated = $2, metadata = $3 WHERE id = $4`,
      [submissionsFound, signalsGenerated, JSON.stringify({ errors, lookbackDays }), runId],
    );

    return { runId, submissionsFound, signalsGenerated, errors };
  } catch (error) {
    await db.query(
      `UPDATE pipeline_runs SET status = 'failed', completed_at = now(), error_message = $1 WHERE id = $2`,
      [error instanceof Error ? error.message : 'Unknown error', runId],
    );
    throw error;
  }
}

export { search510k, searchPma, matchVendor };
