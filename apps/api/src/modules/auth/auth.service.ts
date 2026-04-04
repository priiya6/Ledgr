import bcrypt from 'bcryptjs';
import type { LoginInput, RegisterInput } from '@ledgr/shared';
import { env, redis } from '../../config';
import { AppError } from '../../utils';
import { authRepository, AuthRepository } from './auth.repository';
import { jwtService, JwtService } from '../../services/jwt.service';

const parseDurationMs = (value: string) => {
  const match = /^(\d+)([mhd])$/.exec(value);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === 'm') {
    return amount * 60 * 1000;
  }
  if (unit === 'h') {
    return amount * 60 * 60 * 1000;
  }
  return amount * 24 * 60 * 60 * 1000;
};

export class AuthService {
  constructor(
    private readonly repository: AuthRepository = authRepository,
    private readonly tokenService: JwtService = jwtService
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw AppError.conflict('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    const user = await this.repository.createUser({
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
    });

    return this.repository.sanitizeUser(user);
  }

  async login(input: LoginInput) {
    const user = await this.repository.findUserByEmail(input.email);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    } as const;

    const accessToken = this.tokenService.signAccessToken(payload);
    const refreshToken = this.tokenService.signRefreshToken(payload);
    const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES));

    await this.repository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    await redis.set(`refresh:${user.id}`, refreshToken, 'PX', Math.max(expiresAt.getTime() - Date.now(), 1000));

    return {
      accessToken,
      refreshToken,
      user: this.repository.sanitizeUser(user),
    };
  }

  async refresh(refreshToken: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const stored = await this.repository.findRefreshToken(refreshToken);
    if (!stored || stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token is invalid or expired');
    }

    const cached = await redis.get(`refresh:${payload.userId}`);
    if (cached && cached !== refreshToken) {
      throw AppError.unauthorized('Refresh token was revoked');
    }

    const user = await this.repository.findUserById(payload.userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User account is unavailable');
    }

    return {
      accessToken: this.tokenService.signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      }),
      user: this.repository.sanitizeUser(user),
    };
  }

  async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      await this.repository.deleteRefreshToken(refreshToken);
    }
    if (userId) {
      await this.repository.deleteRefreshTokensForUser(userId);
      await redis.del(`refresh:${userId}`);
    }
  }
}

export const authService = new AuthService();
