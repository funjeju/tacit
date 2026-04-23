# Tacit

> 프롬프트를 모르는 사람을 위한 AI 인터뷰어
> "당신의 30년 경험을 AI가 끌어내 자산화해 드립니다"

---

## 📌 한눈에 보는 Tacit

- **무엇**: 4-50대 도메인 보유자를 위한 메타프롬프트 + 암묵지 자산화 플랫폼
- **왜**: AI는 알지만 "뭘 어떻게 물을지" 모르는 사람들이 너무 많다
- **어떻게**: 유형 선택 → AI가 질문으로 끌어냄 → 구조화된 프롬프트 + 결과물 자동 생성
- **누구를 위해**: 20-30년 업계 경험은 있지만 AI 활용은 서툰 4-50대

---

## 🏗 제품 구조 (5 Layer)

| Layer | 이름 | 역할 |
|-------|------|------|
| L1 | 메타프롬프트 엔진 | 산출물 유형별 질문 트리로 프롬프트 생성 |
| L2 | 원클릭 실행 & 서재 | ChatGPT/Midjourney/Veo 등에서 바로 실행, 결과물 자동 저장 |
| L3 | 도메인별 특화 템플릿 | 식당·교사·공인중개사 등 업종별 질문 트리 (핵심 해자) |
| L4 | 암묵지 인터뷰 모드 | 30-50문 인터뷰로 개인 도메인 프로필 구축 (킬러 기능) |
| L5 | Square 네트워크 | 프롬프트/프로필 공유 및 거래 |

---

## 🛠 기술 스택

- **프론트엔드**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **AI**: Claude API (Sonnet 4.6 / Haiku 4.5 하이브리드)
- **백엔드**: Firebase Functions + Firestore + Firebase Auth + Firebase Storage
- **임베딩**: Supabase pgvector (유사 프롬프트/프로필 검색용)
- **배포**: Vercel (프론트) + Firebase (백엔드)
- **디자인**: Figma + Figma MCP 연동

---

## 📁 프로젝트 구조

```
tacit/
├── CLAUDE.md                 # Claude Code 최상위 지침 (반드시 먼저 읽기)
├── README.md                 # 이 파일
├── docs/                     # 전체 설계 문서
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPEC.md
│   ├── FEATURES.md
│   ├── DESIGN_SYSTEM.md
│   ├── DARK_LIGHT_MODE.md
│   ├── UI_COMPONENTS.md
│   ├── USER_FLOWS.md
│   ├── FIGMA_MCP_GUIDE.md
│   ├── PROMPT_ENGINE.md
│   ├── DOMAIN_TEMPLATES.md
│   ├── TACIT_INTERVIEW.md
│   ├── SQUARE_NETWORK.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT_ROADMAP.md
├── app/                      # Next.js App Router
├── components/               # UI 컴포넌트
├── lib/                      # 유틸리티 및 Firebase 클라이언트
├── functions/                # Firebase Cloud Functions
└── public/                   # 정적 자원
```

---

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 Firebase, Anthropic API 키 입력

# 개발 서버 실행
npm run dev

# Firebase Functions 로컬 실행
cd functions && npm run serve
```

환경변수 상세는 `docs/DEPLOYMENT.md` 참고.

---

## 🎯 MVP 목표 (4주)

- Week 1: Core Engine (L1)
- Week 2: 도메인 템플릿 3종 + UI
- Week 3: 암묵지 인터뷰 모드 (L4)
- Week 4: Square (L5) + 배포

자세한 단계별 계획은 `docs/DEVELOPMENT_ROADMAP.md` 참고.

---

## 📋 타깃 사용자

### 1차: 4-50대 도메인 보유자
20-30년 업계 경험이 있는 자영업자·직장인·은퇴자. AI는 들어봤지만 어떻게 써야 할지 모르는 층.

### 2차: 1인 창업가·소상공인
마케팅·디자인·문서작업을 외주 없이 스스로 해야 하는 층. 비용 절감이 절박.

### 3차: AI 입문자 전체
프롬프트 쓸 줄 모르는 초보자. "뭘 물어야 할지조차 모르겠어요" 층.

---

## 💰 수익 모델

1. **Freemium**: 월 10회 무료, 이상은 구독 (월 9,900원)
2. **도메인 템플릿 판매**: 업종별 특화 팩 (건당 29,000~99,000원)
3. **Square 거래 수수료**: 프롬프트/프로필 마켓플레이스 (15%)
4. **B2B 라이선스**: 소상공인협회·직능단체·지자체 공급

---

## 🏛 차별점

| 기존 서비스 (PromptBase 등) | **Tacit** |
|----------------------------|-----------|
| 프롬프트를 만든 사람을 위한 장터 | 프롬프트를 모르는 사람을 위한 인터뷰어 |
| 기술 중심 | 경험(암묵지) 중심 |
| 20-30대 IT 사용자 | 4-50대 도메인 보유자 |
| 프롬프트가 상품 | 사용자 자신이 자산화됨 |

---

## 📜 라이선스

사내 프로젝트. 외부 배포 금지.
