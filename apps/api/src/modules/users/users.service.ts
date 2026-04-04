import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import type { CreateUserInput, UpdateUserInput, UserQueryInput } from '@ledgr/shared';
import { env } from '../../config/env';
import { AppError, getPagination } from '../../utils';
import { auditService } from '../../services/audit.service';
import { usersRepository, UsersRepository } from './users.repository';

export class UsersService {
  constructor(private readonly repository: UsersRepository = usersRepository) {}

  private sanitize<T extends { passwordHash: string }>(user: T) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async list(query: UserQueryInput) {
    const where = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.list({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...getPagination(query),
      }),
      this.repository.count(where),
    ]);

    return { items: items.map((item: (typeof items)[number]) => this.sanitize(item)), total };
  }

  async getById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return this.sanitize(user);
  }

  async create(input: CreateUserInput, actorUserId: string) {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict('Email is already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    const user = await this.repository.create({
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
    });

    auditService.logMutation({
      userId: actorUserId,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    return this.sanitize(user);
  }

  async update(id: string, input: UpdateUserInput, actorUserId: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw AppError.notFound('User not found');
    }

    if (input.email && input.email !== existing.email) {
      const duplicate = await this.repository.findByEmail(input.email);
      if (duplicate && duplicate.id !== id) {
        throw AppError.conflict('Email is already in use');
      }
    }

    if (actorUserId === id && input.role && input.role !== existing.role) {
      throw AppError.forbidden('You cannot change your own role');
    }

    if (actorUserId === id && input.isActive === false) {
      throw AppError.forbidden('You cannot deactivate your own account');
    }

    if (existing.role === 'ADMIN' && input.isActive === false) {
      const activeAdmins = await this.repository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw AppError.forbidden('Cannot deactivate the last active admin');
      }
    }

    const user = await this.repository.update(id, input);

    auditService.logMutation({
      userId: actorUserId,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: user.id,
      metadata: input as Prisma.InputJsonValue,
    });

    return this.sanitize(user);
  }

  async deactivate(id: string, actorUserId: string) {
    return this.update(id, { isActive: false }, actorUserId);
  }
}

export const usersService = new UsersService();
