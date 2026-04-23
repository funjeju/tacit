'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options: { value: 'light' | 'dark' | 'system'; label: string; Icon: typeof Sun }[] = [
    { value: 'light', label: '밝게', Icon: Sun },
    { value: 'dark', label: '어둡게', Icon: Moon },
    { value: 'system', label: '시스템', Icon: Monitor },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={`테마: ${label}`}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors touch-target
            ${theme === value
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Icon className="size-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
