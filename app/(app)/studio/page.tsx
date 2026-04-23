import { Suspense } from 'react';
import Link from 'next/link';
import {
  ImageIcon,
  FileText,
  Video,
  Presentation,
  Code2,
  Music,
  ArrowRight,
  UtensilsCrossed,
  GraduationCap,
  Home,
  ChevronRight,
} from 'lucide-react';
import type { OutputType, DomainId } from '@/types';

const OUTPUT_TYPES: Array<{
  type: OutputType;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
  examples: string[];
}> = [
  {
    type: 'image',
    label: '이미지',
    desc: '포스터·SNS·광고 이미지',
    Icon: ImageIcon,
    examples: ['신메뉴 포스터', '인스타그램 피드', '이벤트 배너'],
  },
  {
    type: 'report',
    label: '보고서/문서',
    desc: '리포트·공문·안내·답글',
    Icon: FileText,
    examples: ['리뷰 답글', '학부모 알림장', '매물 소개글'],
  },
  {
    type: 'video',
    label: '영상',
    desc: 'SNS 클립·광고영상',
    Icon: Video,
    examples: ['가게 홍보 영상', '수업 소개 클립', '매물 투어 영상'],
  },
  {
    type: 'ppt',
    label: '발표자료',
    desc: '슬라이드·제안서',
    Icon: Presentation,
    examples: ['수업용 슬라이드', '사업 제안서', '이벤트 기획서'],
  },
  {
    type: 'code',
    label: '코드',
    desc: '자동화·홈페이지',
    Icon: Code2,
    examples: ['예약 폼 만들기', '엑셀 자동화', '간단한 홈페이지'],
  },
  {
    type: 'music',
    label: '음악',
    desc: '매장 BGM·광고 음악',
    Icon: Music,
    examples: ['카페 분위기 BGM', '광고 징글', '행사 음악'],
  },
];

const DOMAINS: Array<{
  id: DomainId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'restaurant', label: '식당 사장', Icon: UtensilsCrossed },
  { id: 'education', label: '선생님', Icon: GraduationCap },
  { id: 'real_estate', label: '공인중개사', Icon: Home },
];

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="font-bold text-lg text-foreground">Tacit</Link>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">홈</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">AI 주문서 만들기</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-16">
        {/* 내 직업이 있다면 */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-accent"></span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">
              내 직업 맞춤 질문으로 시작
            </h2>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            어떤 분이세요?
          </h1>
          <p className="text-muted-foreground mb-6">
            업종을 선택하면 딱 맞는 질문으로 바로 시작돼요.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {DOMAINS.map(({ id, label, Icon }) => (
              <Link
                key={id}
                href={`/studio/${id}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 sm:p-6 hover:border-accent/50 hover:shadow-md transition-all text-center"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Icon className="size-6 text-accent" />
                </div>
                <span className="font-semibold text-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 구분선 */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-sm text-muted-foreground">또는 원하는 결과물 유형으로</span>
          </div>
        </div>

        {/* 결과물 유형 선택 */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            무엇을 만들고 싶으세요?
          </h2>
          <p className="text-muted-foreground mb-6">
            결과물 종류를 선택하면 최적의 질문을 드려요.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OUTPUT_TYPES.map(({ type, label, desc, Icon, examples }) => (
              <Link
                key={type}
                href={`/studio/create?type=${type}`}
                className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 hover:border-accent/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted group-hover:bg-accent/10 transition-colors">
                    <Icon className="size-5 text-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {examples.map((ex) => (
                    <span
                      key={ex}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
                <ArrowRight className="absolute right-4 top-4 size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
