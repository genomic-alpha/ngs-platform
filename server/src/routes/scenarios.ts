import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();

const scenarioAdjustmentSchema = z.object({
  productId: z.string(),
  parameter: z.enum(['share', 'pricing', 'tam_growth', 'regulatory', 'new_product']),
  originalValue: z.union([z.number(), z.string()]),
  newValue: z.union([z.number(), z.string()]),
  change: z.number().optional(),
});

const createScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  adjustments: z.array(scenarioAdjustmentSchema),
  tags: z.array(z.string()).optional(),
  is_shared: z.boolean().optional(),
});

const updateScenarioSchema = createScenarioSchema.partial();

// GET /api/scenarios — List scenarios (own + shared)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { shared_only } = req.query;

    let query: string;
    let params: unknown[];

    if (shared_only === 'true') {
      query = `SELECT s.*, u.display_name as creator_name
               FROM scenarios s LEFT JOIN users u ON s.created_by = u.id
               WHERE s.is_shared = true ORDER BY s.updated_at DESC`;
      params = [];
    } else {
      query = `SELECT s.*, u.display_name as creator_name
               FROM scenarios s LEFT JOIN users u ON s.created_by = u.id
               WHERE s.created_by = $1 OR s.is_shared = true
               ORDER BY s.updated_at DESC`;
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// GET /api/scenarios/:id — Get single scenario
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT s.*, u.display_name as creator_name
       FROM scenarios s LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = $1 AND (s.created_by = $2 OR s.is_shared = true)`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching scenario:', error);
    res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});

// POST /api/scenarios — Create scenario (analyst+)
router.post(
  '/',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = createScenarioSchema.parse(req.body);
      const userId = req.user?.id;

      const result = await pool.query(
        `INSERT INTO scenarios (name, description, created_by, adjustments, tags, is_shared)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [data.name, data.description || null, userId, JSON.stringify(data.adjustments), data.tags || [], data.is_shared || false],
      );

      if (userId) {
        await logAudit(pool, userId, 'scenarios', result.rows[0].id, 'insert', null, result.rows[0]);
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
        return;
      }
      console.error('Error creating scenario:', error);
      res.status(500).json({ error: 'Failed to create scenario' });
    }
  },
);

// PUT /api/scenarios/:id — Update scenario (owner or admin)
router.put(
  '/:id',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = updateScenarioSchema.parse(req.body);
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Check ownership
      const existing = await pool.query('SELECT * FROM scenarios WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Scenario not found' });
        return;
      }

      if (existing.rows[0].created_by !== userId && userRole !== 'admin') {
        res.status(403).json({ error: 'Can only edit your own scenarios' });
        return;
      }

      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (data.name !== undefined) { fields.push(`name = $${paramIdx++}`); values.push(data.name); }
      if (data.description !== undefined) { fields.push(`description = $${paramIdx++}`); values.push(data.description); }
      if (data.adjustments !== undefined) { fields.push(`adjustments = $${paramIdx++}`); values.push(JSON.stringify(data.adjustments)); }
      if (data.tags !== undefined) { fields.push(`tags = $${paramIdx++}`); values.push(data.tags); }
      if (data.is_shared !== undefined) { fields.push(`is_shared = $${paramIdx++}`); values.push(data.is_shared); }

      fields.push(`updated_at = now()`);
      values.push(id);

      const result = await pool.query(
        `UPDATE scenarios SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
        values,
      );

      if (userId) {
        await logAudit(pool, userId, 'scenarios', id, 'update', existing.rows[0], result.rows[0]);
      }

      res.json(result.rows[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
        return;
      }
      console.error('Error updating scenario:', error);
      res.status(500).json({ error: 'Failed to update scenario' });
    }
  },
);

// DELETE /api/scenarios/:id — Delete scenario (owner or admin)
router.delete(
  '/:id',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const existing = await pool.query('SELECT * FROM scenarios WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Scenario not found' });
        return;
      }

      if (existing.rows[0].created_by !== userId && userRole !== 'admin') {
        res.status(403).json({ error: 'Can only delete your own scenarios' });
        return;
      }

      await pool.query('DELETE FROM scenarios WHERE id = $1', [id]);

      if (userId) {
        await logAudit(pool, userId, 'scenarios', id, 'delete', existing.rows[0], null);
      }

      res.json({ message: 'Scenario deleted' });
    } catch (error) {
      console.error('Error deleting scenario:', error);
      res.status(500).json({ error: 'Failed to delete scenario' });
    }
  },
);

export default router;
