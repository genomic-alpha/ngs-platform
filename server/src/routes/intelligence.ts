import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();

const signalSchema = z.object({
  vendor_key: z.string().min(1),
  signal_type: z.enum(['partnership', 'funding', 'acquisition', 'regulatory', 'market_move', 'other']),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  impact_level: z.enum(['low', 'medium', 'high']).optional(),
  source_url: z.string().url().optional().nullable(),
  detected_date: z.string().datetime().optional(),
});

const timelineSchema = z.object({
  vendor_key: z.string().min(1),
  event_type: z.enum(['launch', 'acquisition', 'partnership', 'milestone', 'regulatory', 'other']),
  event_title: z.string().min(1),
  event_description: z.string().optional().nullable(),
  event_date: z.string().datetime(),
});

// GET /api/signals - Get all intel signals with optional filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, impact, vendor } = req.query;

    let query = 'SELECT * FROM intelligence_signals WHERE 1=1';
    const values: unknown[] = [];

    if (type) {
      query += ` AND signal_type = $${values.length + 1}`;
      values.push(type);
    }

    if (impact) {
      query += ` AND impact_level = $${values.length + 1}`;
      values.push(impact);
    }

    if (vendor) {
      query += ` AND vendor_key = $${values.length + 1}`;
      values.push(vendor);
    }

    query += ' ORDER BY detected_date DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.status(500).json({ error: 'Failed to fetch intelligence signals' });
  }
});

// POST /api/signals - Create new signal (analyst+)
router.post(
  '/',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = signalSchema.parse(req.body);

      const result = await pool.query(
        `INSERT INTO intelligence_signals (vendor_key, signal_type, title, description, impact_level, source_url, detected_date)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()))
         RETURNING *`,
        [
          data.vendor_key,
          data.signal_type,
          data.title,
          data.description,
          data.impact_level,
          data.source_url,
          data.detected_date,
        ]
      );

      const newSignal = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'intelligence_signals', newSignal.id, 'insert', null, newSignal);
      }

      res.status(201).json(newSignal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error creating signal:', error);
      res.status(500).json({ error: 'Failed to create intelligence signal' });
    }
  }
);

// PUT /api/signals/:id - Update signal (analyst+)
router.put(
  '/:id',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = signalSchema.partial().parse(req.body);

      // Get current signal
      const currentResult = await pool.query('SELECT * FROM intelligence_signals WHERE id = $1', [id]);

      if (currentResult.rows.length === 0) {
        res.status(404).json({ error: 'Signal not found' });
        return;
      }

      const currentSignal = currentResult.rows[0];

      // Build update query
      const fields = Object.keys(data).filter((k) => k in data);
      if (fields.length === 0) {
        res.json(currentSignal);
        return;
      }

      const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fields.map((field) => (data as Record<string, unknown>)[field]);

      const result = await pool.query(
        `UPDATE intelligence_signals SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
        [...values, id]
      );

      const updatedSignal = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'intelligence_signals', id, 'update', currentSignal, updatedSignal);
      }

      res.json(updatedSignal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error updating signal:', error);
      res.status(500).json({ error: 'Failed to update intelligence signal' });
    }
  }
);

// GET /api/timeline - Get all timeline events
router.get('/timeline', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM timeline_events ORDER BY event_date DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline events' });
  }
});

// POST /api/timeline - Create timeline event (analyst+)
router.post(
  '/timeline',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = timelineSchema.parse(req.body);

      const result = await pool.query(
        `INSERT INTO timeline_events (vendor_key, event_type, event_title, event_description, event_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.vendor_key, data.event_type, data.event_title, data.event_description, data.event_date]
      );

      const newEvent = result.rows[0];

      if (req.user) {
        await logAudit(pool, req.user.id, 'timeline_events', newEvent.id, 'insert', null, newEvent);
      }

      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error creating timeline event:', error);
      res.status(500).json({ error: 'Failed to create timeline event' });
    }
  }
);

export default router;
