import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { ThemeToggle } from '@/components/ThemeToggle';

export const LoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const { push } = useToast();
  const [email, setEmail] = useState('admin@finance.dev');
  const [password, setPassword] = useState('Admin@1234');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      push('Signed in successfully', 'success');
    } catch {
      push('Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.9fr]">
        <Card className="overflow-hidden bg-gradient-to-br from-accent/30 via-panel to-panel">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.35em] text-muted">Finance Data Processing</p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight">
              Access-controlled finance operations with one dashboard for records, analytics, and audit visibility.
            </h1>
            <p className="max-w-lg text-sm text-muted">
              This interface is designed for operations teams that need clear metrics, traceable changes, and backend-enforced permissions.
            </p>
          </div>
        </Card>
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-muted">Access tokens stay in memory. Refresh tokens stay in secure cookies.</p>
            </div>
            <Input onChange={(event) => setEmail(event.target.value)} placeholder="Email" value={email} />
            <Input onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" value={password} />
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
