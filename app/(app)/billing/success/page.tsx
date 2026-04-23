'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      return;
    }

    async function confirm() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/billing/confirm', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount!) }),
        });
        if (res.ok) {
          const data = await res.json();
          setExpiresAt(data.expiresAt);
          setStatus('success');
          // 3초 후 대시보드로 이동
          setTimeout(() => router.push('/dashboard'), 3000);
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    }

    confirm();
  }, [user, searchParams, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="size-10 text-accent animate-spin" />
        <p className="text-sm text-muted-foreground">결제를 확인하고 있어요...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <XCircle className="size-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">결제 처리 중 문제가 생겼어요</h1>
        <p className="text-sm text-muted-foreground mb-6">고객센터에 문의하거나 다시 시도해 주세요.</p>
        <Link
          href="/upgrade"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
        >
          다시 시도하기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-accent/10 mx-auto mb-4">
        <CheckCircle className="size-8 text-accent" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Pro 플랜 시작!</h1>
      <p className="text-sm text-muted-foreground mb-1">이제 월 100회 AI 주문서를 만들 수 있어요.</p>
      {expiresAt && (
        <p className="text-xs text-muted-foreground mb-6">
          {new Date(expiresAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지 이용 가능
        </p>
      )}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
        <Sparkles className="size-4 text-accent" />
        3초 후 대시보드로 이동합니다
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
      >
        대시보드로 바로 가기
      </Link>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}
