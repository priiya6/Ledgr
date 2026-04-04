import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Button = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
);
