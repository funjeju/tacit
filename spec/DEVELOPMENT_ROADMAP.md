# DEVELOPMENT_ROADMAP.md — 개발 로드맵

4주 MVP 기준 주차별 상세 계획. Claude Code가 이 문서를 따라 순차 구현합니다.

---

## 전체 타임라인

```
W1. Core Engine        ━━━━━━━━━━━━━━━━━━
W2. 도메인 + UI Shell    ━━━━━━━━━━━━━━━━━━
W3. 암묵지 인터뷰         ━━━━━━━━━━━━━━━━━━
W4. Square + 배포        ━━━━━━━━━━━━━━━━━━
── 출시 ──
+W5-6. 버그픽스·사용자 피드백
+W7-8. Square 고도화, 결제
+W9-12. 도메인 추가, B2B 영업
```

---

## 사전 준비 (Week 0)

### Day 0. 환경 세팅 (0.5일)

- [ ] Git 저장소 생성 (GitHub Private)
- [ ] Next.js 14 프로젝트 초기화
  ```bash
  npx create-next-app@latest tacit --typescript --tailwind --app
  ```
- [ ] 폴더 구조 생성 (TECH_STACK.md 참조)
- [ ] Firebase 프로젝트 3개 생성 (dev/staging/prod)
- [ ] Vercel 프로젝트 연결
- [ ] Supabase 프로젝트 생성 + pgvector 활성화
- [ ] Anthropic API 키 발급
- [ ] OpenAI API 키 발급 (임베딩용)
- [ ] `.env.local`, `.env.example` 작성

### Day 1. Figma 디자인 준비 (1일)

- [ ] Figma 디자인 파일 구조 세팅 (FIGMA_MCP_GUIDE.md 구조)
- [ ] Design Tokens 페이지 작성 (Variables)
- [ ] 컴포넌트 10개 기본형 디자인 (Button, Input, Card 등)
- [ ] 주요 화면 5개 와이어프레임
- [ ] Figma MCP 서버 연결 테스트

### Day 2. 기본 설정 & 의존성 (0.5일)

- [ ] 패키지 설치 (TECH_STACK.md의 초기 설치 명령)
- [ ] shadcn/ui 초기화 + 기본 컴포넌트 15개 생성
- [ ] Tailwind 설정 (DESIGN_SYSTEM.md)
- [ ] 다크/라이트 모드 ThemeProvider 세팅 (DARK_LIGHT_MODE.md)
- [ ] Firebase 초기화 코드 (`lib/firebase/*`)
- [ ] Anthropic SDK 초기화
- [ ] Supabase 클라이언트 초기화
- [ ] `getFirestore(app, '(default)')` 명시 (버그 방지)

---

## Week 1. Core Engine

**목표**: 비회원 사용자가 산출물 유형 → 키워드 → 질문 5개 → 최종 프롬프트까지 완주 가능

### Day 1 (월). 유형 선택 + 랜딩

- [ ] `app/page.tsx` 랜딩 페이지 (헤드라인 + CTA + 6유형 아이콘)
- [ ] `app/create/page.tsx` 유형 선택 페이지
  - 6개 TypeCard 컴포넌트 (UI_COMPONENTS.md)
  - 선택 시 즉시 `/create/[type]/seed` 이동
- [ ] 라우팅 구조 검증

**검증**: 데스크탑·모바일·다크·라이트 4가지 조합으로 확인

### Day 2 (화). 초기 키워드 입력 + 세션 시작

- [ ] `app/create/[type]/seed/page.tsx`
- [ ] 큰 Textarea + 음성 입력 버튼 (VoiceInput 컴포넌트, UI만, 실동작 W3)
- [ ] [다음] 버튼 → 세션 생성 API 호출
- [ ] `POST /api/prompt/start` Firebase Function
- [ ] Firestore `prompts/{id}` 초기 문서 생성

**검증**: 세션 ID가 URL에 반영되고, 새로고침해도 유지

### Day 3 (수). Question Planner

- [ ] `functions/src/prompt/plan.ts` 구현
- [ ] Claude Haiku 4.5로 질문 5~7개 생성
- [ ] 프롬프트 3단 구조 (PROMPT_ENGINE.md)
- [ ] 응답 파싱 + Firestore 저장
- [ ] 에러 처리 (재시도 로직)

**검증**: 같은 입력으로 10번 호출해 질문 품질 검증 (사람이 읽어보고 점수)

### Day 4 (목). 인터뷰 세션 UI

- [ ] `app/create/[type]/interview/page.tsx`
- [ ] QuestionCard 컴포넌트 (UI_COMPONENTS.md)
- [ ] InterviewBar (하단 고정 프로그레스)
- [ ] 답변 저장 API: `POST /api/prompt/answer`
- [ ] "건너뛰기" / "잘 모르겠어요" 버튼
- [ ] 이전/다음 네비게이션

**검증**: 5개 질문 순차 응답 → Firestore 저장 확인

### Day 5 (금). Prompt Assembler + 결과 화면

- [ ] `functions/src/prompt/assemble.ts`
- [ ] SSE 스트리밍 응답 (`GET /api/prompt/generate?sessionId=`)
- [ ] 유형별 조립 템플릿 (image/report만 먼저)
- [ ] `app/create/[type]/generating/page.tsx` (로딩 화면)
- [ ] `app/create/[type]/result/[id]/page.tsx`
  - 생성된 프롬프트 표시
  - 복사 버튼
  - "외부 AI에서 열기" 버튼

**검증**: 이미지/보고서 2개 유형 엔드투엔드 완주 (평균 < 7분)

### Day 6-7 (주말). 다크 모드 완성 + 버그 픽스

- [ ] 모든 페이지 다크 모드 검증
- [ ] WCAG AA 대비 검증 (DARK_LIGHT_MODE.md 체크리스트)
- [ ] 주차 회고 + 다음 주 준비

### Week 1 완료 기준

- 비회원이 "이미지" 유형 → 최종 프롬프트 받아 Midjourney까지 이동 가능
- 비회원이 "보고서" 유형 → 최종 프롬프트 받아 ChatGPT까지 이동 가능
- 다크/라이트 모드 완전 작동
- 모바일 반응형 OK

---

## Week 2. 도메인 템플릿 + UI Shell

**목표**: 회원가입/로그인, 나머지 4개 유형, MVP 3도메인 × 5템플릿 작성, 대시보드

### Day 1 (월). 인증 시스템

- [ ] Firebase Auth 설정 (Email, Google, Kakao, Naver)
- [ ] `/auth/signup`, `/auth/login` 페이지
- [ ] 세션 쿠키 처리 (Next.js Middleware)
- [ ] `app/(auth)/layout.tsx` Marketing shell
- [ ] `app/(app)/layout.tsx` App shell (Header + Sidebar + MobileNav)
- [ ] 가입 유도 모달 (결과 → 저장 시점)

**검증**: Google 로그인 성공, 세션 유지, 로그아웃

### Day 2 (화). 대시보드 + 서재

- [ ] `app/dashboard/page.tsx` 홈 대시보드
  - 최근 프롬프트 5개 (가로 스크롤)
  - [+ 새로 만들기] 큰 버튼
  - 추천 프롬프트 3개 (Square 미리 노출, 빈 상태 처리)
- [ ] `app/library/page.tsx` 서재 페이지
  - LibraryCard 그리드
  - 검색·필터 (유형, 날짜)
- [ ] `GET /api/prompts` 목록 API

**검증**: 생성한 프롬프트가 서재에 표시됨

### Day 3 (수). 나머지 4개 유형 (video, ppt, code, music)

- [ ] 각 유형별 조립 템플릿 추가 (PROMPT_ENGINE.md)
- [ ] 외부 도구 라우팅 (Veo, Gamma, Cursor, Suno 등)
- [ ] 유형별 UI 미세 조정 (result 화면의 "열기" 버튼)

**검증**: 6개 유형 모두 엔드투엔드 작동

### Day 4 (목). 도메인 템플릿 시드

- [ ] `/seeds/templates/restaurant/*.json` 5개
- [ ] `/seeds/templates/education/*.json` 5개
- [ ] `/seeds/templates/real_estate/*.json` 5개
- [ ] `scripts/seed-templates.ts` 실행
- [ ] `app/create/[type]/template/page.tsx` 템플릿 선택 화면
- [ ] 템플릿 선택 시 질문 트리 자동 세팅

**검증**: 식당 사장이 "신메뉴 포스터" 템플릿으로 인터뷰 완주

### Day 5 (금). UI 완성도 향상

- [ ] Figma MCP로 최종 디자인 싱크 (FIGMA_MCP_GUIDE.md)
- [ ] 빈 상태 (EmptyState) 구성
- [ ] 로딩 상태 (LoadingState, Skeleton)
- [ ] 에러 상태 (ErrorState)
- [ ] 토스트 알림 전역 적용

**검증**: 5명 테스터 사용성 테스트 (4-50대 위주)

### Day 6-7 (주말). 설정 페이지 + 피드백 반영

- [ ] `/settings` 페이지
  - 프로필 편집
  - 언어·폰트 크기·테마
  - 계정 삭제
- [ ] `/settings/billing` (W4에서 구체화)
- [ ] 주중 피드백 반영

### Week 2 완료 기준

- 회원가입/로그인 완전 작동
- 6개 유형 × 3개 도메인 × 5개 템플릿 = 15개 경로 모두 작동
- 대시보드 + 서재 + 설정 UI 완성
- Figma 디자인과 UI 일치

---

## Week 3. 암묵지 인터뷰 모드

**목표**: 30~50개 질문 인터뷰 → 프로필 생성 → 프로필 기반 프롬프트 자동 개인화

### Day 1 (월). 인터뷰 진입 + 기본 정보

- [ ] `app/interview/page.tsx` 진입 페이지
- [ ] `app/interview/basic/page.tsx` 기본 정보 (도메인·경력·하위 유형)
- [ ] `POST /api/interview/start` API
- [ ] Firestore `interviews/{id}` 생성
- [ ] 중단 시 자동 저장

**검증**: 중간에 나갔다 돌아와도 이어짐

### Day 2 (화). 질문 풀 + 선택 알고리즘

- [ ] 6개 카테고리 × 각 5~8개 질문 풀 작성 (TACIT_INTERVIEW.md)
- [ ] `functions/src/interview/select-questions.ts`
- [ ] 도메인별 특화 질문 매핑
- [ ] 경력 기반 가중치 조정

**검증**: 도메인별로 질문이 다르게 나오는지 확인

### Day 3 (수). 인터뷰 세션 UI

- [ ] `app/interview/deep/page.tsx`
- [ ] 프로그레스바 (카테고리 + 질문 번호)
- [ ] 카테고리 전환 축하 애니메이션 (Framer Motion)
- [ ] 자동 저장 (3분마다)
- [ ] 이어하기 UI (`/interview/resume`)

**검증**: 45개 질문을 중단·재개 반복하며 완주

### Day 4 (목). 음성 입력

- [ ] `components/VoiceInput.tsx` 완성
- [ ] Web Speech API 연동 (`lib/voice-input.ts`)
- [ ] 녹음 중 시각 피드백 (파동 애니메이션)
- [ ] 실시간 transcript 표시
- [ ] 3초 침묵 감지 → 자동 정지
- [ ] iOS 폴백: 녹음 → Whisper API 업로드

**검증**: 모바일 Safari에서 음성 입력 완주

### Day 5 (금). 프로필 생성 + 임베딩

- [ ] `functions/src/interview/finalize.ts`
- [ ] Claude Sonnet 4.6로 답변 45개 분석 → DomainProfile 생성
- [ ] OpenAI 임베딩 생성 → Supabase 저장
- [ ] `app/interview/preview/page.tsx` 미리보기 + 인라인 편집
- [ ] `app/interview/generating/page.tsx` 로딩 (30~60초)

**검증**: 생성된 프로필이 실제 답변 내용을 정확히 반영

### Day 6 (토). 프로필 활용

- [ ] PromptEngine에 프로필 주입 (Layer B 시스템 프롬프트)
- [ ] 프로필 활성/비활성 토글
- [ ] `app/profile/page.tsx` 프로필 목록
- [ ] `app/profile/[id]/page.tsx` 상세 + 편집

**검증**: 프로필 있을 때 / 없을 때 프롬프트 품질 차이 비교 (사람 평가)

### Day 7 (일). 다중 프로필 + 회고

- [ ] 여러 프로필 관리 UI (ProfileSwitcher)
- [ ] 프롬프트 생성 시 프로필 선택
- [ ] 주차 회고 + QA

### Week 3 완료 기준

- 인터뷰 45분 이내 완주 가능
- 음성 입력 데스크탑·모바일 작동
- 프로필 활성화 후 프롬프트 생성 시 자동 반영
- 다중 프로필 관리 가능

---

## Week 4. Square + 배포

**목표**: 프롬프트 공유·복제, 관리자 도구, 프로덕션 배포, 결제 기초

### Day 1 (월). Square 공개 + 피드

- [ ] `POST /api/square/publish` API
- [ ] 자동 모더레이션 (`checkProfanity`, `checkPII` 등 기본만)
- [ ] `POST /api/square/publish` 후 태그 자동 생성 (Haiku)
- [ ] 임베딩 생성 + Supabase 저장
- [ ] `app/square/page.tsx` 피드 (탭: 추천/최신/인기/내 도메인)

**검증**: 프롬프트 공유 → 피드에 표시

### Day 2 (화). 랭킹 알고리즘 + 상세

- [ ] 랭킹 계산 로직 (SQUARE_NETWORK.md)
- [ ] 추천 벡터 유사도 쿼리 (Supabase pgvector)
- [ ] `app/square/[id]/page.tsx` 상세
- [ ] 좋아요·복제·신고 API + UI
- [ ] `POST /api/square/copy`

**검증**: 복제 → 내 서재에 생성, 원본과 링크 유지

### Day 3 (수). 관리자 대시보드

- [ ] `app/admin/layout.tsx` (role=admin 체크)
- [ ] `app/admin/moderation/page.tsx` 수동 검수
- [ ] 신고 큐 + 승인/거절 UI
- [ ] 통계 대시보드 (DAU, 생성 수 등)

**검증**: 신고된 프롬프트 처리

### Day 4 (목). 결제 기초 (Pro 구독만)

- [ ] 토스페이먼츠 연동
- [ ] `app/upgrade/page.tsx` Pro 안내
- [ ] `POST /api/billing/checkout` (세션 생성)
- [ ] Webhook: `POST /api/billing/webhook` (결제 성공 → 권한 부여)
- [ ] `app/settings/billing` 구독 관리
- [ ] 월 10회 한도 Rate Limit (MonthlyUsage 컬렉션)

**검증**: 카드 결제 → 즉시 Pro 활성화

### Day 5 (금). 프로덕션 배포

- [ ] Firestore 규칙·인덱스 최종 배포
- [ ] Firebase Functions 프로덕션 배포
- [ ] Vercel 프로덕션 배포
- [ ] 도메인 연결 (`tacit.app`)
- [ ] 환경변수 프로덕션 최종 확인
- [ ] 모니터링 설정 (Sentry, Mixpanel, Uptime)
- [ ] GA4 이벤트 설정

**검증**: 프로덕션 URL로 전체 플로우 엔드투엔드 테스트

### Day 6 (토). 소프트 런칭

- [ ] 지인 20명 초대 (소상공인협회 연결 활용)
- [ ] 피드백 수집 폼
- [ ] 실시간 모니터링 (Sentry 에러, P95 응답시간)
- [ ] 긴급 버그 픽스

### Day 7 (일). 런칭 회고 + 다음 단계

- [ ] 4주 회고 (KPI 대비 성과)
- [ ] Week 5+ 계획 수립
- [ ] 사용자 피드백 정리

### Week 4 완료 기준

- 프로덕션 배포 완료 (tacit.app 접속 가능)
- Square 프롬프트 공유·복제 작동
- Pro 구독 결제 가능
- 기본 모니터링 작동
- 소프트 런칭 20명 피드백 수집

---

## Post-MVP (W5-12)

### W5-6. 안정화
- 버그 픽스
- 성능 최적화
- 사용자 피드백 기반 UX 개선
- 도메인 3개 템플릿 추가 (뷰티, 소공인, 서비스업)

### W7-8. Square 고도화
- 유료 프롬프트 거래 활성화
- 팔로우·알림
- 작성자 정산 시스템
- 주간 챌린지 기능

### W9-10. 확장
- 영상 기록 분석 (Vision AI)
- 세대 간 전수 모드
- Pro 고급 기능 (무제한 프로필, 우선 지원)

### W11-12. B2B
- 소상공인협회 공급 (서병일 고문 네트워크)
- 기업 요금제
- 자체 도메인 템플릿 제작 서비스 (컨설팅)
- 지자체 MOU

---

## 주간 마일스톤 & KPI

| 주차 | 마일스톤 | 핵심 KPI |
|------|---------|---------|
| W1 말 | 엔진 작동 | 내부 테스트 엔드투엔드 성공 |
| W2 말 | 풀 제품 UI 완성 | 5명 사용성 테스트 NPS ≥ 30 |
| W3 말 | 인터뷰 완성 | 인터뷰 완주율 ≥ 50% |
| W4 말 | 프로덕션 배포 | 20명 베타 사용자 가입 |
| W6 말 | 안정화 | DAU 100 / 재방문율 30% |
| W8 말 | Square 가동 | 주간 복제 500회 |
| W12 말 | B2B 첫 계약 | MRR ₩1M |

---

## 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Claude API 장애 | 중 | 고 | Haiku 폴백, OpenAI 긴급 라우팅 준비 |
| Firebase 비용 폭증 | 중 | 중 | 월간 예산 알림, 쿼리 최적화 체크 |
| 질문 트리 품질 미달 | 고 | 고 | 전문가 3명 검수 후 출시 |
| 4-50대 사용성 이슈 | 고 | 고 | 매주 5명 사용성 테스트 지속 |
| 음성 입력 iOS 이슈 | 중 | 중 | Whisper API 폴백 경로 준비 |
| 법적 이슈 (저작권) | 저 | 고 | 이용약관·면책 조항 초기 정비 |

---

## 작업 방식

### Claude Code 활용 원칙
1. 각 Task는 관련 MD 문서를 먼저 읽고 시작
2. 구현 완료 시 해당 문서와 일치 여부 자체 검증
3. 새로운 디자인 요소는 Figma MCP로 먼저 동기화
4. 커밋은 작업 단위로 잘게 (feat, fix, docs 분리)

### 일일 리듬
- 09:00~10:00: 전날 리뷰 + 오늘 Task 정의
- 10:00~18:00: 집중 구현
- 18:00~19:00: 테스트 + 커밋 + 다음 날 준비

### 주간 리뷰
- 금요일 17:00: 주간 회고
- KPI 체크, 다음 주 계획 조정
- 리스크 재평가

---

## 참고 문서

- 모든 상세 설계: `docs/` 디렉토리 전체
- 변경 시 우선순위: 이 로드맵 > PRD > 나머지
