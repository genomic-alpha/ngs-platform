import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();

const marketSizeSchema = z.object({
  id: z.string().min(1).optional(),
  market_segment: z.string().min(1),
  market_size_usd: z.number().positive(),
  cagr: z.number().optional().nullable(),
  year: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const costComponentSchema = z.object({
  cost_component: z.string().min(1),
  amount_usd: z.number().positive(),
  percentage: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/market-size - Get current market size
router.get('/market-size', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM market_size WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) ORDER BY market_segment ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching market size:', error);
    res.status(500).json({ error: 'Failed to fetch market size' });
  }
});

// PUT /api/market-size - Update market size (analyst+)
router.put(
  '/market-size',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = marketSizeSchema.parse(req.body);

      const result = await pool.query(
        `INSERT INTO market_size (market_segment, market_size_usd, cagr, year, notes)
         VALUES ($1, $2, $3, COALESCE($4, EXTRACT(YEAR FROM CURRENT_DATE)), $5)
         ON CONFLICT (market_segment, year) DO UPDATE SET
           market_size_usd = $2, cagr = $3, notes = $5
         RETURNING *`,
        [data.market_segment, data.market_size_usd, data.cagr, data.year, data.notes]
      );

      const updated = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'market_size', data.market_segment, 'update', null, updated);
      }

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error updating market size:', error);
      res.status(500).json({ error: 'Failed to update market size' });
    }
  }
);

// GET /api/historical - Get all historical snapshots
router.get('/historical', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT * FROM historical_snapshots
       ORDER BY snapshot_date DESC, vendor_key ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching historical snapshots:', error);
    res.status(500).json({ error: 'Failed to fetch historical snapshots' });
  }
});

// GET /api/costs - Get all cost components
router.get('/costs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM cost_components ORDER BY cost_component ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cost components:', error);
    res.status(500).json({ error: 'Failed to fetch cost components' });
  }
});

// PUT /api/costs/:id - Update cost component (analyst+)
router.put(
  '/costs/:id',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = costComponentSchema.partial().parse(req.body);

      // Get current cost component
      const currentResult = await pool.query('SELECT * FROM cost_components WHERE id = $1', [id]);

      if (currentResult.rows.length === 0) {
        res.status(404).json({ error: 'Cost component not found' });
        return;
      }

      const currentCost = currentResult.rows[0];

      // Build update query
      const fields = Object.keys(data).filter((k) => k in data);
      if (fields.length === 0) {
        res.json(currentCost);
        return;
      }

      const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fields.map((field) => (data as Record<string, unknown>)[field]);

      const result = await pool.query(
        `UPDATE cost_components SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
        [...values, id]
      );

      const updatedCost = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'cost_components', id as string, 'update', currentCost, updatedCost);
      }

      res.json(updatedCost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error updating cost component:', error);
      res.status(500).json({ error: 'Failed to update cost component' });
    }
  }
);

export default router;
