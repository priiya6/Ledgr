import type { PropsWithChildren } from 'react';
import { Card } from './Card';

export const Modal = ({
  open,
  onClose,
  title,
  children,
}: PropsWithChildren<{ open: boolean; onClose: () => void; title: string }>) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-xl" >
        <div onClick={(event) => event.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <button className="text-sm text-muted" onClick={onClose} type="button">
              Close
            </button>
          </div>
          {children}
        </div>
      </Card>
    </div>
  );
};
