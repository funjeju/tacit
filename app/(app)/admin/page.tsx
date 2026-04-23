'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  Users,
  FileText,
  Mic,
  Brain,
  Globe,
  CheckCircle,
  Loader2,
  TrendingUp,
  Flag,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalPrompts: number;
  publishedPrompts: number;
  totalInterviews: number;
  completedInterviews: number;
  totalProfiles: number;
}

interface ReportItem {
  promptId: string;
  finalPrompt: string;
  type: string;
  ownerId: string;
  isPublished: boolean;
  reportCount: number;
  reports: Array<{ reason: string; createdAt: string | null }>;
}

interface RecentPrompt {
  promptId: string;
  ownerId: string;
  type: string;
  domainId: string | null;
  isPublished: boolean;
  stats: { views?: number; likes?: number; copies?: number };
  createdAt: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  image: '이미지',
  report: '보고서',
  video: '영상',
  ppt: '발표자료',
  code: '코드',
  music: '음악',
};

const DOMAIN_LABELS: Record<string, string> = {
  restaurant: '식당',
  education: '교육',
  real_estate: '부동산',
};

const REASON_LABELS: Record<string, string> = {
  spam: '스팸',
  inappropriate: '부적절',
  copyright: '저작권',
  misinformation: '허위정보',
  other: '기타',
};

export default function AdminPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stats' | 'reports'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentPrompts, setRecentPrompts] = useState<RecentPrompt[]>([]);
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setFetching(true);
      try {
        const token = await user!.getIdToken();
        const [statsRes, reportsRes] = await Promise.all([
          fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/reports', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (statsRes.status === 403) {
          setError('관리자 권한이 없어요.');
          return;
        }
        if (!statsRes.ok) throw new Error();
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setRecentPrompts(statsData.recentPrompts ?? []);
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReportItems(reportsData.items ?? []);
        }
      } catch {
        setError('통계를 불러오지 못했어요.');
      } finally {
        setFetching(false);
      }
    }

    load();
  }, [user]);

  async function handleReport(promptId: string, action: 'unpublish' | 'dismiss') {
    if (processingId) return;
    setProcessingId(promptId);
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, action }),
      });
      if (res.ok) {
        setReportItems((prev) => prev.filter((r) => r.promptId !== promptId));
      }
    } finally {
      setProcessingId(null);
    }
  }

  if (loading || !user) return null;

  if (fetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-destructive text-lg font-semibold">{error}</p>
      </div>
    );
  }

  const STAT_CARDS = [
    { label: '총 사용자', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: '총 주문서', value: stats?.totalPrompts ?? 0, icon: FileText, color: 'text-accent', bg: 'bg-accent/10' },
    { label: '공개 주문서', value: stats?.publishedPrompts ?? 0, icon: Globe, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: '총 인터뷰', value: stats?.totalInterviews ?? 0, icon: Mic, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { label: '완료 인터뷰', value: stats?.completedInterviews ?? 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: '도메인 프로필', value: stats?.totalProfiles ?? 0, icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      {/* 헤더 + 탭 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
          <TrendingUp className="size-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">관리자 대시보드</h1>
          <p className="text-sm text-muted-foreground">Tacit 플랫폼 전체 현황</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-8 border-b border-border">
        {[
          { id: 'stats', label: '통계', icon: TrendingUp },
          { id: 'reports', label: `신고 처리 ${reportItems.length > 0 ? `(${reportItems.length})` : ''}`, icon: Flag },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'stats' | 'reports')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 통계 탭 */}
      {activeTab === 'stats' && (<>
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className={`flex size-10 items-center justify-center rounded-xl ${bg} mb-3`}>
              <Icon className={`size-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 완료율 */}
      {stats && stats.totalInterviews > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 mb-10">
          <p className="text-sm font-semibold text-foreground mb-3">인터뷰 완료율</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-2 bg-accent rounded-full transition-all"
                style={{ width: `${Math.round((stats.completedInterviews / stats.totalInterviews) * 100)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {Math.round((stats.completedInterviews / stats.totalInterviews) * 100)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.completedInterviews}명 완료 / {stats.totalInterviews}명 시작
          </p>
        </div>
      )}

      {/* 최근 주문서 */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">최근 주문서 (10개)</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">유형</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">도메인</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">공개</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">좋아요</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentPrompts.map((p) => (
                <tr key={p.promptId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {TYPE_LABELS[p.type] ?? p.type}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.domainId ? (DOMAIN_LABELS[p.domainId] ?? p.domainId) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.isPublished ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        <Globe className="size-2.5" />공개
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        비공개
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {p.stats?.likes ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
              {recentPrompts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    아직 주문서가 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>)}

      {/* 신고 처리 탭 */}
      {activeTab === 'reports' && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">신고된 주문서</h2>
          {reportItems.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <ShieldCheck className="size-10 text-success mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">신고된 주문서가 없어요</p>
              <p className="text-xs text-muted-foreground mt-1">커뮤니티가 건강하게 유지되고 있어요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportItems.map((item) => (
                <div key={item.promptId} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-accent">{TYPE_LABELS[item.type] ?? item.type}</span>
                        {item.isPublished && (
                          <span className="text-xs text-success bg-success/10 rounded-full px-2 py-0.5">공개 중</span>
                        )}
                        <span className="text-xs text-destructive font-semibold">신고 {item.reportCount}건</span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{item.finalPrompt}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleReport(item.promptId, 'dismiss')}
                        disabled={processingId === item.promptId}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="size-3.5" />
                        무시
                      </button>
                      {item.isPublished && (
                        <button
                          onClick={() => handleReport(item.promptId, 'unpublish')}
                          disabled={processingId === item.promptId}
                          className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        >
                          <ShieldOff className="size-3.5" />
                          비공개 처리
                        </button>
                      )}
                    </div>
                  </div>
                  {item.reports.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {item.reports.map((r, i) => (
                        <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {REASON_LABELS[r.reason] ?? r.reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
