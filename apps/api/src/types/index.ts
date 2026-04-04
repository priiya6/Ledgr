import type { AppRole } from '@ledgr/shared';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: AppRole;
}
