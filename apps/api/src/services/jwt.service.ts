import jwt from 'jsonwebtoken';
import { env } from '../config';
import type { AuthenticatedUser } from '../types';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: AuthenticatedUser['role'];
}

export class JwtService {
  signAccessToken(payload: AccessTokenPayload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
    });
  }

  signRefreshToken(payload: AccessTokenPayload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenPayload;
  }
}

export const jwtService = new JwtService();
