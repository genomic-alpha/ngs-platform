/**
 * Environment configuration helper.
 * Provides type-safe access to environment variables with sensible defaults.
 */
export const env = {
  /** Express server port (default: 3001) */
  PORT: parseInt(process.env.PORT || '3001', 10),

  /** PostgreSQL connection string */
  DATABASE_URL:
    process.env.DATABASE_URL || 'postgresql://localhost:5432/ngs_platform',

  /** JWT secret for token signing (default: dev secret) */
  JWT_SECRET: process.env.JWT_SECRET || 'ngs-platform-dev-secret',

  /** Node environment (development, production, test) */
  NODE_ENV: process.env.NODE_ENV || 'development',

  /** CORS origin URL for frontend (default: localhost:5173 for Vite, empty = same-origin) */
  CORS_ORIGIN: process.env.CORS_ORIGIN !== undefined ? process.env.CORS_ORIGIN : 'http://localhost:5173',
} as const;

/**
 * Validate environment configuration.
 * Called at startup to ensure all required values are present.
 */
export function validateEnv(): void {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_HOST) {
    console.warn(
      'WARNING: DATABASE_URL not set, using default postgresql://localhost:5432/ngs_platform'
    );
  }

  if (process.env.NODE_ENV === 'production' && env.JWT_SECRET === 'ngs-platform-dev-secret') {
    console.warn('WARNING: Using development JWT_SECRET in production. Set JWT_SECRET env var.');
  }

  if (process.env.NODE_ENV === 'production' && env.CORS_ORIGIN === 'http://localhost:5173') {
    console.warn(
      'WARNING: CORS_ORIGIN is set to localhost in production. Set CORS_ORIGIN env var.'
    );
  }
}
