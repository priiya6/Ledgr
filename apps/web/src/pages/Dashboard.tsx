import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCategoryAnalyticsQuery, useSummaryQuery, useTimeSeriesQuery } from '@/api/hooks';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const palette = ['#f6c343', '#2a9d8f', '#e76f51', '#4c6ef5', '#8d99ae', '#ef476f'];

export const DashboardPage = () => {
  const { user } = useAuth();
  const canViewAdvancedAnalytics = user?.role === 'ANALYST' || user?.role === 'ADMIN';
  const { data: summary, isLoading: summaryLoading } = useSummaryQuery();
  const { data: categories, isLoading: categoriesLoading } = useCategoryAnalyticsQuery(canViewAdvancedAnalytics);
  const { data: timeSeries, isLoading: seriesLoading } = useTimeSeriesQuery(
    { granularity: 'monthly' },
    canViewAdvancedAnalytics
  );

  const chartData =
    timeSeries?.reduce<Array<{ bucket: string; income: number; expense: number }>>((acc, item) => {
      const found = acc.find((row) => row.bucket === item.bucket) ?? (() => {
        const next = { bucket: item.bucket.slice(0, 10), income: 0, expense: 0 };
        acc.push(next);
        return next;
      })();
      if (item.type === 'INCOME') {
        found.income = item.total;
      } else {
        found.expense = item.total;
      }
      return acc;
    }, []) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Overview</p>
          <h2 className="text-3xl font-bold">Financial command center</h2>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryLoading || !summary
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)
          : [
              { label: 'Total Income', value: formatCurrency(summary.totalIncome) },
              { label: 'Total Expenses', value: formatCurrency(summary.totalExpenses) },
              { label: 'Net Balance', value: formatCurrency(summary.netBalance) },
              { label: 'Records', value: summary.recordCount.toString() },
            ].map((item) => (
              <Card key={item.label}>
                <p className="text-sm text-muted">{item.label}</p>
                <p className="mt-5 text-3xl font-bold">{item.value}</p>
              </Card>
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="h-[360px]">
          <p className="mb-4 text-lg font-semibold">Income vs expenses</p>
          {!canViewAdvancedAnalytics ? (
            <p className="text-sm text-muted">Advanced trend analytics are available to analyst and admin roles.</p>
          ) : seriesLoading ? (
            <Skeleton className="h-[280px]" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
          <p className="mb-4 text-lg font-semibold">Spend by category</p>
          {!canViewAdvancedAnalytics ? (
            <p className="text-sm text-muted">Category analytics are available to analyst and admin roles.</p>
          ) : categoriesLoading ? (
            <Skeleton className="h-[280px]" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories ?? []} dataKey="total" nameKey="category" innerRadius={70} outerRadius={110}>
                  {(categories ?? []).map((entry, index) => (
                    <Cell key={entry.category} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};
