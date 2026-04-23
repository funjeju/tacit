'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  Loader2,
  BookOpen,
  Globe,
  Zap,
  ChevronRight,
  Settings,
  Brain,
  Mic,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import type { OutputType } from '@/types';

const TYPE_LABELS: Record<OutputType, string> = {
  image: '이미지',
  report: '보고서',
  video: '영상',
  ppt: '발표자료',
  code: '코드',
  music: '음악',
};

const DOMAIN_LABELS: Record<string, string> = {
  restaurant: '식당 사장님',
  education: '선생님',
  real_estate: '공인중개사',
};

interface DomainProfileItem {
  profileId: string;
  domainId: string;
  isActive: boolean;
  createdAt: string | null;
  summary: string;
}

interface ProfileData {
  user: {
    displayName?: string;
    email?: string;
    photoURL?: string;
    role: string;
  };
  usage: { thisMonth: number };
  recent: Array<{
    promptId: string;
    type: OutputType;
    finalPrompt: string;
    targetTool: string;
    createdAt: string | null;
  }>;
}

export default function ProfilePage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [profiles, setProfiles] = useState<DomainProfileItem[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/profile');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setFetching(true);
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setData(await res.json());
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function loadProfiles() {
      setProfilesLoading(true);
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/me/profiles', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json();
          setProfiles(d.profiles ?? []);
        }
      } finally {
        setProfilesLoading(false);
      }
    }
    loadProfiles();
  }, [user]);

  async function handleToggle(profileId: string, current: boolean) {
    if (togglingId) return;
    setTogglingId(profileId);
    try {
      const token = await user!.getIdToken();
      const res = await fetch(`/api/me/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setProfiles((prev) =>
          prev.map((p) => (p.profileId === profileId ? { ...p, isActive: !current } : p))
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeleteProfile(profileId: string) {
    if (deletingId || !confirm('이 전문가 프로필을 삭제할까요? 되돌릴 수 없어요.')) return;
    setDeletingId(profileId);
    try {
      const token = await user!.getIdToken();
      const res = await fetch(`/api/me/profiles/${profileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProfiles((prev) => prev.filter((p) => p.profileId !== profileId));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = data?.user.displayName ?? user.displayName ?? '사용자';

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      {/* 프로필 헤더 */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="프로필"
                className="size-16 rounded-full ring-2 ring-border"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-2xl font-bold text-accent">
                {displayName[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {data?.user.role === 'admin' ? '관리자' : '무료 플랜'}
              </span>
            </div>
          </div>
          <Link
            href="/settings"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="size-4" />
          </Link>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">
              {fetching ? '...' : data?.usage.thisMonth ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">이번 달 생성</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">
              {fetching ? '...' : data?.recent.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">서재 보관</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">공개 주문서</p>
          </div>
        </div>
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <QuickLink
          href="/library"
          icon={<BookOpen className="size-5 text-accent" />}
          label="내 서재"
          desc="저장한 주문서 전체"
        />
        <QuickLink
          href="/square"
          icon={<Globe className="size-5 text-moss-500" />}
          label="광장"
          desc="공개 주문서 탐색"
        />
      </div>

      {/* 전문가 프로필 */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">전문가 프로필</h2>
          </div>
          <Link
            href="/interview"
            className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition-colors"
          >
            <Mic className="size-3" />
            인터뷰로 추가
          </Link>
        </div>

        {profilesLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-4 text-accent animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              아직 전문가 프로필이 없어요.<br />
              인터뷰를 완료하면 AI 주문서가 자동 개인화돼요.
            </p>
            <Link
              href="/interview"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
            >
              <Mic className="size-4" />
              인터뷰 시작하기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((p) => (
              <div
                key={p.profileId}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {DOMAIN_LABELS[p.domainId] ?? p.domainId}
                  </p>
                  {p.summary && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.summary}</p>
                  )}
                  {p.createdAt && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleToggle(p.profileId, p.isActive)}
                  disabled={togglingId === p.profileId}
                  className={`shrink-0 transition-colors ${p.isActive ? 'text-accent' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                  title={p.isActive ? '비활성화' : '활성화'}
                >
                  {togglingId === p.profileId ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : p.isActive ? (
                    <ToggleRight className="size-6" />
                  ) : (
                    <ToggleLeft className="size-6" />
                  )}
                </button>
                <button
                  onClick={() => handleDeleteProfile(p.profileId)}
                  disabled={deletingId === p.profileId}
                  className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors"
                  title="삭제"
                >
                  {deletingId === p.profileId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 최근 활동 */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">최근 주문서</h2>
          <Link href="/library" className="text-xs text-accent hover:underline">
            전체 보기
          </Link>
        </div>

        {fetching ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 text-accent animate-spin" />
          </div>
        ) : !data?.recent.length ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">아직 만든 주문서가 없어요</p>
            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
            >
              <Zap className="size-4" />
              첫 주문서 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recent.map((p) => (
              <Link
                key={p.promptId}
                href={`/library/${p.promptId}`}
                className="flex items-center gap-3 rounded-xl border border-transparent hover:border-border hover:bg-muted px-3 py-2.5 transition-all group"
              >
                <span className="text-xs font-medium text-accent bg-accent/10 rounded-md px-1.5 py-0.5 shrink-0">
                  {TYPE_LABELS[p.type]}
                </span>
                <p className="flex-1 text-sm text-foreground truncate">{p.finalPrompt}</p>
                <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-accent/30 hover:shadow-sm transition-all"
    >
      {icon}
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
