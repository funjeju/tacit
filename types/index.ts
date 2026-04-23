import type { Timestamp } from 'firebase/firestore';

// ──── 출력 유형 ────
export type OutputType = 'image' | 'report' | 'video' | 'ppt' | 'code' | 'music';

// ──── 도메인 ────
export type DomainId = 'restaurant' | 'education' | 'real_estate' | 'beauty' | 'small_biz' | 'service';

// ──── 사용자 ────
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  ageRange?: '30s' | '40s' | '50s' | '60s+';
  region?: string;
  primaryDomain?: string;
  role: 'user' | 'pro' | 'admin';
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en' | 'ja';
  fontSize: 'normal' | 'large' | 'xlarge';
  onboardingCompleted: boolean;
  onboardingStep?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}

// ──── 도메인 프로필 ────
export interface DomainProfile {
  profileId: string;
  userId: string;
  domainId: string;
  domainLabel: string;
  customLabel?: string;
  sourceInterviewId: string;
  experience: {
    years: number;
    specialty: string[];
    highlights: string;
  };
  judgmentPatterns: {
    criteria: string[];
    examples: string[];
  };
  methodology: {
    routines: string[];
    philosophy: string;
  };
  terminology: string[];
  taboos: string[];
  toneAndVoice: string;
  rawSummary: string;
  embeddingId?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ──── 프롬프트 ────
export interface Prompt {
  promptId: string;
  ownerId: string;
  type: OutputType;
  domainId?: string;
  typeSubcategory?: string;
  userInputs: {
    initialKeyword: string;
    answers: Array<{
      questionId: string;
      questionText: string;
      answer: string;
    }>;
  };
  usedProfileId?: string;
  finalPrompt: string;
  finalPromptStructured?: object;
  targetTool: 'chatgpt' | 'claude' | 'midjourney' | 'dalle' | 'gamma' | 'veo' | 'suno' | 'runway' | 'custom';
  isPublished: boolean;
  publishedAt?: Timestamp;
  stats: {
    views: number;
    copies: number;
    likes: number;
    uses: number;
  };
  tags: string[];
  currentVersion: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ──── 인터뷰 ────
export interface Interview {
  interviewId: string;
  userId: string;
  domainId?: string;
  customDomain?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  questionsAsked: number;
  questionsAnswered: number;
  targetQuestionCount: number;
  inputMode: 'text' | 'voice' | 'mixed';
  totalDurationSec?: number;
  generatedProfileId?: string;
  startedAt: Timestamp;
  lastActivityAt: Timestamp;
  completedAt?: Timestamp;
}

// ──── 템플릿 질문 ────
export interface TemplateQuestion {
  id: string;
  order: number;
  text: string;
  type: 'text' | 'textarea' | 'choice' | 'multichoice' | 'slider' | 'image';
  category: 'purpose' | 'audience' | 'style' | 'content' | 'constraint' | 'context';
  options?: Array<{ value: string; label: string; hint?: string }>;
  placeholder?: string;
  hint?: string;
  required: boolean;
  skippable: boolean;
  dependsOn?: { questionId: string; value: string | string[] };
  prefillFromProfile?: string;
}

// ──── 도메인 템플릿 ────
export interface DomainTemplate {
  id: string;
  domainId: DomainId;
  subtype: string;
  outputType: OutputType;
  name: string;
  description: string;
  estimatedTime: string;
  questions: TemplateQuestion[];
  assemblyPromptKey: string;
  sampleOutput?: string;
  usageCount: number;
}

// ──── 외부 AI 도구 ────
export interface ExternalTool {
  name: string;
  url: string | null;
  type: 'copy-only' | 'copy-and-open' | 'url-param';
}

// ──── 생성된 프롬프트 결과 ────
export interface GeneratedPromptResult {
  prompt: string;
  parameters?: string;
  variations?: string[];
  explanation?: string;
  structure?: string[];
  tips?: string;
}

// ──── 스튜디오 세션 ────
export interface StudioSession {
  sessionId: string;
  outputType: OutputType;
  domainId?: string;
  templateId?: string;
  seedKeyword: string;
  questions: TemplateQuestion[];
  answers: Record<string, string>;
  currentQuestionIndex: number;
  status: 'setup' | 'questioning' | 'generating' | 'done';
}
