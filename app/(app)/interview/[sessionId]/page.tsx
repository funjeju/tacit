'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { trackInterviewCompleted, trackProfileCreated } from '@/lib/analytics';
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  Loader2,
  Check,
  Brain,
  Sparkles,
  Volume2,
} from 'lucide-react';

type InterviewStatus = 'questioning' | 'loading_next' | 'completing' | 'done' | 'error';

interface ProfileResult {
  domainLabel?: string;
  experience?: { years: number; specialty: string[]; highlights: string };
  judgmentPatterns?: { criteria: string[]; examples: string[] };
  methodology?: { routines: string[]; philosophy: string };
  terminology?: string[];
  rawSummary?: string;
}

// Web Speech API 타입
interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    SpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export default function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, loading } = useAuthStore();
  const router = useRouter();

  const [status, setStatus] = useState<InterviewStatus>('questioning');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [streamingQuestion, setStreamingQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answeredCount, setAnsweredCount] = useState(0);
  const [targetCount] = useState(20);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [whisperSupported, setWhisperSupported] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [domainId, setDomainId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 첫 질문 로드 (세션 ID로 Firestore에서 openingQuestion 복원)
  useEffect(() => {
    if (!user || !sessionId) return;

    async function loadSession() {
      try {
        const token = await user!.getIdToken();
        // 세션 정보는 /api/interview/start에서 openingQuestion을 반환했지만,
        // 페이지 새로고침 시를 위해 별도 조회 필요 → 여기선 URL state로 처리
        // 첫 질문이 없으면 question API로 undefined answer를 보내 첫 질문을 받음
        // 실제로는 router.push 직전에 state 전달하는 게 더 좋지만,
        // 여기선 sessionStorage 활용
        const storedDomain = sessionStorage.getItem(`interview-${sessionId}-domain`);
        if (storedDomain) {
          setDomainId(storedDomain);
          sessionStorage.removeItem(`interview-${sessionId}-domain`);
        }
        const stored = sessionStorage.getItem(`interview-${sessionId}-question`);
        if (stored) {
          setCurrentQuestion(stored);
          sessionStorage.removeItem(`interview-${sessionId}-question`);
        } else {
          // fallback: 세션 초기 질문 재요청
          setCurrentQuestion('');
          setStatus('loading_next');
          await submitAnswer('', token);
        }
      } catch {
        setError('세션을 불러오지 못했어요.');
      }
    }

    loadSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionId]);

  // 음성 입력 방식 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(hasSpeech);
    // Web Speech 없는 환경(iOS Safari)에서 MediaRecorder가 있으면 Whisper 폴백 활성화
    if (!hasSpeech && typeof MediaRecorder !== 'undefined') {
      setWhisperSupported(true);
    }
  }, []);

  const toggleVoiceInput = useCallback(() => {
    if (!speechSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setAnswer(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, speechSupported]);

  async function startWhisperRecording() {
    if (!whisperSupported || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 1000) { setIsRecording(false); return; }
        setTranscribing(true);
        try {
          const token = await user!.getIdToken();
          const fd = new FormData();
          fd.append('audio', blob, `recording.${mimeType.includes('webm') ? 'webm' : 'mp4'}`);
          const res = await fetch('/api/interview/transcribe', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.text) setAnswer((prev) => prev ? `${prev} ${data.text}` : data.text);
          }
        } catch {
          // 변환 실패 시 무시
        } finally {
          setTranscribing(false);
          setIsRecording(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      // 마이크 권한 거부 등
    }
  }

  function stopWhisperRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function submitAnswer(currentAnswer: string, existingToken?: string) {
    if (!user) return;
    setStatus('loading_next');
    setStreamingQuestion('');
    setError(null);

    try {
      const token = existingToken ?? await user.getIdToken();
      const res = await fetch('/api/interview/question', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answer: currentAnswer }),
      });

      if (!res.ok) throw new Error();

      // 답변 완료 신호 체크 (JSON 응답)
      const contentType = res.headers.get('Content-Type') ?? '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.done) {
          await completeInterview();
          return;
        }
      }

      // SSE 스트리밍 파싱
      const reader = res.body?.getReader();
      if (!reader) throw new Error();
      const decoder = new TextDecoder();
      let accumulated = '';

      setStatus('questioning');
      setCurrentQuestion('');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) {
              accumulated += parsed.text;
              setStreamingQuestion(accumulated);
            }
            if (parsed.done === false && typeof parsed.answeredCount === 'number') {
              setAnsweredCount(parsed.answeredCount);
              if (parsed.answeredCount >= targetCount) {
                await completeInterview();
                return;
              }
            }
          } catch { /* ignore parse errors */ }
        }
      }

      setCurrentQuestion(accumulated.trim());
      setStreamingQuestion('');
      setAnswer('');
      textareaRef.current?.focus();
    } catch {
      setError('질문을 불러오지 못했어요. 다시 시도해 주세요.');
      setStatus('questioning');
    }
  }

  async function completeInterview() {
    if (!user) return;
    setStatus('completing');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/interview/complete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(data.profile);
      setProfileId(data.profileId);
      setStatus('done');
      trackInterviewCompleted({ domainId, questionsAnswered: answeredCount });
      if (data.profileId) trackProfileCreated({ domainId });
    } catch {
      setError('프로필 생성에 실패했어요. 잠시 후 다시 시도해 주세요.');
      setStatus('questioning');
    }
  }

  function handleSubmit() {
    if (!answer.trim() || status !== 'questioning') return;
    submitAnswer(answer);
  }

  const progress = Math.min((answeredCount / targetCount) * 100, 100);
  const displayQuestion = streamingQuestion || currentQuestion;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 flex items-center justify-between h-14">
          <Link
            href="/interview"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="text-sm">인터뷰 홈</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Mic className="size-4 text-accent" />
            <span className="font-medium text-foreground">암묵지 인터뷰</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {answeredCount}/{targetCount}
          </span>
        </div>
        {/* 프로그레스 */}
        <div className="h-1 bg-muted">
          <div
            className="h-1 bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 질문 중 / 로딩 */}
        {(status === 'questioning' || status === 'loading_next') && (
          <div className="animate-fade-in">
            {/* AI 아바타 */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-10 items-center justify-center rounded-full bg-accent/10">
                <Brain className="size-5 text-accent" />
              </div>
              <div className="text-sm text-muted-foreground">Tacit 인터뷰어</div>
            </div>

            {/* 질문 */}
            <div className="min-h-[80px] mb-8">
              {status === 'loading_next' && !streamingQuestion ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm">다음 질문을 준비하는 중...</span>
                </div>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                  {displayQuestion}
                  {streamingQuestion && (
                    <span className="inline-block w-0.5 h-6 bg-accent ml-1 animate-pulse" />
                  )}
                </p>
              )}
            </div>

            {/* 입력 영역 */}
            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="자유롭게 답변해 주세요. 길어도 괜찮아요."
                rows={4}
                disabled={status === 'loading_next'}
                className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 transition-shadow"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || status === 'loading_next'}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === 'loading_next' ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      다음 질문
                      <ArrowRight className="size-5" />
                    </>
                  )}
                </button>

                {/* Web Speech API (Chrome/Android) */}
                {speechSupported && (
                  <button
                    onClick={toggleVoiceInput}
                    disabled={status === 'loading_next'}
                    className={`flex size-12 items-center justify-center rounded-xl border transition-colors
                      ${isListening
                        ? 'border-accent bg-accent/10 text-accent animate-pulse'
                        : 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground'
                      }`}
                    title={isListening ? '음성 입력 중지' : '음성으로 답하기'}
                  >
                    {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                  </button>
                )}

                {/* Whisper 폴백 (iOS Safari) */}
                {!speechSupported && whisperSupported && (
                  <button
                    onClick={isRecording ? stopWhisperRecording : startWhisperRecording}
                    disabled={status === 'loading_next' || transcribing}
                    className={`flex size-12 items-center justify-center rounded-xl border transition-colors
                      ${isRecording
                        ? 'border-destructive bg-destructive/10 text-destructive animate-pulse'
                        : 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground'
                      }`}
                    title={isRecording ? '녹음 중지 (변환)' : '녹음으로 답하기 (iOS)'}
                  >
                    {transcribing ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="size-5" />
                    ) : (
                      <Mic className="size-5" />
                    )}
                  </button>
                )}
              </div>

              {isListening && (
                <div className="flex items-center gap-2 text-sm text-accent animate-pulse">
                  <Volume2 className="size-4" />
                  <span>듣고 있어요... 말씀해 주세요</span>
                </div>
              )}
              {isRecording && (
                <div className="flex items-center gap-2 text-sm text-destructive animate-pulse">
                  <Mic className="size-4" />
                  <span>녹음 중... 완료하면 버튼을 다시 눌러주세요</span>
                </div>
              )}
              {transcribing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>음성을 텍스트로 변환하고 있어요...</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Enter로 제출 · Shift+Enter 줄바꿈
                {answeredCount >= 5 && (
                  <button
                    onClick={completeInterview}
                    className="ml-3 underline hover:text-foreground transition-colors"
                  >
                    여기서 마무리하기
                  </button>
                )}
              </p>
            </div>
          </div>
        )}

        {/* 프로필 생성 중 */}
        {status === 'completing' && (
          <div className="flex flex-col items-center gap-6 py-20 animate-fade-in text-center">
            <div className="relative size-20">
              <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-accent/10">
                <Brain className="size-10 text-accent" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground mb-2">
                노하우를 정리하고 있어요
              </p>
              <p className="text-sm text-muted-foreground">
                인터뷰 내용을 분석해 나만의 AI 프로필을 만드는 중...<br />
                잠시만 기다려 주세요 (30~60초)
              </p>
            </div>
          </div>
        )}

        {/* 완료 */}
        {status === 'done' && profile && (
          <div className="animate-slide-up space-y-6">
            <div className="text-center mb-8">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-success/10 mx-auto mb-4">
                <Check className="size-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                프로필이 완성됐어요!
              </h2>
              <p className="text-muted-foreground text-sm">
                이제 AI 주문서를 만들 때 이 프로필이 자동으로 반영됩니다.
              </p>
            </div>

            {/* 프로필 미리보기 */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              {profile.experience && (
                <ProfileSection title="경력 & 전문 분야">
                  <p className="text-sm text-foreground">{profile.experience.highlights}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {profile.experience.specialty.map((s) => (
                      <span key={s} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                        {s}
                      </span>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {profile.methodology?.philosophy && (
                <ProfileSection title="운영 철학">
                  <p className="text-sm text-foreground">{profile.methodology.philosophy}</p>
                </ProfileSection>
              )}

              {profile.terminology && profile.terminology.length > 0 && (
                <ProfileSection title="전문 어휘">
                  <div className="flex flex-wrap gap-1.5">
                    {profile.terminology.map((t) => (
                      <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {profile.rawSummary && (
                <ProfileSection title="종합 요약">
                  <p className="text-sm text-foreground leading-relaxed">{profile.rawSummary}</p>
                </ProfileSection>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/studio"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                <Sparkles className="size-5" />
                AI 주문서 만들기
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-3.5 font-medium text-foreground hover:bg-muted transition-colors"
              >
                대시보드로 이동
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
