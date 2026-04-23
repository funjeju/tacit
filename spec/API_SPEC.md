# API_SPEC.md — Tacit API 명세

## 1. 개요

모든 API는 Next.js 14 Route Handler로 구현. `/app/api/**/route.ts` 위치.

### 1.1 공통 헤더
```
Content-Type: application/json
Authorization: Bearer {firebase-id-token}
```

### 1.2 공통 응답 포맷
```typescript
// 성공
{ ok: true, data: T }

// 실패
{ ok: false, error: { code: string, message: string, details?: any } }
```

### 1.3 공통 에러 코드
| 코드 | 의미 |
|------|------|
| `UNAUTHORIZED` | 인증 필요 |
| `FORBIDDEN` | 권한 없음 |
| `NOT_FOUND` | 리소스 없음 |
| `VALIDATION_ERROR` | 입력 검증 실패 |
| `QUOTA_EXCEEDED` | 사용량 초과 |
| `UPSTREAM_ERROR` | Claude/외부 API 에러 |
| `INTERNAL_ERROR` | 서버 내부 에러 |

### 1.4 Rate Limiting
- 비로그인: IP당 월 10회
- user: 월 10회 (플랜별)
- pro: 무제한 (팟 한도 설정)

---

## 2. Prompt API

### 2.1 `POST /api/prompt/start` — 프롬프트 세션 시작

사용자가 유형 선택 후 첫 질문을 받는다.

**요청**:
```typescript
{
  type: 'report' | 'image' | 'video' | 'presentation' | 'code' | 'music' | 'plan' | 'copy';
  domainId?: string;                  // 도메인 템플릿 사용 시
  typeSubcategory?: string;           // 템플릿 하위 유형
  initialKeyword: string;             // 사용자가 입력한 초기 키워드
  useProfileId?: string;              // 개인 프로필 활용 여부
}
```

**응답**:
```typescript
{
  ok: true,
  data: {
    sessionId: string;
    firstQuestion: {
      questionId: string;
      question: string;
      inputType: 'text' | 'textarea' | 'select' | 'multiselect';
      placeholder?: string;
      examples?: string[];
      options?: Array<{ value: string; label: string }>;
    };
    progressHint: {
      estimatedQuestions: number;
      currentStep: 1;
    };
  }
}
```

### 2.2 `POST /api/prompt/answer` — 답변 제출 & 다음 질문

**요청**:
```typescript
{
  sessionId: string;
  questionId: string;
  answer: string | string[];          // 멀티셀렉트는 배열
}
```

**응답 (추가 질문 있음)**:
```typescript
{
  ok: true,
  data: {
    status: 'continue';
    nextQuestion: { /* 위와 동일 구조 */ };
    progressHint: {
      estimatedQuestions: 5;
      currentStep: 3;
    };
  }
}
```

**응답 (질문 완료)**:
```typescript
{
  ok: true,
  data: {
    status: 'ready_to_generate';
    sessionId: string;
  }
}
```

### 2.3 `POST /api/prompt/generate` — 최종 프롬프트 생성 (스트리밍)

**요청**:
```typescript
{
  sessionId: string;
}
```

**응답**: Server-Sent Events (SSE) 스트림
```
data: {"type":"thinking","message":"프로필 반영 중..."}
data: {"type":"chunk","content":"당신은 20년 경력의..."}
data: {"type":"chunk","content":" 한식당 사장입니다..."}
data: {"type":"complete","promptId":"abc123","finalPrompt":"..."}
```

### 2.4 `GET /api/prompt/:promptId` — 프롬프트 조회

**응답**:
```typescript
{
  ok: true,
  data: Prompt;  // DATABASE_SCHEMA.md 참고
}
```

### 2.5 `POST /api/prompt/:promptId/execute` — 내부 실행

Claude/OpenAI 등 API 연동 가능한 도구에서 바로 실행.

**요청**:
```typescript
{
  targetTool: 'claude' | 'chatgpt' | 'image_flux';
}
```

**응답**: SSE 스트림 또는 `resultId`

### 2.6 `POST /api/prompt/:promptId/external-open` — 외부 도구 열기

외부 도구 URL을 반환해 클라이언트가 탭 오픈 + 클립보드 복사.

**응답**:
```typescript
{
  ok: true,
  data: {
    toolUrl: string;                  // "https://chat.openai.com/"
    promptText: string;               // 복사할 텍스트
    copyInstructions: string;         // "붙여넣고 엔터를 누르세요"
  }
}
```

### 2.7 `POST /api/prompt/:promptId/save-result` — 결과물 저장

```typescript
{
  resultType: 'text' | 'image' | 'video' | 'audio' | 'file';
  content?: string;
  fileUrl?: string;
  userRating?: 1-5;
}
```

### 2.8 `GET /api/prompts` — 내 서재 목록

**쿼리 파라미터**:
- `type?`, `domainId?`, `limit=20`, `cursor?`, `sort='updated'|'created'`

**응답**:
```typescript
{
  ok: true,
  data: {
    items: Prompt[];
    nextCursor?: string;
  }
}
```

### 2.9 `DELETE /api/prompt/:promptId`

---

## 3. Interview API (암묵지 인터뷰)

### 3.1 `POST /api/interview/start`

**요청**:
```typescript
{
  domainId?: string;
  customDomain?: string;              // 맞춤 도메인
  inputMode: 'text' | 'voice' | 'mixed';
  targetQuestionCount?: number;       // 기본 30
}
```

**응답**:
```typescript
{
  ok: true,
  data: {
    interviewId: string;
    firstQuestion: InterviewQuestion;
    welcomeMessage: string;           // "안녕하세요. 앞으로 30-50분 정도..."
  }
}
```

### 3.2 `POST /api/interview/:interviewId/answer`

**요청**:
```typescript
{
  questionId: string;
  answer: string;
  answerMode: 'text' | 'voice';
  audioUrl?: string;                  // 음성 파일 (Storage에 업로드됨)
}
```

**응답 (계속)**:
```typescript
{
  ok: true,
  data: {
    status: 'continue';
    nextQuestion: InterviewQuestion;
    progress: {
      answered: 7;
      target: 30;
      percentComplete: 23;
    };
    acknowledgment?: string;          // "좋은 답변입니다. 다음 질문으로 넘어갈게요."
  }
}
```

**응답 (완료 가능)**:
```typescript
{
  ok: true,
  data: {
    status: 'ready_to_finalize';
    progress: {
      answered: 30;
      target: 30;
      percentComplete: 100;
    };
  }
}
```

### 3.3 `POST /api/interview/:interviewId/pause`

일시정지. 세션 유지하되 비활성 상태로 전환.

### 3.4 `POST /api/interview/:interviewId/resume`

재개. 마지막 질문 재전송.

### 3.5 `POST /api/interview/:interviewId/finalize`

인터뷰 완료 → Firebase Function이 트리거되어 프로필 생성.

**응답**:
```typescript
{
  ok: true,
  data: {
    interviewId: string;
    profileId: string;
    profile: DomainProfile;          // 생성된 프로필
    stats: {
      totalQuestionsAnswered: number;
      totalDurationSec: number;
    };
  }
}
```

### 3.6 `GET /api/interview/:interviewId`

진행 상태 조회.

---

## 4. Profile API

### 4.1 `GET /api/profiles`

내 프로필 목록.

### 4.2 `GET /api/profiles/:profileId`

### 4.3 `PATCH /api/profiles/:profileId`

프로필 수동 편집 (사용자가 프로필 내용 조정 가능).

```typescript
{
  customLabel?: string;
  experience?: Partial<DomainProfile['experience']>;
  methodology?: Partial<DomainProfile['methodology']>;
  // ...
  isActive?: boolean;
}
```

### 4.4 `DELETE /api/profiles/:profileId`

### 4.5 `POST /api/profiles/:profileId/activate`

여러 프로필 중 활성 프로필 전환.

---

## 5. Template API

### 5.1 `GET /api/templates`

모든 도메인 템플릿 목록.

**쿼리**: `category?`, `isFree?`

### 5.2 `GET /api/templates/:templateId`

### 5.3 `GET /api/templates/:templateId/types`

템플릿 내 모든 유형 트리.

### 5.4 `POST /api/templates/:templateId/purchase` (2차)

유료 템플릿 구매.

---

## 6. Square API

### 6.1 `GET /api/square/feed`

**쿼리**:
- `domainId?`: 도메인 필터
- `type?`: 유형 필터
- `sort`: `'trending' | 'popular' | 'recent'`
- `cursor?`, `limit=20`

**응답**:
```typescript
{
  ok: true,
  data: {
    items: SquareEntry[];
    nextCursor?: string;
  }
}
```

### 6.2 `POST /api/square/publish`

내 프롬프트를 Square에 공개.

```typescript
{
  promptId: string;
  title: string;
  summary: string;                    // 사용자가 작성하는 한 줄 설명
  tags: string[];
}
```

### 6.3 `POST /api/square/:squareId/copy`

Square의 프롬프트를 내 서재로 복제.

**응답**:
```typescript
{
  ok: true,
  data: {
    newPromptId: string;
  }
}
```

### 6.4 `POST /api/square/:squareId/like`

### 6.5 `POST /api/square/:squareId/report`

```typescript
{
  reason: 'spam' | 'inappropriate' | 'plagiarism' | 'other';
  details?: string;
}
```

### 6.6 `GET /api/square/:squareId`

공개된 Square 엔트리 상세 조회.

### 6.7 `GET /api/square/recommendations`

벡터 유사도 기반 추천. 로그인 사용자의 프로필 벡터와 비교.

---

## 7. User API

### 7.1 `GET /api/me`

현재 사용자 정보.

### 7.2 `PATCH /api/me`

```typescript
{
  displayName?: string;
  ageRange?: '30s' | '40s' | '50s' | '60s+';
  region?: string;
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'normal' | 'large' | 'xlarge';
}
```

### 7.3 `GET /api/me/usage`

현재 월 사용량.

```typescript
{
  ok: true,
  data: {
    yearMonth: string;
    promptGenerations: number;
    interviewSessions: number;
    squareCopies: number;
    quotas: {
      promptGenerations: number;      // 총 할당량
      interviewSessions: number;
    };
  }
}
```

### 7.4 `POST /api/me/onboarding/complete`

---

## 8. Upload API

### 8.1 `POST /api/upload/signed-url`

Firebase Storage 업로드용 서명 URL 발급.

```typescript
// 요청
{
  fileName: string;
  contentType: string;
  purpose: 'interview_audio' | 'result_image' | 'avatar' | 'attachment';
}

// 응답
{
  ok: true,
  data: {
    uploadUrl: string;
    storagePath: string;
    publicUrl?: string;               // 공개 파일인 경우
    expiresAt: string;
  }
}
```

---

## 9. 스트리밍 구현 가이드

### 9.1 SSE 응답 작성
```typescript
// app/api/prompt/generate/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      
      try {
        send({ type: 'thinking', message: '프로필 반영 중...' });
        
        const anthropicStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6-20250101',
          max_tokens: 2048,
          system: systemPrompt,
          messages: messages,
        });
        
        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta') {
            send({ type: 'chunk', content: chunk.delta.text });
          }
        }
        
        send({ type: 'complete', promptId });
      } catch (err) {
        send({ type: 'error', error: err.message });
      } finally {
        controller.close();
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 9.2 클라이언트 수신
```typescript
const response = await fetch('/api/prompt/generate', {
  method: 'POST',
  body: JSON.stringify({ sessionId }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      // 처리
    }
  }
}
```

---

## 10. 에러 처리 표준

### 10.1 Rate Limit 초과
```json
{
  "ok": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "이번 달 사용 가능 횟수를 모두 사용하셨습니다.",
    "details": {
      "current": 10,
      "limit": 10,
      "resetAt": "2026-05-01T00:00:00Z"
    }
  }
}
```

### 10.2 인증 실패
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요합니다."
  }
}
```

### 10.3 검증 실패
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 값에 오류가 있습니다.",
    "details": {
      "fieldErrors": {
        "answer": "답변은 최소 10자 이상이어야 합니다."
      }
    }
  }
}
```
