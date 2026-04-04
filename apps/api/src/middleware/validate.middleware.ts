import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodTypeAny } from 'zod';

type RequestField = 'body' | 'query' | 'params';
type CompositeSchema = Partial<Record<RequestField, ZodTypeAny>>;

/**
 * Middleware factory that validates request data against a Zod schema.
 * Supports validating req.body, req.query, and req.params in one pass.
 */
export const validateRequest = (schema: ZodSchema | CompositeSchema, field: RequestField = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if ('safeParse' in schema) {
        const result = schema.parse(req[field]);
        if (field === 'body') {
          req.body = result;
        } else if (field === 'query') {
          req.query = result as Record<string, string>;
        } else if (field === 'params') {
          req.params = result as Record<string, string>;
        }
        next();
        return;
      }

      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query) as Record<string, string>;
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params) as Record<string, string>;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
