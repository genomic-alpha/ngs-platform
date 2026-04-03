import { Router } from 'express';
import type { Request, Response } from 'express';
import pool from '../db/pool';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { generateReport } from '../services/report-generator';
import type { ReportType, ReportFormat, ReportParameters } from '../services/report-generator';

const router = Router();

// POST /api/reports/generate — Generate a report
router.post(
  '/generate',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { reportType, format, parameters } = req.body as {
        reportType: ReportType;
        format: ReportFormat;
        parameters: ReportParameters;
      };

      if (!reportType || !format) {
        res.status(400).json({ error: 'reportType and format are required' });
        return;
      }

      const validTypes: ReportType[] = ['quarterly_update', 'vendor_deep_dive', 'indication_landscape', 'competitive_battlecard'];
      if (!validTypes.includes(reportType)) {
        res.status(400).json({ error: `Invalid reportType. Must be one of: ${validTypes.join(', ')}` });
        return;
      }

      const validFormats: ReportFormat[] = ['pptx', 'pdf', 'xlsx'];
      if (!validFormats.includes(format)) {
        res.status(400).json({ error: `Invalid format. Must be one of: ${validFormats.join(', ')}` });
        return;
      }

      const result = await generateReport(db, reportType, format, parameters || {}, req.user?.id);
      res.json({
        reportId: result.reportId,
        data: result.data,
        filePath: result.filePath,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Report generation failed' });
    }
  },
);

// Alias for pool to use in routes
const db = pool;

// GET /api/reports — List generated reports
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { report_type, format, limit = '20' } = req.query;
    let query = 'SELECT id, report_type, format, title, generated_by, status, created_at, file_size_bytes FROM generated_reports WHERE 1=1';
    const params: unknown[] = [];

    if (report_type) {
      params.push(report_type);
      query += ` AND report_type = $${params.length}`;
    }
    if (format) {
      params.push(format);
      query += ` AND format = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string, 10));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/reports/:id — Get report details with data
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM generated_reports WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// GET /api/reports/:id/data — Get the report JSON data for client-side rendering
router.get('/:id/data', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const report = await pool.query('SELECT * FROM generated_reports WHERE id = $1', [id]);

    if (report.rows.length === 0) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    if (report.rows[0].status !== 'completed') {
      res.status(409).json({ error: 'Report not yet completed', status: report.rows[0].status });
      return;
    }

    // Read the JSON data file
    const filePath = report.rows[0].file_path;
    if (!filePath) {
      res.status(404).json({ error: 'Report data not available' });
      return;
    }

    const fs = await import('fs');
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Report file not found' });
      return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ error: 'Failed to fetch report data' });
  }
});

export default router;
