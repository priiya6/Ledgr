import type { Prisma } from '@prisma/client';
import { prisma } from '../../config';

export class RecordsRepository {
  list(args: Prisma.FinancialRecordFindManyArgs) {
    return prisma.financialRecord.findMany(args);
  }

  count(where: Prisma.FinancialRecordWhereInput) {
    return prisma.financialRecord.count({ where });
  }

  findById(id: string) {
    return prisma.financialRecord.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });
  }

  create(data: Prisma.FinancialRecordUncheckedCreateInput) {
    return prisma.financialRecord.create({ data });
  }

  update(id: string, data: Prisma.FinancialRecordUpdateInput) {
    return prisma.financialRecord.update({ where: { id }, data });
  }
}

export const recordsRepository = new RecordsRepository();
