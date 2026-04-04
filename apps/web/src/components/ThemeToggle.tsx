import { useEffect, useState } from 'react';
import { Button } from './ui/Button';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('ledgr-theme') as 'light' | 'dark' | null) ?? 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('ledgr-theme', theme);
  }, [theme]);

  return (
    <Button
      className="bg-white/10 text-ink"
      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      type="button"
    >
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </Button>
  );
};
