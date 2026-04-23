# PROMPT_ENGINE.md — 메타프롬프트 엔진

Tacit의 심장. 사용자의 모호한 입력을 구조화된 질문으로 증폭하고, 답변을 최종 프롬프트로 조립하는 엔진의 설계 문서입니다.

---

## 설계 철학

1. **AI가 AI에게 묻는다** — 사용자는 한 번도 "프롬프트 엔지니어링"을 의식하지 않는다
2. **질문은 도메인 × 유형의 교차점에서 생성된다** — 일반 질문이 아니라 맥락 질문
3. **암묵지 프로필이 있으면 질문 수가 줄어든다** — 이미 아는 건 다시 묻지 않는다
4. **모든 답변은 재사용된다** — 한 번 답한 내용은 `DomainProfile`에 축적되어 다음에 자동 반영

---

## 엔진 전체 흐름

```
[사용자 입력]
    ├─ 산출물 유형 (image, report, video, ppt, code, music)
    ├─ 초기 키워드 (자유 텍스트)
    └─ 도메인 프로필 (옵션)
         ↓
[1단계: 질문 플래너 (Question Planner)]
    └─ 유형 × 도메인에 맞는 질문 5~7개 생성
         ↓
[2단계: 인터뷰 세션 (Interview Session)]
    └─ 질문 1개씩 순차 제시 + 답변 수집
         ↓
[3단계: 프롬프트 조립기 (Prompt Assembler)]
    └─ 답변 + 프로필 + 유형 템플릿 → 최종 프롬프트 생성
         ↓
[4단계: 실행 라우팅 (Execution Router)]
    └─ 유형별 외부 AI 도구로 연결 + 결과 저장
```

---

## 시스템 프롬프트 구조 (3단 레이어)

모든 Claude API 호출은 다음 3단 구조로 시스템 프롬프트를 구성합니다.

### Layer A. Identity (고정, 캐시됨)

```
당신은 Tacit의 프롬프트 엔진입니다.
Tacit은 4-50대 도메인 전문가의 경험을 AI 프롬프트로 번역하는 서비스입니다.

당신의 역할은 두 가지입니다:
1. 사용자의 모호한 의도를 질문으로 증폭해 구체화한다.
2. 구체화된 답변을 외부 AI 도구(ChatGPT, Midjourney, Veo 등)에서 바로 쓸 수 있는 최적 프롬프트로 번역한다.

원칙:
- 사용자는 "프롬프트 엔지니어링"을 모른다. 전문 용어를 쓰지 말라.
- 한 번에 하나의 질문만 한다. 여러 개를 묶지 말라.
- 사용자의 도메인 용어를 그대로 존중한다. 번역하지 말라.
- 답변이 모호하면 "잘 모르겠어요" 옵션을 제공하라.
- 생성된 최종 프롬프트는 영어/한국어 중 해당 외부 도구가 더 잘 이해하는 언어로 출력한다.
```

### Layer B. Context (세션별, 캐시됨)

```
[현재 세션 맥락]
- 산출물 유형: {output_type}
- 사용자 도메인: {domain} (예: 요식업, 교육, 부동산)
- 사용자 하위 유형: {subtype} (예: 해산물 식당 사장)
- 사용자 경력: {years}년
- 도메인 프로필 요약: {profile_summary} (있으면)
- 전문 어휘: {vocabulary}
- 판단 기준: {criteria}
```

### Layer C. Task (매 턴마다 변경)

```
[이번 턴 작업]
- 현재 단계: 질문 생성 / 답변 수집 / 프롬프트 조립
- 지금까지의 Q&A: {qa_history}
- 수행할 작업: {task_instruction}
- 출력 포맷: {output_format}
```

### Prompt Caching 적용

- Layer A + B는 `cache_control: ephemeral` 로 지정 → 10분 간 캐시 재사용
- Layer C만 매 호출마다 새로 전송
- 비용 효과: 세션당 평균 7번의 API 호출 × 70% 캐시 히트 → 토큰 비용 약 55% 절감

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: [
    { type: 'text', text: LAYER_A_IDENTITY, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: LAYER_B_CONTEXT, cache_control: { type: 'ephemeral' } },
  ],
  messages: [
    { role: 'user', content: LAYER_C_TASK },
  ],
});
```

---

## 1단계: Question Planner

### 입력
```typescript
interface PlannerInput {
  outputType: 'image' | 'report' | 'video' | 'ppt' | 'code' | 'music';
  seedKeyword: string;
  profile?: DomainProfile;
  template?: DomainTemplate;
}
```

### 처리

**경우 1. 템플릿이 지정된 경우**
- 템플릿에 이미 정의된 질문 트리를 그대로 사용
- 프로필에서 답변 가능한 질문은 "추천 답변" 으로 프리필

**경우 2. 템플릿이 없는 경우 (자유 생성)**
- Claude API 호출:

```
당신은 Question Planner입니다.
사용자가 "{output_type}" 유형의 결과물을 만들고 싶어 하고,
초기 키워드는 "{seed_keyword}" 입니다.
사용자 도메인은 "{domain}" 이고, 경력은 {years}년입니다.

다음 JSON 스키마로 5~7개의 질문을 생성하세요:

{
  "questions": [
    {
      "id": "q1",
      "text": "질문 내용 (사용자가 이해하기 쉬운 말로)",
      "type": "text" | "choice" | "slider",
      "category": "purpose" | "audience" | "style" | "content" | "constraint",
      "options": ["옵션1", "옵션2"], // choice일 때만
      "required": true,
      "skippable": false,
      "hint": "잘 모를 때 볼 힌트"
    }
  ]
}

원칙:
- 질문 순서: 목적(purpose) → 대상(audience) → 스타일(style) → 내용(content) → 제약(constraint)
- 도메인 용어는 그대로 유지
- 한 질문에 한 가지만 묻기
- 선택지(choice)는 최대 4개
```

### 출력
`InterviewQuestion[]` 배열 (DATABASE_SCHEMA.md 참조)

---

## 2단계: Interview Session

### 동작

```typescript
// pseudo-code
class InterviewSession {
  questions: Question[];
  answers: Map<string, Answer>;
  currentIndex: number;

  async answerCurrent(text: string) {
    const q = this.questions[this.currentIndex];
    this.answers.set(q.id, { text, answeredAt: now() });
    
    // Follow-up 판단
    const needFollowUp = await this.detectFollowUp(q, text);
    if (needFollowUp) {
      const followUp = await this.generateFollowUp(q, text);
      this.questions.splice(this.currentIndex + 1, 0, followUp);
    }
    
    this.currentIndex++;
  }

  async detectFollowUp(q: Question, answer: string): Promise<boolean> {
    // 답변이 너무 짧거나 모호하면 true
    if (answer.length < 10) return true;
    if (answer.includes('잘 모르') || answer.includes('대충')) return true;
    return false;
  }

  async generateFollowUp(q: Question, answer: string): Promise<Question> {
    // Claude API로 동적 후속 질문 생성
    // 예: "포스터 분위기는 따뜻하게요" → "따뜻함을 어떤 색감으로 표현하고 싶으세요?"
  }
}
```

### "잘 모르겠어요" 처리

사용자가 `[잘 모르겠어요, 추천해주세요]` 클릭 시:

```
[시스템 → Claude API]
사용자가 다음 질문에 "잘 모르겠어요"라고 답했습니다.
질문: {question}
사용자 맥락: {profile_summary}, 초기 키워드: {seed}

사용자의 상황에서 가장 적합한 3가지 답변 후보를 제시하세요.
각 후보는 1문장으로, 이유와 함께.

JSON:
{
  "suggestions": [
    { "answer": "...", "reason": "..." },
    ...
  ]
}
```

사용자는 3개 중 하나를 선택하거나, 다시 직접 입력.

### 건너뛰기 처리

- `skippable: true` 인 질문만 건너뛰기 허용
- 건너뛴 질문은 조립 시 기본값 사용

---

## 3단계: Prompt Assembler

### 입력
- `answers: Map<string, string>`
- `profile: DomainProfile | null`
- `outputType: OutputType`
- `assemblyTemplate: string` (유형별)

### 유형별 조립 템플릿

#### 이미지 (Midjourney / DALL-E / Stable Diffusion)

```
[시스템 → Claude API]
다음 답변들을 Midjourney용 프롬프트로 번역하세요.
Midjourney는 영어 자연어 + 파라미터(--ar, --v, --style) 조합을 이해합니다.

[답변]
- 목적: {purpose}
- 주제: {subject}
- 스타일: {style}
- 색감: {colors}
- 분위기: {mood}
- 사용처: {use_case}

[도메인 프로필]
- 도메인: {domain}
- 전문 어휘: {vocabulary}

[출력 포맷]
```json
{
  "prompt": "영어 프롬프트",
  "parameters": "--ar 16:9 --v 6.0 --style raw",
  "variations": ["변형 1", "변형 2"],
  "explanation": "이 프롬프트가 담고 있는 의도 설명 (한국어, 2~3문장)"
}
```

#### 보고서 (ChatGPT / Claude)

```
다음 답변들을 ChatGPT/Claude용 보고서 작성 프롬프트로 번역하세요.

[답변]
- 보고서 주제: {topic}
- 독자: {audience}
- 분량: {length}
- 어조: {tone}
- 포함 요소: {must_include}
- 참고 자료: {references}

[도메인 프로필]
- 사용자 전문 분야: {domain}
- 사용자 판단 기준: {criteria} (이 기준으로 분석 관점 반영)

[출력 포맷]
```json
{
  "prompt": "당신은 {domain} 전문가입니다. 다음 조건으로 보고서를 작성해주세요. ...",
  "structure": ["1. 서론", "2. 현황 분석", "3. 시사점", "4. 결론"],
  "tips": "프롬프트 사용 시 팁 1줄"
}
```

#### 영상 (Veo / Sora / Runway)

```
[출력 포맷]
{
  "prompt": "영어 영상 생성 프롬프트 (시네마틱 묘사)",
  "shot_breakdown": [
    { "time": "0-3s", "description": "..." },
    { "time": "3-6s", "description": "..." }
  ],
  "style_keywords": ["cinematic", "warm lighting", ...],
  "duration": "6s"
}
```

#### PPT (Gamma / 파워포인트 프롬프트)

```
{
  "prompt": "Gamma에 입력할 슬라이드 생성 프롬프트",
  "slide_structure": [
    { "slide": 1, "title": "...", "content": "..." },
    ...
  ],
  "design_style": "미니멀 / 비즈니스 / 크리에이티브"
}
```

#### 코드 (ChatGPT / Claude / Copilot)

```
{
  "prompt": "컨텍스트·요구사항·제약사항을 포함한 개발자용 프롬프트",
  "language": "Python | TypeScript | ...",
  "framework": "...",
  "test_cases": ["Input: ..., Expected: ..."]
}
```

#### 음악 (Suno / Udio)

```
{
  "prompt": "가사 + 스타일 태그",
  "style_tags": ["lo-fi", "warm", "acoustic"],
  "structure": "Verse-Chorus-Verse-Bridge-Chorus",
  "duration_hint": "2~3분"
}
```

### 조립 시 추가 처리

1. **금칙어 필터**: 외부 AI 도구의 정책 위반 키워드 차단
2. **길이 최적화**: 각 도구의 이상적 프롬프트 길이 (Midjourney ≤ 300자, ChatGPT 제한 없음)
3. **버전 표기**: "Midjourney v6.0 기준" 등 명시

---

## 4단계: Execution Router

### 외부 AI 도구 매핑

```typescript
const externalTools: Record<OutputType, ExternalTool[]> = {
  image: [
    { name: 'Midjourney', url: 'https://www.midjourney.com/app', type: 'copy-only' },
    { name: 'DALL-E (ChatGPT)', url: 'https://chat.openai.com', type: 'copy-and-open' },
    { name: 'Stable Diffusion', url: 'https://stablediffusionweb.com', type: 'copy-and-open' },
  ],
  report: [
    { name: 'ChatGPT', url: 'https://chat.openai.com', type: 'url-param' },
    { name: 'Claude', url: 'https://claude.ai/new', type: 'url-param' },
    { name: 'Gemini', url: 'https://gemini.google.com', type: 'copy-only' },
  ],
  video: [
    { name: 'Veo (Gemini)', url: 'https://gemini.google.com', type: 'copy-only' },
    { name: 'Runway', url: 'https://runwayml.com', type: 'copy-only' },
    { name: 'Sora', url: 'https://sora.com', type: 'copy-only' },
  ],
  ppt: [
    { name: 'Gamma', url: 'https://gamma.app', type: 'copy-only' },
    { name: 'Beautiful.ai', url: 'https://beautiful.ai', type: 'copy-only' },
  ],
  code: [
    { name: 'ChatGPT', url: 'https://chat.openai.com', type: 'url-param' },
    { name: 'Claude', url: 'https://claude.ai/new', type: 'url-param' },
    { name: 'Cursor (로컬)', url: null, type: 'copy-only' },
  ],
  music: [
    { name: 'Suno', url: 'https://suno.com', type: 'copy-only' },
    { name: 'Udio', url: 'https://udio.com', type: 'copy-only' },
  ],
};
```

### 타입별 실행 방식

**copy-and-open**: 프롬프트 자동 복사 + 새 탭으로 이동
```typescript
async function copyAndOpen(prompt: string, url: string) {
  await navigator.clipboard.writeText(prompt);
  toast({ title: '프롬프트를 복사했습니다. 이제 붙여넣으세요.' });
  window.open(url, '_blank');
}
```

**url-param**: URL 파라미터로 자동 주입 (지원 도구만)
```typescript
// ChatGPT 예시
const chatGPTUrl = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
```

**copy-only**: 복사만 하고 사용자가 알아서 이동

---

## Streaming 구현 (SSE)

프롬프트 생성은 SSE 스트리밍으로 UX 개선.

### 서버 (Firebase Function)

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import Anthropic from '@anthropic-ai/sdk';

export const generatePrompt = onRequest(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: [
      { type: 'text', text: LAYER_A, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: LAYER_B, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: LAYER_C }],
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
    }
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
});
```

### 클라이언트

```typescript
const eventSource = new EventSource(`/api/prompt/generate?sessionId=${sessionId}`);
eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') {
    eventSource.close();
    return;
  }
  const { text } = JSON.parse(event.data);
  setGeneratedPrompt(prev => prev + text);
};
```

---

## 모델 선택 전략

| 작업 | 모델 | 이유 |
|------|------|------|
| 질문 생성 (Planner) | Claude Haiku 4.5 | 빠르고 저렴, 구조화된 출력 |
| 동적 후속 질문 | Claude Haiku 4.5 | 짧은 텍스트 생성 |
| 최종 프롬프트 조립 | Claude Sonnet 4.6 | 품질 결정적, 영어 번역 포함 |
| 암묵지 프로필 생성 | Claude Sonnet 4.6 | 장문 분석·구조화 |
| Square 태그 생성 | Claude Haiku 4.5 | 배치 처리 |

비용 추정 (월 MAU 1만, 평균 사용자당 10회 생성):
- Haiku 호출: 10만 건 × 1000 토큰 × $1/M = $100
- Sonnet 호출: 10만 건 × 2000 토큰 × $3/M = $600
- Prompt Caching 50% 할인 반영 → **실제 ~$350/월**

---

## 폴백 및 에러 처리

### API 실패 시
```typescript
async function generateWithRetry(input: Input, attempts = 3): Promise<Output> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await generate(input);
    } catch (error) {
      if (i === attempts - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // 지수 백오프
    }
  }
}
```

### 모델 다운 시
- Sonnet 다운 → Haiku로 자동 전환
- 품질 경고 배너 표시: "일시적으로 빠른 모드로 생성됩니다"

### 응답 포맷 오류 시
- JSON 파싱 실패 시 1회 재시도 (temperature=0)
- 2회 실패 시 사용자에게 "다시 시도" 버튼 제시

---

## 평가 메트릭 (내부)

모든 생성에 대해 다음 메트릭 수집:

```typescript
interface GenerationMetric {
  sessionId: string;
  outputType: OutputType;
  domain: string;
  questionsCount: number;
  answersSkipped: number;
  generationTimeMs: number;
  tokensInput: number;
  tokensOutput: number;
  cacheHitRatio: number;
  userRating?: 1 | 2 | 3 | 4 | 5; // 사용자 피드백
  externallyExecuted?: boolean; // 외부 도구로 연결했는지
}
```

주간 분석:
- 평균 user rating < 3.5인 도메인×유형 조합 → 질문 템플릿 재설계
- `externallyExecuted = false` 비율이 50% 초과 → 라우팅 UX 재검토

---

## 확장: 피드백 루프

사용자가 외부 도구에서 결과물을 가져와 저장하면:

```
[사용자] "이 결과가 마음에 들어요" / "이 부분이 아쉬워요"
    ↓
[Tacit] 피드백을 답변 맥락과 함께 저장
    ↓
[월간 배치] 동일 도메인×유형의 고평가 답변 패턴 분석
    ↓
[결과] 해당 조합의 질문 템플릿을 자동 개선 제안
```

---

## 참고 문서

- 데이터 모델: `DATABASE_SCHEMA.md`
- API 엔드포인트: `API_SPEC.md`
- 질문 템플릿: `DOMAIN_TEMPLATES.md`
- 인터뷰 UX: `TACIT_INTERVIEW.md`
