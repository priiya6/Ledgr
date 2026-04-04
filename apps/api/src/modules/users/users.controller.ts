import type { Request, Response } from 'express';
import { asyncHandler, buildPaginationMeta, sendPaginated, sendSuccess } from '../../utils';
import { usersService } from './users.service';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as any;
  const result = await usersService.list(query);
  sendPaginated(res, result.items, buildPaginationMeta(query.page, query.limit, result.total));
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getById(req.user!.userId);
  sendSuccess(res, user);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getById(req.params.id!);
  sendSuccess(res, user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.create(req.body, req.user!.userId);
  sendSuccess(res, user, 201);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.update(req.params.id!, req.body, req.user!.userId);
  sendSuccess(res, user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await usersService.deactivate(req.params.id!, req.user!.userId);
  res.status(204).send();
});
