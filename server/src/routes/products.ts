import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/audit';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  vendor_key: z.string().min(1),
  description: z.string().optional().nullable(),
  launch_date: z.string().datetime().optional().nullable(),
  list_price: z.number().positive().optional().nullable(),
  indications: z.array(z.string()).optional(),
  sample_types: z.array(z.string()).optional(),
  nucleic_acids: z.array(z.string()).optional(),
});

// Helper: Get product with joined data
async function getProductWithJoins(productId: string | number) {
  const result = await pool.query(
    `SELECT
      p.id, p.name, p.vendor_key, p.description, p.launch_date, p.list_price,
      COALESCE(json_agg(DISTINCT pi.indication_name) FILTER (WHERE pi.indication_name IS NOT NULL), '[]'::json) as indications,
      COALESCE(json_agg(DISTINCT pst.sample_type_name) FILTER (WHERE pst.sample_type_name IS NOT NULL), '[]'::json) as sample_types,
      COALESCE(json_agg(DISTINCT pna.nucleic_acid_name) FILTER (WHERE pna.nucleic_acid_name IS NOT NULL), '[]'::json) as nucleic_acids
     FROM products p
     LEFT JOIN product_indications pi ON p.id = pi.product_id
     LEFT JOIN product_sample_types pst ON p.id = pst.product_id
     LEFT JOIN product_nucleic_acids pna ON p.id = pna.product_id
     WHERE p.id = $1
     GROUP BY p.id`,
    [productId]
  );
  return result.rows[0];
}

// GET /api/products - List all products with joined data
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
        p.id, p.name, p.vendor_key, p.description, p.launch_date, p.list_price,
        COALESCE(json_agg(DISTINCT pi.indication_name) FILTER (WHERE pi.indication_name IS NOT NULL), '[]'::json) as indications,
        COALESCE(json_agg(DISTINCT pst.sample_type_name) FILTER (WHERE pst.sample_type_name IS NOT NULL), '[]'::json) as sample_types,
        COALESCE(json_agg(DISTINCT pna.nucleic_acid_name) FILTER (WHERE pna.nucleic_acid_name IS NOT NULL), '[]'::json) as nucleic_acids
       FROM products p
       LEFT JOIN product_indications pi ON p.id = pi.product_id
       LEFT JOIN product_sample_types pst ON p.id = pst.product_id
       LEFT JOIN product_nucleic_acids pna ON p.id = pna.product_id
       GROUP BY p.id
       ORDER BY p.name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get single product with joins
router.get('/:id', async (_req: Request, res: Response): Promise<void> => {
  try {
    const product = await getProductWithJoins(_req.params.id as string);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create product (analyst+)
router.post(
  '/',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = productSchema.parse(req.body);

      // Insert product
      const result = await pool.query(
        `INSERT INTO products (name, vendor_key, description, launch_date, list_price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [data.name, data.vendor_key, data.description, data.launch_date, data.list_price]
      );

      const productId = result.rows[0].id;

      // Insert indications
      if (data.indications?.length) {
        for (const indication of data.indications) {
          await pool.query(
            'INSERT INTO product_indications (product_id, indication_name) VALUES ($1, $2)',
            [productId, indication]
          );
        }
      }

      // Insert sample types
      if (data.sample_types?.length) {
        for (const sampleType of data.sample_types) {
          await pool.query(
            'INSERT INTO product_sample_types (product_id, sample_type_name) VALUES ($1, $2)',
            [productId, sampleType]
          );
        }
      }

      // Insert nucleic acids
      if (data.nucleic_acids?.length) {
        for (const nucleicAcid of data.nucleic_acids) {
          await pool.query(
            'INSERT INTO product_nucleic_acids (product_id, nucleic_acid_name) VALUES ($1, $2)',
            [productId, nucleicAcid]
          );
        }
      }

      const newProduct = await getProductWithJoins(productId);

      if (req.user) {
        await logAudit(pool, req.user.id, 'products', productId, 'insert', null, newProduct);
      }

      res.status(201).json(newProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// PUT /api/products/:id - Update product (analyst+)
router.put(
  '/:id',
  authenticate,
  requireRole('analyst', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const productId = req.params.id as string;
      const data = productSchema.partial().parse(req.body);

      // Get current product
      const currentProduct = await getProductWithJoins(productId);

      if (!currentProduct) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Update product fields (excluding join tables)
      const productFields = ['name', 'vendor_key', 'description', 'launch_date', 'list_price'];
      const fieldsToUpdate = productFields.filter((f) => f in data);

      if (fieldsToUpdate.length > 0) {
        const setClause = fieldsToUpdate.map((f, i) => `${f} = $${i + 1}`).join(', ');
        const values = fieldsToUpdate.map((f) => (data as Record<string, unknown>)[f]);

        await pool.query(`UPDATE products SET ${setClause} WHERE id = $${fieldsToUpdate.length + 1}`, [
          ...values,
          productId,
        ]);
      }

      // Update indications if provided
      if (data.indications) {
        await pool.query('DELETE FROM product_indications WHERE product_id = $1', [productId]);
        for (const indication of data.indications) {
          await pool.query(
            'INSERT INTO product_indications (product_id, indication_name) VALUES ($1, $2)',
            [productId, indication]
          );
        }
      }

      // Update sample types if provided
      if (data.sample_types) {
        await pool.query('DELETE FROM product_sample_types WHERE product_id = $1', [productId]);
        for (const sampleType of data.sample_types) {
          await pool.query(
            'INSERT INTO product_sample_types (product_id, sample_type_name) VALUES ($1, $2)',
            [productId, sampleType]
          );
        }
      }

      // Update nucleic acids if provided
      if (data.nucleic_acids) {
        await pool.query('DELETE FROM product_nucleic_acids WHERE product_id = $1', [productId]);
        for (const nucleicAcid of data.nucleic_acids) {
          await pool.query(
            'INSERT INTO product_nucleic_acids (product_id, nucleic_acid_name) VALUES ($1, $2)',
            [productId, nucleicAcid]
          );
        }
      }

      const updatedProduct = await getProductWithJoins(productId);

      if (req.user) {
        await logAudit(pool, req.user.id, 'products', productId, 'update', currentProduct, updatedProduct);
      }

      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request body', details: error.errors });
        return;
      }

      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// DELETE /api/products/:id - Delete product (admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const productId = req.params.id as string;

      // Get product before deletion
      const deletedProduct = await getProductWithJoins(productId);

      if (!deletedProduct) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      await pool.query('DELETE FROM products WHERE id = $1', [productId]);

      if (req.user) {
        await logAudit(pool, req.user.id, 'products', productId, 'delete', deletedProduct, null);
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }
);

export default router;
