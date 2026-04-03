/**
 * ClinicalTrials.gov Intelligence Feed
 *
 * Bi-weekly scan for clinical trials involving NGS-based companion
 * diagnostics, tumor profiling, and genomic testing. Generates
 * intel signals for significant trial events.
 *
 * Source: ClinicalTrials.gov API v2
 */

import type { Pool } from 'pg';

const CT_API_BASE = 'https://clinicaltrials.gov/api/v2';

// Search terms for NGS-relevant trials
const SEARCH_QUERIES = [
  'next generation sequencing companion diagnostic',
  'NGS-based tumor profiling',
  'liquid biopsy companion diagnostic',
  'cell-free DNA diagnostic',
  'comprehensive genomic profiling',
  'targeted gene panel diagnostic',
  'whole exome sequencing clinical',
  'somatic mutation profiling IVD',
];

// Map known sponsors/interventions to vendor keys
const SPONSOR_VENDOR_MAP: Record<string, string> = {
  'illumina': 'illumina',
  'foundation medicine': 'roche',
  'roche': 'roche',
  'thermo fisher': 'thermo',
  'ion torrent': 'thermo',
  'qiagen': 'qiagen',
  'agilent': 'agilent',
  'guardant health': 'guardant',
  'guardant': 'guardant',
  'natera': 'natera',
  'myriad': 'myriad',
  'myriad genetics': 'myriad',
  'tempus': 'tempus',
  'sophia genetics': 'sophia',
  'pacific biosciences': 'pacbio',
  'oxford nanopore': 'oxford',
  '10x genomics': '10x',
  'archer dx': 'danaher',
  'idt': 'danaher',
  'twist bioscience': 'twist',
};

// Known CDx product names to match
const CDX_PRODUCT_MAP: Record<string, { vendor: string; product: string }> = {
  'foundationone cdx': { vendor: 'roche', product: 'FoundationOne CDx' },
  'guardant360': { vendor: 'guardant', product: 'Guardant360' },
  'tempus xt': { vendor: 'tempus', product: 'Tempus xT' },
  'trusight oncology': { vendor: 'illumina', product: 'TruSight Oncology' },
  'oncomine': { vendor: 'thermo', product: 'Oncomine' },
  'msi analysis system': { vendor: 'thermo', product: 'MSI Analysis System' },
  'signatera': { vendor: 'natera', product: 'Signatera' },
  'mychoice cdx': { vendor: 'myriad', product: 'MyChoice CDx' },
  'brca analysis': { vendor: 'myriad', product: 'BRACAnalysis CDx' },
  'praxis extended ras': { vendor: 'illumina', product: 'Praxis Extended RAS' },
};

interface CtStudy {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      officialTitle?: string;
    };
    statusModule: {
      overallStatus: string;
      startDateStruct?: { date: string };
      completionDateStruct?: { date: string };
      lastUpdatePostDateStruct?: { date: string };
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: { name: string };
      collaborators?: Array<{ name: string }>;
    };
    designModule?: {
      phases?: string[];
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        name: string;
        description?: string;
        type: string;
      }>;
    };
    conditionsModule?: {
      conditions?: string[];
    };
  };
}

interface CtSearchResult {
  studies: CtStudy[];
  totalCount: number;
  nextPageToken?: string;
}

interface ParsedTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string | null;
  sponsor: string;
  vendorKey: string | null;
  productName: string | null;
  cdxProduct: string | null;
  indication: string | null;
  intervention: string | null;
  startDate: string | null;
  completionDate: string | null;
  lastUpdate: string | null;
  rawData: Record<string, unknown>;
}

/**
 * Search ClinicalTrials.gov for NGS-related trials
 */
async function searchTrials(
  query: string,
  afterDate?: string,
  pageSize = 50,
): Promise<CtStudy[]> {
  const params = new URLSearchParams({
    'query.term': query,
    pageSize: pageSize.toString(),
    sort: 'LastUpdatePostDate',
    format: 'json',
    fields: 'NCTId,BriefTitle,OfficialTitle,OverallStatus,LeadSponsorName,Phase,InterventionName,InterventionDescription,Condition,StartDate,CompletionDate,LastUpdatePostDate,CollaboratorName',
  });

  if (afterDate) {
    params.set('filter.advanced', `AREA[LastUpdatePostDate]RANGE[${afterDate},MAX]`);
  }

  const url = `${CT_API_BASE}/studies?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error(`ClinicalTrials.gov API error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as CtSearchResult;
    return data.studies || [];
  } catch (error) {
    console.error('Failed to fetch clinical trials:', error);
    return [];
  }
}

/**
 * Match a sponsor name to a vendor key
 */
function matchSponsor(sponsor: string): string | null {
  const lower = sponsor.toLowerCase();
  for (const [pattern, vendorKey] of Object.entries(SPONSOR_VENDOR_MAP)) {
    if (lower.includes(pattern)) return vendorKey;
  }
  return null;
}

/**
 * Extract CDx product from trial text
 */
function extractCdxProduct(
  title: string,
  interventions: string[],
): { vendor: string; product: string } | null {
  const text = [title, ...interventions].join(' ').toLowerCase();

  for (const [pattern, info] of Object.entries(CDX_PRODUCT_MAP)) {
    if (text.includes(pattern)) return info;
  }

  return null;
}

/**
 * Parse a CT.gov study into our format
 */
function parseTrial(study: CtStudy): ParsedTrial {
  const id = study.protocolSection.identificationModule;
  const status = study.protocolSection.statusModule;
  const sponsor = study.protocolSection.sponsorCollaboratorsModule;
  const design = study.protocolSection.designModule;
  const arms = study.protocolSection.armsInterventionsModule;
  const conditions = study.protocolSection.conditionsModule;

  const sponsorName = sponsor?.leadSponsor?.name || 'Unknown';
  const interventionNames = arms?.interventions?.map((i) => i.name) || [];
  const interventionText = arms?.interventions?.map((i) => `${i.name}: ${i.description || ''}`).join('; ') || null;

  const vendorKey = matchSponsor(sponsorName);
  const cdxInfo = extractCdxProduct(id.briefTitle, interventionNames);
  const phases = design?.phases || [];
  const phase = phases.length > 0 ? phases[phases.length - 1] : null;

  return {
    nctId: id.nctId,
    title: id.briefTitle,
    status: status.overallStatus,
    phase,
    sponsor: sponsorName,
    vendorKey: vendorKey || cdxInfo?.vendor || null,
    productName: cdxInfo?.product || null,
    cdxProduct: cdxInfo?.product || null,
    indication: conditions?.conditions?.[0] || null,
    intervention: interventionText,
    startDate: status.startDateStruct?.date || null,
    completionDate: status.completionDateStruct?.date || null,
    lastUpdate: status.lastUpdatePostDateStruct?.date || null,
    rawData: study as unknown as Record<string, unknown>,
  };
}

/**
 * Determine signal impact level based on trial characteristics
 */
function assessImpact(trial: ParsedTrial): 'high' | 'medium' | 'low' {
  // High: Phase 3 or FDA submission-related, or CDx approval trial
  if (trial.phase?.includes('3') || trial.phase?.includes('4')) return 'high';
  if (trial.cdxProduct && trial.status === 'COMPLETED') return 'high';

  // Medium: Phase 2 or known CDx product involved
  if (trial.phase?.includes('2')) return 'medium';
  if (trial.cdxProduct) return 'medium';

  return 'low';
}

/**
 * Run the clinical trials pipeline
 */
export async function runClinicalTrialsPipeline(
  db: Pool,
  userId?: string,
  options: { lookbackDays?: number } = {},
): Promise<{
  runId: number;
  trialsFound: number;
  signalsGenerated: number;
  errors: string[];
}> {
  const lookbackDays = options.lookbackDays || 30;
  const afterDate = new Date(Date.now() - lookbackDays * 86400000).toISOString().split('T')[0];
  const errors: string[] = [];
  let signalsGenerated = 0;
  let trialsFound = 0;

  // Create pipeline run
  const runResult = await db.query(
    `INSERT INTO pipeline_runs (pipeline, status, triggered_by, started_at)
     VALUES ('clinical_trials', 'running', $1, now()) RETURNING id`,
    [userId || null],
  );
  const runId = runResult.rows[0].id as number;

  try {
    // Search across all NGS queries (deduplicate by NCT ID)
    const seenNctIds = new Set<string>();
    const allTrials: ParsedTrial[] = [];

    for (const query of SEARCH_QUERIES) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 200)); // rate limit
        const studies = await searchTrials(query, afterDate);

        for (const study of studies) {
          const parsed = parseTrial(study);
          if (!seenNctIds.has(parsed.nctId)) {
            seenNctIds.add(parsed.nctId);
            allTrials.push(parsed);
          }
        }
      } catch (queryError) {
        errors.push(`Query "${query}" failed: ${queryError instanceof Error ? queryError.message : 'Unknown'}`);
      }
    }

    // Store trials and generate signals
    for (const trial of allTrials) {
      // Check for existing
      const existing = await db.query(
        'SELECT id, status FROM clinical_trials WHERE nct_id = $1',
        [trial.nctId],
      );

      if (existing.rows.length > 0) {
        // Update status if changed
        const oldStatus = existing.rows[0].status as string;
        if (oldStatus !== trial.status) {
          await db.query(
            `UPDATE clinical_trials SET status = $1, updated_at = now() WHERE nct_id = $2`,
            [trial.status, trial.nctId],
          );

          // Generate signal for status change
          if (trial.vendorKey && (trial.status === 'COMPLETED' || trial.status === 'ACTIVE_NOT_RECRUITING')) {
            const impact = assessImpact(trial);
            await db.query(
              `INSERT INTO intel_signals (id, date, type, vendor, title, impact, summary, source, confidence)
               VALUES ($1, $2, 'clinical_data', $3, $4, $5, $6, $7, 'verified')
               ON CONFLICT (id) DO NOTHING`,
              [
                `ct-${trial.nctId}-status`,
                new Date().toISOString().split('T')[0],
                trial.vendorKey,
                `Clinical Trial Status Change: ${trial.nctId} → ${trial.status}`,
                impact,
                `Trial "${trial.title}" (${trial.nctId}) status changed from ${oldStatus} to ${trial.status}. Sponsor: ${trial.sponsor}.${trial.cdxProduct ? ` CDx: ${trial.cdxProduct}.` : ''}`,
                `ClinicalTrials.gov ${trial.nctId}`,
              ],
            );
            signalsGenerated++;
          }
        }
        continue;
      }

      // Insert new trial
      await db.query(
        `INSERT INTO clinical_trials (
          nct_id, title, status, phase, sponsor, vendor_key, product_name,
          cdx_product, indication, intervention, start_date, completion_date,
          last_update, raw_data, review_status, pipeline_run_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          trial.nctId, trial.title, trial.status, trial.phase, trial.sponsor,
          trial.vendorKey, trial.productName, trial.cdxProduct, trial.indication,
          trial.intervention, trial.startDate, trial.completionDate, trial.lastUpdate,
          JSON.stringify(trial.rawData), 'pending', runId,
        ],
      );

      trialsFound++;

      // Generate signal for new trials with known vendors
      if (trial.vendorKey) {
        const impact = assessImpact(trial);
        await db.query(
          `INSERT INTO intel_signals (id, date, type, vendor, title, impact, summary, source, confidence)
           VALUES ($1, $2, 'clinical_data', $3, $4, $5, $6, $7, 'estimated')
           ON CONFLICT (id) DO NOTHING`,
          [
            `ct-${trial.nctId}-new`,
            trial.lastUpdate || new Date().toISOString().split('T')[0],
            trial.vendorKey,
            `New Clinical Trial: ${trial.title.substring(0, 120)}`,
            impact,
            `New trial registered: ${trial.nctId} (${trial.phase || 'Phase N/A'}). Sponsor: ${trial.sponsor}. Status: ${trial.status}.${trial.cdxProduct ? ` CDx product: ${trial.cdxProduct}.` : ''}${trial.indication ? ` Indication: ${trial.indication}.` : ''}`,
            `ClinicalTrials.gov ${trial.nctId}`,
          ],
        );
        signalsGenerated++;
      }
    }

    await db.query(
      `UPDATE pipeline_runs SET status = 'completed', completed_at = now(), records_found = $1, records_updated = $2, metadata = $3 WHERE id = $4`,
      [trialsFound, signalsGenerated, JSON.stringify({ errors, queries: SEARCH_QUERIES.length, lookbackDays }), runId],
    );

    return { runId, trialsFound, signalsGenerated, errors };
  } catch (error) {
    await db.query(
      `UPDATE pipeline_runs SET status = 'failed', completed_at = now(), error_message = $1 WHERE id = $2`,
      [error instanceof Error ? error.message : 'Unknown error', runId],
    );
    throw error;
  }
}

export { searchTrials, matchSponsor, extractCdxProduct, assessImpact };
export type { ParsedTrial };
