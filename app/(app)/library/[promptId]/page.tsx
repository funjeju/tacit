'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  ImageIcon,
  FileText,
  Video,
  Presentation,
  Code2,
  Music,
  Globe,
  Lock,
  Loader2,
  Tag,
} from 'lucide-react';
import type { OutputType } from '@/types';
import { trackPromptCopied, trackPromptPublished } from '@/lib/analytics';
import { toast } from '@/lib/stores/useToastStore';
import { Trash2 } from 'lucide-react';

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

interface PromptDetail {
  promptId: string;
  type: OutputType;
  domainId?: string;
  finalPrompt: string;
  targetTool: string;
  isPublished: boolean;
  stats: { views: number; copies: number; likes: number; uses: number };
  tags: string[];
  userInputs?: { initialKeyword: string; answers: Array<{ questionId: string; questionText: string; answer: string }> };
  createdAt: string | null;
  updatedAt: string | null;
  ownerId: string;
}

export default function PromptDetailPage() {
  const { promptId } = useParams<{ promptId: string }>();
  const { user, loading } = useAuthStore();
  const router = useRouter();

  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/library');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !promptId) return;

    async function fetchPrompt() {
      setFetching(true);
      try {
        const token = await user!.getIdToken();
        const res = await fetch(`/api/prompt/${promptId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPrompt(data.prompt);
        } else if (res.status === 404) {
          router.push('/library');
        }
      } catch {
        // ignore
      } finally {
        setFetching(false);
      }
    }

    fetchPrompt();
  }, [user, promptId, router]);

  async function handleCopy() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt.finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackPromptCopied({ promptId: prompt.promptId, source: 'library' });
  }

  async function togglePublish() {
    if (!user || !prompt) return;
    setPublishing(true);
    try {
      const token = await user.getIdToken();
      const nextState = !prompt.isPublished;
      const res = await fetch(`/api/prompt/${promptId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextState }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrompt((p) => p ? { ...p, isPublished: nextState, tags: data.tags ?? p.tags } : p);
        toast(nextState ? '광장에 공개했어요.' : '비공개로 전환했어요.', 'success');
        if (nextState) trackPromptPublished({ promptId: prompt.promptId, type: prompt.type });
      }
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!user || !prompt || deleting) return;
    if (!confirm('정말 삭제할까요? 되돌릴 수 없어요.')) return;
    setDeleting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/prompt/${promptId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast('삭제했어요.', 'success');
        router.push('/library');
      } else {
        toast('삭제에 실패했어요.', 'error');
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user || !prompt) return null;

  const Icon = TYPE_ICONS[prompt.type] ?? FileText;
  const isOwner = prompt.ownerId === user.uid;
  const createdDate = prompt.createdAt
    ? new Date(prompt.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      {/* 뒤로가기 */}
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        내 서재
      </Link>

      {/* 헤더 */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
              <Icon className="size-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-accent">{TYPE_LABELS[prompt.type]}</span>
                {prompt.targetTool && (
                  <span className="text-xs text-muted-foreground">→ {TOOL_LABELS[prompt.targetTool] ?? prompt.targetTool}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{createdDate}</p>
            </div>
          </div>

          {/* 공개 상태 + 삭제 */}
          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={togglePublish}
                disabled={publishing}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
                  ${prompt.isPublished
                    ? 'bg-success/10 text-success hover:bg-success/20'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
              >
                {publishing ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : prompt.isPublished ? (
                  <Globe className="size-3" />
                ) : (
                  <Lock className="size-3" />
                )}
                {prompt.isPublished ? '공개중' : '비공개'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              </button>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>조회 {prompt.stats?.views ?? 0}</span>
          <span>복사 {prompt.stats?.copies ?? 0}</span>
          <span>좋아요 {prompt.stats?.likes ?? 0}</span>
        </div>
      </div>

      {/* 주문서 본문 */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">AI 주문서</h2>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {copied ? (
              <><Check className="size-3 text-success" />복사됨</>
            ) : (
              <><Copy className="size-3" />복사하기</>
            )}
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans">
          {prompt.finalPrompt}
        </pre>
      </div>

      {/* Q&A 히스토리 */}
      {prompt.userInputs?.answers && prompt.userInputs.answers.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">입력 내용</h2>
          <div className="space-y-3">
            {prompt.userInputs.answers.map((qa) => (
              <div key={qa.questionId} className="text-sm">
                <p className="text-muted-foreground mb-1">{qa.questionText}</p>
                <p className="text-foreground font-medium">{qa.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 태그 */}
      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <Tag className="size-3.5 text-muted-foreground" />
          {prompt.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 외부 도구로 열기 */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">이 주문서 사용하기</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            주문서 복사
          </button>
          <a
            href="https://chat.openai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="size-4" />
            ChatGPT에서 사용
          </a>
          <a
            href="https://claude.ai/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="size-4" />
            Claude에서 사용
          </a>
        </div>
      </div>
    </div>
  );
}
