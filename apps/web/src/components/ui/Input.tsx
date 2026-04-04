import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'w-full rounded-2xl border border-border bg-slate-950/20 px-4 py-3 text-sm text-ink outline-none ring-0 placeholder:text-muted focus:border-accent',
      className
    )}
    {...props}
  />
);
