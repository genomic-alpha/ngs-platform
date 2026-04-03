import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();

const vendorSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  website: z.string().url().optional().nullable(),
  founded_year: z.number().int().optional().nullable(),
  headquarters: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

// GET /api/vendors - List all vendors
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM vendors ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// GET /api/vendors/:key - Get single vendor
router.get('/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const result = await pool.query('SELECT * FROM vendors WHERE key = $1', [key]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// POST /api/vendors - Create vendor (admin only)
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = vendorSchema.parse(req.body);

      const result = await pool.query(
        `INSERT INTO vendors (key, name, website, founded_year, headquarters, description)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [data.key, data.name, data.website, data.founded_year, data.headquarters, data.description]
      );

      const newVendor = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'vendors', data.key, 'insert', null, newVendor);
      }

      res.status(201).json(newVendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error creating vendor:', error);
      res.status(500).json({ error: 'Failed to create vendor' });
    }
  }
);

// PUT /api/vendors/:key - Update vendor (analyst+)
router.put(
  '/:key',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      const data = vendorSchema.partial().parse(req.body);

      // Get current vendor
      const currentResult = await pool.query('SELECT * FROM vendors WHERE key = $1', [key]);

      if (currentResult.rows.length === 0) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }

      const currentVendor = currentResult.rows[0];

      // Build update query
      const fields = Object.keys(data).filter((k) => k in data);
      if (fields.length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fields.map((field) => (data as Record<string, unknown>)[field]);

      const result = await pool.query(
        `UPDATE vendors SET ${setClause} WHERE key = $${fields.length + 1} RETURNING *`,
        [...values, key]
      );

      const updatedVendor = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'vendors', key as string, 'update', currentVendor, updatedVendor);
      }

      res.json(updatedVendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error updating vendor:', error);
      res.status(500).json({ error: 'Failed to update vendor' });
    }
  }
);

// DELETE /api/vendors/:key - Delete vendor (admin only)
router.delete(
  '/:key',
  authenticate,
  requireRole('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { key } = req.params;

      // Get vendor before deletion
      const currentResult = await pool.query('SELECT * FROM vendors WHERE key = $1', [key]);

      if (currentResult.rows.length === 0) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }

      const deletedVendor = currentResult.rows[0];

      await pool.query('DELETE FROM vendors WHERE key = $1', [key]);

      if (req.user) {
        await logAudit(pool, req.user.id, 'vendors', key as string, 'delete', deletedVendor, null);
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      res.status(500).json({ error: 'Failed to delete vendor' });
    }
  }
);

export default router;
