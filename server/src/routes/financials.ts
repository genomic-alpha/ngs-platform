import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();

const financialSchema = z.object({
  vendor_key: z.string().min(1),
  revenue_2023: z.number().optional().nullable(),
  revenue_2024: z.number().optional().nullable(),
  growth_rate: z.number().optional().nullable(),
  profit_margin: z.number().optional().nullable(),
  r_and_d_spending: z.number().optional().nullable(),
  gross_margin: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/financials - List all financial profiles
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM financials ORDER BY vendor_key ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching financials:', error);
    res.status(500).json({ error: 'Failed to fetch financial profiles' });
  }
});

// GET /api/financials/:vendorKey - Get single financial profile
router.get('/:vendorKey', async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendorKey } = req.params;
    const result = await pool.query('SELECT * FROM financials WHERE vendor_key = $1', [vendorKey]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Financial profile not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching financial profile:', error);
    res.status(500).json({ error: 'Failed to fetch financial profile' });
  }
});

// PUT /api/financials/:vendorKey - Update financial profile (analyst+)
router.put(
  '/:vendorKey',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { vendorKey } = req.params;
      const data = financialSchema.partial().parse(req.body);

      // Get current financial profile
      const currentResult = await pool.query('SELECT * FROM financials WHERE vendor_key = $1', [
        vendorKey,
      ]);

      let currentFinancial = currentResult.rows[0];

      if (!currentFinancial) {
        // Create new financial record if it doesn't exist
        const createResult = await pool.query(
          `INSERT INTO financials (vendor_key, revenue_2023, revenue_2024, growth_rate, profit_margin, r_and_d_spending, gross_margin, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            vendorKey,
            data.revenue_2023,
            data.revenue_2024,
            data.growth_rate,
            data.profit_margin,
            data.r_and_d_spending,
            data.gross_margin,
            data.notes,
          ]
        );

        const newFinancial = createResult.rows[0];

        if (req.user) {
          await logAudit(pool, req.user.id, 'financials', vendorKey as string, 'insert', null, newFinancial);
        }

        res.status(201).json(newFinancial);
        return;
      }

      // Build update query
      const fields = Object.keys(data).filter((k) => k in data && k !== 'vendor_key');
      if (fields.length === 0) {
        res.json(currentFinancial);
        return;
      }

      const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fields.map((field) => (data as Record<string, unknown>)[field]);

      const result = await pool.query(
        `UPDATE financials SET ${setClause} WHERE vendor_key = $${fields.length + 1} RETURNING *`,
        [...values, vendorKey]
      );

      const updatedFinancial = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'financials', vendorKey as string, 'update', currentFinancial, updatedFinancial);
      }

      res.json(updatedFinancial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error updating financial profile:', error);
      res.status(500).json({ error: 'Failed to update financial profile' });
    }
  }
);

export default router;
