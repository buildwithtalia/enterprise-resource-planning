import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Development mode: bypass authentication if DISABLE_AUTH is true
    if (process.env.DISABLE_AUTH === 'true') {
      req.user = {
        id: 'dev-user-id',
        email: 'dev@company.com',
        role: 'admin',
        permissions: ['*'],
      };
      return next();
    }

    // Check for user info from API Gateway headers
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const userPermissions = req.headers['x-user-permissions'] as string;

    if (userId && userEmail) {
      // User info forwarded by API Gateway
      req.user = {
        id: userId,
        email: userEmail,
        role: userRole || 'user',
        permissions: userPermissions ? JSON.parse(userPermissions) : [],
      };
      return next();
    }

    // Fallback: Validate JWT directly (for direct service access)
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
    }

    const token = authHeader.substring(7);
    const publicKey = fs.readFileSync(
      process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem',
      'utf8'
    );

    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    }) as any;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    logger.error('Authentication error', error as Error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const hasPermission = requiredPermissions.some(
      (permission) =>
        req.user!.permissions.includes(permission) ||
        req.user!.permissions.includes('*') ||
        req.user!.role === 'admin'
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          details: {
            required: requiredPermissions,
            actual: req.user.permissions,
          },
        },
      });
    }

    return next();
  };
};
