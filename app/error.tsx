'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-6xl font-black text-muted-foreground/20">⚠️</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">문제가 생겼어요</h1>
      <p className="text-muted-foreground text-sm mb-8 max-w-xs">
        예상치 못한 오류가 발생했어요. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
        >
          <RefreshCw className="size-4" />
          다시 시도
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Home className="size-4" />
          홈으로
        </Link>
      </div>
    </div>
  );
}
