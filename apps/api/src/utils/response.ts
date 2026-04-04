import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

/**
 * Send a successful JSON response with data
 */
export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): void => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

/**
 * Send a successful paginated JSON response
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
};

/**
 * Calculate pagination offsets
 */
export const getPaginationParams = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

/**
 * Build pagination meta from query results
 */
export const buildPaginationMeta = (page: number, limit: number, total: number): PaginationMeta => {
  return {
    page,
    limit,
    total,
  };
};
