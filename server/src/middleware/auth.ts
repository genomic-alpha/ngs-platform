import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
    }
  }
}

export type AuthRequest = Request & { user?: { id: string; email: string; role: string } };

const JWT_SECRET = process.env.JWT_SECRET || 'ngs-platform-dev-secret';
const TOKEN_EXPIRY = '24h';

// Role hierarchy: admin > analyst > viewer
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 3,
  analyst: 2,
  viewer: 1,
};

/**
 * Authenticate Express middleware.
 * Extracts Bearer token from Authorization header and verifies JWT.
 * Attaches decoded payload to req.user.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Role-based access control middleware factory.
 * Checks if user's role is in the allowed roles list.
 * Enforces role hierarchy: admin can do everything analyst can, etc.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;

    // Check if user's role level is high enough for any allowed role
    const hasPermission = allowedRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] || 0;
      return userRoleLevel >= requiredLevel;
    });

    if (!hasPermission) {
      res.status(403).json({
        error: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Generate JWT token for user.
 * Token valid for 24 hours.
 */
export function generateToken(user: {
  id: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}
