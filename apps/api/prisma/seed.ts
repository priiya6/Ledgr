import bcrypt from 'bcryptjs';
import { PrismaClient, RecordType, Role } from '@prisma/client';

const prisma = new PrismaClient();

const seedUsers = [
  { email: 'admin@finance.dev', name: 'Admin User', password: 'Admin@1234', role: Role.ADMIN },
  { email: 'analyst1@finance.dev', name: 'Analyst One', password: 'Analyst@1234', role: Role.ANALYST },
  { email: 'analyst2@finance.dev', name: 'Analyst Two', password: 'Analyst@1234', role: Role.ANALYST },
  { email: 'viewer1@finance.dev', name: 'Viewer One', password: 'Viewer@1234', role: Role.VIEWER },
  { email: 'viewer2@finance.dev', name: 'Viewer Two', password: 'Viewer@1234', role: Role.VIEWER },
  { email: 'viewer3@finance.dev', name: 'Viewer Three', password: 'Viewer@1234', role: Role.VIEWER },
] as const;

const categories = ['Salary', 'Rent', 'Utilities', 'Marketing', 'Sales', 'Equipment', 'Travel', 'Consulting'];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  const users: Array<{ id: string }> = [];

  for (const seedUser of seedUsers) {
    const passwordHash = await bcrypt.hash(seedUser.password, 12);
    users.push(
      await prisma.user.create({
        data: {
          email: seedUser.email,
          name: seedUser.name,
          passwordHash,
          role: seedUser.role,
        },
      })
    );
  }

  const now = new Date();
  const records = Array.from({ length: 50 }).map((_, index) => {
    const recordDate = new Date(now);
    recordDate.setDate(now.getDate() - index * 3);
    const type = index % 3 === 0 ? RecordType.INCOME : RecordType.EXPENSE;
    const creator = users[index % users.length]!;

    return {
      type,
      amount: (index + 1) * (type === RecordType.INCOME ? 950 : 315),
      category: categories[index % categories.length]!.toLowerCase(),
      description: `${type.toLowerCase()} seed record ${index + 1}`,
      date: recordDate,
      createdBy: creator.id,
    };
  });

  await prisma.financialRecord.createMany({ data: records });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
