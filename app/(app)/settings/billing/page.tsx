'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { Sparkles, Loader2, CheckCircle, ArrowLeft, CreditCard } from 'lucide-react';

interface PlanInfo {
  plan: 'free' | 'pro';
  planExpiresAt: string | null;
  usageThisMonth: number;
  limit: number;
}

export default function BillingSettingsPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [info, setInfo] = useState<PlanInfo | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/settings/billing');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const u = data.user ?? {};
          const isPro = u.plan === 'pro' && u.planExpiresAt && new Date(u.planExpiresAt) > new Date();
          setInfo({
            plan: isPro ? 'pro' : 'free',
            planExpiresAt: u.planExpiresAt ?? null,
            usageThisMonth: data.usageThisMonth ?? 0,
            limit: isPro ? 100 : 10,
          });
        }
      } catch {
        // ignore
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">구독 관리</h1>
          <p className="text-sm text-muted-foreground">현재 플랜과 사용량을 확인하세요</p>
        </div>
      </div>

      {fetching ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 text-accent animate-spin" />
        </div>
      ) : info ? (
        <div className="space-y-4">
          {/* 현재 플랜 */}
          <div className={`rounded-2xl border p-6 ${
            info.plan === 'pro'
              ? 'border-accent/30 bg-accent/5'
              : 'border-border bg-card'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {info.plan === 'pro' ? (
                  <Sparkles className="size-5 text-accent" />
                ) : (
                  <CreditCard className="size-5 text-muted-foreground" />
                )}
                <span className="font-bold text-foreground">
                  {info.plan === 'pro' ? 'Pro 플랜' : '무료 플랜'}
                </span>
              </div>
              {info.plan === 'pro' && (
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                  활성
                </span>
              )}
            </div>

            {info.plan === 'pro' && info.planExpiresAt && (
              <p className="text-sm text-muted-foreground mb-4">
                {new Date(info.planExpiresAt).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}까지 이용 가능
              </p>
            )}

            {/* 사용량 */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">이번 달 사용량</span>
                <span className="font-semibold text-foreground">
                  {info.usageThisMonth} / {info.limit}회
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${
                    info.usageThisMonth >= info.limit
                      ? 'bg-destructive'
                      : info.usageThisMonth >= info.limit * 0.8
                      ? 'bg-amber-500'
                      : 'bg-accent'
                  }`}
                  style={{ width: `${Math.min(100, (info.usageThisMonth / info.limit) * 100)}%` }}
                />
              </div>
            </div>

            {info.plan === 'free' ? (
              <Link
                href="/upgrade"
                className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                <Sparkles className="size-4" />
                Pro로 업그레이드 — ₩9,900/월
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="size-4" />
                월 100회 생성 이용 가능
              </div>
            )}
          </div>

          {/* Pro 혜택 안내 */}
          {info.plan === 'free' && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground mb-3">Pro 플랜 혜택</p>
              <ul className="space-y-2">
                {[
                  '월 100회 AI 주문서 생성 (10배)',
                  '암묵지 인터뷰 무제한',
                  '도메인 프로필 3개 동시 활성',
                  '우선 고객 지원',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="size-3.5 text-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground pt-2">
            결제 문의: support@tacit.app · 자동 갱신 없음
          </p>
        </div>
      ) : null}
    </div>
  );
}
