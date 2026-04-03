import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Global error handler middleware.
 * Catches all errors and returns appropriate HTTP responses.
 * Logs errors to console in development.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV !== 'production';

  // Log error in development
  if (isDev) {
    console.error('Error:', err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle authentication errors
  if (err instanceof Error && err.message.includes('auth')) {
    res.status(401).json({ error: err.message });
    return;
  }

  // Handle permission errors
  if (err instanceof Error && err.message.includes('permission')) {
    res.status(403).json({ error: err.message });
    return;
  }

  // Handle standard errors
  if (err instanceof Error) {
    // Check for specific error types
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }

    if (err.message.includes('already exists')) {
      res.status(409).json({ error: err.message });
      return;
    }

    res.status(500).json({
      error: err.message || 'Internal server error',
      ...(isDev && { details: err.stack }),
    });
    return;
  }

  // Fallback for unknown errors
  res.status(500).json({
    error: 'Internal server error',
    ...(isDev && { details: String(err) }),
  });
}
