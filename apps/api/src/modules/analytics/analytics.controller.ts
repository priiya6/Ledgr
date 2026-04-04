import type { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../../utils';
import { analyticsService } from './analytics.service';

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.summary(req.user!);
  sendSuccess(res, result.payload);
});

export const byCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.byCategory(req.user!);
  sendSuccess(res, result.payload);
});

export const timeSeries = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.timeSeries(req.user!, req.query as any);
  sendSuccess(res, result.payload);
});

export const topCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.topCategories(req.user!, req.query as any);
  sendSuccess(res, result.payload);
});
