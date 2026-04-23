'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  Heart,
  Copy,
  Check,
  ImageIcon,
  FileText,
  Video,
  Presentation,
  Code2,
  Music,
  Loader2,
  Users,
  Flame,
  Plus,
  GitFork,
  BookmarkCheck,
  Flag,
  X,
  ExternalLink,
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

interface SquarePrompt {
  promptId: string;
  type: OutputType;
  domainId?: string;
  finalPrompt: string;
  targetTool: string;
  stats: { views: number; copies: number; likes: number; uses: number };
  tags: string[];
  createdAt: string | null;
}

const TYPE_FILTERS: Array<{ value: OutputType | 'all'; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'image', label: '이미지' },
  { value: 'report', label: '보고서' },
  { value: 'ppt', label: '발표자료' },
  { value: 'video', label: '영상' },
  { value: 'code', label: '코드' },
  { value: 'music', label: '음악' },
];

export default function SquarePage() {
  const { user } = useAuthStore();
  const [prompts, setPrompts] = useState<SquarePrompt[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeType, setActiveType] = useState<OutputType | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [forkedIds, setForkedIds] = useState<Set<string>>(new Set());
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const fetchPrompts = useCallback(async () => {
    setFetching(true);
    try {
      const url = activeType === 'all' ? '/api/square' : `/api/square?type=${activeType}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPrompts(data.prompts ?? []);
      }
    } catch {
      // ignore
    } finally {
      setFetching(false);
    }
  }, [activeType]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    trackPromptCopied({ promptId: id, source: 'square' });
    // 복사 수 증가 (fire and forget)
    fetch(`/api/prompt/${id}`, { method: 'HEAD' }).catch(() => {});
  }

  async function handleReport() {
    if (!user || !reportTarget || !reportReason || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/square/${reportTarget}/report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });
      if (res.ok || res.status === 409) {
        setReportedIds((prev) => new Set(prev).add(reportTarget!));
        setReportTarget(null);
        setReportReason('');
      }
    } catch {
      // ignore
    } finally {
      setReportSubmitting(false);
    }
  }

  async function handleFork(promptId: string) {
    if (!user || forkingId) return;
    setForkingId(promptId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/square/${promptId}/copy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setForkedIds((prev) => new Set(prev).add(promptId));
        setPrompts((prev) =>
          prev.map((p) =>
            p.promptId === promptId
              ? { ...p, stats: { ...p.stats, copies: p.stats.copies + 1 } }
              : p
          )
        );
        trackPromptForked({ promptId });
      }
    } catch {
      // ignore
    } finally {
      setForkingId(null);
    }
  }

  async function handleLike(promptId: string) {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/square/${promptId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setLikedIds((prev) => {
        const next = new Set(prev);
        data.liked ? next.add(promptId) : next.delete(promptId);
        return next;
      });
      setPrompts((prev) =>
        prev.map((p) =>
          p.promptId === promptId
            ? { ...p, stats: { ...p.stats, likes: p.stats.likes + (data.liked ? 1 : -1) } }
            : p
        )
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="size-5 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">광장</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            다른 전문가들이 공개한 AI 주문서를 참고하세요.
          </p>
        </div>
        <Link
          href="/studio"
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
        >
          <Plus className="size-4" />
          내 주문서 만들기
        </Link>
      </div>

      {/* 유형 필터 */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveType(value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors
              ${activeType === value
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          onClose={() => setReportTarget(null)}
          onSubmit={handleReport}
          reason={reportReason}
          setReason={setReportReason}
          submitting={reportSubmitting}
        />
      )}

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
            const isLiked = likedIds.has(p.promptId);
            const isCopied = copiedId === p.promptId;

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
                        <span className="ml-2 text-xs text-muted-foreground">
                          → {TOOL_LABELS[p.targetTool] ?? p.targetTool}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{date}</span>
                </div>

                {/* 미리보기 */}
                <p className="text-sm text-foreground leading-relaxed line-clamp-3 mb-4">
                  {p.finalPrompt}
                </p>

                {/* 통계 + 액션 */}
                <div className="flex items-center gap-3">
                  {/* 좋아요 */}
                  <button
                    onClick={() => handleLike(p.promptId)}
                    className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                      isLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'
                    }`}
                    title={user ? '좋아요' : '로그인 후 이용 가능'}
                  >
                    <Heart className={`size-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    {p.stats?.likes ?? 0}
                  </button>

                  {/* 복사 */}
                  <button
                    onClick={() => handleCopy(p.finalPrompt, p.promptId)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {isCopied ? (
                      <><Check className="size-3 text-success" />복사됨</>
                    ) : (
                      <><Copy className="size-3" />복사</>
                    )}
                  </button>

                  {/* 복제 (로그인 시) */}
                  {user && (
                    <button
                      onClick={() => handleFork(p.promptId)}
                      disabled={forkingId === p.promptId}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        forkedIds.has(p.promptId)
                          ? 'text-success'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title="내 서재에 복제하기"
                    >
                      {forkedIds.has(p.promptId) ? (
                        <><BookmarkCheck className="size-3" />복제됨</>
                      ) : forkingId === p.promptId ? (
                        <><Loader2 className="size-3 animate-spin" />복제 중</>
                      ) : (
                        <><GitFork className="size-3" />복제</>
                      )}
                    </button>
                  )}

                  {/* 태그 */}
                  {p.tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {p.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 상세 보기 */}
                  <Link
                    href={`/square/${p.promptId}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="상세 보기"
                  >
                    <ExternalLink className="size-3" />
                    자세히
                  </Link>

                  {/* 신고 */}
                  {user && !reportedIds.has(p.promptId) && (
                    <button
                      onClick={() => { setReportTarget(p.promptId); setReportReason(''); }}
                      className="ml-auto text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      title="신고"
                    >
                      <Flag className="size-3" />
                    </button>
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

const REPORT_REASONS = [
  { value: 'spam', label: '스팸이에요' },
  { value: 'inappropriate', label: '부적절한 내용이에요' },
  { value: 'copyright', label: '저작권 침해예요' },
  { value: 'misinformation', label: '잘못된 정보예요' },
  { value: 'other', label: '기타' },
];

function ReportModal({
  onClose,
  onSubmit,
  reason,
  setReason,
  submitting,
}: {
  onClose: () => void;
  onSubmit: () => void;
  reason: string;
  setReason: (v: string) => void;
  submitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground">신고하기</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">신고 사유를 선택해주세요.</p>
        <div className="space-y-2 mb-5">
          {REPORT_REASONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setReason(value)}
              className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                reason === value
                  ? 'border-destructive bg-destructive/10 text-destructive'
                  : 'border-border bg-card text-foreground hover:border-muted-foreground/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={!reason || submitting}
            className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors disabled:opacity-40"
          >
            {submitting ? '신고 중...' : '신고 접수'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Flame className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">아직 공개된 주문서가 없어요</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        첫 번째로 주문서를 만들고 광장에 공개해보세요. 다른 전문가들에게 도움이 됩니다.
      </p>
      <Link
        href="/studio"
        className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
      >
        <Plus className="size-4" />
        주문서 만들기
      </Link>
    </div>
  );
}
