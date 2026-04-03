import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { env, validateEnv } from './utils/env';
import { authenticate, requireRole } from './middleware/auth';
import { errorHandler } from './middleware/error';
import apiRouter from './routes/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * NGS Platform Backend Server
 * Main Express application entry point.
 */

// Validate environment configuration
validateEnv();

// Initialize Express app
const app = express();

// Database connection pool
const dbPool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Middleware: CORS (skip in production when serving frontend from Express)
if (env.CORS_ORIGIN) {
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
}

// Middleware: JSON parsing with size limit
app.use(express.json({ limit: '10mb' }));

// Middleware: URL-encoded parsing
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint (no auth required)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes — authentication applied inside router per-route
app.use('/api', authenticate, apiRouter);

// ── Production: serve Vite build output ──────────────────
if (env.NODE_ENV === 'production') {
  // Static assets from the frontend build (../../dist relative to server/dist/)
  const clientDist = path.resolve(__dirname, '../../dist');
  app.use(express.static(clientDist, { maxAge: '30d', immutable: true }));

  // SPA fallback — all non-API routes serve index.html
  // Express 5 requires named wildcard params (not bare '*')
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Development 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Global error handler (must be last)
app.use(errorHandler);

// Server startup
const server = app.listen(env.PORT, () => {
  console.log(`NGS Platform server running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Database: ${env.DATABASE_URL.replace(/:[^@]*@/, ':***@')}`);
  console.log(`CORS Origin: ${env.CORS_ORIGIN}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nReceived shutdown signal. Closing server gracefully...');

  // Stop accepting new requests
  server.close(async () => {
    console.log('HTTP server closed');

    // Close database connections
    try {
      await dbPool.end();
      console.log('Database connections closed');
    } catch (err) {
      console.error('Error closing database:', err);
    }

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Export for testing
export { app, dbPool };
