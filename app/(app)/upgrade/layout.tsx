import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pro 플랜',
  description: 'Tacit Pro 플랜으로 월 100회 AI 주문서 생성, 무제한 인터뷰, 도메인 프로필 3개 동시 활성을 이용하세요.',
  openGraph: {
    title: 'Tacit Pro 플랜 — 월 ₩9,900',
    description: '월 100회 AI 주문서 생성과 개인화 프로필로 전문가 수준 결과물을 만드세요.',
    type: 'website',
  },
};

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
