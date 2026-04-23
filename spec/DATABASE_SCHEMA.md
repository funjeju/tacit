# DATABASE_SCHEMA.md — Tacit Firestore 스키마

## 1. 설계 원칙

- **Flat 구조 우선**: 깊은 중첩은 쿼리 비용 증가, 최대 2-3단계 서브컬렉션
- **비정규화 허용**: 읽기 최적화, 필요한 경우 중복 저장
- **소유권 필드 필수**: 모든 문서에 `ownerId` 포함 → 보안 규칙 단순화
- **createdAt / updatedAt 필수**: 모든 문서 공통
- **타임스탬프**: Firestore `serverTimestamp()` 사용
- **ID 규칙**: Firestore 자동 ID 기본, 참조용은 의미 있는 ID

---

## 2. 컬렉션 전체 맵

```
/users/{userId}
  └ /profiles/{profileId}            # 사용자의 도메인 프로필 (복수 가능)
  └ /subscriptions/{subscriptionId}   # 구독 이력
  └ /usage/{yearMonth}                # 월별 사용량 집계

/prompts/{promptId}                   # 생성된 프롬프트 (내 서재 + Square)
  └ /versions/{versionId}             # 프롬프트 편집 히스토리
  └ /results/{resultId}               # 실행 결과물

/interviews/{interviewId}             # 암묵지 인터뷰 세션
  └ /questions/{questionId}           # 질문-답변 쌍

/templates/{templateId}               # 도메인 템플릿 (시스템 관리)
  └ /versions/{version}               # 템플릿 버전
  └ /typeTrees/{typeId}               # 유형별 질문 트리

/square/{squareId}                    # Square 공개 프롬프트
  └ /reactions/{reactionId}           # 좋아요/신고 등

/tags/{tagName}                       # 태그 인덱스 (검색용)
/domains/{domainId}                   # 도메인 마스터 (식당, 교사 등)

/admin/system                         # 시스템 설정
/admin/models                         # AI 모델 설정
```

---

## 3. 컬렉션별 스키마

### 3.1 `/users/{userId}`

```typescript
interface User {
  uid: string;                        // Firebase Auth UID와 동일
  email: string;
  displayName: string;
  photoURL?: string;
  
  // 프로필 기본
  ageRange?: '30s' | '40s' | '50s' | '60s+';  // 타깃 분석용
  region?: string;                    // 거주 지역 (시도 단위)
  primaryDomain?: string;             // 주 도메인 ID
  
  // 권한
  role: 'user' | 'pro' | 'admin';
  
  // 설정
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en' | 'ja';
  fontSize: 'normal' | 'large' | 'xlarge';  // 접근성
  
  // 온보딩
  onboardingCompleted: boolean;
  onboardingStep?: number;
  
  // 타임스탬프
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}
```

### 3.2 `/users/{userId}/profiles/{profileId}` — 도메인 프로필

암묵지 인터뷰 결과로 생성되는 사용자 프로필. 이후 모든 프롬프트 생성에 자동 반영.

```typescript
interface DomainProfile {
  profileId: string;
  userId: string;
  
  domainId: string;                   // /domains/ 참조
  domainLabel: string;                // "식당 사장" 등
  customLabel?: string;               // 사용자 지정 이름 (예: "마포 한식당")
  
  // 인터뷰 결과
  sourceInterviewId: string;          // 어떤 인터뷰에서 만들어졌는가
  
  // 구조화된 프로필 (Claude가 추출)
  experience: {
    years: number;                    // 경력 연수
    specialty: string[];              // 전문 분야 태그
    highlights: string;               // 대표 경험 요약
  };
  
  judgmentPatterns: {                 // 판단 기준
    criteria: string[];
    examples: string[];
  };
  
  methodology: {                      // 업무 방식
    routines: string[];
    philosophy: string;
  };
  
  terminology: string[];              // 업계 용어
  taboos: string[];                   // 금기사항 (예: 경쟁사 언급 회피 등)
  
  // AI 활용 메타
  toneAndVoice: string;               // 사용자 말투 특징
  rawSummary: string;                 // 전체 요약 (시스템 프롬프트용)
  
  // 벡터
  embeddingId?: string;               // Supabase pgvector ID
  
  // 메타
  isActive: boolean;                  // 활성 프로필 여부
  usageCount: number;                 // 이 프로필로 생성된 프롬프트 수
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3.3 `/users/{userId}/usage/{yearMonth}` — 사용량 집계

```typescript
interface MonthlyUsage {
  yearMonth: string;                  // "2026-04"
  userId: string;
  
  promptGenerations: number;
  interviewSessions: number;
  squareCopies: number;
  
  claudeApiCost: number;              // 관리자용 (사용자 노출 X)
  
  updatedAt: Timestamp;
}
```

### 3.4 `/prompts/{promptId}`

```typescript
interface Prompt {
  promptId: string;
  ownerId: string;                    // userId
  
  // 분류
  type: 'report' | 'image' | 'video' | 'presentation' | 'code' | 'music' | 'plan' | 'copy';
  domainId?: string;                  // 도메인 템플릿 사용 시
  typeSubcategory?: string;           // "포스터", "인스타 피드" 등
  
  // 사용자 입력 (원본)
  userInputs: {
    initialKeyword: string;
    answers: Array<{
      questionId: string;
      questionText: string;
      answer: string;
    }>;
  };
  
  // 사용된 프로필 (있으면)
  usedProfileId?: string;
  
  // 최종 결과물
  finalPrompt: string;                // 완성된 프롬프트 텍스트
  finalPromptStructured?: object;     // 구조화 버전 (JSON)
  
  // 실행 대상 도구
  targetTool: 'chatgpt' | 'claude' | 'midjourney' | 'dalle' | 'gamma' | 'veo' | 'suno' | 'runway' | 'custom';
  
  // 공개 상태
  isPublished: boolean;               // Square 공개 여부
  publishedAt?: Timestamp;
  
  // 통계
  stats: {
    views: number;
    copies: number;
    likes: number;
    uses: number;                     // 소유자가 재사용한 횟수
  };
  
  // 태그
  tags: string[];
  
  // 버전
  currentVersion: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3.5 `/prompts/{promptId}/results/{resultId}` — 실행 결과물

```typescript
interface PromptResult {
  resultId: string;
  promptId: string;
  userId: string;
  
  executionType: 'internal' | 'external_link';  // 내부 실행 vs 외부 도구 링크
  
  // 결과
  resultType: 'text' | 'image' | 'video' | 'audio' | 'file';
  content?: string;                   // 텍스트 결과
  fileUrl?: string;                   // Firebase Storage URL
  thumbnailUrl?: string;
  
  // 평가
  userRating?: 1 | 2 | 3 | 4 | 5;
  userNotes?: string;
  
  // 메타
  modelUsed?: string;                 // "Claude Sonnet 4.6", "Midjourney v7" 등
  durationMs?: number;
  
  createdAt: Timestamp;
}
```

### 3.6 `/interviews/{interviewId}`

```typescript
interface Interview {
  interviewId: string;
  userId: string;
  
  domainId?: string;                  // 기존 도메인 기반인 경우
  customDomain?: string;              // 사용자 지정 도메인
  
  // 상태
  status: 'in_progress' | 'completed' | 'abandoned';
  
  // 진행률
  questionsAsked: number;
  questionsAnswered: number;
  targetQuestionCount: number;        // 기본 30, 최대 50
  
  // 세션 메타
  inputMode: 'text' | 'voice' | 'mixed';
  totalDurationSec?: number;
  
  // 결과 (완료 시)
  generatedProfileId?: string;
  
  // 타임스탬프
  startedAt: Timestamp;
  lastActivityAt: Timestamp;
  completedAt?: Timestamp;
}
```

### 3.7 `/interviews/{interviewId}/questions/{questionId}` — 질문-답변

```typescript
interface InterviewQuestion {
  questionId: string;
  interviewId: string;
  sequence: number;                   // 질문 순번
  
  category: 'experience' | 'methodology' | 'judgment' | 'terminology' | 'philosophy' | 'challenge';
  
  question: string;                   // Claude가 생성한 질문
  followUpHint?: string;              // 답변 유도 힌트
  
  answer?: string;                    // 사용자 답변
  answerMode?: 'text' | 'voice';
  answerDurationSec?: number;
  
  // 메타
  claudeReasoning?: string;           // 이 질문을 왜 던졌는지 (디버깅/품질 개선용)
  
  askedAt: Timestamp;
  answeredAt?: Timestamp;
}
```

### 3.8 `/templates/{templateId}` — 도메인 템플릿

```typescript
interface DomainTemplate {
  templateId: string;
  domainId: string;                   // "restaurant", "teacher", "realtor" 등
  
  // 메타
  label: string;                      // "식당 사장"
  description: string;
  icon: string;                       // Lucide 아이콘 이름
  heroImage?: string;
  
  // 버전
  currentVersion: string;
  
  // 가격
  isFree: boolean;
  priceKRW?: number;
  
  // 통계
  stats: {
    activeUsers: number;
    totalPromptsGenerated: number;
    averageRating: number;
  };
  
  // 상태
  status: 'draft' | 'published' | 'deprecated';
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3.9 `/templates/{templateId}/typeTrees/{typeId}` — 유형별 질문 트리

```typescript
interface TypeTree {
  typeId: string;                     // "menu_development", "store_promotion" 등
  templateId: string;
  
  label: string;                      // "신메뉴 홍보"
  description: string;
  icon: string;
  
  // 대상 산출물 유형
  outputType: 'report' | 'image' | 'video' | 'presentation' | 'code' | 'music' | 'plan' | 'copy';
  
  // 질문 트리 (선형 또는 분기)
  questions: Array<{
    questionId: string;
    sequence: number;
    
    // 조건부 분기
    dependsOn?: {
      questionId: string;
      matchValues?: string[];
    };
    
    // 질문 내용
    question: string;
    inputType: 'text' | 'textarea' | 'select' | 'multiselect' | 'number';
    placeholder?: string;
    examples?: string[];              // 답변 예시 (4-50대 UX)
    
    // 검증
    required: boolean;
    minLength?: number;
    
    // 선택지 (select/multiselect일 때)
    options?: Array<{
      value: string;
      label: string;
    }>;
  }>;
  
  // 프롬프트 조립 템플릿 (서버 전용)
  assemblyTemplate: string;           // Claude에 전달되는 조립 규칙
  
  // 연결 도구
  recommendedTool: 'chatgpt' | 'claude' | 'midjourney' | 'dalle' | 'gamma' | 'veo' | 'suno';
  
  // 통계
  usageCount: number;
  averageSatisfaction: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3.10 `/domains/{domainId}` — 도메인 마스터

```typescript
interface Domain {
  domainId: string;                   // "restaurant"
  label: string;                      // "식당 사장"
  description: string;
  category: 'service' | 'education' | 'professional' | 'creative' | 'labor';
  
  iconLucide: string;
  color: string;                      // hex
  
  // 관련 템플릿
  templateIds: string[];
  
  // 통계
  activeProfilesCount: number;
  
  sortOrder: number;
  isActive: boolean;
}
```

### 3.11 `/square/{squareId}` — Square 공개 피드 인덱스

```typescript
interface SquareEntry {
  squareId: string;                   // = promptId
  promptId: string;
  ownerId: string;
  ownerDisplayName: string;           // 비정규화 (피드 렌더링 최적화)
  ownerAvatarUrl?: string;
  
  title: string;
  summary: string;
  
  type: string;
  domainId?: string;
  tags: string[];
  
  // 통계 (랭킹용)
  stats: {
    views: number;
    likes: number;
    copies: number;
    reports: number;
  };
  
  // 랭킹 스코어 (크론 갱신)
  rankingScore: number;
  trendingScore: number;              // 최근 24시간 가중
  
  // 상태
  status: 'active' | 'hidden' | 'removed';
  
  publishedAt: Timestamp;
  lastActivityAt: Timestamp;
}
```

### 3.12 `/square/{squareId}/reactions/{reactionId}`

```typescript
interface Reaction {
  reactionId: string;
  squareId: string;
  userId: string;
  
  type: 'like' | 'copy' | 'report';
  reason?: string;                    // 신고 사유
  
  createdAt: Timestamp;
}
```

---

## 4. Firestore 보안 규칙 (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      return request.auth.token.role == 'admin';
    }
    
    // Users
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) && 
                     !('role' in request.resource.data.diff(resource.data).affectedKeys());
      allow delete: if isAdmin();
      
      match /profiles/{profileId} {
        allow read, write: if isOwner(userId);
      }
      
      match /usage/{yearMonth} {
        allow read: if isOwner(userId);
        allow write: if false;  // 서버 사이드만
      }
    }
    
    // Prompts
    match /prompts/{promptId} {
      allow read: if isOwner(resource.data.ownerId) 
                  || resource.data.isPublished == true;
      allow create: if isSignedIn() && isOwner(request.resource.data.ownerId);
      allow update: if isOwner(resource.data.ownerId);
      allow delete: if isOwner(resource.data.ownerId);
      
      match /results/{resultId} {
        allow read, write: if isOwner(get(/databases/$(database)/documents/prompts/$(promptId)).data.ownerId);
      }
    }
    
    // Interviews
    match /interviews/{interviewId} {
      allow read, write: if isOwner(resource.data.userId);
      
      match /questions/{questionId} {
        allow read, write: if isOwner(get(/databases/$(database)/documents/interviews/$(interviewId)).data.userId);
      }
    }
    
    // Templates (읽기만 공개)
    match /templates/{templateId} {
      allow read: if true;
      allow write: if isAdmin();
      
      match /typeTrees/{typeId} {
        allow read: if true;
        allow write: if isAdmin();
      }
    }
    
    // Domains
    match /domains/{domainId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Square
    match /square/{squareId} {
      allow read: if true;
      allow create: if isSignedIn() && isOwner(request.resource.data.ownerId);
      allow update: if isOwner(resource.data.ownerId) || isAdmin();
      allow delete: if isOwner(resource.data.ownerId) || isAdmin();
      
      match /reactions/{reactionId} {
        allow read: if true;
        allow create: if isSignedIn() && isOwner(request.resource.data.userId);
        allow delete: if isOwner(resource.data.userId);
      }
    }
  }
}
```

---

## 5. 복합 인덱스 설정

`firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "square",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "domainId", "order": "ASCENDING" },
        { "fieldPath": "rankingScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "square",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "trendingScore", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 6. Supabase pgvector 스키마

```sql
-- 프로필 임베딩
CREATE TABLE profile_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL,           -- Firestore profileId 참조
  user_id TEXT NOT NULL,
  domain_id TEXT,
  embedding VECTOR(1536),              -- OpenAI text-embedding-3-small 차원
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON profile_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 프롬프트 임베딩 (Square 유사 추천용)
CREATE TABLE prompt_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  domain_id TEXT,
  type TEXT,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON prompt_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON prompt_embeddings (domain_id);
```
