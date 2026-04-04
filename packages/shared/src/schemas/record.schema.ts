import { z } from 'zod';
import { paginationQuerySchema } from './user.schema';

export const recordTypeEnum = z.enum(['INCOME', 'EXPENSE']);
export type RecordType = z.infer<typeof recordTypeEnum>;

export const baseRecordBodySchema = z.object({
  type: recordTypeEnum,
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().max(500).nullable().optional(),
  date: z.coerce.date(),
});

export const createRecordSchema = baseRecordBodySchema;

export const updateRecordSchema = baseRecordBodySchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

export const recordQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['date', 'amount', 'category', 'type', 'createdAt']).default('date'),
  type: recordTypeEnum.optional(),
  category: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const recordIdParamSchema = z.object({
  id: z.string().uuid('Invalid record ID'),
});

export const recordExportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const recordConvertQuerySchema = z.object({
  amount: z.coerce.number().positive(),
  from: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  to: z.string().trim().length(3).transform((value) => value.toUpperCase()),
});

export const analyticsSummarySchema = z.object({
  totalIncome: z.number(),
  totalExpenses: z.number(),
  netBalance: z.number(),
  recordCount: z.number(),
});

export const analyticsQuerySchema = z.object({
  granularity: z.enum(['daily', 'monthly']).default('monthly'),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const topCategoriesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).default(5),
});

export const auditLogQuerySchema = paginationQuerySchema.pick({
  page: true,
  limit: true,
  sortOrder: true,
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordQueryInput = z.infer<typeof recordQuerySchema>;
export type RecordExportQueryInput = z.infer<typeof recordExportQuerySchema>;
export type RecordConvertQueryInput = z.infer<typeof recordConvertQuerySchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type TopCategoriesQueryInput = z.infer<typeof topCategoriesQuerySchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
