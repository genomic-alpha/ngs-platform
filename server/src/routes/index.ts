import { Router } from 'express';
import vendorsRouter from './vendors';
import productsRouter from './products';
import financialsRouter from './financials';
import marketDataRouter from './market-data';
import intelligenceRouter from './intelligence';
import compatibilityRouter from './compatibility';
import partnersRouter from './partners';
import authRouter from './auth-routes';
import pipelinesRouter from './pipelines';
import scenariosRouter from './scenarios';
import reportsRouter from './reports';
import docsRouter from './docs';

const api = Router();

// Auth routes (no prefix needed)
api.use('/auth', authRouter);

// Business domain routes
api.use('/vendors', vendorsRouter);
api.use('/products', productsRouter);
api.use('/financials', financialsRouter);
api.use('/market-data', marketDataRouter);
api.use('/intelligence', intelligenceRouter);
api.use('/compatibility', compatibilityRouter);
api.use('/partners', partnersRouter);

// Phase 3: Intelligence & Reporting
api.use('/pipelines', pipelinesRouter);
api.use('/scenarios', scenariosRouter);
api.use('/reports', reportsRouter);

// Documentation
api.use('/docs', docsRouter);

export default api;
