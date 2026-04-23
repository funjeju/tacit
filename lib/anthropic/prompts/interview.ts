import type { DomainId } from '@/types';

const DOMAIN_LABELS: Record<string, string> = {
  restaurant: '식당 사장님',
  education: '선생님',
  real_estate: '공인중개사',
  beauty: '미용·피부 전문가',
  small_biz: '소공인·공방 운영자',
  service: '서비스업 종사자',
};

const DOMAIN_CONTEXT: Record<string, string> = {
  restaurant: `인터뷰 핵심 주제:
- 가게 운영 철학 및 메뉴 개발 방식
- 식재료 선택 기준과 공급처 관리
- 단골 손님과의 관계 및 고객 응대 노하우
- 계절·날씨에 따른 메뉴 운영 패턴
- 가격 책정 및 마진 관리 방식
- 직원 교육 및 주방 운영 원칙`,

  education: `인터뷰 핵심 주제:
- 교과목 및 학년별 교수법 철학
- 학생 개인차 파악 및 맞춤 지도 방법
- 학부모 소통 및 상담 노하우
- 평가 및 피드백 원칙
- 수업 준비 루틴과 자료 제작 방식
- 어려운 학생 동기부여 사례`,

  real_estate: `인터뷰 핵심 주제:
- 매물 분석 및 가치 평가 방식
- 고객 유형별 상담 및 설득 전략
- 시장 동향 파악 루틴
- 계약 성사를 위한 핵심 노하우
- 분쟁·어려운 상황 해결 경험
- 지역 커뮤니티 및 네트워크 관리`,
};

// ─── 인터뷰어 시스템 프롬프트 ───────────────────────────────
export function buildInterviewerPrompt(domain: string): string {
  const label = DOMAIN_LABELS[domain] ?? '전문가';
  const context = DOMAIN_CONTEXT[domain] ?? '';

  return `당신은 Tacit의 암묵지 인터뷰어입니다.
Tacit은 ${label}의 수십 년 경험과 노하우를 AI가 이해할 수 있는 형태로 기록하는 서비스입니다.

당신의 임무:
- ${label}의 숨어 있는 경험과 지식을 친근한 대화로 끌어낸다
- 전문 용어 없이 쉬운 말로 질문한다
- 추상적인 원칙보다 구체적인 사례와 경험을 묻는다
- 한 번에 반드시 하나의 질문만 한다
- 이전 답변을 자연스럽게 이어받아 다음 질문을 만든다
- 존경과 따뜻함이 담긴 말투를 사용한다 (4-50대를 초보자 취급 금지)

${context}

출력 형식:
질문 텍스트만 출력하세요. 설명이나 부가 문구 없이 질문 하나만 씁니다.
예시처럼 자연스러운 대화체로 작성하세요:
- "혹시 가장 기억에 남는 단골 손님 이야기가 있으신가요?"
- "그 방식을 처음 시도하게 된 계기가 궁금한데요, 어떻게 발견하셨어요?"`;
}

// ─── 인터뷰 시작 질문 (도메인별 고정) ──────────────────────
export const OPENING_QUESTIONS: Record<string, string> = {
  restaurant: '안녕하세요! 지금 운영하고 계신 가게에 대해 먼저 여쭤볼게요. 가게를 시작하신 지 얼마나 되셨고, 어떤 음식을 주로 하고 계세요?',
  education: '안녕하세요! 먼저 선생님께서 담당하시는 과목과 학교급을 알려주실 수 있으세요? 그리고 교직 경력은 얼마나 되셨나요?',
  real_estate: '안녕하세요! 중개업을 시작하신 지 얼마나 되셨고, 주로 어떤 지역이나 매물 종류를 다루고 계세요?',
};

export function getOpeningQuestion(domain: string): string {
  return OPENING_QUESTIONS[domain] ?? '안녕하세요! 먼저 본인이 하시는 일에 대해 간단히 소개해 주시겠어요?';
}

// ─── 다음 질문 생성 태스크 ─────────────────────────────────
export function buildNextQuestionTask(params: {
  qaHistory: Array<{ question: string; answer: string }>;
  questionCount: number;
  targetCount: number;
  domain: string;
}): string {
  const { qaHistory, questionCount, targetCount, domain } = params;
  const label = DOMAIN_LABELS[domain] ?? '전문가';
  const remaining = targetCount - questionCount;

  const historyText = qaHistory
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n');

  return `지금까지의 인터뷰 내용:
${historyText}

현재 진행: ${questionCount}/${targetCount}번째 질문 완료 (남은 질문: ${remaining}개)

위 대화를 바탕으로 ${label}의 암묵지를 더 깊이 끌어낼 다음 질문을 하나만 작성하세요.
${remaining <= 5 ? '인터뷰가 거의 끝나가고 있습니다. 아직 다루지 않은 중요한 노하우나 마지막으로 꼭 남기고 싶은 이야기를 끌어내는 질문을 해주세요.' : ''}
질문만 출력하세요.`;
}

// ─── DomainProfile 생성 태스크 ────────────────────────────
export function buildProfileGenerationTask(params: {
  domain: string;
  qaHistory: Array<{ question: string; answer: string }>;
}): string {
  const { domain, qaHistory } = params;
  const label = DOMAIN_LABELS[domain] ?? '전문가';

  const historyText = qaHistory
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n');

  return `다음은 ${label}과의 암묵지 인터뷰 전체 기록입니다:

${historyText}

위 인터뷰를 분석해 다음 JSON 형식의 도메인 프로필을 생성하세요.
반드시 아래 JSON 스키마를 정확히 따르고, 한국어로 작성하세요.

\`\`\`json
{
  "domainLabel": "${label}",
  "experience": {
    "years": <경력 연수 (숫자)>,
    "specialty": [<전문 분야 목록, 3~6개 문자열>],
    "highlights": "<핵심 경력 요약 1~3문장>"
  },
  "judgmentPatterns": {
    "criteria": [<판단·선택 기준 3~5개 문자열>],
    "examples": [<구체적 사례 2~4개 문자열>]
  },
  "methodology": {
    "routines": [<일상적 업무 루틴·방식 3~5개 문자열>],
    "philosophy": "<핵심 운영 철학 1~2문장>"
  },
  "terminology": [<전문 용어·업계 어휘 5~10개>],
  "taboos": [<하지 않는 것·금기 사항 2~4개>],
  "toneAndVoice": "<말투·소통 스타일 특징 1문장>",
  "rawSummary": "<인터뷰 전체 요약 3~5문장>"
}
\`\`\`

JSON 객체만 출력하세요. 다른 텍스트는 포함하지 마세요.`;
}
