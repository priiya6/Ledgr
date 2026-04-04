import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';

const navigation = [
  { to: '/', label: 'Dashboard', roles: ['VIEWER', 'ANALYST', 'ADMIN'] },
  { to: '/records', label: 'Records', roles: ['VIEWER', 'ANALYST', 'ADMIN'] },
  { to: '/analytics', label: 'Analytics', roles: ['ANALYST', 'ADMIN'] },
  { to: '/users', label: 'Users', roles: ['ADMIN'] },
] as const;

export const AppShell = () => {
  const location = useLocation();
  const { isAuthenticated, isReady, logout, user } = useAuth();

  if (!isReady) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 flex-col justify-between rounded-[32px] border border-border bg-panel/95 p-5 shadow-panel lg:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Ledgr</p>
            <h1 className="mt-3 text-2xl font-bold">Finance Control</h1>
            <div className="mt-8 space-y-2">
              {navigation
                .filter((item) => (item.roles as unknown as Array<'VIEWER' | 'ANALYST' | 'ADMIN'>).includes(user?.role ?? 'VIEWER'))
                .map((item) => (
                  <Link
                    key={item.to}
                    className={cn(
                      'block rounded-2xl px-4 py-3 text-sm transition',
                      location.pathname === item.to ? 'bg-accent text-slate-950' : 'text-muted hover:bg-white/5 hover:text-ink'
                    )}
                    to={item.to}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted">{user?.role}</div>
            </div>
            <Button className="w-full" onClick={() => void logout()} type="button">
              Logout
            </Button>
          </div>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
