'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  ImageIcon,
  Video,
  Presentation,
  Code2,
  Music,
  Loader2,
  ChevronRight,
  Zap,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import type { OutputType } from '@/types';

const TYPE_ICONS: Record<OutputType, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  report: FileText,
  video: Video,
  ppt: Presentation,
  code: Code2,
  music: Music,
};

const TYPE_LABELS: Record<OutputType, string> = {
  image: '이미지',
  report: '보고서/문서',
  video: '영상',
  ppt: '발표자료',
  code: '코드',
  music: '음악',
};

const TOOL_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  midjourney: 'Midjourney',
  dalle: 'DALL-E',
  gamma: 'Gamma',
  veo: 'Veo',
  suno: 'Suno',
  runway: 'Runway',
  custom: '직접 사용',
};

const QUICK_ACTIONS = [
  { label: '이미지 만들기', type: 'image' as OutputType, href: '/studio/create?type=image' },
  { label: '문서 만들기', type: 'report' as OutputType, href: '/studio/create?type=report' },
  { label: '발표자료 만들기', type: 'ppt' as OutputType, href: '/studio/create?type=ppt' },
];

const DOMAIN_SHORTCUTS = [
  { domainId: 'restaurant', label: '식당 메뉴 포스터', href: '/studio/restaurant?template=restaurant_new_menu_poster', emoji: '🍽️' },
  { domainId: 'education', label: '수업 계획서', href: '/studio/education?template=education_lesson_plan', emoji: '📚' },
  { domainId: 'real_estate', label: '매물 소개 문구', href: '/studio/real_estate?template=real_estate_listing_description', emoji: '🏠' },
];

interface RecentPrompt {
  promptId: string;
  type: OutputType;
  finalPrompt: string;
  targetTool: string;
  createdAt: string | null;
}

interface DashboardData {
  user: { displayName?: string; email?: string; role: string; plan?: string };
  usage: { thisMonth: number; limit: number };
  recent: RecentPrompt[];
}

export default function DashboardPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchDashboard() {
      setFetching(true);
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setData(await res.json());
      } catch {
        // ignore
      } finally {
        setFetching(false);
      }
    }

    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = data?.user.displayName ?? user.displayName ?? '사장님';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      {/* 인사말 */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          안녕하세요, {firstName}님 👋
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          오늘도 AI로 업무를 더 쉽게 만들어보세요.
        </p>
      </div>

      {/* 사용량 배너 */}
      {!fetching && (
        <UsageBanner used={data?.usage.thisMonth ?? 0} limit={data?.usage.limit ?? 10} isPro={data?.user.plan === 'pro'} />
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <StatCard
          icon={<Zap className="size-5 text-accent" />}
          label="이번 달 생성"
          value={fetching ? '...' : `${data?.usage.thisMonth ?? 0}개`}
        />
        <StatCard
          icon={<BookOpen className="size-5 text-primary" />}
          label="내 서재"
          value={fetching ? '...' : `${data?.recent.length ?? 0}개`}
          href="/library"
        />
        <StatCard
          icon={<TrendingUp className="size-5 text-moss-500" />}
          label="도메인 전문화"
          value="식당"
          className="hidden sm:flex"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* 왼쪽 */}
        <div className="space-y-6">
          {/* 빠른 시작 */}
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3">바로 만들기</h2>
            <div className="grid grid-cols-3 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = TYPE_ICONS[action.type];
                return (
                  <Link
                    key={action.type}
                    href={action.href}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 hover:border-accent/40 hover:shadow-sm transition-all text-center"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 최근 주문서 */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">최근 만든 주문서</h2>
              <Link href="/library" className="text-xs text-accent hover:underline">
                전체 보기
              </Link>
            </div>

            {fetching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 text-accent animate-spin" />
              </div>
            ) : !data?.recent.length ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">아직 만든 주문서가 없어요</p>
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
                >
                  <Plus className="size-4" />
                  첫 주문서 만들기
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recent.map((p) => {
                  const Icon = TYPE_ICONS[p.type] ?? FileText;
                  const date = p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                    : '';
                  return (
                    <Link
                      key={p.promptId}
                      href={`/library/${p.promptId}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-accent/30 hover:shadow-sm transition-all group"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{p.finalPrompt}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {TYPE_LABELS[p.type]} · {TOOL_LABELS[p.targetTool] ?? p.targetTool} · {date}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* 오른쪽 — 도메인 바로가기 */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">도메인별 바로가기</h2>
          <div className="space-y-2">
            {DOMAIN_SHORTCUTS.map((s) => (
              <Link
                key={s.domainId}
                href={s.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 hover:border-accent/30 hover:shadow-sm transition-all group"
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="flex-1 text-sm font-medium text-foreground">{s.label}</span>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}

            <Link
              href="/studio"
              className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3.5 hover:border-accent/40 transition-all group mt-1"
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
                <Plus className="size-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                다른 유형 만들기
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageBanner({ used, limit, isPro = false }: { used: number; limit: number; isPro?: boolean }) {
  const remaining = Math.max(0, limit - used);
  const pct = Math.min(100, (used / limit) * 100);
  const isNearLimit = used >= limit - 2;
  const isAtLimit = used >= limit;

  if (used === 0) return null;

  return (
    <div className={`mb-6 rounded-xl border px-4 py-3.5 ${isAtLimit ? 'border-destructive/30 bg-destructive/5' : isNearLimit ? 'border-amber-400/40 bg-amber-50 dark:bg-amber-950/20' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          이번 달 AI 주문서 생성
          {isPro && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">PRO</span>}
        </span>
        <span className={`text-sm font-bold ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
          {used} / {limit}회
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-amber-400' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isAtLimit ? (
        <p className="mt-2 text-xs text-destructive">
          이번 달 무료 횟수를 모두 사용했어요.{' '}
          <a href="/upgrade" className="underline font-semibold hover:opacity-80">Pro로 업그레이드</a>하면 월 100회 사용 가능해요.
        </p>
      ) : isNearLimit ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          무료 사용 {remaining}회 남았어요.{' '}
          <a href="/upgrade" className="underline hover:opacity-80">Pro 업그레이드 →</a>
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">무료 {remaining}회 남음</p>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  className?: string;
}) {
  const content = (
    <div className={`flex flex-col gap-2 rounded-xl border border-border bg-card p-4 ${className}`}>
      {icon}
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  if (href) return <Link href={href} className="hover:border-accent/30 transition-colors rounded-xl">{content}</Link>;
  return content;
}
