export const Skeleton = ({ className = 'h-24 w-full' }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-200/10 ${className}`} />
);
