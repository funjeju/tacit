import type { DomainProfile, OutputType } from '@/types';

// Layer A — 고정 Identity (캐시 대상)
export const LAYER_A_IDENTITY = `당신은 Tacit의 프롬프트 엔진입니다.
Tacit은 4-50대 도메인 전문가의 경험을 AI 주문서(프롬프트)로 번역하는 서비스입니다.

당신의 역할은 두 가지입니다:
1. 사용자의 모호한 의도를 질문으로 증폭해 구체화한다.
2. 구체화된 답변을 외부 AI 도구(ChatGPT, Midjourney, Veo 등)에서 바로 쓸 수 있는 최적 주문서로 번역한다.

절대 원칙:
- 사용자는 AI 기술을 모른다. "프롬프트", "API", "토큰" 같은 전문 용어를 쓰지 말라.
- 한 번에 하나의 질문만 한다. 여러 개를 묶지 말라.
- 사용자의 도메인 용어를 그대로 존중한다. 임의로 바꾸지 말라.
- 답변이 모호하면 "잘 모르겠어요" 옵션을 제공하라.
- 항상 따뜻하고 존중하는 말투를 유지한다. 4-50대를 초보자 취급하지 말라.`;

// Layer B — 세션 컨텍스트 (세션별 캐시 대상)
export function buildLayerB(params: {
  outputType: OutputType;
  domain?: string;
  subtype?: string;
  profile?: DomainProfile | null;
}): string {
  const { outputType, domain, subtype, profile } = params;

  const outputTypeLabel: Record<OutputType, string> = {
    image: '이미지',
    report: '보고서/문서',
    video: '영상',
    ppt: '프레젠테이션',
    code: '코드',
    music: '음악',
  };

  let context = `[현재 세션 맥락]
- 산출물 유형: ${outputTypeLabel[outputType]}
- 사용자 도메인: ${domain ?? '일반'}
- 하위 분야: ${subtype ?? '미지정'}`;

  if (profile) {
    context += `

[사용자 도메인 프로필]
- 경력: ${profile.experience.years}년
- 전문 분야: ${profile.experience.specialty.join(', ')}
- 핵심 노하우 요약: ${profile.experience.highlights}
- 판단 기준: ${profile.judgmentPatterns.criteria.join(', ')}
- 전문 어휘: ${profile.terminology.join(', ')}
- 말투 특징: ${profile.toneAndVoice}
- 이미 파악된 정보이므로 관련 질문은 다시 하지 않는다.`;
  }

  return context;
}

// Layer C — 질문 생성 Task
export function buildQuestionPlannerTask(params: {
  outputType: OutputType;
  seedKeyword: string;
  qaHistory?: Array<{ question: string; answer: string }>;
}): string {
  const { outputType, seedKeyword, qaHistory } = params;

  const outputTypeLabel: Record<OutputType, string> = {
    image: '이미지',
    report: '보고서/문서',
    video: '영상',
    ppt: '프레젠테이션',
    code: '코드',
    music: '음악',
  };

  let task = `[지금 할 일: 질문 5~7개 생성]
사용자가 "${outputTypeLabel[outputType]}" 유형의 결과물을 만들고 싶어 합니다.
초기 키워드: "${seedKeyword}"`;

  if (qaHistory && qaHistory.length > 0) {
    task += `\n\n[지금까지 나눈 대화]\n`;
    qaHistory.forEach((qa, i) => {
      task += `Q${i + 1}. ${qa.question}\nA${i + 1}. ${qa.answer}\n`;
    });
    task += '\n위 답변을 바탕으로 아직 파악하지 못한 정보를 묻는 질문만 생성하세요.';
  }

  task += `

다음 JSON 형식으로 5~7개의 질문을 생성하세요:
{
  "questions": [
    {
      "id": "q1",
      "text": "질문 내용 (사용자가 이해하기 쉬운 말로, 한국어)",
      "type": "text" | "textarea" | "choice" | "multichoice",
      "category": "purpose" | "audience" | "style" | "content" | "constraint",
      "options": [{"value": "v1", "label": "선택지 (choice/multichoice일 때만)"}],
      "placeholder": "입력 예시 힌트",
      "hint": "잘 모를 때 도움이 되는 짧은 힌트",
      "required": true,
      "skippable": false
    }
  ]
}

원칙:
- 질문 순서: 목적 → 대상 → 스타일 → 내용 → 제약
- 한 질문에 한 가지만 묻기
- choice 선택지는 최대 4개
- 쉬운 한국어만 사용`;

  return task;
}

// Layer C — 최종 프롬프트 조립 Task
export function buildAssemblerTask(params: {
  outputType: OutputType;
  qaHistory: Array<{ question: string; answer: string }>;
  profile?: DomainProfile | null;
}): string {
  const { outputType, qaHistory, profile } = params;

  const assemblerInstructions: Record<OutputType, string> = {
    image: `다음 답변들을 Midjourney/DALL-E용 이미지 생성 주문서로 번역하세요.
출력 포맷 (JSON):
{
  "prompt": "영어 이미지 생성 프롬프트 (구체적 묘사)",
  "parameters": "--ar 16:9 --v 6.0 (Midjourney용 파라미터)",
  "variations": ["조금 다른 버전 1", "조금 다른 버전 2"],
  "explanation": "이 주문서가 담은 의도 (한국어, 2~3문장)"
}`,
    report: `다음 답변들을 ChatGPT/Claude용 보고서 작성 주문서로 번역하세요.
출력 포맷 (JSON):
{
  "prompt": "보고서 작성 주문서 (한국어, 역할 + 조건 + 출력 형식 명시)",
  "structure": ["1. 서론", "2. 본론", "3. 결론"],
  "tips": "이 주문서 사용 팁 1줄"
}`,
    video: `다음 답변들을 Veo/Runway용 영상 생성 주문서로 번역하세요.
출력 포맷 (JSON):
{
  "prompt": "영어 영상 생성 프롬프트 (시네마틱 묘사)",
  "shot_breakdown": [{"time": "0-3s", "description": ""}],
  "style_keywords": ["cinematic", "warm lighting"]
}`,
    ppt: `다음 답변들을 Gamma용 슬라이드 생성 주문서로 번역하세요.
출력 포맷 (JSON):
{
  "prompt": "Gamma에 입력할 슬라이드 생성 주문서 (한국어)",
  "slide_structure": [{"slide": 1, "title": "", "content": ""}],
  "design_style": "미니멀 | 비즈니스 | 크리에이티브"
}`,
    code: `다음 답변들을 ChatGPT/Claude용 코드 작성 주문서로 번역하세요.
출력 포맷 (JSON):
{
  "prompt": "코드 작성 주문서 (컨텍스트 + 요구사항 + 제약사항)",
  "language": "Python | TypeScript | ...",
  "framework": "사용 프레임워크"
}`,
    music: `다음 답변들을 Suno/Udio용 음악 생성 주문서로 번역하세요.
출력 포맷 (JSON):
{
  "prompt": "음악 생성 주문서 (가사 + 스타일 태그)",
  "style_tags": ["lo-fi", "warm", "acoustic"],
  "structure": "Verse-Chorus-Verse-Bridge-Chorus"
}`,
  };

  let task = `[지금 할 일: 최종 주문서 조립]

[사용자 답변]
${qaHistory.map((qa, i) => `Q${i + 1}. ${qa.question}\nA${i + 1}. ${qa.answer}`).join('\n\n')}`;

  if (profile) {
    task += `\n\n[활성 프로필 반영사항]\n${profile.rawSummary}`;
  }

  task += `\n\n${assemblerInstructions[outputType]}

중요: JSON만 출력하세요. 설명 텍스트 없이.`;

  return task;
}
