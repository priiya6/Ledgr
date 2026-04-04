import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('rounded-[28px] border border-border/60 bg-panel/90 p-5 shadow-panel backdrop-blur', className)}>
    {children}
  </div>
);
