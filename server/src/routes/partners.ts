import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();

const partnerSchema = z.object({
  name: z.string().min(1),
  partner_type: z.enum(['academic', 'government', 'commercial', 'nonprofit', 'other']),
  description: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/partners - List all partners
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM partners ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

// GET /api/partners/:id - Get single partner
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM partners WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({ error: 'Failed to fetch partner' });
  }
});

// POST /api/partners - Create partner (analyst+)
router.post(
  '/',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = partnerSchema.parse(req.body);

      const result = await pool.query(
        `INSERT INTO partners (name, partner_type, description, website, contact_email, location, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          data.name,
          data.partner_type,
          data.description,
          data.website,
          data.contact_email,
          data.location,
          data.notes,
        ]
      );

      const newPartner = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'partners', newPartner.id, 'insert', null, newPartner);
      }

      res.status(201).json(newPartner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error creating partner:', error);
      res.status(500).json({ error: 'Failed to create partner' });
    }
  }
);

// PUT /api/partners/:id - Update partner (analyst+)
router.put(
  '/:id',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = partnerSchema.partial().parse(req.body);

      // Get current partner
      const currentResult = await pool.query('SELECT * FROM partners WHERE id = $1', [id]);

      if (currentResult.rows.length === 0) {
        res.status(404).json({ error: 'Partner not found' });
        return;
      }

      const currentPartner = currentResult.rows[0];

      // Build update query
      const fields = Object.keys(data).filter((k) => k in data);
      if (fields.length === 0) {
        res.json(currentPartner);
        return;
      }

      const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fields.map((field) => (data as Record<string, unknown>)[field]);

      const result = await pool.query(
        `UPDATE partners SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
        [...values, id]
      );

      const updatedPartner = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'partners', id as string, 'update', currentPartner, updatedPartner);
      }

      res.json(updatedPartner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error updating partner:', error);
      res.status(500).json({ error: 'Failed to update partner' });
    }
  }
);

// DELETE /api/partners/:id - Delete partner (admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;

      // Get partner before deletion
      const currentResult = await pool.query('SELECT * FROM partners WHERE id = $1', [id]);

      if (currentResult.rows.length === 0) {
        res.status(404).json({ error: 'Partner not found' });
        return;
      }

      const deletedPartner = currentResult.rows[0];

      await pool.query('DELETE FROM partners WHERE id = $1', [id]);

      if (req.user) {
        await logAudit(pool, req.user.id, 'partners', id as string, 'delete', deletedPartner, null);
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting partner:', error);
      res.status(500).json({ error: 'Failed to delete partner' });
    }
  }
);

export default router;
