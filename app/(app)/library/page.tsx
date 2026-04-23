'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import {
  ImageIcon,
  FileText,
  Video,
  Presentation,
  Code2,
  Music,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  BookOpen,
  Search,
  X,
} from 'lucide-react';
import type { OutputType } from '@/types';
import { trackPromptCopied } from '@/lib/analytics';

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

interface PromptItem {
  promptId: string;
  type: OutputType;
  domainId?: string;
  finalPrompt: string;
  targetTool: string;
  isPublished: boolean;
  stats: { views: number; copies: number; likes: number; uses: number };
  tags: string[];
  createdAt: string | null;
}

export default function LibraryPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<OutputType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/library');
    }
  }, [user, loading, router]);

  // 검색어 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchPrompts = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (activeType !== 'all') params.set('type', activeType);
      if (debouncedQ) params.set('q', debouncedQ);
      const url = `/api/prompts${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setPrompts(data.prompts ?? []);
      }
    } catch {
      // 오류 무시
    } finally {
      setFetching(false);
    }
  }, [user, activeType, debouncedQ]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    trackPromptCopied({ promptId: id, source: 'library' });
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">내 서재</h1>
          <p className="mt-1 text-muted-foreground text-sm">만든 AI 주문서가 쌓이는 곳이에요</p>
        </div>
        <Link
          href="/studio"
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors touch-target"
        >
          <Plus className="size-4" />
          새로 만들기
        </Link>
      </div>

      {/* 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="주문서 내용 또는 태그로 검색..."
          className="w-full rounded-xl border border-border bg-card pl-10 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* 유형 필터 */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(['all', 'image', 'report', 'video', 'ppt', 'code', 'music'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors
              ${activeType === t
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
          >
            {t === 'all' ? '전체' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {fetching ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 text-accent animate-spin" />
        </div>
      ) : prompts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {prompts.map((p) => {
            const Icon = TYPE_ICONS[p.type] ?? FileText;
            const date = p.createdAt
              ? new Date(p.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
              : '';

            return (
              <div
                key={p.promptId}
                className="group rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-accent/30 transition-all"
              >
                {/* 상단 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-accent">{TYPE_LABELS[p.type]}</span>
                      {p.targetTool && (
                        <span className="ml-2 text-xs text-muted-foreground">→ {TOOL_LABELS[p.targetTool] ?? p.targetTool}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{date}</span>
                </div>

                {/* 프롬프트 미리보기 */}
                <p className="text-sm text-foreground leading-relaxed line-clamp-3 mb-4">
                  {p.finalPrompt}
                </p>

                {/* 액션 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(p.finalPrompt, p.promptId)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {copiedId === p.promptId ? (
                      <><Check className="size-3 text-success" /> 복사됨</>
                    ) : (
                      <><Copy className="size-3" /> 복사</>
                    )}
                  </button>
                  <Link
                    href={`/library/${p.promptId}`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="size-3" />
                    자세히
                  </Link>
                  {p.isPublished && (
                    <span className="ml-auto text-xs text-success bg-success/10 rounded-full px-2 py-0.5">
                      공개됨
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <BookOpen className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">아직 만든 주문서가 없어요</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        AI 주문서를 만들고 저장하면 여기에 쌓여요. 쓸수록 나만의 자산이 됩니다.
      </p>
      <Link
        href="/studio"
        className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
      >
        <Plus className="size-4" />
        첫 번째 주문서 만들기
      </Link>
    </div>
  );
}
