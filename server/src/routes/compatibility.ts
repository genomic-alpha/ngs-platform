import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();

const compatibilitySchema = z.object({
  product_id: z.string().min(1),
  third_party_tool: z.string().min(1),
  compatibility_layer: z.string().min(1),
  integration_status: z.enum(['planned', 'in_progress', 'supported', 'deprecated']).optional(),
  notes: z.string().optional().nullable(),
});

// GET /api/compatibility - Get all entries with layers
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT c.*, cl.description as layer_description
       FROM compatibility_matrix c
       LEFT JOIN compatibility_layers cl ON c.compatibility_layer = cl.layer_name
       ORDER BY c.product_id, c.third_party_tool`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching compatibility entries:', error);
    res.status(500).json({ error: 'Failed to fetch compatibility entries' });
  }
});

// GET /api/compatibility/layers - Get just layer definitions
router.get('/layers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM compatibility_layers ORDER BY layer_name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching compatibility layers:', error);
    res.status(500).json({ error: 'Failed to fetch compatibility layers' });
  }
});

// POST /api/compatibility - Create entry (analyst+)
router.post(
  '/',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = compatibilitySchema.parse(req.body);

      const result = await pool.query(
        `INSERT INTO compatibility_matrix (product_id, third_party_tool, compatibility_layer, integration_status, notes)
         VALUES ($1, $2, $3, COALESCE($4, 'planned'), $5)
         RETURNING *`,
        [
          data.product_id,
          data.third_party_tool,
          data.compatibility_layer,
          data.integration_status,
          data.notes,
        ]
      );

      const newEntry = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'compatibility_matrix', newEntry.id, 'insert', null, newEntry);
      }

      res.status(201).json(newEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error creating compatibility entry:', error);
      res.status(500).json({ error: 'Failed to create compatibility entry' });
    }
  }
);

// PUT /api/compatibility/:id - Update entry (analyst+)
router.put(
  '/:id',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = compatibilitySchema.partial().parse(req.body);

      // Get current entry
      const currentResult = await pool.query('SELECT * FROM compatibility_matrix WHERE id = $1', [id]);

      if (currentResult.rows.length === 0) {
        res.status(404).json({ error: 'Compatibility entry not found' });
        return;
      }

      const currentEntry = currentResult.rows[0];

      // Build update query
      const fields = Object.keys(data).filter((k) => k in data);
      if (fields.length === 0) {
        res.json(currentEntry);
        return;
      }

      const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fields.map((field) => (data as Record<string, unknown>)[field]);

      const result = await pool.query(
        `UPDATE compatibility_matrix SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
        [...values, id]
      );

      const updatedEntry = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'compatibility_matrix', id, 'update', currentEntry, updatedEntry);
      }

      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error updating compatibility entry:', error);
      res.status(500).json({ error: 'Failed to update compatibility entry' });
    }
  }
);

// DELETE /api/compatibility/:id - Delete entry (admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;

      // Get entry before deletion
      const currentResult = await pool.query('SELECT * FROM compatibility_matrix WHERE id = $1', [id]);

      if (currentResult.rows.length === 0) {
        res.status(404).json({ error: 'Compatibility entry not found' });
        return;
      }

      const deletedEntry = currentResult.rows[0];

      await pool.query('DELETE FROM compatibility_matrix WHERE id = $1', [id]);

      if (req.user) {
        await logAudit(pool, req.user.id, 'compatibility_matrix', id, 'delete', deletedEntry, null);
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting compatibility entry:', error);
      res.status(500).json({ error: 'Failed to delete compatibility entry' });
    }
  }
);

export default router;
