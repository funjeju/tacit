import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '광장',
  description: '다른 사람들이 만든 AI 주문서를 구경하고 복제해 보세요. 좋아요 순으로 정렬된 검증된 프롬프트 모음.',
  openGraph: {
    title: '광장 — 공개 AI 주문서 모음 | Tacit',
    description: '다른 전문가들이 만든 AI 주문서를 복제해 바로 사용해 보세요.',
    type: 'website',
  },
};

export default function SquareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
