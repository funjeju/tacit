# FEATURE.md — Tacit 기능 구현 현황

> 구현된 기능을 Layer별로 기록합니다. 개발 진행에 따라 지속 업데이트.

---

## Layer 1: 메타프롬프트 엔진 (Core Engine)

### ✅ 완료된 기능

#### 1-1. 프로젝트 초기화 (2026-04-24)
- **스택**: Next.js 16 (App Router) + TypeScript 5 strict + Tailwind CSS 4
- **폴더 구조**: spec/TECH_STACK.md 기준 생성
  - `app/(marketing)` — 랜딩 등 비인증 페이지
  - `app/(app)/studio` — 메타프롬프트 스튜디오
  - `app/api/prompt` — Claude API Route Handler
  - `components/theme` — ThemeProvider, ThemeToggle
  - `lib/firebase` — 클라이언트/어드민 초기화
  - `lib/anthropic` — SDK 클라이언트, 시스템 프롬프트

#### 1-2. 디자인 시스템 구축 (2026-04-24)
- **tailwind.config.ts**: Tacit Ink 팔레트, Amber Warmth, Moss Green, Warm Neutral
- **app/globals.css**: CSS 변수 기반 라이트/다크 모드 전환 토큰
  - `:root` — 라이트 모드 전체 토큰
  - `.dark` — 다크 모드 오버라이드
  - WCAG AA 대비 기준 충족 확인
- **폰트**: Pretendard Variable (시스템 폴백)
- **8px 그리드**, 터치 타깃 44px 강제

#### 1-3. 다크/라이트 모드 (2026-04-24)
- **ThemeProvider** (`components/theme/ThemeProvider.tsx`): light / dark / system 3모드
- **FOUC 방지 스크립트**: `app/layout.tsx` `<head>` 인라인 JS
  - React 하이드레이션 전에 실행 → 테마 플래시 없음
- **localStorage 영속화** + Firestore 동기화 훅(로그인 시)
- **ThemeToggle** (`components/theme/ThemeToggle.tsx`): 드롭다운 없이 인라인 3버튼

#### 1-4. 메타프롬프트 엔진 — 시스템 프롬프트 (2026-04-24)
- **파일**: `lib/anthropic/prompts/system.ts`
- **3단 레이어 구조**:
  - Layer A (Identity): 고정 시스템 역할 지침 — `cache_control: ephemeral` 캐싱
  - Layer B (Context): 세션별 도메인·출력 유형·프로필 컨텍스트 — 캐싱
  - Layer C (Task): 매 턴 변경 (질문 생성 / 프롬프트 조립)
- **지원 출력 유형**: image, report, video, ppt, code, music

#### 1-5. API Route Handlers (2026-04-24)
- `POST /api/prompt/questions` — Claude Haiku 4.5로 질문 5~7개 동적 생성
  - JSON 응답: `{ questions: TemplateQuestion[] }`
  - Prompt Caching 적용 (Layer A + B)
- `POST /api/prompt/generate` — Claude Sonnet 4.6으로 최종 주문서 조립
  - JSON 응답: `{ result: GeneratedPromptResult }`
  - 출력 유형별 조립 템플릿 적용

#### 1-6. SSE 스트리밍 API (2026-04-24)
- **파일**: `app/api/prompt/stream/route.ts`
- `POST /api/prompt/stream` — Claude Sonnet 스트리밍 응답
  - `ReadableStream` + `text/event-stream` 헤더
  - `client.messages.stream()` 사용
  - 이벤트 포맷: `data: {"text": "..."}` → `data: [DONE]`
  - 선택적 인증 (비회원도 사용 가능)

#### 1-7. 세션 관리 API (2026-04-24)
- `POST /api/prompt/start` — 세션 생성
  - 선택적 인증 (guest / user)
  - Firestore `prompts` 컬렉션에 `status: 'in_progress'` 문서 생성
  - 응답: `{ sessionId }`
- `POST /api/prompt/save` — 완료 저장 (인증 필수)
  - `qaHistory` + `finalPrompt` + `outputType` + `targetTool` 저장
  - `users/{userId}/usage/{yearMonth}` 월간 카운터 증가

---

## Layer 2: 원클릭 실행 & 서재

### ✅ 완료된 기능

#### 2-1. 외부 AI 도구 연결 (2026-04-24)
- **파일**: `app/(app)/studio/create/page.tsx`
- 출력 유형별 외부 도구 매핑 (image→Midjourney/DALL-E, report→ChatGPT/Claude 등)
- "복사 + 새 탭 열기" 패턴 구현
- 클립보드 복사 성공 피드백 (✓ 아이콘 2초)

#### 2-2. 서재 (Library) 페이지 (2026-04-24)
- **파일**: `app/(app)/library/page.tsx`
- 인증 게이트: 비로그인 시 `/auth/login?redirect=/library` 리다이렉트
- `GET /api/prompts` Bearer 토큰 호출로 목록 조회
- 유형 필터 탭 (전체 / 이미지 / 보고서 / 영상 / 발표자료 / 코드 / 음악)
- 카드 뷰: 유형 아이콘, 도구 레이블, 날짜, 프롬프트 미리보기 (120자)
- 클립보드 복사 + 상세 보기 링크
- 빈 상태(EmptyState) UI
- `GET /api/prompts` Route Handler — 유형 필터, 최신순 정렬

---

## Layer 3: 도메인별 특화 템플릿

### ✅ 완료된 기능

#### 3-1. 도메인 라우팅 (2026-04-24)
- **파일**: `app/(app)/studio/[domainId]/page.tsx`
- 도메인 3종 지원: restaurant, education, real_estate
- 각 도메인 5개 템플릿 목록 UI 완성
- 도메인 → 템플릿 선택 → `/studio/create?type=...&domain=...&template=...` 라우팅

#### 3-2. 도메인 템플릿 시드 데이터 (2026-04-24)
- **식당** (`seeds/templates/restaurant/restaurant_templates.json`) — 5종:
  - `restaurant_new_menu_poster` — 신메뉴 포스터 (image, 7문항)
  - `restaurant_review_response` — 리뷰 답글 (report, 5문항, dependsOn 포함)
  - `restaurant_instagram_post` — 인스타 피드 (image, 3문항)
  - `restaurant_menu_description` — 메뉴판 설명 (report, 4문항)
  - `restaurant_event_flyer` — 이벤트 전단지 (ppt, 3문항)
- **교사** (`seeds/templates/education/education_templates.json`) — 5종:
  - `education_lesson_plan` — 수업 계획서 (report, 5문항)
  - `education_parent_communication` — 학부모 안내문 (report, 4문항)
  - `education_quiz_generator` — 단원 퀴즈 생성 (report, 5문항)
  - `education_presentation_slides` — 수업 슬라이드 (ppt, 4문항)
  - `education_student_feedback` — 학생 개별 피드백 (report, 4문항)
- **부동산** (`seeds/templates/real_estate/real_estate_templates.json`) — 5종:
  - `real_estate_listing_description` — 매물 소개 문구 (report, 5문항)
  - `real_estate_customer_response` — 고객 문의 답변 (report, 4문항)
  - `real_estate_market_report` — 시세·시장 분석 (report, 4문항)
  - `real_estate_property_photo` — 매물 사진 가이드 (image, 4문항)
  - `real_estate_contract_explainer` — 계약 조건 설명 (report, 4문항)
- **Firestore 시드 스크립트** (`scripts/seed-templates.ts`)
  - 3개 도메인 JSON → `domainTemplates` 컬렉션 일괄 batch 업로드

### 🔲 예정 기능 (Week 2)

- [ ] Firestore `domainTemplates` 컬렉션에서 실시간 로드
- [ ] 도메인별 특화 전문 어휘 DB 반영
- [ ] 템플릿 사용 횟수(`usageCount`) 실시간 업데이트

---

## Layer 4: 암묵지 인터뷰 모드

### ✅ 완료 (2026-04-24)

#### 4-1. 인터뷰 시스템 프롬프트 (`lib/anthropic/prompts/interview.ts`)
- `buildInterviewerPrompt(domain)` — 도메인별 인터뷰어 시스템 프롬프트 (restaurant/education/real_estate)
- `OPENING_QUESTIONS` — 도메인별 고정 오프닝 질문
- `buildNextQuestionTask(params)` — Q&A 히스토리 기반 다음 질문 생성 태스크
- `buildProfileGenerationTask(params)` — 완료 인터뷰 → DomainProfile JSON 합성 태스크

#### 4-2. 인터뷰 API Routes
- `POST /api/interview/start` — `interviews` 컬렉션 도큐먼트 생성, 오프닝 질문 삽입, `{ sessionId, openingQuestion }` 반환
- `POST /api/interview/question` — 직전 답변 저장 + Claude Haiku SSE 스트리밍으로 다음 질문 생성, `qaHistory` Firestore 업데이트; 목표 달성 시 `{ done: true }` 반환
- `POST /api/interview/complete` — Claude Sonnet으로 전체 Q&A → DomainProfile JSON 생성, `domainProfiles` 컬렉션 저장, 인터뷰 `completed` 처리

#### 4-3. 인터뷰 페이지
- `/interview` (`app/(app)/interview/page.tsx`) — 도메인 선택 (restaurant/education/real_estate), 작동 방식 3단계, 소요 시간 안내, 시작 버튼
- `/interview/[sessionId]` (`app/(app)/interview/[sessionId]/page.tsx`) — 활성 인터뷰 세션:
  - SSE 스트리밍 질문 텍스트 + 블링킹 커서 애니메이션
  - Web Speech API 음성 입력 (Korean `ko-KR`)
  - 진행 바 (answeredCount / targetCount)
  - "여기서 마무리하기" 조기 완료 (5개 이상 답변 후)
  - 완료 화면: DomainProfile 미리보기 (도메인, 요약, 핵심 인사이트, 전문성 지표)
  - 커스텀 SpeechRecognition TypeScript 타입 선언 (built-in DOM 타입 없음)

### 🔲 미구현 (Stretch)
- [ ] Supabase pgvector 임베딩 (Week 3 stretch — DomainProfile 벡터 검색용)

---

## Layer 5: Square 네트워크

### ✅ 완료 (2026-04-24)

#### 5-1. Square 피드
- **파일**: `app/(app)/square/page.tsx`
- 공개된 프롬프트 카드 피드 (좋아요순 + 최신순)
- 유형 필터 탭 (전체 / 이미지 / 보고서 / 발표자료 / 영상 / 코드 / 음악)
- 좋아요 토글 (로그인 필요) + 즉시 UI 반영
- 복사 기능 + 빈 상태 UI

#### 5-2. Square API
- `GET /api/square` — 공개 프롬프트 목록, 좋아요순, 유형 필터, 커서 페이징
- `POST /api/square/[promptId]/like` — 좋아요 토글 (좋아요 서브컬렉션 + stats.likes 증가)

### 🔲 예정
- [ ] 좋아요·복제·신고 (복제 미구현)
- [ ] 랭킹 알고리즘 고도화

---

## 인증 & 미들웨어

### ✅ 완료된 기능 (2026-04-24)

#### 인증 시스템
- **Firebase Auth** (`lib/firebase/auth.ts`): Google OAuth 로그인/로그아웃
  - `signInWithGoogle()` — 팝업 방식
  - `signOut()` — 쿠키 제거 포함
  - `onAuthChange()` — 상태 구독
  - `ensureUserDocument()` — 최초 로그인 시 Firestore 사용자 문서 생성
- **AuthProvider** (`components/providers/AuthProvider.tsx`): Zustand 스토어 연결
- **useAuthStore** (`lib/stores/useAuthStore.ts`): `{ user, loading }` 전역 상태
- **로그인 페이지** (`app/auth/login/page.tsx`): Google 로그인, 에러 상태, 비로그인 계속

#### 미들웨어
- **파일**: `middleware.ts`
- 보호 경로: `/library`, `/interview`, `/profile`, `/settings`, `/admin`
- `tacit-session` 쿠키 검사 → 없으면 `/auth/login?redirect=...`
- 공개 경로: `/`, `/auth/login`, `/studio`, `/square`

#### 앱 셸
- **AppHeader** (`components/layout/AppHeader.tsx`): 스티키 헤더, 모바일 드로어, 인증 상태별 표시
- **App Layout** (`app/(app)/layout.tsx`): AppHeader + AuthProvider 래핑

---

## 공통 UI 컴포넌트

### ✅ 완료

| 컴포넌트 | 파일 | 설명 |
|---------|------|------|
| ThemeProvider | `components/theme/ThemeProvider.tsx` | 다크/라이트/시스템 모드 컨텍스트 |
| ThemeToggle | `components/theme/ThemeToggle.tsx` | 3버튼 인라인 토글 |
| AuthProvider | `components/providers/AuthProvider.tsx` | Firebase Auth 상태 → Zustand 동기화 |
| AppHeader | `components/layout/AppHeader.tsx` | 스티키 헤더 + 모바일 드로어 |

### 🔲 예정 (Week 2)

- [ ] Button (shadcn 기반, Tacit 디자인 커스터마이즈)
- [ ] Input, Textarea
- [ ] Card
- [ ] Toast
- [ ] Modal/Dialog
- [ ] Progress Bar
- [ ] LoadingSpinner / Skeleton

---

## 빌드 & 인프라

### ✅ 완료 (2026-04-24)

#### 빌드 이슈 해결
- **Firebase Admin lazy init** (`lib/firebase/admin.ts`): Proxy 패턴으로 export — 빌드타임에 실행 안 됨
- **Firebase Client null-safe** (`lib/firebase/client.ts`): apiKey 없으면 초기화 건너뜀
- **middleware → proxy 마이그레이션**: Next.js 16 컨벤션 (`proxy.ts`, `export function proxy`)
- **`force-dynamic`**: `app/(app)/layout.tsx`에 추가해 SSR 프리렌더링 방지
- **turbopack.root**: `next.config.ts`에 추가해 경고 제거

#### API Route 추가
- `GET /api/prompt/[promptId]` — 단건 조회 + 조회수 증가
- `PATCH /api/prompt/[promptId]` — isPublished, tags 수정
- `GET /api/me` — 사용자 정보 + 이번 달 사용량 + 최근 5개 주문서
- `PATCH /api/me` — theme, fontSize, displayName 업데이트

#### Firestore Security Rules (`firestore.rules`)
- users: 본인 읽기/쓰기, 어드민 읽기
- prompts: 공개 시 전체 읽기, 비공개 시 본인만
- domainTemplates: 전체 읽기, 어드민만 쓰기
- domainProfiles / interviews: 본인 소유

---

## Layer 5: Square 네트워크

### ✅ 완료 (2026-04-24)

#### 5-1. Square 피드
- **파일**: `app/(app)/square/page.tsx`
- 공개된 프롬프트 카드 피드 (좋아요순 + 최신순)
- 유형 필터 탭 (전체 / 이미지 / 보고서 / 발표자료 / 영상 / 코드 / 음악)
- 좋아요 토글 (로그인 필요) + 즉시 UI 반영
- 복사 기능 + 빈 상태 UI

#### 5-2. Square API
- `GET /api/square` — 공개 프롬프트 목록, 좋아요순, 유형 필터, 커서 페이징
- `POST /api/square/[promptId]/like` — 좋아요 토글 (좋아요 서브컬렉션 + stats.likes 증가)

---

## 추가 완료 기능

### ✅ 템플릿 시스템 (2026-04-24)
- **`GET /api/templates`** — JSON 시드 파일에서 직접 서빙 (Firestore 불필요)
  - `?domain=restaurant` — 도메인별 목록
  - `?id=templateId` — 단건 조회
- **Studio create 템플릿 모드** (`app/(app)/studio/create/page.tsx`)
  - templateId URL 파라미터 → 자동으로 고정 질문 로드
  - seed 단계 건너뜀, 템플릿 이름 헤더 표시
  - `dependsOn` 조건부 질문 필터링 (전 답변에 따라 질문 스킵)
  - 생성 후 "내 서재에 저장" 버튼 (로그인 시)
  - 저장 완료 시 서재 상세로 바로 이동 링크

### ✅ DomainProfile → Prompt Engine 연결 (2026-04-24)
- **`GET /api/me/profiles`** — 사용자의 활성 도메인 프로필 목록 (domain 필터 지원)
- **`/api/prompt/generate`** — `profileId` 파라미터 추가, 인증 후 프로필 조회 → `buildLayerB` + `buildAssemblerTask`에 주입
- **Studio create 프로필 배너** — domainId + 로그인 시 자동으로 활성 프로필 로드, 주문서 생성 시 자동 적용 (Sparkles 배너 표시)

### ✅ Square 복제(fork) 기능 (2026-04-24)
- **`POST /api/square/[promptId]/copy`** — 공개 프롬프트를 내 서재에 복사, 원본 `stats.copies` 증가
- **광장 페이지 복제 버튼** — 로그인 사용자에게 GitFork 버튼 표시, 복제 완료 시 BookmarkCheck + 카운터 즉시 반영

### ✅ Toast 알림 시스템 (2026-04-24)
- **`lib/stores/useToastStore.ts`** — Zustand 기반 토스트 스토어 (`success`, `error`, `info` 3가지 타입)
- **`components/ui/Toast.tsx`** — 우하단 고정 토스트 컨테이너, 3.5초 자동 닫힘, X 버튼 수동 닫힘
- **`app/(app)/layout.tsx`** — ToastContainer 전역 주입
- **`toast()` 헬퍼** — 어디서든 `import { toast } from '@/lib/stores/useToastStore'`로 호출 가능

### ✅ 관리자 대시보드 (2026-04-24)
- **`GET /api/admin/stats`** — 전체 통계 (사용자, 주문서, 공개, 인터뷰, 완료, 프로필), 최근 주문서 10개
  - `ADMIN_UIDS` 환경변수로 접근 제한
- **`/admin`** — 통계 카드 6종, 인터뷰 완료율 진행바, 최근 주문서 테이블 (유형, 도메인, 공개 여부, 좋아요, 날짜)

### ✅ Vercel 배포 설정 (2026-04-24)
- **`vercel.json`** — 프레임워크: nextjs
  - `maxDuration: 60` — 전체 API 기본
  - `maxDuration: 120` — 스트리밍 루트 3개 (`prompt/stream`, `interview/question`, `interview/complete`)
  - 환경변수 Vercel 시크릿 참조 (`@tacit-firebase-api-key` 등 10종)

### ✅ 인프라 (2026-04-24)
- **`firestore.indexes.json`** — 복합 인덱스 4종
  - `ownerId + createdAt`, `ownerId + type + createdAt`
  - `isPublished + likes + createdAt`, `isPublished + type + likes + createdAt`
- **`firebase.json`** — Firestore rules/indexes 배포 설정
- **`app/not-found.tsx`** — 커스텀 404 페이지
- **`app/error.tsx`** — 전역 에러 바운더리 (reset 기능)
- **`app/(app)/profile/page.tsx`** — 프로필 (아바타, 통계, 최근 주문서)
- **AppHeader** — 프로필 아바타/아이콘 링크, 대시보드 링크 추가

### ✅ GA4 Analytics (2026-04-24)
- **`lib/analytics.ts`** — Firebase Analytics lazy init, SSR-safe (browser-only), production-only
  - `trackPromptGenerated`, `trackInterviewCompleted`, `trackPromptPublished`, `trackPromptForked`, `trackUpgradeViewed`, `trackPaymentCompleted`, `trackError` — 7종 이벤트
- **Studio create, interview, library, upgrade** — 핵심 이벤트 지점에 호출 삽입

### ✅ Sentry 에러 모니터링 (2026-04-24)
- **`@sentry/nextjs` v8** — `withSentryConfig` wraps `next.config.ts`
- **`sentry.client/server/edge.config.ts`** — 3개 SDK 초기 설정, `tracesSampleRate: 0.1`, Replay (에러 시 10%)
- `Sentry.captureException()` — API route 주요 try/catch에 삽입

### ✅ Square 상세 페이지 (2026-04-24)
- **`GET /api/square/[promptId]`** — 공개 프롬프트 단건 조회, 조회수 fire-and-forget 증가, 비회원도 열람 가능, 좋아요 여부 조건부 반환
- **`/square/[promptId]`** — 전체 프롬프트 표시, 좋아요·복제·복사·신고 액션
  - 신고 모달 (5가지 사유, `prompts/{id}/reports` 서브컬렉션, reportId = uid 중복 방지)
  - `stats.views` 실시간 표시

### ✅ 결제 시스템 — 토스페이먼츠 (2026-04-24)
- **`POST /api/billing/checkout`** — orderId 생성, `orders` 컬렉션 저장, clientKey 반환
- **`POST /api/billing/confirm`** — 토스 서버 검증 후 `users/{uid}.plan = 'pro'`, `planExpiresAt = +30일`
- **`/upgrade`** — Free/Pro 비교 테이블, `@tosspayments/tosspayments-js` dynamic import, 카드 결제 위젯
- **`/billing/success`** — `?paymentKey&orderId&amount` → confirm API 호출 → 3초 후 대시보드 이동
- **`/settings/billing`** — 현재 플랜, 만료일, 이번 달 사용량 진행바 (색상 코딩), 업그레이드 CTA

### ✅ Pro 요금제 Rate Limiting (2026-04-24)
- **`lib/rateLimit.ts`** — `users/{uid}.plan` + `planExpiresAt` Firestore 확인
  - Free: 10회/월, Pro: 100회/월
  - `{ allowed, current, limit, isPro }` 반환
- **`/api/me`** — `usage.limit` (10 or 100) + `usageThisMonth` 반환
- **`/dashboard`** — `UsageBanner` PRO 배지, 동적 limit, 한도 도달 시 업그레이드 링크

### ✅ 서재 삭제 / 공개 기능 강화 (2026-04-24)
- **`DELETE /api/prompt/[promptId]`** — 인증 + 소유자 확인 후 삭제
- **서재 상세 (`/library/[promptId]`)** — Trash2 삭제 버튼, 확인 다이얼로그, 삭제 후 서재 목록 이동
  - 공개/비공개 토글 시 toast 알림 + analytics 이벤트

### ✅ iOS Whisper 음성 입력 폴백 (2026-04-24)
- **`POST /api/interview/transcribe`** — FormData audio blob → OpenAI Whisper API (`whisper-1`, `ko`)
- **인터뷰 세션 (`/interview/[sessionId]`)** — 두 가지 입력 경로:
  - Web Speech API: Chrome / Android (기존)
  - MediaRecorder + Whisper: iOS Safari 폴백 (Mic 버튼 분리, 녹음 중/변환 중 UI)

### ✅ SEO 메타데이터 완성 (2026-04-24)
- **`app/(app)/square/layout.tsx`** — 광장 피드 정적 metadata
- **`app/(app)/square/[promptId]/layout.tsx`** — `generateMetadata` Firestore 동적 조회
- **`app/(app)/upgrade/layout.tsx`** — Pro 업그레이드 metadata
- **`app/layout.tsx`** — `manifest`, `metadataBase`, `twitter` 카드, `openGraph.url/siteName` 추가

### ✅ SEO 인프라 (2026-04-24)
- **`public/robots.txt`** — 공개/비공개 경로 지시어, sitemap 참조
- **`app/sitemap.ts`** — 정적 5개 + Firestore 공개 프롬프트 최대 200개 동적 생성
- **`public/manifest.json`** — PWA 설치 메타데이터 (name, short_name, display: standalone, theme_color)

### ✅ 마케팅 페이지 (2026-04-24)
- **`app/(marketing)/layout.tsx`** — 헤더 + 푸터 공용 레이아웃
- **`/pricing`** — Free/Pro 비교 카드 (랜딩 내비 연결)
- **`/privacy`** — 개인정보처리방침 (푸터 연결)
- **`/terms`** — 이용약관 (푸터 연결)

### ✅ Firestore 인덱스 & 규칙 업데이트 (2026-04-24)
- **인덱스 5개 추가**: `stats.reports DESC`, `interviews userId+status+lastActivityAt`, `domainProfiles userId+isActive+createdAt`, `domainProfiles userId+domainId+isActive+createdAt`, `reports` 서브컬렉션 `status+createdAt`
- **rules 수정**: `interviews` create 규칙 `resource` null 버그 수정 (allow create 분리), `prompts/{id}/reports` 서브컬렉션 규칙 추가

---

## 페이지 현황

| 페이지 | 경로 | 상태 |
|--------|------|------|
| 랜딩 | `/` | ✅ 완료 |
| 스튜디오 홈 | `/studio` | ✅ 완료 |
| 스튜디오 인터뷰 | `/studio/create` | ✅ 완료 (템플릿 모드 포함) |
| 도메인 스튜디오 | `/studio/[domainId]` | ✅ 완료 |
| 서재 목록 | `/library` | ✅ 완료 |
| 서재 상세 | `/library/[promptId]` | ✅ 완료 (삭제/공개 포함) |
| 대시보드 | `/dashboard` | ✅ 완료 (Pro 배지 포함) |
| 프로필 | `/profile` | ✅ 완료 |
| 로그인 | `/auth/login` | ✅ 완료 |
| 설정 | `/settings` | ✅ 완료 |
| 설정 / 결제 | `/settings/billing` | ✅ 완료 |
| 광장 | `/square` | ✅ 완료 |
| 광장 상세 | `/square/[promptId]` | ✅ 완료 (신고 포함) |
| 업그레이드 | `/upgrade` | ✅ 완료 (토스페이먼츠) |
| 결제 완료 | `/billing/success` | ✅ 완료 |
| 요금제 | `/pricing` | ✅ 완료 |
| 개인정보처리방침 | `/privacy` | ✅ 완료 |
| 이용약관 | `/terms` | ✅ 완료 |
| 404 | 자동 | ✅ 완료 |
| 에러 | 자동 | ✅ 완료 |
| 암묵지 인터뷰 홈 | `/interview` | ✅ 완료 |
| 암묵지 인터뷰 세션 | `/interview/[sessionId]` | ✅ 완료 (iOS 폴백 포함) |
| 관리자 대시보드 | `/admin` | ✅ 완료 |

## 미구현 (Stretch Goals)

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| Supabase pgvector 임베딩 | 낮음 | Week 3 stretch, DomainProfile 벡터 검색 |
| 카카오/네이버 로그인 | 낮음 | Firebase Auth 추가 provider |
| OG 이미지 | 낮음 | `public/og-image.png` 제작 후 metadata에 추가 |
