# TECH_STACK.md — Tacit 기술 스택

## 1. 스택 요약

| 영역 | 기술 | 버전 | 이유 |
|------|------|------|------|
| 프론트엔드 프레임워크 | Next.js | 14.x (App Router) | SSR + SSG 하이브리드, Server Components, Vercel 네이티브 |
| 언어 | TypeScript | 5.x strict | 타입 안전성, Claude Code 이해도 ↑ |
| 스타일링 | Tailwind CSS | 3.x | 유틸리티 퍼스트, 디자인 시스템 구현 용이 |
| 컴포넌트 라이브러리 | shadcn/ui | latest | 코드 복사 기반, 완전 커스터마이즈 가능 |
| 아이콘 | Lucide React | latest | 일관된 스타일, 가볍다 |
| 애니메이션 | Framer Motion | 11.x | 복잡한 전환, 성능 좋음 |
| 폼 관리 | React Hook Form + Zod | latest | 성능 + 스키마 검증 |
| 상태 관리 | Zustand | 4.x | 가볍고 심플, 큰 학습곡선 없음 |
| AI 오케스트레이션 | Anthropic SDK | latest | Claude API 공식 SDK |
| 인증 | Firebase Auth | 10.x | OAuth 제공자 다양, 한국 서비스 통합 용이 |
| 데이터베이스 | Firestore | 10.x | 실시간 동기화, 서버리스 |
| 파일 저장 | Firebase Storage | 10.x | Firebase 통합, 보안 규칙 편리 |
| 벡터 DB | Supabase pgvector | latest | 비용 효율, SQL 친화 |
| 서버리스 함수 | Firebase Functions | 5.x (2세대) | Firebase 통합, cold start 개선됨 |
| 배포 | Vercel + Firebase | - | 프론트 Vercel, 백엔드 Firebase |
| 모니터링 | Sentry + Vercel Analytics | latest | 에러 + 성능 |
| 분석 | GA4 + Amplitude | latest | 전환 퍼널 분석 |
| 디자인 도구 | Figma + Figma MCP | latest | 디자인 시스템 소스 오브 트루스 |

---

## 2. 프론트엔드 상세

### 2.1 Next.js 14 설정 원칙
- **App Router 전용** (Pages Router 금지)
- **React Server Components 기본**, Client Components는 `'use client'` 명시
- **Route Groups 사용**: `(marketing)`, `(app)` 등으로 레이아웃 분리
- **Parallel Routes**: 인터뷰 진행률 사이드바 등에 활용
- **Streaming**: `loading.tsx` + Suspense 적극 사용

### 2.2 Tailwind CSS 설정
- **CSS 변수 기반 테마**: 다크/라이트 모드 스위칭 최적화 (`DARK_LIGHT_MODE.md` 참고)
- **커스텀 토큰**: `tailwind.config.ts`에 디자인 시스템 토큰 반영
- **@apply 지양**: 컴포넌트에서 직접 유틸리티 클래스 사용
- **Arbitrary values 최소화**: 디자인 시스템에 없는 값 사용 시 토큰 추가 우선

### 2.3 shadcn/ui 활용 원칙
- **직접 복사해 프로젝트에 포함**: `npx shadcn@latest add button` 등
- **커스터마이즈 필수**: Tacit 디자인 시스템 반영
- **접근성 기본 지원**: Radix UI 기반이라 a11y 대응 쉬움

### 2.4 폴더 구조
```
app/
  (marketing)/
    page.tsx              # 랜딩
    pricing/
      page.tsx
  (app)/
    layout.tsx            # 로그인 필요 레이아웃
    studio/
      page.tsx            # 메타프롬프트 스튜디오
      [typeId]/
        page.tsx          # 유형별 상세
    library/
      page.tsx            # 내 서재
      [promptId]/
        page.tsx
    interview/
      page.tsx            # 인터뷰 시작
      [sessionId]/
        page.tsx          # 인터뷰 진행
    square/
      page.tsx            # 피드
      [promptId]/
        page.tsx
  api/
    prompt/
      generate/
        route.ts          # POST: 프롬프트 생성
    interview/
      next-question/
        route.ts
      finalize/
        route.ts
    square/
      publish/
        route.ts
      feed/
        route.ts
  layout.tsx              # 루트 레이아웃 (ThemeProvider 등)

components/
  ui/                     # shadcn/ui 기반 기본 컴포넌트
  layout/                 # Header, Footer, Sidebar
  studio/                 # 스튜디오 전용 컴포넌트
  interview/              # 인터뷰 전용 컴포넌트
  square/                 # Square 전용 컴포넌트
  theme/                  # 테마 관련 (ThemeToggle 등)

lib/
  firebase/
    client.ts             # 클라이언트 Firebase 초기화
    admin.ts              # 서버 사이드 Firebase Admin
    auth.ts
    firestore.ts
  anthropic/
    client.ts             # Anthropic SDK 초기화
    prompts/              # 시스템 프롬프트 템플릿
  utils/
    cn.ts                 # Tailwind 클래스 병합
    analytics.ts
  stores/                 # Zustand 스토어

types/                    # 전역 TypeScript 타입
functions/                # Firebase Functions
  src/
    index.ts
    interview/
    square/
```

---

## 3. 백엔드 상세

### 3.1 Firebase 프로젝트 구조
- **프로젝트 분리**: `tacit-dev`, `tacit-staging`, `tacit-prod`
- **Firestore 모드**: Native mode (Datastore 모드 금지)
- **멀티 리전**: 아시아(서울) 기본, 필요 시 다중 리전

### 3.2 Firebase Functions
- **2세대 함수** 사용 (Cold start 개선, 동시 실행 지원)
- **Node.js 20 런타임**
- **지역**: `asia-northeast3` (서울)
- **메모리**: 기본 512MB, 무거운 작업은 1-2GB

### 3.3 Firestore 연결 주의사항
**반드시 아래 명시적 문법 사용:**
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, '(default)');  // ← '(default)' 명시 필수
```

이 문법 누락 시 연결 실패 버그 발생 가능.

---

## 4. AI 스택

### 4.1 모델 선택 전략

| 용도 | 모델 | 이유 |
|------|------|------|
| 질문 생성 (빈번) | Claude Haiku 4.5 | 저비용, 빠름, 충분한 품질 |
| 최종 프롬프트 조립 | Claude Sonnet 4.6 | 복합 추론, 구조화 품질 우수 |
| 암묵지 인터뷰 | Claude Sonnet 4.6 | 뉘앙스 파악, 후속 질문 품질 |
| 프로필 벡터화 | text-embedding-3-small (OpenAI) | pgvector 최적, 비용 효율 |
| 이미지 프롬프트 실행 | Replicate (Flux) | 고품질 이미지, 비용 합리적 |

### 4.2 Claude API 호출 규칙
- **반드시 서버 사이드에서만 호출** (Route Handler 또는 Firebase Function)
- **스트리밍 우선**: 질문 생성 등 긴 응답은 스트리밍
- **Prompt Caching 적극 활용**: 시스템 프롬프트 캐싱으로 비용 50% 절감
- **에러 재시도**: 429, 5xx는 exponential backoff로 3회까지 재시도

### 4.3 Anthropic SDK 사용 예시
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6-20250101',  // 실제 모델명은 배포 시점 확인
  max_tokens: 2048,
  system: systemPrompt,  // 캐싱 대상
  messages: conversationHistory,
});
```

---

## 5. 상태 관리 전략

### 5.1 Zustand 스토어 구조
```
lib/stores/
  useStudioStore.ts      # 스튜디오 세션 상태
  useInterviewStore.ts   # 인터뷰 진행 상태
  useThemeStore.ts       # 테마 (dark/light)
  useAuthStore.ts        # 인증 상태 래퍼
  useLibraryStore.ts     # 서재 캐시
```

### 5.2 서버 상태 vs 클라이언트 상태
- **서버 상태**: Next.js Server Components + Firestore 직접 조회
- **클라이언트 캐시**: 필요한 경우에만 Zustand
- **실시간 데이터**: Firestore `onSnapshot` 직접 사용 (인터뷰 진행률 등)

### 5.3 폼 상태
- React Hook Form + Zod 스키마 검증
- 긴 폼은 단계별 저장 (Firestore에 autosave)

---

## 6. 환경 변수

`.env.example`:
```env
# Anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL_SONNET=claude-sonnet-4-6-20250101
ANTHROPIC_MODEL_HAIKU=claude-haiku-4-5-20251001

# Firebase (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin (Server)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (Embedding만)
OPENAI_API_KEY=

# Replicate (Image 생성)
REPLICATE_API_TOKEN=

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_AMPLITUDE_API_KEY=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 7. 개발 도구

### 7.1 필수 도구
- **Node.js 20 LTS 이상**
- **pnpm** (npm/yarn보다 빠름, 워크스페이스 지원)
- **Firebase CLI 13+**
- **Vercel CLI**
- **VS Code + Claude Code 확장**
- **Figma + Figma MCP**

### 7.2 권장 VS Code 확장
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Firebase
- Claude Code

### 7.3 코드 품질 도구
- **ESLint**: Next.js 기본 설정 + 커스텀 규칙
- **Prettier**: 포매터 통일
- **Husky + lint-staged**: Pre-commit 자동 린트
- **TypeScript**: strict 모드
- **Vitest**: 단위 테스트
- **Playwright**: E2E 테스트 (2차)

---

## 8. 패키지 설치 명령어

초기 설정:
```bash
# Next.js 프로젝트 생성
npx create-next-app@latest tacit --typescript --tailwind --app --src-dir=false

cd tacit

# 핵심 의존성
pnpm add firebase firebase-admin @anthropic-ai/sdk
pnpm add zustand react-hook-form @hookform/resolvers zod
pnpm add framer-motion lucide-react
pnpm add @supabase/supabase-js openai

# shadcn/ui 초기화
npx shadcn@latest init

# 개발 의존성
pnpm add -D @types/node prettier eslint-config-prettier
pnpm add -D husky lint-staged vitest @testing-library/react

# Firebase Functions
cd functions
npm init -y
npm install firebase-admin firebase-functions @anthropic-ai/sdk
```
