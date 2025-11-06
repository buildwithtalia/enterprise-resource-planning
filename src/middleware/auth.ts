import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Shared authentication middleware
 * All modules use this single authentication mechanism
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication failed', { error });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Generate JWT token (used by login endpoints)
 */
export const generateToken = (payload: { id: string; email: string; role: string }): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};
