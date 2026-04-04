import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

interface ToastItem {
  id: number;
  title: string;
  tone: 'success' | 'error';
}

const ToastContext = createContext<{ push: (title: string, tone: 'success' | 'error') => void } | undefined>(undefined);

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = (title: string, tone: 'success' | 'error') => {
    const id = Date.now();
    setItems((prev) => [...prev, { id, title, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 2500);
  };

  const value = useMemo(() => ({ push }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl px-4 py-3 text-sm shadow-panel ${item.tone === 'success' ? 'bg-success text-slate-950' : 'bg-danger text-white'}`}
          >
            {item.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
