import { Router } from 'express';
import { openApiSpec } from '../docs/openapi.js';

const router = Router();

/** GET /api/docs/openapi.json — serve OpenAPI 3.1 spec */
router.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

export default router;
