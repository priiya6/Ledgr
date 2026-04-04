import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTimeSeriesQuery, useTopCategoriesQuery } from '@/api/hooks';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: timeSeries, isLoading: timeSeriesLoading } = useTimeSeriesQuery(
    {
      granularity,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    true
  );
  const { data: topCategories, isLoading: topCategoriesLoading } = useTopCategoriesQuery(5);

  if (user?.role === 'VIEWER') {
    return <Navigate to="/" replace />;
  }

  const chartRows =
    timeSeries?.reduce<Array<{ bucket: string; income: number; expense: number }>>((acc, row) => {
      const current = acc.find((item) => item.bucket === row.bucket) ?? (() => {
        const next = { bucket: row.bucket.slice(0, 10), income: 0, expense: 0 };
        acc.push(next);
        return next;
      })();
      if (row.type === 'INCOME') {
        current.income = row.total;
      } else {
        current.expense = row.total;
      }
      return acc;
    }, []) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Analytics</p>
        <h2 className="text-3xl font-bold">Trend and category analysis</h2>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={granularity} onChange={(event) => setGranularity(event.target.value as 'daily' | 'monthly')}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </Select>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="h-[360px]">
          <p className="mb-4 text-lg font-semibold">Time series</p>
          {timeSeriesLoading ? (
            <Skeleton className="h-[280px]" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="bucket" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line dataKey="income" stroke="#f6c343" strokeWidth={3} />
                <Line dataKey="expense" stroke="#2a9d8f" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card className="h-[360px]">
          <p className="mb-4 text-lg font-semibold">Top categories</p>
          {topCategoriesLoading ? (
            <Skeleton className="h-[280px]" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCategories ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" width={90} />
                <Tooltip />
                <Bar dataKey="total" fill="#f6c343" radius={[0, 12, 12, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};
