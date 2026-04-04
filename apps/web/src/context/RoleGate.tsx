import type { PropsWithChildren } from 'react';
import { useAuth } from './AuthContext';

export const RoleGate = ({
  roles,
  children,
}: PropsWithChildren<{ roles: Array<'VIEWER' | 'ANALYST' | 'ADMIN'> }>) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};
