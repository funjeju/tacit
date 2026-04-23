'use client';

import { useToastStore } from '@/lib/stores/useToastStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle className="size-4 text-success shrink-0" />,
  error: <XCircle className="size-4 text-destructive shrink-0" />,
  info: <Info className="size-4 text-accent shrink-0" />,
};

const BG = {
  success: 'border-success/30 bg-success/10',
  error: 'border-destructive/30 bg-destructive/10',
  info: 'border-accent/30 bg-accent/10',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 sm:right-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur max-w-sm animate-slide-up ${BG[t.type]}`}
        >
          {ICONS[t.type]}
          <p className="flex-1 text-sm font-medium text-foreground">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
