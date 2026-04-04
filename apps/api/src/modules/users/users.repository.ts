import type { Prisma } from '@prisma/client';
import { prisma } from '../../config';

export class UsersRepository {
  list(args: Prisma.UserFindManyArgs) {
    return prisma.user.findMany(args);
  }

  count(where: Prisma.UserWhereInput) {
    return prisma.user.count({ where });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }

  countActiveAdmins() {
    return prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
  }
}

export const usersRepository = new UsersRepository();
