'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  ArrowLeft,
  Heart,
  Copy,
  Check,
  GitFork,
  BookmarkCheck,
  Flag,
  Loader2,
  ImageIcon,
  FileText,
  Video,
  Presentation,
  Code2,
  Music,
  X,
  Globe,
} from 'lucide-react';
import type { OutputType } from '@/types';
import { trackPromptCopied, trackPromptForked } from '@/lib/analytics';

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

const DOMAIN_LABELS: Record<string, string> = {
  restaurant: '식당',
  education: '교육',
  real_estate: '부동산',
};

const REASON_OPTIONS = [
  { value: 'spam', label: '스팸' },
  { value: 'inappropriate', label: '부적절한 내용' },
  { value: 'copyright', label: '저작권 침해' },
  { value: 'misinformation', label: '허위 정보' },
  { value: 'other', label: '기타' },
];

interface PromptDetail {
  promptId: string;
  type: OutputType;
  domainId: string | null;
  finalPrompt: string;
  targetTool: string;
  stats: { views: number; likes: number; copies: number };
  tags: string[];
  createdAt: string | null;
}

export default function SquareDetailPage() {
  const { promptId } = useParams<{ promptId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [forked, setForked] = useState(false);
  const [forking, setForking] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!promptId) return;
    async function load() {
      setFetching(true);
      try {
        const headers: Record<string, string> = {};
        if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
        const res = await fetch(`/api/square/${promptId}`, { headers });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? '주문서를 불러오지 못했어요.');
          return;
        }
        const data = await res.json();
        setPrompt(data.prompt);
        setLiked(data.liked ?? false);
      } catch {
        setError('주문서를 불러오지 못했어요.');
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [promptId, user]);

  async function handleLike() {
    if (!user || liking || !prompt) return;
    setLiking(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/square/${promptId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setPrompt((p) =>
          p ? { ...p, stats: { ...p.stats, likes: p.stats.likes + (data.liked ? 1 : -1) } } : p
        );
      }
    } finally {
      setLiking(false);
    }
  }

  async function handleCopy() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt.finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackPromptCopied({ promptId, source: 'square' });
  }

  async function handleFork() {
    if (!user || forking || !prompt) return;
    setForking(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/square/${promptId}/copy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setForked(true);
        setPrompt((p) =>
          p ? { ...p, stats: { ...p.stats, copies: p.stats.copies + 1 } } : p
        );
        trackPromptForked({ promptId });
      }
    } finally {
      setForking(false);
    }
  }

  async function handleReport() {
    if (!user || !reportReason || reporting) return;
    setReporting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/square/${promptId}/report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });
      if (res.ok) {
        setReported(true);
        setReportOpen(false);
      }
    } finally {
      setReporting(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-destructive font-semibold">{error ?? '주문서를 찾을 수 없어요.'}</p>
        <Link href="/square" className="mt-4 inline-block text-sm text-accent hover:underline">
          광장으로 돌아가기
        </Link>
      </div>
    );
  }

  const Icon = TYPE_ICONS[prompt.type] ?? FileText;
  const date = prompt.createdAt
    ? new Date(prompt.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      {/* 뒤로가기 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        광장으로
      </button>

      {/* 헤더 */}
      <div className="rounded-xl border border-border bg-card p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <Icon className="size-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-accent">{TYPE_LABELS[prompt.type]}</span>
                {prompt.domainId && (
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {DOMAIN_LABELS[prompt.domainId] ?? prompt.domainId}
                  </span>
                )}
              </div>
              {prompt.targetTool && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  → {TOOL_LABELS[prompt.targetTool] ?? prompt.targetTool}
                </p>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{date}</span>
        </div>

        {/* 통계 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Heart className="size-3.5" />
            {prompt.stats.likes ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="size-3.5" />
            {prompt.stats.copies ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="size-3.5" />
            {prompt.stats.views ?? 0}
          </span>
        </div>

        {/* 태그 */}
        {prompt.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {prompt.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {copied ? <><Check className="size-4 text-success" /> 복사됨</> : <><Copy className="size-4" /> 복사</>}
          </button>

          {user && (
            <>
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  liked
                    ? 'border-red-200 bg-red-50 text-red-500 dark:border-red-900/50 dark:bg-red-950/30'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Heart className={`size-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                {prompt.stats.likes ?? 0}
              </button>

              <button
                onClick={handleFork}
                disabled={forking || forked}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  forked
                    ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {forked ? <BookmarkCheck className="size-4" /> : <GitFork className="size-4" />}
                {forked ? '서재에 추가됨' : '내 서재에 복제'}
              </button>

              {!reported && (
                <button
                  onClick={() => setReportOpen(true)}
                  className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <Flag className="size-3.5" />
                  신고
                </button>
              )}
            </>
          )}

          {!user && (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              로그인하고 복제하기
            </Link>
          )}
        </div>
      </div>

      {/* 주문서 전문 */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">AI 주문서 전문</h2>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{prompt.finalPrompt}</p>
      </div>

      {/* 신고 모달 */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">신고 사유 선택</h3>
              <button onClick={() => setReportOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {REASON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setReportReason(opt.value)}
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    reportReason === opt.value
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border text-foreground hover:border-accent/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleReport}
              disabled={!reportReason || reporting}
              className="w-full rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors disabled:opacity-40"
            >
              {reporting ? <Loader2 className="size-4 animate-spin mx-auto" /> : '신고하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
