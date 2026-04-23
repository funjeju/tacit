'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  ArrowLeft,
  ArrowRight,
  SkipForward,
  HelpCircle,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';
import type { OutputType, TemplateQuestion, GeneratedPromptResult } from '@/types';
import { trackPromptGenerated } from '@/lib/analytics';

const EXTERNAL_TOOLS: Record<OutputType, Array<{ name: string; url: string | null }>> = {
  image: [
    { name: 'Midjourney', url: 'https://www.midjourney.com/app' },
    { name: 'DALL-E (ChatGPT)', url: 'https://chat.openai.com' },
  ],
  report: [
    { name: 'ChatGPT', url: 'https://chat.openai.com' },
    { name: 'Claude', url: 'https://claude.ai/new' },
  ],
  video: [
    { name: 'Veo (Gemini)', url: 'https://gemini.google.com' },
    { name: 'Runway', url: 'https://runwayml.com' },
  ],
  ppt: [
    { name: 'Gamma', url: 'https://gamma.app' },
  ],
  code: [
    { name: 'ChatGPT', url: 'https://chat.openai.com' },
    { name: 'Claude', url: 'https://claude.ai/new' },
  ],
  music: [
    { name: 'Suno', url: 'https://suno.com' },
    { name: 'Udio', url: 'https://udio.com' },
  ],
};

const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
  image: '이미지',
  report: '보고서/문서',
  video: '영상',
  ppt: '발표자료',
  code: '코드',
  music: '음악',
};

type SessionStatus =
  | 'seed'
  | 'loading_template'
  | 'loading_questions'
  | 'questioning'
  | 'generating'
  | 'done';

// dependsOn 조건을 만족하는지 확인
function shouldShowQuestion(
  q: TemplateQuestion,
  answers: Record<string, string>
): boolean {
  if (!q.dependsOn) return true;
  const dep = q.dependsOn as { questionId: string; value: string };
  return answers[dep.questionId] === dep.value;
}

// 활성 질문 목록 (dependsOn 필터링)
function getActiveQuestions(
  all: TemplateQuestion[],
  answers: Record<string, string>
): TemplateQuestion[] {
  return all.filter((q) => shouldShowQuestion(q, answers));
}

function StudioCreateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const outputType = (searchParams.get('type') ?? 'report') as OutputType;
  const domainId = searchParams.get('domain') ?? undefined;
  const templateId = searchParams.get('template') ?? undefined;

  const [status, setStatus] = useState<SessionStatus>(templateId ? 'loading_template' : 'seed');
  const [templateName, setTemplateName] = useState('');
  const [allQuestions, setAllQuestions] = useState<TemplateQuestion[]>([]);
  const [seedKeyword, setSeedKeyword] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [result, setResult] = useState<GeneratedPromptResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeProfileSummary, setActiveProfileSummary] = useState<string | null>(null);

  // 도메인 프로필 자동 로드
  useEffect(() => {
    if (!user || !domainId) return;
    async function loadProfile() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch(`/api/me/profiles?domain=${domainId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const first = data.profiles?.[0];
        if (first) {
          setActiveProfileId(first.profileId);
          setActiveProfileSummary(first.summary || null);
        }
      } catch {
        // 프로필 없어도 진행
      }
    }
    loadProfile();
  }, [user, domainId]);

  // 템플릿 모드: 최초 진입 시 질문 로드
  useEffect(() => {
    if (!templateId) return;

    async function loadTemplate() {
      try {
        const res = await fetch(`/api/templates?id=${templateId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const tpl = data.template;
        setTemplateName(tpl.name ?? '');
        const sorted: TemplateQuestion[] = (tpl.questions ?? []).sort(
          (a: TemplateQuestion, b: TemplateQuestion) => a.order - b.order
        );
        setAllQuestions(sorted);
        setStatus('questioning');
      } catch {
        setError('템플릿을 불러오지 못했어요.');
        setStatus('seed');
      }
    }

    loadTemplate();
  }, [templateId]);

  // 현재 활성 질문 목록
  const activeQuestions = getActiveQuestions(allQuestions, answers);
  const currentQ = activeQuestions[currentIndex];
  const progress = activeQuestions.length > 0 ? (currentIndex / activeQuestions.length) * 100 : 0;

  // 세션 시작 (답변 완료 직전)
  async function startSession(): Promise<string | null> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
      const res = await fetch('/api/prompt/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ outputType, seedKeyword: seedKeyword || templateName, domainId, templateId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch {
      return null;
    }
  }

  // 1단계: 키워드 제출 → 질문 생성 (자유 모드)
  async function handleSeedSubmit() {
    if (!seedKeyword.trim()) return;
    setStatus('loading_questions');
    setError(null);

    try {
      const res = await fetch('/api/prompt/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputType, seedKeyword, domainId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAllQuestions(data.questions);
      setStatus('questioning');
    } catch {
      setError('잠시 후 다시 시도해 주세요.');
      setStatus('seed');
    }
  }

  // 답변 제출
  function handleAnswerSubmit() {
    if (!currentQ) return;
    const newAnswers = { ...answers, [currentQ.id]: currentAnswer };
    setAnswers(newAnswers);
    setCurrentAnswer('');
    advanceOrGenerate(newAnswers, currentIndex + 1);
  }

  // 건너뛰기
  function handleSkip() {
    if (!currentQ) return;
    const newAnswers = { ...answers, [currentQ.id]: '' };
    setAnswers(newAnswers);
    setCurrentAnswer('');
    advanceOrGenerate(newAnswers, currentIndex + 1);
  }

  function advanceOrGenerate(newAnswers: Record<string, string>, nextIdx: number) {
    const next = getActiveQuestions(allQuestions, newAnswers);
    if (nextIdx >= next.length) {
      generatePrompt(newAnswers, next);
    } else {
      setCurrentIndex(nextIdx);
    }
  }

  // 최종 프롬프트 생성
  async function generatePrompt(finalAnswers: Record<string, string>, active: TemplateQuestion[]) {
    setStatus('generating');
    setError(null);

    const sid = await startSession();

    const qaHistory = active.map((q) => ({
      question: q.text,
      answer: finalAnswers[q.id] ?? '(건너뜀)',
    }));

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
      const res = await fetch('/api/prompt/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ outputType, qaHistory, domainId, profileId: activeProfileId ?? undefined }),
      });
      if (res.status === 429) {
        const data = await res.json();
        setError(data.error ?? '이번 달 무료 횟수를 모두 사용했어요.');
        setStatus('questioning');
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data.result);
      setStatus('done');
      trackPromptGenerated({ type: outputType, domainId, hasProfile: !!activeProfileId });
    } catch {
      setError('주문서 생성에 실패했어요. 다시 시도해 주세요.');
      setStatus('questioning');
    }
  }

  // 서재 저장
  async function handleSave() {
    if (!user || !result || saving) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const qaHistory = activeQuestions.map((q) => ({
        question: q.text,
        answer: answers[q.id] ?? '',
      }));
      const finalPrompt = result.prompt + (result.parameters ? ' ' + result.parameters : '');
      const res = await fetch('/api/prompt/save', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, finalPrompt, qaHistory, outputType, targetTool: 'chatgpt', domainId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedId(data.promptId);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpen(url: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    window.open(url, '_blank');
  }

  function resetSession() {
    setStatus(templateId ? 'loading_template' : 'seed');
    setSeedKeyword('');
    setAnswers({});
    setCurrentIndex(0);
    setCurrentAnswer('');
    setResult(null);
    setSessionId(null);
    setSavedId(null);
    setError(null);
    if (templateId) {
      // Re-trigger template load
      setAllQuestions([]);
      setStatus('loading_template');
      fetch(`/api/templates?id=${templateId}`)
        .then((r) => r.json())
        .then((data) => {
          const sorted: TemplateQuestion[] = (data.template?.questions ?? []).sort(
            (a: TemplateQuestion, b: TemplateQuestion) => a.order - b.order
          );
          setAllQuestions(sorted);
          setStatus('questioning');
        })
        .catch(() => setStatus('seed'));
    }
  }

  const fullPrompt = result ? result.prompt + (result.parameters ? ' ' + result.parameters : '') : '';

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href={domainId ? `/studio/${domainId}` : '/studio'} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
            <span className="text-sm">돌아가기</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {templateName ? (
              <span className="text-foreground font-medium">{templateName}</span>
            ) : (
              <>
                <span>AI 주문서</span>
                <ChevronRight className="size-3" />
                <span className="text-foreground font-medium">{OUTPUT_TYPE_LABELS[outputType]}</span>
              </>
            )}
          </div>
          <div className="w-20" />
        </div>
        {/* 프로그레스 바 */}
        {status === 'questioning' && activeQuestions.length > 0 && (
          <div className="h-1 bg-muted">
            <div
              className="h-1 bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
        {/* 활성 프로필 배너 */}
        {activeProfileId && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <Sparkles className="size-4 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-accent">내 전문가 프로필이 적용돼요</p>
              {activeProfileSummary && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{activeProfileSummary}</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 템플릿 로딩 */}
        {status === 'loading_template' && (
          <div className="flex flex-col items-center gap-4 py-20 animate-fade-in">
            <Loader2 className="size-10 text-accent animate-spin" />
            <p className="text-muted-foreground">템플릿을 불러오는 중...</p>
          </div>
        )}

        {/* STEP 1: 키워드 입력 (자유 모드만) */}
        {status === 'seed' && (
          <div className="animate-fade-in">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent">
              1단계 — 시작
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              어떤 {OUTPUT_TYPE_LABELS[outputType]}을(를) 원하세요?
            </h1>
            <p className="text-muted-foreground mb-8">
              한 줄로 간단히 알려주시면 나머지는 AI가 질문해드릴게요.
            </p>
            <textarea
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSeedSubmit();
                }
              }}
              placeholder={
                outputType === 'image'
                  ? '예: 여름 한정 냉국수 신메뉴 포스터'
                  : outputType === 'report'
                  ? '예: 네이버 리뷰에 감사 답글 달기'
                  : '무엇을 만들고 싶으신지 간단히 써주세요'
              }
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            <button
              onClick={handleSeedSubmit}
              disabled={!seedKeyword.trim()}
              className="mt-4 flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-target"
            >
              질문 받기
              <ArrowRight className="size-5" />
            </button>
          </div>
        )}

        {/* STEP: AI 질문 생성 로딩 */}
        {status === 'loading_questions' && (
          <div className="flex flex-col items-center gap-4 py-20 animate-fade-in">
            <Loader2 className="size-10 text-accent animate-spin" />
            <p className="text-muted-foreground">맞춤 질문을 준비하고 있어요...</p>
          </div>
        )}

        {/* STEP 2: 질문 인터뷰 */}
        {status === 'questioning' && currentQ && (
          <div className="animate-slide-up">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-accent">
              {currentIndex + 1} / {activeQuestions.length}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 leading-snug">
              {currentQ.text}
            </h2>
            {currentQ.hint && (
              <div className="flex items-start gap-2 mb-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                <HelpCircle className="size-4 shrink-0 mt-0.5 text-accent" />
                <span>{currentQ.hint}</span>
              </div>
            )}

            {/* 선택형 */}
            {(currentQ.type === 'choice' || currentQ.type === 'multichoice') && currentQ.options && (
              <div className="grid gap-2">
                {currentQ.options.map((opt) => {
                  const isSelected = currentQ.type === 'multichoice'
                    ? currentAnswer.split(',').filter(Boolean).includes(opt.value)
                    : currentAnswer === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (currentQ.type === 'multichoice') {
                          const arr = currentAnswer ? currentAnswer.split(',').filter(Boolean) : [];
                          const idx = arr.indexOf(opt.value);
                          const next = idx >= 0 ? arr.filter((v) => v !== opt.value) : [...arr, opt.value];
                          setCurrentAnswer(next.join(','));
                        } else {
                          setCurrentAnswer(opt.value);
                        }
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors touch-target
                        ${isSelected
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-card text-foreground hover:border-accent/50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 텍스트 단답 */}
            {currentQ.type === 'text' && (
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAnswerSubmit()}
                placeholder={currentQ.placeholder}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}

            {/* 텍스트 장문 */}
            {currentQ.type === 'textarea' && (
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={currentQ.placeholder}
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleAnswerSubmit}
                disabled={currentQ.required && !currentAnswer.trim()}
                className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-target"
              >
                {currentIndex + 1 >= activeQuestions.length ? '주문서 만들기' : '다음'}
                <ArrowRight className="size-5" />
              </button>
              {currentQ.skippable && (
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors touch-target"
                >
                  <SkipForward className="size-4" />
                  건너뛰기
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP: 생성 중 */}
        {status === 'generating' && (
          <div className="flex flex-col items-center gap-4 py-20 animate-fade-in">
            <div className="relative size-16">
              <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
              <div className="relative flex size-16 items-center justify-center rounded-full bg-accent/10">
                <Loader2 className="size-8 text-accent animate-spin" />
              </div>
            </div>
            <p className="text-lg font-semibold text-foreground">주문서를 만들고 있어요</p>
            <p className="text-sm text-muted-foreground">답변을 분석해 최적의 AI 주문서를 조립 중...</p>
          </div>
        )}

        {/* STEP 3: 결과 */}
        {status === 'done' && result && (
          <div className="animate-slide-up space-y-6">
            <div>
              <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-success">완성!</div>
              <h2 className="text-2xl font-bold text-foreground">AI 주문서가 준비됐어요</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                아래 주문서를 복사해 AI 도구에 붙여넣으세요.
              </p>
            </div>

            {result.explanation && (
              <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 text-sm text-foreground leading-relaxed">
                <span className="font-semibold text-accent">✦ 이 주문서는요 —</span>
                <p className="mt-1">{result.explanation}</p>
              </div>
            )}

            {/* 메인 프롬프트 */}
            <div className="relative rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI 주문서</span>
                <button
                  onClick={() => handleCopy(fullPrompt)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  {copied ? '복사됨!' : '복사'}
                </button>
              </div>
              <div className="p-4 font-mono text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
                {result.prompt}
                {result.parameters && <span className="text-muted-foreground"> {result.parameters}</span>}
              </div>
            </div>

            {result.tips && (
              <p className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3">
                💡 {result.tips}
              </p>
            )}

            {/* 외부 도구 버튼 */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">어디서 사용하실 건가요?</p>
              <div className="flex flex-wrap gap-2">
                {EXTERNAL_TOOLS[outputType].map(({ name, url }) =>
                  url ? (
                    <button
                      key={name}
                      onClick={() => handleOpen(url, fullPrompt)}
                      className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-accent/50 hover:text-accent transition-colors touch-target"
                    >
                      <ExternalLink className="size-3.5" />
                      {name}에서 열기
                    </button>
                  ) : null
                )}
              </div>
            </div>

            {/* 저장 + 다시 만들기 */}
            <div className="pt-4 border-t border-border flex flex-wrap gap-3">
              {user && !savedId && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <BookmarkCheck className="size-4" />}
                  {saving ? '저장 중...' : '내 서재에 저장'}
                </button>
              )}
              {savedId && (
                <Link
                  href={`/library/${savedId}`}
                  className="flex items-center gap-2 rounded-xl bg-success/10 border border-success/30 px-5 py-3 text-sm font-semibold text-success hover:bg-success/20 transition-colors"
                >
                  <Check className="size-4" />
                  저장됨 — 서재에서 보기
                </Link>
              )}
              <button
                onClick={resetSession}
                className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors touch-target"
              >
                다시 만들기
              </button>
              <Link
                href="/studio"
                className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors touch-target"
              >
                다른 유형 선택
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function StudioCreatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    }>
      <StudioCreateContent />
    </Suspense>
  );
}
