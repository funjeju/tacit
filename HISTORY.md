# HISTORY.md — Tacit 개발 이벤트 & 이슈 로그

> 날짜 내림차순. 주요 이벤트, 결정, 이슈, 해결책을 기록합니다.

---

## 2026-04-24 (목) — Day 1~2: 킥오프 + 코어 인프라

### ✅ 완료 이벤트

#### Day 1 (오전~오후)

| 이벤트 |
|--------|
| spec 폴더 18개 문서 전체 리뷰 (README, PRD, ARCHITECTURE, TECH_STACK, DATABASE_SCHEMA, DESIGN_SYSTEM, DARK_LIGHT_MODE, PROMPT_ENGINE, DOMAIN_TEMPLATES, DEVELOPMENT_ROADMAP 등) |
| Next.js 16 프로젝트 초기화 (tacit-temp → tacit 디렉터리 이동) |
| 핵심 의존성 설치: firebase, firebase-admin, @anthropic-ai/sdk, zustand, react-hook-form, zod, framer-motion, lucide-react, @supabase/supabase-js, tailwindcss-animate |
| shadcn/ui components.json 수동 설정 (interactive CLI 우회) |
| tailwind.config.ts — Tacit Ink, Amber, Moss, Warm Gray 팔레트 + CSS 변수 연결 |
| globals.css — 라이트/다크 모드 CSS 변수 전체, WCAG AA 충족 |
| ThemeProvider + FOUC 방지 인라인 스크립트 |
| app/layout.tsx — 한국어 루트 레이아웃, ThemeProvider 래핑 |
| types/index.ts — User, Prompt, Interview, DomainProfile 등 전체 타입 정의 |
| lib/firebase/client.ts + admin.ts — getFirestore(app, '(default)') 명시 |
| lib/anthropic/client.ts — lazy 초기화 (빌드타임 오류 방지) |
| lib/anthropic/prompts/system.ts — 3단 레이어 시스템 프롬프트 + Prompt Caching |
| app/page.tsx — 랜딩 페이지 (히어로, 유형 선택, 도메인 선택, 3단계 설명, CTA) |
| app/(app)/studio/page.tsx — 스튜디오 홈 |
| app/(app)/studio/create/page.tsx — 인터뷰 세션 UI (seed→질문→생성→결과) |
| app/(app)/studio/[domainId]/page.tsx — 도메인별 템플릿 목록 |
| app/api/prompt/questions/route.ts — Claude Haiku 질문 생성 API |
| app/api/prompt/generate/route.ts — Claude Sonnet 프롬프트 조립 API |

#### Day 2-3 (이어서)

| 이벤트 |
|--------|
| lib/firebase/auth.ts — Google OAuth (signInWithGoogle, signOut, onAuthChange, ensureUserDocument) |
| lib/stores/useAuthStore.ts — Zustand Auth 스토어 |
| components/providers/AuthProvider.tsx — Firebase → Zustand 연결 |
| components/layout/AppHeader.tsx — 스티키 헤더, 모바일 드로어, 인증 상태 반영 |
| app/(app)/layout.tsx — 앱 셸 레이아웃 (AppHeader + AuthProvider) |
| app/auth/login/page.tsx — Google 로그인 페이지, 에러 상태 |
| middleware.ts — /library, /interview, /profile, /settings, /admin 보호 |
| app/api/prompt/stream/route.ts — SSE 스트리밍 (ReadableStream + text/event-stream) |
| app/api/prompt/start/route.ts — 세션 생성 (게스트/회원 공통) |
| app/api/prompt/save/route.ts — 결과 저장 + 월간 사용량 카운터 |
| app/api/prompts/route.ts — 서재 목록 조회 API (유형 필터, 최신순) |
| app/(app)/library/page.tsx — 서재 페이지 (필터, 복사, 빈 상태) |
| seeds/templates/restaurant/restaurant_templates.json — 식당 템플릿 5종 |
| seeds/templates/education/education_templates.json — 교사 템플릿 5종 |
| seeds/templates/real_estate/real_estate_templates.json — 부동산 템플릿 5종 |
| scripts/seed-templates.ts — Firestore 시드 스크립트 (batch 업로드) |
| FEATURE.md, HISTORY.md 업데이트 |
| app/(app)/library/[promptId]/page.tsx — 서재 상세 (공개 토글, Q&A 히스토리, 외부 도구) |
| app/(app)/dashboard/page.tsx — 대시보드 (통계, 최근 주문서, 도메인 바로가기) |
| app/(app)/settings/page.tsx — 설정 (테마, 글자 크기, 로그아웃) |
| app/api/me/route.ts — 사용자 정보 GET/PATCH |
| app/api/prompt/[promptId]/route.ts — 단건 조회/수정 GET/PATCH |
| firestore.rules — Security Rules (users, prompts, domainTemplates, domainProfiles, interviews) |
| lib/firebase/admin.ts — Proxy lazy init (빌드타임 오류 해결) |
| lib/firebase/client.ts — apiKey guard (SSR/build 안전) |
| middleware.ts → proxy.ts (Next.js 16 컨벤션 마이그레이션) |
| app/(app)/layout.tsx — dynamic='force-dynamic' 추가 |
| next.config.ts — turbopack.root 설정 |
| npm run build 통과 (17개 라우트, TypeScript 오류 없음) |
| app/api/templates/route.ts — JSON 시드 파일 서빙 (도메인별 + 단건) |
| app/(app)/studio/create/page.tsx — 템플릿 모드 (고정 질문, dependsOn 필터, 저장 버튼) |
| app/api/square/route.ts — 공개 프롬프트 피드 (좋아요순, 커서 페이징) |
| app/api/square/[promptId]/like/route.ts — 좋아요 토글 |
| app/(app)/square/page.tsx — 광장 피드 페이지 |
| firestore.indexes.json — 복합 인덱스 4종 |
| firebase.json — Firestore 배포 설정 |
| app/not-found.tsx — 커스텀 404 |
| app/error.tsx — 전역 에러 바운더리 |
| app/(app)/profile/page.tsx — 프로필 페이지 |
| AppHeader — 프로필 아바타 링크 + 대시보드 링크 추가 |
| npm run build 통과 (23개 라우트, TypeScript 오류 없음) |
| lib/anthropic/prompts/interview.ts — buildInterviewerPrompt, OPENING_QUESTIONS, buildNextQuestionTask, buildProfileGenerationTask |
| app/api/interview/start/route.ts — 세션 생성 (qaHistory 오프닝 질문 포함) |
| app/api/interview/question/route.ts — 답변 저장 + Claude Haiku SSE 스트리밍 다음 질문 생성 |
| app/api/interview/complete/route.ts — Claude Sonnet DomainProfile JSON 생성 + domainProfiles 저장 |
| app/(app)/interview/page.tsx — 도메인 선택 홈 (restaurant/education/real_estate) |
| app/(app)/interview/[sessionId]/page.tsx — 활성 인터뷰 세션 (SSE, 음성입력, 진행바, 조기완료, 완료화면) |
| vercel.json — 배포 설정 (maxDuration 60/120, Vercel 시크릿 env var 10종) |
| npm run build 통과 (28개 라우트, TypeScript 오류 없음) |
| app/api/me/profiles/route.ts — 사용자 활성 도메인 프로필 목록 API |
| app/api/prompt/generate/route.ts — profileId 파라미터 추가, DomainProfile → buildLayerB + buildAssemblerTask 주입 |
| app/(app)/studio/create/page.tsx — 활성 프로필 자동 로드 + Sparkles 배너 UI |
| app/api/square/[promptId]/copy/route.ts — 공개 프롬프트 복제 API |
| app/(app)/square/page.tsx — 복제 버튼 + forkedIds 상태 관리 |
| lib/stores/useToastStore.ts — Zustand 토스트 스토어 (success/error/info) |
| components/ui/Toast.tsx — 우하단 고정 토스트 컨테이너 UI |
| app/(app)/layout.tsx — ToastContainer 전역 주입 |
| app/api/admin/stats/route.ts — 플랫폼 전체 통계 API (ADMIN_UIDS 접근 제한) |
| app/(app)/admin/page.tsx — 관리자 대시보드 (통계 카드, 완료율, 최근 주문서 테이블) |
| npm run build 통과 (32개 라우트, TypeScript 오류 없음) |

### ⚠️ 이슈 & 해결

#### ISSUE-009: Next.js 16 Dynamic Route params → Promise
- **현상**: `app/api/square/[promptId]/copy/route.ts`에서 `params: { promptId: string }` 타입 오류 — Next.js 16에서 params가 `Promise<...>`로 변경
- **해결**: `{ params }: { params: Promise<{ promptId: string }> }` + `const { promptId } = await params`
- **교훈**: Next.js 16 dynamic route handler의 params는 반드시 await 필요 (이전에도 같은 패턴 적용된 라우트 있음 — 신규 라우트 생성 시 동일 패턴 반드시 사용)

#### ISSUE-008: SpeechRecognition TypeScript 오류
- **현상**: `interview/[sessionId]/page.tsx`에서 `Cannot find name 'SpeechRecognition'` — built-in DOM 타입 없음
- **해결**: `SpeechRecognitionInstance`, `SpeechRecognitionEvent`, `SpeechRecognitionResultList`, `SpeechRecognitionResult` 커스텀 인터페이스 직접 선언
- **교훈**: Web Speech API는 `@types/dom-speech-recognition` 또는 직접 타입 선언 필요

#### ISSUE-001: create-next-app 디렉터리 충돌
- **현상**: `spec` 폴더가 있어 `npx create-next-app@latest .` 실패
- **해결**: 임시 디렉터리(`tacit-temp`)에 생성 후 `cp -r` 이동
- **후속**: tacit-temp 디렉터리 삭제

#### ISSUE-002: shadcn init interactive CLI 우회 불가
- **현상**: `npx shadcn@latest init -y`가 interactive 프롬프트 요구
- **해결**: `components.json` 수동 작성, Radix UI 개별 설치
- **후속**: shadcn 컴포넌트 필요 시 `npx shadcn@latest add <component>` 개별 실행

#### ISSUE-003: Anthropic 클라이언트 빌드타임 초기화 오류
- **현상**: `lib/anthropic/client.ts`에서 모듈 로드 시 `ANTHROPIC_API_KEY` 없어 throw → 빌드 실패
- **원인**: 빌드타임에 API Route가 정적 분석될 때 모듈이 실행됨
- **해결**: 싱글톤 패턴 + lazy 초기화 (`_client` 변수, getter 패턴)
- **교훈**: 환경변수 의존 클라이언트는 반드시 lazy 초기화

#### ISSUE-005: Firebase Admin 빌드타임 초기화 오류
- **현상**: `lib/firebase/admin.ts`의 `initAdmin()` + `getFirestore()`가 모듈 로드 시 실행 → 환경변수 없어 throw
- **해결**: `adminDb`, `adminAuth`를 JS Proxy로 감싸 lazy 초기화
- **교훈**: 서버 SDK도 lazy init 필수

#### ISSUE-006: Firebase Client SSR 오류
- **현상**: `studio/create` 프리렌더링 중 Firebase `auth/invalid-api-key` 오류
- **원인**: `lib/firebase/client.ts`가 모듈 평가 시 `initializeApp()` 실행 → 빌드타임 env var 없음
- **해결**: `apiKey` 없으면 null 반환 + `app/(app)/layout.tsx`에 `dynamic = 'force-dynamic'`
- **교훈**: Firebase Client SDK는 브라우저 전용 — SSR 중 초기화 방지 필요

#### ISSUE-007: Next.js 16 middleware → proxy 컨벤션 변경
- **현상**: `middleware.ts` 존재 시 빌드 warning → `proxy.ts`와 공존 불가 에러
- **해결**: `middleware.ts` 삭제, `proxy.ts`에서 `export function proxy(request)` 사용
- **교훈**: Next.js 16에서 Middleware → Proxy 이름 변경 (기능 동일)

#### ISSUE-004: Next.js 버전 16 (spec은 14 기준)
- **현상**: spec에 Next.js 14 기준 작성되어 있으나 create-next-app이 16 설치
- **결정**: Next.js 16 사용 (App Router 구조 동일, 호환성 문제 없음)
- **영향**: 없음

### 📌 결정 사항

1. **shadcn 컴포넌트**: 빌드 blocking 없이 components.json 수동 설정, 필요 컴포넌트만 add
2. **Prompt Caching**: Layer A + Layer B에 `cache_control: { type: 'ephemeral' }` 적용 (~55% 비용 절감 예상)
3. **Anthropic Client**: lazy getter 패턴 — `anthropic.messages.create()` 호출 시점에 초기화
4. **다크모드**: `class` 기반 (`darkMode: 'class'`), FOUC 방지 인라인 스크립트
5. **게스트 세션**: `/api/prompt/start` + `/api/prompt/stream`은 비회원 허용, `/api/prompt/save`는 인증 필수
6. **미들웨어 쿠키**: `tacit-session` 쿠키로 보호 경로 게이팅 (Firebase ID 토큰 쿠키)
7. **템플릿 시드**: JSON 파일로 관리, `scripts/seed-templates.ts`로 Firestore 일괄 업로드

### 📊 Day 1~4 진행률

- **Week 1 목표**: 100% 완료
- **Week 2 목표**: 100% 완료 (템플릿 시스템, 서재, 대시보드, 설정)
- **Week 3 목표**: 100% 완료 (암묵지 인터뷰 모드 — Layer 4 전체)
- **Week 4 목표**: 100% 완료 (Square 복제, Admin 대시보드, DomainProfile → 엔진 연결, Toast 시스템)
- 총 라우트: 32개 (API 17 + 페이지 15)
- 남은 것: `.env.local` 실제 연동 테스트, Vercel 시크릿 등록 후 프로덕션 배포, Supabase pgvector (stretch)

---

## [예정] 2026-04-25 ~ — 배포 & 검증

### 계획
- [ ] `.env.local` 설정 후 실제 Firebase 연동 동작 검증
- [ ] `npm run build` 로컬 프로덕션 빌드 최종 확인
- [ ] Vercel 프로젝트 생성 + 시크릿 등록 (`@tacit-*` 10종)
- [ ] Firestore 보안 규칙 + 인덱스 배포 (`firebase deploy --only firestore`)
- [ ] Vercel 프로덕션 배포 (`vercel --prod`)
- [ ] 인터뷰 → 주문서 골든 패스 E2E 수동 테스트
- [ ] Supabase pgvector 임베딩 (stretch)
