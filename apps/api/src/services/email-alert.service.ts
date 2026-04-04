import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { prisma } from '../config';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class EmailAlertService {
  private readonly transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });

  start() {
    if (!env.INTEGRATIONS_ENABLED) {
      return;
    }

    cron.schedule('0 0 * * *', () => {
      void this.checkMonthlyExpenseThreshold();
    });
  }

  async checkMonthlyExpenseThreshold() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const result = await prisma.financialRecord.aggregate({
      where: {
        type: 'EXPENSE',
        isDeleted: false,
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    });

    const totalExpenses = Number(result._sum.amount ?? 0);
    if (totalExpenses <= env.ALERT_EXPENSE_THRESHOLD) {
      return;
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { email: true },
    });

    if (admins.length === 0) {
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.SMTP_USER || 'alerts@finance.dev',
        to: admins.map((admin: (typeof admins)[number]) => admin.email).join(','),
        subject: 'Monthly expense threshold exceeded',
        text: `Monthly expenses reached ${totalExpenses.toFixed(2)} which is above ${env.ALERT_EXPENSE_THRESHOLD}.`,
      });
    } catch (error) {
      logger.warn('Email alert failed', { error });
    }
  }
}

export const emailAlertService = new EmailAlertService();
