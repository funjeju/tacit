import Link from 'next/link';
import {
  UtensilsCrossed,
  GraduationCap,
  Home,
  Image as ImageIcon,
  FileText,
  Video,
  Presentation,
  Code2,
  Music,
  ArrowRight,
  Star,
  Users,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const OUTPUT_TYPES = [
  { type: 'image', label: '이미지', desc: '포스터·SNS 사진', Icon: ImageIcon, color: 'text-amber-500' },
  { type: 'report', label: '보고서/문서', desc: '리포트·공문·안내문', Icon: FileText, color: 'text-primary' },
  { type: 'video', label: '영상', desc: 'SNS 클립·광고영상', Icon: Video, color: 'text-info' },
  { type: 'ppt', label: '발표자료', desc: '슬라이드·제안서', Icon: Presentation, color: 'text-secondary' },
  { type: 'code', label: '코드', desc: '자동화·홈페이지', Icon: Code2, color: 'text-success' },
  { type: 'music', label: '음악', desc: '매장 BGM·광고 음악', Icon: Music, color: 'text-warning' },
] as const;

const DOMAINS = [
  { id: 'restaurant', label: '식당 사장님', Icon: UtensilsCrossed, desc: '메뉴 홍보, 리뷰 답글, 인스타 피드' },
  { id: 'education', label: '선생님', Icon: GraduationCap, desc: '수업 자료, 학부모 소통, 평가 문항' },
  { id: 'real_estate', label: '공인중개사', Icon: Home, desc: '매물 설명, 고객 응대, 시장 분석' },
];

const STATS = [
  { label: '저장된 AI 주문서', value: '12,000+', Icon: Sparkles },
  { label: '활성 사용자', value: '3,800+', Icon: Users },
  { label: '평균 만족도', value: '4.8 / 5', Icon: Star },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground tracking-tight">Tacit</span>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Beta</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/studio" className="hover:text-foreground transition-colors">AI 주문서 만들기</Link>
            <Link href="/square" className="hover:text-foreground transition-colors">광장</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">요금</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/studio"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors touch-target flex items-center"
            >
              무료로 시작
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── 히어로 ── */}
        <section className="relative overflow-hidden gradient-hero py-20 sm:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
              AI 인터뷰어 · 프롬프트 모르셔도 됩니다
            </p>
            <h1 className="text-4xl font-bold text-balance text-foreground sm:text-5xl lg:text-6xl leading-tight">
              당신의 30년 경험을<br />
              <span className="text-accent">AI가 끌어내</span> 자산으로
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              식당 사장님, 선생님, 공인중개사님 —
              <br className="hidden sm:inline" />
              AI 주문서(프롬프트) 몰라도 됩니다.
              <strong className="text-foreground"> 질문에 답하기만 하면</strong> Tacit이 대신 만들어 드려요.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/studio"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 text-base font-semibold text-accent-foreground hover:bg-accent-hover transition-colors touch-target"
              >
                지금 바로 만들어보기
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/studio?domain=restaurant"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 py-4 text-base font-medium text-foreground hover:bg-muted transition-colors touch-target"
              >
                식당 사장 예시 보기
              </Link>
            </div>
          </div>
        </section>

        {/* ── 통계 ── */}
        <section className="border-y border-border bg-muted/40 py-8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              {STATS.map(({ label, value, Icon }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <Icon className="size-5 text-accent mb-1" />
                  <div className="text-2xl font-bold text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 무엇을 만들 수 있나요? ── */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">무엇을 만들 수 있나요?</h2>
              <p className="mt-3 text-muted-foreground">6가지 유형의 AI 주문서를 5분 안에</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {OUTPUT_TYPES.map(({ type, label, desc, Icon, color }) => (
                <Link
                  key={type}
                  href={`/studio?type=${type}`}
                  className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 hover:border-accent/50 hover:shadow-md transition-all"
                >
                  <Icon className={`size-8 ${color}`} />
                  <div>
                    <div className="font-semibold text-foreground text-lg">{label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{desc}</div>
                  </div>
                  <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 내 직업에 맞는 템플릿 ── */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">내 직업에 딱 맞는 질문</h2>
              <p className="mt-3 text-muted-foreground">
                일반 AI와 다르게, Tacit은 당신의 업종을 알고 있어요
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {DOMAINS.map(({ id, label, Icon, desc }) => (
                <Link
                  key={id}
                  href={`/studio?domain=${id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:border-accent/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-lg">{label}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  <div className="mt-auto flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all">
                    바로 써보기 <ArrowRight className="size-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 어떻게 작동하나요? ── */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">딱 3단계예요</h2>
            </div>
            <div className="space-y-6">
              {[
                {
                  step: '01',
                  title: '유형을 고르세요',
                  desc: '이미지, 문서, 영상 등 원하는 결과물 종류를 선택하세요.',
                },
                {
                  step: '02',
                  title: 'AI가 질문해요',
                  desc: '5~7개 질문에 짧게 답하시면 됩니다. 모르는 건 건너뛰어도 괜찮아요.',
                },
                {
                  step: '03',
                  title: '주문서가 완성돼요',
                  desc: 'ChatGPT·Midjourney 등 AI 도구에 바로 붙여넣을 수 있는 주문서가 자동으로 만들어집니다.',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-5 items-start">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground font-bold text-lg">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-xl">{title}</h3>
                    <p className="mt-1 text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-base font-semibold text-accent-foreground hover:bg-accent-hover transition-colors touch-target"
              >
                지금 무료로 해보기
                <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA 배너 ── */}
        <section className="gradient-hero py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              20년 경험, 이제 AI로 꺼내세요
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              월 10회 무료. 가입 없이도 3회 바로 체험.
            </p>
            <Link
              href="/studio"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-10 py-4 text-lg font-semibold text-accent-foreground hover:bg-accent-hover transition-colors touch-target"
            >
              무료 체험 시작
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── 푸터 ── */}
      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2026 Tacit. 사내 프로젝트. 외부 배포 금지.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">이용약관</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
