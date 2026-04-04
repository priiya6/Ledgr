import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Select = ({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn('w-full rounded-2xl border border-border bg-slate-950/20 px-4 py-3 text-sm text-ink outline-none focus:border-accent', className)}
    {...props}
  >
    {children}
  </select>
);
