import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSaveUserMutation, useUsersQuery } from '@/api/hooks';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export const UserManagementPage = () => {
  const { user } = useAuth();
  const { push } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VIEWER' as 'VIEWER' | 'ANALYST' | 'ADMIN',
  });

  const { data, isLoading } = useUsersQuery({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }, user?.role === 'ADMIN');
  const saveUser = useSaveUserMutation();

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const submitUser = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await saveUser.mutateAsync(form);
      push('User saved', 'success');
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'VIEWER' as 'VIEWER' | 'ANALYST' | 'ADMIN' });
    } catch {
      push('Unable to save user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Administration</p>
          <h2 className="text-3xl font-bold">User management</h2>
        </div>
        <Button onClick={() => setModalOpen(true)} type="button">
          Invite user
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((member) => (
                <tr key={member.id} className="border-t border-border/60">
                  <td className="py-4">{member.name}</td>
                  <td className="py-4">{member.email}</td>
                  <td className="py-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em]">{member.role}</span>
                  </td>
                  <td className="py-4">{member.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="py-4 text-right">
                    <Button
                      className="bg-white/10 text-ink"
                      onClick={() =>
                        void saveUser.mutateAsync({ id: member.id, isActive: !member.isActive }).then(
                          () => push('User status updated', 'success'),
                          () => push('Status update failed', 'error')
                        )
                      }
                      type="button"
                    >
                      Toggle status
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Invite user">
        <form className="grid gap-3" onSubmit={submitUser}>
          <Input placeholder="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          <Input placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
          <Input placeholder="Temporary password" type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
          <Select
            value={form.role}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, role: event.target.value as 'VIEWER' | 'ANALYST' | 'ADMIN' }))
            }
          >
            <option value="VIEWER">Viewer</option>
            <option value="ANALYST">Analyst</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Button disabled={saveUser.isPending} type="submit">
            {saveUser.isPending ? 'Saving...' : 'Save user'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
