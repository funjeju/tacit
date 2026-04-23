# CLAUDE.md — Tacit 개발 지침

이 파일은 Claude Code가 Tacit 프로젝트를 구현할 때 가장 먼저 읽는 최상위 지침이다. 다른 문서보다 이 문서의 지침이 우선한다.

---

## 🎯 프로젝트 정체성

**Tacit**은 4-50대 도메인 보유자의 암묵지를 AI 프롬프트로 번역해주는 플랫폼이다.

한 문장 정의:
> "프롬프트를 모르는 사람을 위한 AI 인터뷰어"

기존 프롬프트 마켓(PromptBase, FlowGPT)과 정반대 포지션. 기술이 아닌 경험 중심, 20-30대 IT 사용자가 아닌 4-50대 도메인 보유자 타깃.

**핵심 철학**: "사용자가 자산화된다" — 쓸수록 본인의 도메인 프로필이 쌓이고, 프롬프트가 개인화된다.

---

## 📚 문서 읽는 순서

구현 시작 전 반드시 아래 순서로 읽는다.

1. `README.md` — 프로젝트 개요
2. `docs/PRD.md` — 제품 요구사항 (무엇을 만드는가)
3. `docs/ARCHITECTURE.md` — 시스템 구조 (어떻게 구성되는가)
4. `docs/TECH_STACK.md` — 기술 스택 상세
5. `docs/DATABASE_SCHEMA.md` — Firestore 데이터 모델
6. `docs/API_SPEC.md` — API 엔드포인트 명세
7. `docs/FEATURES.md` — 기능별 상세 스펙
8. `docs/DESIGN_SYSTEM.md` — 디자인 토큰 및 시스템
9. `docs/DARK_LIGHT_MODE.md` — 다크/라이트 모드 구현
10. `docs/UI_COMPONENTS.md` — 컴포넌트 라이브러리
11. `docs/USER_FLOWS.md` — 사용자 플로우
12. `docs/FIGMA_MCP_GUIDE.md` — Figma MCP 디자인 워크플로우
13. `docs/PROMPT_ENGINE.md` — 메타프롬프트 엔진 로직
14. `docs/DOMAIN_TEMPLATES.md` — 도메인별 질문 트리
15. `docs/TACIT_INTERVIEW.md` — 암묵지 인터뷰 모드 (킬러 기능)
16. `docs/SQUARE_NETWORK.md` — Square 공유 네트워크
17. `docs/DEPLOYMENT.md` — Vercel + Firebase 배포
18. `docs/DEVELOPMENT_ROADMAP.md` — 개발 단계별 로드맵

---

## 🛠 절대 원칙 (반드시 지킬 것)

### 1. 타깃 UX 원칙
- **4-50대 친화**: 폰트 크기 기본 16px 이상, 버튼 44x44px 이상 (터치 타깃), 명확한 고대비
- **한국어 우선**: 영문 표기는 부차적. 모든 UI 카피는 한국어로 먼저 작성 후 영문 병기
- **설명 과잉 금지**: 중년층은 "뭘 해야 하는지"만 알면 된다. 기술 용어 사용 금지 (예: "프롬프트" → "AI 주문서", "API" → "연결")

### 2. 디자인 원칙
- **다크모드/라이트모드 필수**: 두 모드 모두 1급 시민. CSS 변수 기반.
- **Figma MCP 연동**: 컴포넌트 디자인은 Figma에서 먼저 만들고 MCP로 코드화
- **모바일 우선**: 4-50대는 PC보다 모바일 사용률이 높다. 반응형 필수
- **접근성 WCAG AA**: 색 대비 4.5:1 이상

### 3. 코드 원칙
- **Next.js 14 App Router** 사용 (Pages Router 금지)
- **Server Components 우선**, Client Components는 상호작용 필요 시에만
- **TypeScript strict 모드** 필수
- **Tailwind CSS + shadcn/ui** 조합
- **Firebase v10+ 모듈러 SDK** (compat 금지)
- **Firestore 연결**: `getFirestore(app, '(default)')` 명시적 문법 사용 (연결 버그 방지)

### 4. 성능 원칙
- **LCP 2.5초 이내**
- **이미지 Next/Image 사용**, lazy loading 기본
- **Claude API 스트리밍**: 질문 생성 시 스트리밍으로 UX 개선

### 5. 보안 원칙
- **API 키는 서버 사이드에서만**: Claude API 호출은 Next.js API Route에서만
- **Firestore 보안 규칙 엄격 적용**: 기본값은 deny
- **사용자 인증**: Firebase Auth (Google, 카카오, 애플)

---

## 🗺 개발 우선순위 (MVP 4주)

### Week 1: Core Engine
- 프로젝트 초기 세팅 (Next.js 14 + Firebase + Vercel)
- 디자인 시스템 구축 (토큰, 컬러, 다크/라이트)
- 메타프롬프트 엔진 (Layer 1) 기본 동작

### Week 2: 도메인 템플릿 + UI
- 식당/교사/공인중개사 3개 도메인 템플릿 구현
- 질문 트리 UI/UX 완성
- 사용자 서재 (결과물 저장)

### Week 3: 암묵지 인터뷰 모드
- Layer 4 구현 (30-50개 질문 인터뷰)
- 도메인 프로필 저장 및 재사용
- 음성 입력 기본 지원 (Web Speech API)

### Week 4: Square + 배포
- Layer 5 Square 네트워크 (공유, 복제, 좋아요)
- 최종 Vercel 배포
- 분석 도구 연동 (GA4, Amplitude)

---

## ⚠️ 자주 하는 실수 방지

1. **"MVP에 안 중요"라고 판단하지 마라**: 특히 다크모드/라이트모드, 한국어 카피 품질, 4-50대 UX는 MVP 필수
2. **기술 용어 노출 금지**: "Prompt", "API", "Token" 등 사용자 화면에 노출 금지
3. **Firebase 연결 문자열 누락 주의**: `getFirestore(app, '(default)')` 반드시 명시
4. **Claude API 호출 클라이언트 사이드 금지**: 반드시 Route Handler 경유
5. **Figma 디자인 무시하고 임의 구현 금지**: 반드시 Figma MCP 먼저 조회

---

## 🧠 작업 시 항상 되물어야 할 질문

구현 중 방향이 흔들릴 때 아래 질문으로 돌아온다.

1. **"4-50대 식당 사장님이 이 화면을 보고 이해할 수 있는가?"**
2. **"이 기능이 '암묵지를 자산화한다'는 철학에 부합하는가?"**
3. **"사용자가 쓸수록 플랫폼에 뭔가 쌓이는가? (복리 구조)"**
4. **"이 기능이 없으면 제품이 안 팔리는가? (MVP 판단 기준)"**

---

## 📞 애매할 때

디자인 결정이 애매하면: `docs/DESIGN_SYSTEM.md` 및 Figma MCP 조회
기능 스펙이 애매하면: `docs/FEATURES.md` 해당 Layer 섹션 확인
데이터 모델이 애매하면: `docs/DATABASE_SCHEMA.md` 확인
배포/환경변수 문제면: `docs/DEPLOYMENT.md` 확인

위 문서에도 없으면: 사용자에게 "어떤 방향으로 가길 원하는지" 명확히 질문할 것. 임의 판단 금지.
