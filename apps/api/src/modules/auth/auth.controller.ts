import type { Request, Response } from 'express';
import { env } from '../../config';
import { AppError, asyncHandler, sendSuccess } from '../../utils';
import { authService } from './auth.service';

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  sendSuccess(res, user, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.cookie(env.REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
  sendSuccess(res, { accessToken: result.accessToken, user: result.user });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[env.REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    throw AppError.unauthorized('Refresh token missing');
  }
  const result = await authService.refresh(refreshToken);
  sendSuccess(res, result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[env.REFRESH_COOKIE_NAME];
  await authService.logout(refreshToken, req.user?.userId);
  res.clearCookie(env.REFRESH_COOKIE_NAME, refreshCookieOptions);
  res.status(204).send();
});
