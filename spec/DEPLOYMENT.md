# DEPLOYMENT.md — 배포 가이드

Vercel(프론트엔드) + Firebase(백엔드) 기반 배포 전체 프로세스입니다.

---

## 환경 분리

| 환경 | 용도 | 도메인 | Firebase 프로젝트 |
|------|------|--------|-------------------|
| Local | 개발자 로컬 | localhost:3000 | tacit-dev (에뮬레이터) |
| Dev | 개발자 통합 테스트 | dev.tacit.app | tacit-dev |
| Staging | QA·내부 검토 | staging.tacit.app | tacit-staging |
| Production | 실제 서비스 | tacit.app, www.tacit.app | tacit-prod |

---

## 초기 세팅

### 1. Firebase 프로젝트 생성

```bash
# Firebase CLI 설치
npm install -g firebase-tools
firebase login

# 프로젝트 3개 생성 (Firebase Console에서)
# - tacit-dev
# - tacit-staging
# - tacit-prod

# 프로젝트 별칭 설정
firebase use --add tacit-dev --alias dev
firebase use --add tacit-staging --alias staging
firebase use --add tacit-prod --alias prod
```

### 2. Firebase 서비스 활성화

각 프로젝트에서 다음 서비스 활성화:
- Authentication (Email/Password, Google, Kakao, Naver)
- Firestore Database (asia-northeast3 리전)
- Cloud Functions (2세대, Node 20, asia-northeast3)
- Cloud Storage (asia-northeast3)
- App Check (프로덕션만)

### 3. Vercel 프로젝트 생성

```bash
npm install -g vercel
vercel login

cd tacit/
vercel link   # 프로젝트 연결
```

Vercel Dashboard에서:
- Git 저장소 연결 (GitHub)
- Preview 환경: `develop` 브랜치
- Production 환경: `main` 브랜치

### 4. Supabase 프로젝트 생성

```bash
# Supabase Dashboard에서 프로젝트 생성
# - tacit-dev
# - tacit-prod
# (staging은 prod와 공유 가능)
```

pgvector 확장 활성화:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 환경변수 관리

### Vercel 환경변수

Vercel Dashboard → Settings → Environment Variables

**Development / Preview / Production 분리**

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tacit-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (서버만)
FIREBASE_ADMIN_PROJECT_ID=tacit-prod
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI (임베딩)
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# 결제
TOSS_SECRET_KEY=...
TOSS_CLIENT_KEY=...

# 분석
NEXT_PUBLIC_GA_ID=G-XXXXXX
NEXT_PUBLIC_MIXPANEL_TOKEN=...

# 기타
NEXT_PUBLIC_APP_URL=https://tacit.app
NEXT_PUBLIC_ENV=production
```

### Firebase Functions 환경변수

```bash
# Functions용 env 설정 (2세대는 .env 파일 사용)
cd functions/
touch .env.tacit-prod

# 파일 내용
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
TOSS_SECRET_KEY=...

# 배포 시 자동 읽음 (파일명 = .env.{프로젝트ID})
```

---

## 첫 배포

### Firebase 배포

```bash
# 1. Firestore 규칙 & 인덱스
firebase deploy --only firestore:rules,firestore:indexes --project prod

# 2. Storage 규칙
firebase deploy --only storage --project prod

# 3. Functions
firebase deploy --only functions --project prod

# 4. Hosting은 Vercel에서 처리하므로 생략
```

### Vercel 배포

```bash
# 첫 프로덕션 배포
git push origin main

# 또는 CLI
vercel --prod
```

### 도메인 연결

Vercel → Settings → Domains:
1. `tacit.app` 추가
2. `www.tacit.app` → `tacit.app` 리다이렉트
3. DNS 설정:
   - A: `76.76.21.21`
   - CNAME (www): `cname.vercel-dns.com`

---

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
        env:
          BASE_URL: ${{ secrets.E2E_BASE_URL }}

  deploy-functions:
    if: github.ref == 'refs/heads/main'
    needs: [lint-typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && cd functions && npm ci
      - uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions --project prod
        env:
          GCP_SA_KEY: ${{ secrets.GCP_SA_KEY }}
```

### Branch 전략

```
main (프로덕션)
  ↑
develop (스테이징 자동 배포)
  ↑
feature/* (PR로 merge)
```

- `feature/*` → PR → 코드 리뷰 → `develop` 병합 → 스테이징 자동 배포
- `develop` → PR → QA 완료 → `main` 병합 → 프로덕션 자동 배포

---

## Firestore 규칙 배포

`firestore.rules` 파일 수정 후:

```bash
# 로컬 테스트
firebase emulators:start --only firestore
npm run test:rules

# 배포
firebase deploy --only firestore:rules --project prod
```

규칙 배포는 반드시 테스트 먼저. 잘못된 규칙으로 전체 사용자 접근 차단 가능.

---

## Firestore 인덱스 배포

`firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "square",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "moderation.status", "order": "ASCENDING" },
        { "fieldPath": "stats.copies", "order": "DESCENDING" }
      ]
    }
  ]
}
```

배포:
```bash
firebase deploy --only firestore:indexes --project prod
```

인덱스 빌드는 비동기. Firebase Console에서 완료 확인 후 쿼리 사용.

---

## Cloud Functions 구조

```
functions/
├── src/
│   ├── index.ts                # 모든 함수 export
│   ├── prompt/
│   │   ├── generate.ts         # SSE 스트리밍
│   │   ├── plan.ts             # 질문 생성
│   │   └── assemble.ts         # 프롬프트 조립
│   ├── interview/
│   │   ├── start.ts
│   │   ├── finalize.ts         # 프로필 생성 + 임베딩
│   │   └── embed.ts            # OpenAI 임베딩
│   ├── square/
│   │   ├── publish.ts
│   │   ├── moderate.ts
│   │   └── recommend.ts
│   ├── billing/
│   │   ├── checkout.ts
│   │   ├── webhook.ts
│   │   └── payout.ts
│   └── triggers/
│       ├── onUserCreate.ts     # 신규 사용자 초기화
│       └── onPromptWrite.ts    # 임베딩 자동 생성
├── package.json
├── tsconfig.json
└── .env.tacit-prod
```

### 리전 & 설정

```typescript
// functions/src/config.ts
import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({
  region: 'asia-northeast3',
  timeoutSeconds: 60,
  memory: '512MiB',
  maxInstances: 100,
});
```

긴 작업은 개별 설정:
```typescript
export const finalizeInterview = onCall(
  { timeoutSeconds: 300, memory: '1GiB' },
  async (request) => { /* ... */ }
);
```

---

## 모니터링

### Vercel Analytics
- Web Vitals (CLS, LCP, FID, INP)
- 실시간 트래픽
- 에러 추적 (자동)

### Firebase 모니터링
- **Crashlytics** (모바일 없으므로 생략)
- **Performance Monitoring**: 활성화
- **Cloud Monitoring**: Functions 지표 + 알림

### 외부 모니터링

**Sentry** (에러 추적):
```typescript
// app/layout.tsx
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV,
  tracesSampleRate: 0.1,
});
```

**Mixpanel / GA4** (프로덕트 분석):
- 주요 이벤트: 가입, 프롬프트 생성, 인터뷰 완료, 구독 전환

### Uptime 체크
- Better Uptime / UptimeRobot
- 5분 간격 ping: `https://tacit.app/api/health`
- 다운 시 Slack/SMS 알림

---

## 로깅

### Cloud Logging
- Firebase Functions 로그 자동 수집
- Log Explorer에서 쿼리
- 심각도별 알림 정책 설정

### 구조화 로깅

```typescript
import { logger } from 'firebase-functions';

logger.info('Prompt generated', {
  userId,
  promptId,
  outputType,
  tokensUsed,
  cacheHitRatio,
  generationTimeMs,
});
```

---

## 백업 & 복구

### Firestore 백업
- Firebase Console → Scheduled backups 활성화
- 매일 03:00 KST 자동 백업
- Cloud Storage `gs://tacit-prod-backups/firestore/`
- 30일 보관

### Supabase 백업
- Supabase Dashboard → Database → Backups
- 일일 자동 백업 (무료 플랜 7일)

### 복구 절차
```bash
# Firestore 복구
gcloud firestore import gs://tacit-prod-backups/firestore/2026-05-01

# 복구는 staging에서 먼저 테스트 후 프로덕션 적용
```

---

## 비밀 관리

### GitHub Secrets
- `GCP_SA_KEY`: Firebase 배포용 서비스 계정 키
- `FIGMA_TOKEN`: CI에서 디자인 검증 시
- `SENTRY_AUTH_TOKEN`: 소스맵 업로드

### Google Secret Manager (프로덕션)
민감한 환경변수는 Secret Manager에 저장:

```typescript
import { defineSecret } from 'firebase-functions/params';

const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

export const generate = onRequest(
  { secrets: [anthropicKey] },
  async (req, res) => {
    const apiKey = anthropicKey.value();
    // ...
  }
);
```

---

## 배포 체크리스트

### 배포 전 (PR 단계)
- [ ] 모든 테스트 통과
- [ ] TypeScript 에러 없음
- [ ] ESLint 경고 없음
- [ ] 환경변수 추가 필요 시 팀 공지
- [ ] Firestore 규칙 변경 시 테스트 완료
- [ ] 마이그레이션 스크립트 있으면 dry-run 완료

### 배포 직후
- [ ] Vercel 빌드 성공 확인
- [ ] 주요 페이지 수동 테스트 (랜딩, 가입, 프롬프트 생성)
- [ ] Sentry 새 에러 없음 확인 (5분)
- [ ] Functions 에러율 확인 (< 1%)

### 배포 후 24시간
- [ ] MAU 변화 없음
- [ ] P95 응답시간 < 3초 (프롬프트 생성)
- [ ] 사용자 피드백 이상 신호 없음

---

## 롤백 절차

### Vercel 롤백
```bash
# Vercel Dashboard → Deployments → 이전 배포 선택 → Promote to Production
```
또는:
```bash
vercel rollback <deployment-url>
```

### Firebase Functions 롤백
```bash
# 이전 커밋으로 체크아웃 후 재배포
git checkout <previous-commit>
firebase deploy --only functions --project prod
```

### Firestore 규칙 롤백
Firebase Console → Firestore → 규칙 → 히스토리에서 이전 버전 복원.

---

## 성능 최적화

### Next.js
- 모든 이미지: `next/image` 사용
- 동적 임포트: `dynamic()` 활용
- 서버 컴포넌트 기본, 필요한 곳만 `'use client'`
- ISR/캐싱 적극 활용

### Firebase Functions
- Cold Start 최소화: `minInstances: 1` (비용 감수)
- Prompt Caching으로 API 비용 절감
- 긴 작업은 Cloud Tasks로 비동기화

### CDN
- Vercel Edge Network 기본 활용
- 정적 자산은 `/public` (불변)

---

## 비용 모니터링

### 예상 비용 (월 MAU 1만 기준)

| 서비스 | 예상 비용 |
|--------|----------|
| Vercel (Pro) | $20 |
| Firebase Firestore | $50 |
| Firebase Functions (2세대) | $30 |
| Firebase Storage | $10 |
| Supabase (Pro) | $25 |
| Anthropic API | $350 |
| OpenAI 임베딩 | $20 |
| Sentry | $26 |
| Mixpanel | $25 |
| 토스페이먼츠 수수료 | 매출의 2.9% |
| **합계 (결제 제외)** | **약 $575/월** |

### 비용 알림
- Google Cloud Billing Budget: 월 $1,000 초과 시 알림
- Anthropic: API 사용량 주간 체크 (Dashboard)

---

## 보안 체크리스트

- [ ] Firestore 규칙 엄격하게 (기본 deny)
- [ ] App Check 활성화 (프로덕션)
- [ ] API 키 서버에만 존재 (클라이언트 노출 금지)
- [ ] CORS 화이트리스트 설정
- [ ] Rate Limiting (Firebase Functions)
- [ ] 결제 웹훅 서명 검증
- [ ] 사용자 입력 sanitize (XSS 방지)
- [ ] 정기 의존성 감사: `npm audit`, Dependabot

---

## 참고 문서

- 스택 상세: `TECH_STACK.md`
- DB 구조: `DATABASE_SCHEMA.md`
- API: `API_SPEC.md`
- 로드맵: `DEVELOPMENT_ROADMAP.md`
