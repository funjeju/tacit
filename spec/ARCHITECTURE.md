# ARCHITECTURE.md — Tacit 시스템 아키텍처

## 1. 아키텍처 개요

Tacit은 **JAMstack + 서버리스 + AI 오케스트레이션** 구조다.
- **정적/동적 하이브리드**: Next.js 14 App Router로 SSG + SSR 혼용
- **서버리스 백엔드**: Firebase Functions로 비용 최소화
- **AI 게이트웨이**: Next.js Route Handler가 Claude API 오케스트레이션
- **실시간 데이터**: Firestore 실시간 리스너로 인터뷰 세션·Square 피드 동기화

---

## 2. 시스템 구성도 (High-level)

```
[User Browser]
     │
     │  HTTPS
     ▼
[Vercel Edge Network] ──────► [Next.js App]
     │                               │
     │   (Static Assets)             │  (Server Components
     │                               │   + Route Handlers)
     ▼                               │
[Vercel Edge Cache]                  │
                                     │
                                     ├──► [Claude API] (Anthropic)
                                     ├──► [Firebase Auth]
                                     ├──► [Firestore]
                                     ├──► [Firebase Storage]
                                     ├──► [Supabase pgvector]
                                     └──► [Firebase Functions]
                                             │
                                             ├──► [Claude API]
                                             └──► [External AI APIs]
                                                  (OpenAI, Replicate 등)
```

---

## 3. 레이어별 책임

### 3.1 Presentation Layer (Next.js App)
**위치**: `/app`, `/components`
**책임**:
- 사용자 인터페이스 렌더링
- 클라이언트 상호작용 (폼 입력, 질문 응답)
- 다크/라이트 모드 전환
- Server Components 우선, 상호작용 필요 시 Client Components

**주요 경로**:
- `/app/(marketing)/page.tsx` — 랜딩
- `/app/(app)/studio` — 메타프롬프트 엔진
- `/app/(app)/library` — 내 서재
- `/app/(app)/interview` — 암묵지 인터뷰
- `/app/(app)/square` — Square 네트워크

### 3.2 API Layer (Route Handlers)
**위치**: `/app/api/**`
**책임**:
- Claude API 호출 (스트리밍 포함)
- Firestore 읽기/쓰기 (서버 컨텍스트)
- 인증 검증
- 프롬프트 조립 (서버 사이드 전용, 노출 금지)

**주요 엔드포인트**:
- `POST /api/prompt/generate` — 메타프롬프트 생성 (스트리밍)
- `POST /api/interview/next-question` — 인터뷰 다음 질문
- `POST /api/interview/finalize` — 인터뷰 완료 시 프로필 추출
- `POST /api/square/publish` — 프롬프트 공개
- `GET /api/square/feed` — Square 피드

### 3.3 Business Logic Layer (Firebase Functions)
**위치**: `/functions/src/**`
**책임**:
- 무거운 배치 작업
- 외부 AI API 호출 (Midjourney, Veo 등)
- 이미지/영상 처리
- Square 랭킹 집계
- 사용량 쿼터 체크 및 집계

**주요 함수**:
- `onInterviewComplete` — 인터뷰 완료 시 프로필 벡터화
- `onPromptUsed` — 프롬프트 사용 시 통계 집계
- `squareRankingUpdater` — 크론으로 Square 랭킹 갱신
- `proxyExternalAI` — 외부 AI API 프록시

### 3.4 Data Layer
**Firestore**: 구조화된 사용자 데이터
**Firebase Storage**: 업로드된 이미지/영상/음성 파일
**Supabase pgvector**: 임베딩 벡터 (프롬프트·프로필 유사도 검색)

자세한 스키마는 `DATABASE_SCHEMA.md` 참고.

---

## 4. 주요 데이터 흐름

### 4.1 메타프롬프트 생성 흐름

```
[사용자]
  │ 1. 유형 선택 ("이미지 > 포스터")
  ▼
[Next.js Client Component]
  │ 2. POST /api/prompt/generate
  ▼
[Route Handler]
  │ 3. 도메인 템플릿 로드 (Firestore)
  │ 4. 사용자 프로필 로드 (있으면)
  │ 5. Claude API 호출 (첫 질문 생성, 스트리밍)
  ▼
[Client]
  │ 6. 질문 표시, 답변 입력
  │ 7. 답변 제출 → 반복 (3회-7회)
  ▼
[Route Handler]
  │ 8. 모든 답변 종합 → 최종 프롬프트 조립
  │ 9. Firestore에 저장
  ▼
[Client]
  │ 10. 완성된 프롬프트 표시 + "외부 도구에서 열기" 버튼
```

### 4.2 암묵지 인터뷰 흐름

```
[사용자]
  │ 1. "암묵지 인터뷰 시작" 클릭
  ▼
[인터뷰 세션 생성 (Firestore)]
  │ 2. 도메인 선택 (직접 입력 or 템플릿)
  ▼
[Route Handler: 첫 질문 생성]
  │ 3. Claude API로 시작 질문 5개 생성
  ▼
[사용자 답변 (텍스트/음성)]
  │
  ▼
[Route Handler: 다음 질문 동적 생성]
  │ 4. 이전 답변 맥락 반영해 다음 질문 생성
  │ 5. 30-50회 반복 (사용자 중단 시까지)
  ▼
[인터뷰 완료]
  │ 6. Firebase Function: onInterviewComplete 트리거
  │ 7. Claude로 답변 통합 → 도메인 프로필 생성
  │ 8. Supabase에 벡터 임베딩 저장
  ▼
[프로필 저장 완료]
  │ 9. 이후 모든 메타프롬프트 생성에 자동 반영
```

### 4.3 Square 피드 흐름

```
[사용자 A]
  │ 1. 프롬프트 생성 후 "Square에 공개"
  ▼
[Route Handler: /api/square/publish]
  │ 2. 프롬프트 공개 상태 업데이트
  │ 3. 카테고리/도메인 태그 추출
  │ 4. 임베딩 벡터 계산 (Supabase)
  ▼
[사용자 B]
  │ 5. Square 피드 방문
  ▼
[Route Handler: /api/square/feed]
  │ 6. 사용자 B의 도메인 매칭 프롬프트 추천 (벡터 유사도)
  │ 7. 랭킹 적용 (좋아요 × 최신성 × 관련도)
  ▼
[피드 렌더링]
  │ 8. 사용자 B가 "복제" 클릭 시 → 자기 프롬프트로 복사
```

---

## 5. 인증 및 권한

### 5.1 인증 제공자
- Firebase Auth
- 지원 로그인: Google, 카카오, 애플, 이메일/패스워드

### 5.2 사용자 역할
- `guest`: 비로그인 (Layer 1만 시연 가능, 저장 불가)
- `user`: 일반 로그인 사용자
- `pro`: 유료 구독자 (할당량 상향, Square 고급 필터)
- `admin`: Anthropic 운영팀

### 5.3 권한 매트릭스

| 기능 | guest | user | pro | admin |
|------|:----:|:----:|:----:|:----:|
| 메타프롬프트 생성 | △ (월 3회) | ✓ (월 10회) | ✓ (무제한) | ✓ |
| 서재 저장 | ✗ | ✓ | ✓ | ✓ |
| 암묵지 인터뷰 | ✗ | ✓ (1개) | ✓ (5개) | ✓ |
| Square 공개 | ✗ | ✓ | ✓ | ✓ |
| Square 복제 | ✗ | ✓ | ✓ | ✓ |
| 도메인 템플릿 구매 | ✗ | ✓ | ✓ | ✓ |
| 신고 처리 | ✗ | ✗ | ✗ | ✓ |

---

## 6. 프롬프트 엔지니어링 원칙 (아키텍처 차원)

### 6.1 프롬프트 3단 구조
모든 Tacit 내부 프롬프트는 아래 3단 구조를 따른다.

```
[1. 시스템 지침 — 서버에 고정]
  + Tacit 플랫폼 전체 톤앤매너
  + 현재 도메인 템플릿
  + 사용자 프로필 (있으면)

[2. 대화 히스토리]
  + 이전 질문-답변 쌍

[3. 현재 턴 입력]
  + 사용자의 최신 답변
```

### 6.2 프롬프트 레시피 버저닝
- 각 도메인 템플릿은 Firestore에 버전 관리됨
- `templates/{domain}/versions/{version}` 구조
- 품질 개선 시 새 버전 발행, 기존 사용자는 선택 업그레이드

### 6.3 모델 선택 전략
- **Claude Sonnet 4.6**: 최종 프롬프트 조립, 도메인 인터뷰
- **Claude Haiku 4.5**: 질문 생성, 간단한 검증
- **임베딩**: OpenAI text-embedding-3-small (비용 효율)

---

## 7. 배포 환경

### 7.1 환경 분리
- `development`: 로컬 Firebase Emulator + 로컬 Next.js
- `staging`: staging.tacit.app (Vercel Preview + Firebase staging 프로젝트)
- `production`: tacit.app (Vercel Production + Firebase prod 프로젝트)

### 7.2 CI/CD
- GitHub Actions
- PR 생성 시 Vercel Preview 자동 배포
- `main` 브랜치 머지 시 prod 자동 배포
- `develop` 브랜치는 staging 자동 배포

자세한 설정은 `DEPLOYMENT.md` 참고.

---

## 8. 모니터링 및 관측성

- **에러 추적**: Sentry
- **분석**: GA4 + Amplitude
- **Claude API 사용량**: 자체 대시보드 (Firestore 집계)
- **성능**: Vercel Analytics + Web Vitals

---

## 9. 비용 추정 (월 MAU 1만 기준)

| 항목 | 예상 비용 |
|------|-----------|
| Claude API (Haiku 중심) | 약 $400 |
| Firebase (Firestore + Functions + Storage) | 약 $80 |
| Vercel Pro | $20 |
| Supabase (pgvector) | $25 |
| 기타 (GA4, Sentry 등) | $50 |
| **합계** | **약 $575/월** |

상세 산출은 `docs/COST_MODEL.md` (필요 시 추후 작성)
