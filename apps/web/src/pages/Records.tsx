import { FormEvent, useMemo, useState } from 'react';
import { useDeleteRecordMutation, useRecordsQuery, useSaveRecordMutation } from '@/api/hooks';
import { RoleGate } from '@/context/RoleGate';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

const emptyForm = {
  type: 'EXPENSE',
  amount: '',
  category: '',
  description: '',
  date: '',
};

export const RecordsPage = () => {
  const { push } = useToast();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    sortOrder: 'desc',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      sortBy: 'date',
      sortOrder: filters.sortOrder,
      search: filters.search || undefined,
      type: filters.type || undefined,
      category: filters.category || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }),
    [page, filters]
  );

  const { data, isLoading } = useRecordsQuery(params);
  const saveRecord = useSaveRecordMutation();
  const deleteRecord = useDeleteRecordMutation();

  const submitRecord = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await saveRecord.mutateAsync({
        id: editingId ?? undefined,
        type: form.type as 'INCOME' | 'EXPENSE',
        amount: Number(form.amount),
        category: form.category,
        description: form.description,
        date: form.date,
      });
      push(`Record ${editingId ? 'updated' : 'created'}`, 'success');
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch {
      push('Unable to save record', 'error');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Records</p>
          <h2 className="text-3xl font-bold">Financial records</h2>
        </div>
        <RoleGate roles={['ADMIN']}>
          <Button onClick={openCreate} type="button">
            New record
          </Button>
        </RoleGate>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-6">
          <Input placeholder="Search" value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} />
          <Select value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}>
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </Select>
          <Input placeholder="Category" value={filters.category} onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))} />
          <Input
            aria-label="Start Date"
            placeholder="Start Date"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
          />
          <Input
            aria-label="End Date"
            placeholder="End Date"
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
          />
          <Select value={filters.sortOrder} onChange={(event) => setFilters((prev) => ({ ...prev, sortOrder: event.target.value }))}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </Select>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((record) => (
                  <tr key={record.id} className="border-t border-border/60">
                    <td className="py-4">{formatDate(record.date)}</td>
                    <td className="py-4">{record.type}</td>
                    <td className="py-4">{record.category}</td>
                    <td className="py-4">{record.description ?? '-'}</td>
                    <td className="py-4">{formatCurrency(Number(record.amount))}</td>
                    <td className="py-4 text-right">
                      <RoleGate roles={['ADMIN']}>
                        <div className="flex justify-end gap-2">
                          <Button
                            className="bg-white/10 text-ink"
                            onClick={() => {
                              setEditingId(record.id);
                              setForm({
                                type: record.type,
                                amount: String(record.amount),
                                category: record.category,
                                description: record.description ?? '',
                                date: record.date.slice(0, 10),
                              });
                              setModalOpen(true);
                            }}
                            type="button"
                          >
                            Edit
                          </Button>
                          <Button
                            className="bg-danger text-white"
                            onClick={() =>
                              void deleteRecord.mutateAsync(record.id).then(
                                () => push('Record deleted', 'success'),
                                () => push('Delete failed', 'error')
                              )
                            }
                            type="button"
                          >
                            Delete
                          </Button>
                        </div>
                      </RoleGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            Page {data?.meta?.page ?? page} of {Math.max(1, Math.ceil((data?.meta?.total ?? 1) / (data?.meta?.limit ?? 10)))}
          </span>
          <div className="flex gap-2">
            <Button className="bg-white/10 text-ink" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} type="button">
              Previous
            </Button>
            <Button
              className="bg-white/10 text-ink"
              disabled={Boolean(data?.meta && page * (data.meta.limit ?? 10) >= (data.meta.total ?? 0))}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit record' : 'Create record'}>
        <form className="grid gap-3" onSubmit={submitRecord}>
          <Select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </Select>
          <Input placeholder="Amount" type="number" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} />
          <Input placeholder="Category" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
          <Input placeholder="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
          <Input type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
          <Button disabled={saveRecord.isPending} type="submit">
            {saveRecord.isPending ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
