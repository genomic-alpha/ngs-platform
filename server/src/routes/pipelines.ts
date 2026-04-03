import { Router } from 'express';
import type { Response } from 'express';
import pool from '../db/pool';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { runSecEdgarPipeline, approveSecFiling } from '../services/sec-edgar';
import { runFdaPipeline } from '../services/fda-pipeline';
import { runClinicalTrialsPipeline } from '../services/clinical-trials';

const router = Router();

// ============================================
// Pipeline Run Management
// ============================================

// GET /api/pipelines/runs — List pipeline runs with filtering
router.get('/runs', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pipeline, status, limit = '20' } = req.query;
    let query = 'SELECT * FROM pipeline_runs WHERE 1=1';
    const params: unknown[] = [];

    if (pipeline) {
      params.push(pipeline);
      query += ` AND pipeline = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string, 10));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pipeline runs:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline runs' });
  }
});

// GET /api/pipelines/runs/:id — Get single pipeline run with details
router.get('/runs/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM pipeline_runs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Pipeline run not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching pipeline run:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline run' });
  }
});

// ============================================
// SEC EDGAR Pipeline
// ============================================

// POST /api/pipelines/sec-edgar/run — Trigger SEC EDGAR pipeline
router.post(
  '/sec-edgar/run',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { targetYear, vendorKeys } = req.body;
      const result = await runSecEdgarPipeline(pool, req.user?.id, {
        targetYear, vendorKeys,
      });
      res.json(result);
    } catch (error) {
      console.error('SEC EDGAR pipeline error:', error);
      res.status(500).json({ error: 'SEC EDGAR pipeline failed' });
    }
  },
);

// GET /api/pipelines/sec-edgar/filings — List SEC filings
router.get('/sec-edgar/filings', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vendor_key, review_status, limit = '50' } = req.query;
    let query = 'SELECT * FROM sec_filings WHERE 1=1';
    const params: unknown[] = [];

    if (vendor_key) {
      params.push(vendor_key);
      query += ` AND vendor_key = $${params.length}`;
    }
    if (review_status) {
      params.push(review_status);
      query += ` AND review_status = $${params.length}`;
    }

    query += ` ORDER BY filing_date DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string, 10));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching SEC filings:', error);
    res.status(500).json({ error: 'Failed to fetch SEC filings' });
  }
});

// POST /api/pipelines/sec-edgar/filings/:id/approve — Approve a SEC filing
router.post(
  '/sec-edgar/filings/:id/approve',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const filingId = parseInt(req.params.id as string, 10);
      const { notes } = req.body;

      if (!req.user?.id) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await approveSecFiling(pool, filingId, req.user.id, notes);
      res.json({ message: 'Filing approved and financials updated' });
    } catch (error) {
      console.error('Error approving SEC filing:', error);
      res.status(500).json({ error: 'Failed to approve filing' });
    }
  },
);

// POST /api/pipelines/sec-edgar/filings/:id/reject — Reject a SEC filing
router.post(
  '/sec-edgar/filings/:id/reject',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const filingId = parseInt(req.params.id as string, 10);
      const { notes } = req.body;

      await pool.query(
        `UPDATE sec_filings SET review_status = 'rejected', reviewed_by = $1, reviewed_at = now(), review_notes = $2 WHERE id = $3`,
        [req.user?.id, notes || null, filingId],
      );

      res.json({ message: 'Filing rejected' });
    } catch (error) {
      console.error('Error rejecting SEC filing:', error);
      res.status(500).json({ error: 'Failed to reject filing' });
    }
  },
);

// ============================================
// FDA Regulatory Pipeline
// ============================================

// POST /api/pipelines/fda/run — Trigger FDA pipeline
router.post(
  '/fda/run',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { lookbackDays } = req.body;
      const result = await runFdaPipeline(pool, req.user?.id, { lookbackDays });
      res.json(result);
    } catch (error) {
      console.error('FDA pipeline error:', error);
      res.status(500).json({ error: 'FDA pipeline failed' });
    }
  },
);

// GET /api/pipelines/fda/submissions — List FDA submissions
router.get('/fda/submissions', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vendor_key, submission_type, review_status, limit = '50' } = req.query;
    let query = 'SELECT * FROM fda_submissions WHERE 1=1';
    const params: unknown[] = [];

    if (vendor_key) {
      params.push(vendor_key);
      query += ` AND vendor_key = $${params.length}`;
    }
    if (submission_type) {
      params.push(submission_type);
      query += ` AND submission_type = $${params.length}`;
    }
    if (review_status) {
      params.push(review_status);
      query += ` AND review_status = $${params.length}`;
    }

    query += ` ORDER BY decision_date DESC NULLS LAST LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string, 10));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching FDA submissions:', error);
    res.status(500).json({ error: 'Failed to fetch FDA submissions' });
  }
});

// ============================================
// Clinical Trials Pipeline
// ============================================

// POST /api/pipelines/clinical-trials/run — Trigger clinical trials pipeline
router.post(
  '/clinical-trials/run',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { lookbackDays } = req.body;
      const result = await runClinicalTrialsPipeline(pool, req.user?.id, { lookbackDays });
      res.json(result);
    } catch (error) {
      console.error('Clinical trials pipeline error:', error);
      res.status(500).json({ error: 'Clinical trials pipeline failed' });
    }
  },
);

// GET /api/pipelines/clinical-trials — List tracked trials
router.get('/clinical-trials', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vendor_key, status, limit = '50' } = req.query;
    let query = 'SELECT * FROM clinical_trials WHERE 1=1';
    const params: unknown[] = [];

    if (vendor_key) {
      params.push(vendor_key);
      query += ` AND vendor_key = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY last_update DESC NULLS LAST LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string, 10));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clinical trials:', error);
    res.status(500).json({ error: 'Failed to fetch clinical trials' });
  }
});

// ============================================
// Vendor CIK Mapping (admin)
// ============================================

// GET /api/pipelines/sec-edgar/vendors — List SEC vendor mappings
router.get('/sec-edgar/vendors', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM sec_vendor_map ORDER BY vendor_key');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vendor map:', error);
    res.status(500).json({ error: 'Failed to fetch vendor mappings' });
  }
});

export default router;
