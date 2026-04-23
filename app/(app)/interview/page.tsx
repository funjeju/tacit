'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import Link from 'next/link';
import {
  Mic,
  UtensilsCrossed,
  GraduationCap,
  Home,
  Loader2,
  ArrowRight,
  Clock,
  Brain,
  Sparkles,
  PlayCircle,
} from 'lucide-react';
import type { DomainId } from '@/types';
import { trackInterviewStarted } from '@/lib/analytics';

const DOMAIN_LABELS: Record<string, string> = {
  restaurant: '식당 사장님',
  education: '선생님',
  real_estate: '공인중개사',
};

const DOMAINS = [
  {
    id: 'restaurant' as DomainId,
    label: '식당 사장님',
    desc: '메뉴 철학, 재료 선택, 단골 관리 노하우',
    Icon: UtensilsCrossed,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
  {
    id: 'education' as DomainId,
    label: '선생님',
    desc: '교수법, 학생 지도, 학부모 소통 방식',
    Icon: GraduationCap,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    id: 'real_estate' as DomainId,
    label: '공인중개사',
    desc: '매물 분석, 고객 설득, 계약 성사 노하우',
    Icon: Home,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
  },
];

const HOW_IT_WORKS = [
  { icon: <Mic className="size-5" />, title: '대화하듯 답해요', desc: '어려운 질문 없이 자연스러운 대화로 진행돼요' },
  { icon: <Brain className="size-5" />, title: 'AI가 노하우 정리', desc: '답변에서 숨은 전문 지식을 자동으로 추출해요' },
  { icon: <Sparkles className="size-5" />, title: '주문서 품질이 높아져요', desc: '나만의 프로필로 AI 주문서 정확도가 크게 오릅니다' },
];

interface ResumeSession {
  sessionId: string;
  domainId: string;
  questionsAnswered: number;
  targetQuestionCount: number;
  lastActivityAt: string | null;
}

export default function InterviewHomePage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState<DomainId | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeSession, setResumeSession] = useState<ResumeSession | null>(null);

  useEffect(() => {
    if (!user) return;
    async function checkResume() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/interview/resume', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          if (d.session) setResumeSession(d.session);
        }
      } catch {
        // 이어하기 없어도 진행
      }
    }
    checkResume();
  }, [user]);

  if (!loading && !user) {
    router.push('/auth/login?redirect=/interview');
    return null;
  }

  async function handleStart() {
    if (!user || !selectedDomain || starting) return;
    setStarting(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: selectedDomain, targetQuestionCount: 20 }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // 첫 질문을 sessionStorage에 미리 저장 (페이지 전환 후 즉시 표시)
      sessionStorage.setItem(`interview-${data.sessionId}-question`, data.openingQuestion);
      sessionStorage.setItem(`interview-${data.sessionId}-domain`, selectedDomain!);
      trackInterviewStarted({ domainId: selectedDomain! });
      router.push(`/interview/${data.sessionId}`);
    } catch {
      setError('인터뷰를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.');
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
      {/* 이어하기 배너 */}
      {resumeSession && (
        <div className="mb-8 flex items-center gap-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-4">
          <PlayCircle className="size-6 text-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              {DOMAIN_LABELS[resumeSession.domainId] ?? resumeSession.domainId} 인터뷰를 이어할 수 있어요
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {resumeSession.questionsAnswered}/{resumeSession.targetQuestionCount}개 완료
              {resumeSession.lastActivityAt && (
                <> · {new Date(resumeSession.lastActivityAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 중단</>
              )}
            </p>
          </div>
          <Link
            href={`/interview/${resumeSession.sessionId}`}
            className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
          >
            이어하기
          </Link>
        </div>
      )}

      {/* 헤더 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-4">
          <Mic className="size-3.5" />
          암묵지 인터뷰
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          당신의 노하우를<br />AI가 기억하게 해드려요
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          20분 대화로 수십 년의 경험을 AI 프로필로 만들어요.<br />
          이후 만드는 모든 AI 주문서의 품질이 달라집니다.
        </p>
      </div>

      {/* 작동 방식 */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {HOW_IT_WORKS.map((item) => (
          <div key={item.title} className="text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted mx-auto mb-2 text-accent">
              {item.icon}
            </div>
            <p className="text-xs font-semibold text-foreground mb-1">{item.title}</p>
            <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 도메인 선택 */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">어떤 분야로 인터뷰할까요?</h2>
        <div className="space-y-2">
          {DOMAINS.map(({ id, label, desc, Icon, color, bg }) => (
            <button
              key={id}
              onClick={() => setSelectedDomain(id)}
              className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all
                ${selectedDomain === id
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : 'border-border bg-card hover:border-accent/40'
                }`}
            >
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`size-5 ${color}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              {selectedDomain === id && (
                <div className="ml-auto size-5 rounded-full bg-accent flex items-center justify-center">
                  <div className="size-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 소요 시간 안내 */}
      <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground mb-6">
        <Clock className="size-4 shrink-0" />
        <span>질문 20개 · 예상 소요 시간 <strong className="text-foreground">15~25분</strong></span>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={!selectedDomain || starting || loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-4 text-base font-semibold text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {starting ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            인터뷰 시작하기
            <ArrowRight className="size-5" />
          </>
        )}
      </button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        중간에 멈춰도 괜찮아요. 언제든 이어서 진행할 수 있어요.
      </p>
    </div>
  );
}
