import type { Request, Response } from 'express';
import { asyncHandler, buildPaginationMeta, sendPaginated, sendSuccess } from '../../utils';
import { recordService } from './records.service';

export const listRecords = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as any;
  const result = await recordService.list(query, req.user!);
  sendPaginated(res, result.items, buildPaginationMeta(query.page, query.limit, result.total));
});

export const getRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = await recordService.getById(req.params.id!, req.user!);
  sendSuccess(res, record);
});

export const createRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = await recordService.create(req.body, req.user!.userId);
  sendSuccess(res, record, 201);
});

export const updateRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = await recordService.update(req.params.id!, req.body, req.user!.userId);
  sendSuccess(res, record);
});

export const deleteRecord = asyncHandler(async (req: Request, res: Response) => {
  await recordService.remove(req.params.id!, req.user!.userId);
  res.status(204).send();
});

export const exportRecords = asyncHandler(async (req: Request, res: Response) => {
  await recordService.export(req.query as any, req.user!, res);
});

export const convertAmount = asyncHandler(async (req: Request, res: Response) => {
  const result = await recordService.convert(req.query as any);
  sendSuccess(res, result);
});
