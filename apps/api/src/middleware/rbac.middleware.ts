import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

type Role = 'VIEWER' | 'ANALYST' | 'ADMIN';

/**
 * Middleware factory: restricts access to users with specified roles.
 * Returns 403 if user's role is not in the allowed list.
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden(`Role '${req.user.role}' does not have access to this resource`));
      return;
    }

    next();
  };
};

/**
 * Middleware factory: checks that the authenticated user owns the entity,
 * or is an ADMIN (who can access any entity).
 */
export const requireOwnership = (getEntityUserId: (req: Request) => string | Promise<string>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(AppError.unauthorized('Authentication required'));
        return;
      }

      if (req.user.role === 'ADMIN') {
        next();
        return;
      }

      const entityUserId = await getEntityUserId(req);
      if (entityUserId !== req.user.userId) {
        next(AppError.forbidden('You do not have permission to access this resource'));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
