import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '요금제',
  description: 'Tacit 무료/Pro 요금제 비교. 월 ₩9,900으로 월 100회 AI 주문서, 무제한 인터뷰, 도메인 프로필 3개를 이용하세요.',
  openGraph: {
    title: '요금제 | Tacit',
    description: '월 ₩9,900 Pro 플랜으로 전문가 수준 결과물을 무제한으로.',
    type: 'website',
  },
};

const FREE_FEATURES = [
  '월 10회 AI 주문서 생성',
  '인터뷰 세션 (월 3회)',
  '서재 저장 (최대 10개)',
  '광장 공개 및 복제',
];

const PRO_FEATURES = [
  '월 100회 AI 주문서 생성',
  '무제한 인터뷰 세션',
  '서재 무제한 저장',
  '도메인 프로필 3개 동시 활성',
  '광장 공개 및 복제',
  '우선 지원',
];

export default function PricingPage() {
  return (
    <div className="py-20 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">심플한 요금제</h1>
          <p className="mt-4 text-lg text-muted-foreground">무료로 시작하고, 더 필요할 때 업그레이드하세요</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-8">
            <div className="mb-6">
              <div className="text-lg font-semibold text-muted-foreground">무료</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-foreground">₩0</span>
                <span className="text-muted-foreground">/ 월</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">가입만 하면 바로 시작</p>
            </div>
            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                  <Check className="size-4 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/login"
              className="mt-8 block rounded-xl border border-border py-3 text-center text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              무료로 시작하기
            </Link>
          </div>

          {/* Pro */}
          <div className="flex flex-col rounded-2xl border-2 border-accent bg-card p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-accent px-4 py-1 text-sm font-semibold text-accent-foreground">
                추천
              </span>
            </div>
            <div className="mb-6">
              <div className="text-lg font-semibold text-accent">Pro</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-foreground">₩9,900</span>
                <span className="text-muted-foreground">/ 월</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">커피 두 잔 값으로 전문가 수준 결과물</p>
            </div>
            <ul className="space-y-3 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                  <Check className="size-4 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/upgrade"
              className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
            >
              Pro 시작하기
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다. 언제든지 해지 가능.
        </p>
      </div>
    </div>
  );
}
