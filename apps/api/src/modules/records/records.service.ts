import type {
  CreateRecordInput,
  RecordConvertQueryInput,
  RecordExportQueryInput,
  RecordQueryInput,
  UpdateRecordInput,
} from '@ledgr/shared';
import Papa from 'papaparse';
import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { auditService } from '../../services/audit.service';
import { cacheService } from '../../services/cache.service';
import { exchangeRateService } from '../../services/exchange-rate.service';
import { AppError, getPagination } from '../../utils';
import { recordsRepository, RecordsRepository } from './records.repository';

export class RecordService {
  constructor(private readonly repository: RecordsRepository = recordsRepository) {}

  private validateRules(input: Partial<CreateRecordInput | UpdateRecordInput>) {
    if (input.amount !== undefined && input.amount <= 0) {
      throw AppError.badRequest('Amount must be greater than 0');
    }

    if (!env.ALLOW_FUTURE_RECORD_DATE && input.date && input.date > new Date()) {
      throw AppError.badRequest('Date cannot be in the future');
    }
  }

  private normalizeCategory(category?: string) {
    return category ? category.trim().toLowerCase() : undefined;
  }

  private where(query?: Partial<RecordQueryInput>, requester?: { userId: string; role: string }) {
    return {
      isDeleted: false,
      ...(query?.type ? { type: query.type } : {}),
      ...(query?.category ? { category: this.normalizeCategory(query.category) } : {}),
      ...(query?.dateFrom || query?.dateTo
        ? {
            date: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
      ...(query?.search
        ? {
            OR: [
              { category: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(requester?.role === 'VIEWER' ? { createdBy: requester.userId } : {}),
    };
  }

  async list(query: RecordQueryInput, requester: { userId: string; role: string }) {
    const where = this.where(query, requester);
    const [items, total] = await Promise.all([
      this.repository.list({
        where,
        include: {
          creator: {
            select: { id: true, email: true, name: true, role: true },
          },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        ...getPagination(query),
      }),
      this.repository.count(where),
    ]);

    return { items, total };
  }

  async getById(id: string, requester: { userId: string; role: string }) {
    const record = await this.repository.findById(id);
    if (!record || record.isDeleted) {
      throw AppError.notFound('Record not found');
    }

    if (requester.role === 'VIEWER' && record.createdBy !== requester.userId) {
      throw AppError.forbidden('You do not have permission to access this record');
    }

    return record;
  }

  async create(input: CreateRecordInput, actorUserId: string) {
    this.validateRules(input);
    const record = await this.repository.create({
      type: input.type,
      amount: new Prisma.Decimal(input.amount),
      category: this.normalizeCategory(input.category)!,
      description: input.description ?? null,
      date: input.date,
      createdBy: actorUserId,
    });

    auditService.logMutation({
      userId: actorUserId,
      action: 'CREATE_RECORD',
      entityType: 'FinancialRecord',
      entityId: record.id,
      metadata: { amount: Number(record.amount), category: record.category },
    });

    await cacheService.delByPattern('analytics:*');
    return record;
  }

  async update(id: string, input: UpdateRecordInput, actorUserId: string) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.isDeleted) {
      throw AppError.notFound('Record not found');
    }

    this.validateRules(input);
    const record = await this.repository.update(id, {
      ...(input.type ? { type: input.type } : {}),
      ...(input.amount !== undefined ? { amount: new Prisma.Decimal(input.amount) } : {}),
      ...(input.category ? { category: this.normalizeCategory(input.category) } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.date ? { date: input.date } : {}),
    });

    auditService.logMutation({
      userId: actorUserId,
      action: 'UPDATE_RECORD',
      entityType: 'FinancialRecord',
      entityId: id,
      metadata: input as Prisma.InputJsonValue,
    });

    await cacheService.delByPattern('analytics:*');
    return record;
  }

  async remove(id: string, actorUserId: string) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.isDeleted) {
      throw AppError.notFound('Record not found');
    }

    await this.repository.update(id, { isDeleted: true, deletedAt: new Date() });
    auditService.logMutation({
      userId: actorUserId,
      action: 'DELETE_RECORD',
      entityType: 'FinancialRecord',
      entityId: id,
    });

    await cacheService.delByPattern('analytics:*');
  }

  async export(query: RecordExportQueryInput, requester: { userId: string; role: string }, res: Response) {
    const records = await this.repository.list({
      where: this.where(query as Partial<RecordQueryInput>, requester),
      orderBy: { date: 'desc' },
    });

    const rows = records.map((record: (typeof records)[number]) => ({
      id: record.id,
      type: record.type,
      amount: Number(record.amount),
      category: record.category,
      description: record.description ?? '',
      date: record.date.toISOString(),
    }));

    if (query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="records.csv"');
      res.write(Papa.unparse(rows));
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="records.pdf"');
    const doc = new PDFDocument({ margin: 32 });
    doc.pipe(res);
    doc.fontSize(18).text('Records Export');
    doc.moveDown();
    rows.forEach((row: (typeof rows)[number]) => {
      doc.fontSize(10).text(`${row.date} | ${row.type} | ${row.category} | ${row.amount.toFixed(2)} | ${row.description}`);
    });
    doc.end();
  }

  convert(query: RecordConvertQueryInput) {
    return exchangeRateService.convert(query.amount, query.from, query.to);
  }
}

export const recordService = new RecordService();
