'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import Link from 'next/link';
import {
  Sparkles,
  Check,
  Loader2,
  Zap,
  Brain,
  BarChart3,
  Shield,
} from 'lucide-react';

const FREE_FEATURES = [
  '월 10회 AI 주문서 생성',
  '서재 저장',
  '암묵지 인터뷰 1회',
  '광장 열람 및 복제',
];

const PRO_FEATURES = [
  '월 100회 AI 주문서 생성',
  '서재 저장 무제한',
  '암묵지 인터뷰 무제한',
  '도메인 프로필 3개 동시 활성',
  '프로필 기반 고품질 주문서',
  '우선 고객 지원',
];

export default function UpgradePage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [proExpires, setProExpires] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/upgrade');
  }, [user, loading, router]);

  // 현재 플랜 확인
  useEffect(() => {
    if (!user) return;
    async function checkPlan() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.plan === 'pro' && data.user?.planExpiresAt) {
            setIsPro(true);
            setProExpires(data.user.planExpiresAt);
          }
        }
      } catch {
        // ignore
      }
    }
    checkPlan();
  }, [user]);

  async function handleUpgrade() {
    if (!user || paying) return;
    setPaying(true);
    setError(null);
    try {
      const token = await user.getIdToken();

      // 주문 생성
      const checkoutRes = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!checkoutRes.ok) {
        const d = await checkoutRes.json();
        setError(d.error ?? '결제 준비에 실패했어요.');
        return;
      }
      const { orderId, amount, orderName, clientKey } = await checkoutRes.json();

      // 토스페이먼츠 SDK v2 동적 로드
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: user.uid });

      // 결제창 오픈
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: amount },
        orderId,
        orderName,
        successUrl: `${window.location.origin}/billing/success`,
        failUrl: `${window.location.origin}/upgrade?error=payment_failed`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (!msg.includes('PAY_PROCESS_CANCELED')) {
        setError('결제 중 오류가 발생했어요. 다시 시도해 주세요.');
      }
    } finally {
      setPaying(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
      {/* 헤더 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-4">
          <Sparkles className="size-3.5" />
          Pro 플랜
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          더 많이 쓸수록<br />더 좋아집니다
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Pro 플랜으로 월 100회 AI 주문서를 만들고<br />
          나만의 도메인 프로필로 품질을 높이세요.
        </p>
      </div>

      {isPro ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
          <Sparkles className="size-10 text-accent mx-auto mb-3" />
          <p className="text-lg font-bold text-foreground mb-1">Pro 플랜 이용 중이에요</p>
          {proExpires && (
            <p className="text-sm text-muted-foreground">
              {new Date(proExpires).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지 유효
            </p>
          )}
          <Link
            href="/settings/billing"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            구독 관리 →
          </Link>
        </div>
      ) : (
        <>
          {/* 플랜 비교 */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {/* Free */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold text-muted-foreground mb-1">무료</p>
              <p className="text-3xl font-bold text-foreground mb-4">₩0</p>
              <ul className="space-y-2">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="size-4 mt-0.5 shrink-0 text-muted-foreground/50" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-accent bg-accent/5 p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                추천
              </div>
              <p className="text-sm font-semibold text-accent mb-1">Pro</p>
              <div className="flex items-baseline gap-1 mb-4">
                <p className="text-3xl font-bold text-foreground">₩9,900</p>
                <span className="text-sm text-muted-foreground">/월</span>
              </div>
              <ul className="space-y-2">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="size-4 mt-0.5 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 특징 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Zap, label: '10배 더 많은 생성' },
              { icon: Brain, label: '개인화 프로필' },
              { icon: BarChart3, label: '사용량 통계' },
              { icon: Shield, label: '우선 지원' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                <Icon className="size-5 text-accent mx-auto mb-1.5" />
                <p className="text-xs font-medium text-foreground">{label}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={paying}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-base font-bold text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {paying ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <><Sparkles className="size-5" />Pro로 업그레이드 — ₩9,900/월</>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            결제 즉시 활성화 · 30일 이용 · 자동 갱신 없음
          </p>
        </>
      )}
    </div>
  );
}
