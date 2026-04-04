import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../../src/modules/users/users.service';
import { AppError } from '../../src/utils/errors';

vi.mock('../../src/services/audit.service', () => ({
  auditService: {
    logMutation: vi.fn(),
  },
}));

describe('UsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cannot deactivate self', async () => {
    const service = new UsersService({
      findById: vi.fn().mockResolvedValue({
        id: 'user-1',
        email: 'admin@finance.dev',
        passwordHash: 'hash',
        role: 'ADMIN',
        isActive: true,
      }),
      countActiveAdmins: vi.fn().mockResolvedValue(2),
      update: vi.fn(),
    } as any);

    await expect(service.deactivate('user-1', 'user-1')).rejects.toBeInstanceOf(AppError);
  });

  it('cannot change own role', async () => {
    const service = new UsersService({
      findById: vi.fn().mockResolvedValue({
        id: 'user-1',
        email: 'admin@finance.dev',
        passwordHash: 'hash',
        role: 'ADMIN',
        isActive: true,
      }),
      findByEmail: vi.fn().mockResolvedValue(null),
      countActiveAdmins: vi.fn().mockResolvedValue(2),
      update: vi.fn(),
    } as any);

    await expect(service.update('user-1', { role: 'VIEWER' }, 'user-1')).rejects.toBeInstanceOf(AppError);
  });
});
