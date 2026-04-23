# TACIT_INTERVIEW.md — 암묵지 인터뷰 모드

Tacit의 킬러 기능. 사용자의 30년 경험을 30~50개 질문으로 구조화해 `DomainProfile`로 저장하고, 이후 모든 프롬프트 생성에 자동 반영합니다.

---

## 왜 암묵지 인터뷰인가

기존 프롬프트 서비스의 한계:
- 사용자가 "프롬프트를 잘 쓰는 법"을 배워야 한다
- 매번 처음부터 맥락을 설명해야 한다
- 본인의 노하우가 프롬프트에 반영되지 않는다

Tacit의 해답:
- 사용자가 **한 번만** 자신의 경험을 이야기한다
- AI가 그것을 구조화된 프로필로 저장한다
- 이후 모든 프롬프트에 그 프로필이 자동 적용된다

결과: **"나만의 프롬프트가 자동으로 나오는 AI"**

---

## 인터뷰 구성

### 2단계 구조

**1단계. 기본 정보 (3~5분)**
- 도메인, 하위 유형, 경력, 주 업무
- 이 단계로 후속 질문의 방향이 결정됨

**2단계. 심층 인터뷰 (20~35분)**
- 6개 카테고리 × 5~8개 질문 = 30~48개
- 사용자는 중간에 저장하고 나갈 수 있음

---

## 6개 카테고리

### 카테고리 1. 일상 업무 (daily_work)
**목적**: 사용자의 실제 업무 맥락 이해

**질문 풀** (도메인별 5~8개 선택):

일반:
1. "하루 일과를 시간대별로 간단히 알려주세요. (예: 오전엔 ~, 점심엔 ~, 오후엔 ~)"
2. "요일별로 업무가 많이 달라지나요? 어떻게 다른가요?"
3. "한 주 중에 가장 바쁜 때와 한가한 때는 언제예요?"
4. "혼자 일하시나요, 팀으로 일하시나요? 팀이라면 몇 명이에요?"
5. "주로 쓰는 도구(프로그램, 기기)가 있다면?"
6. "업무 시 주로 쓰는 공간은 어디예요?"
7. "하루에 몇 명 정도 만나세요? (손님, 학생, 고객 등)"
8. "반복되는 업무와 매번 다른 업무의 비중은 어떻게 되나요?"

도메인 특화 (예: 식당 사장):
- "하루에 몇 테이블 정도 받으세요?"
- "재료는 어디서 받으시나요?"
- "메뉴는 얼마나 자주 바꾸세요?"

---

### 카테고리 2. 판단 기준 (judgment_criteria)
**목적**: 사용자의 의사결정 방식 학습

**질문 풀**:

일반:
1. "일할 때 가장 중요하게 생각하는 원칙 3가지만 꼽아주세요"
2. "절대 타협하지 않는 것이 있다면?"
3. "경력 초기와 지금, 판단 기준이 달라진 게 있나요?"
4. "'이건 좀 이상한데' 싶으면 어떤 순간이세요?"
5. "동종 업계에서 다른 사람들과 다르게 일하는 부분이 있다면?"
6. "결정이 어려울 때 참고하는 사람이나 기준이 있나요?"
7. "돈보다 중요하게 여기는 가치가 있다면?"

도메인 특화 (예: 교사):
- "학생을 평가할 때 가장 중요한 기준은?"
- "같은 실수를 반복하는 학생에게 어떻게 대응하세요?"
- "수업의 성공은 무엇으로 판단하세요?"

---

### 카테고리 3. 성공 경험 (success_stories)
**목적**: 사용자가 자랑스러워하는 성과 패턴 추출

**질문 풀**:

일반:
1. "지금까지 가장 보람 있었던 순간 하나만 들려주세요"
2. "작년에 가장 잘한 일은 무엇이었나요?"
3. "고객(학생, 손님)에게 들었던 가장 기억에 남는 칭찬은?"
4. "다른 사람은 못 했는데 당신은 해낸 일이 있다면?"
5. "지금 돌이켜봐도 뿌듯한 결정이 있다면?"
6. "후배에게 '이거 하나는 꼭 배워라'라고 한다면?"

도메인 특화 (예: 공인중개사):
- "가장 성공적이었던 매물 중개 경험은?"
- "어려운 고객을 만족시켰던 사례는?"

---

### 카테고리 4. 실패 경험 (failure_stories)
**목적**: 사용자의 학습 패턴·회피 영역 이해

**질문 풀**:

일반:
1. "돌이켜보면 후회되는 결정이 있나요? (구체적일수록 좋아요)"
2. "'다시 하면 이렇게 안 하겠다' 싶은 일이 있다면?"
3. "가장 힘들었던 시기는 언제였나요?"
4. "고객을 잃은 적이 있다면, 원인이 뭐였나요?"
5. "주변에서 조언했는데 듣지 않았다가 후회한 일은?"
6. "지금 이 일을 시작하는 사람에게 '이건 조심하라'고 한다면?"

---

### 카테고리 5. 고객/상대 이해 (customer_understanding)
**목적**: 사용자의 상대방 관찰 능력 구조화

**질문 풀**:

일반:
1. "당신의 고객(학생, 손님)은 어떤 분들이에요?"
2. "오래 봐온 분들과 처음 온 분들을 어떻게 다르게 대하세요?"
3. "고객이 말하지 않아도 알아챌 수 있는 신호가 있나요?"
4. "까다로운 고객과 좋은 고객의 차이는 뭐라고 보세요?"
5. "고객이 원하는 것과 실제로 필요한 것이 다를 때가 있나요?"
6. "고객이 만족했을 때의 신호는 어떻게 알아채세요?"

도메인 특화:
- 식당: "첫 방문 손님과 단골의 주문 패턴 차이는?"
- 교사: "학생이 집중하는지 흐트러지는지 어떻게 구분하세요?"

---

### 카테고리 6. 노하우·팁 (know_how)
**목적**: 형식지로 잘 안 떠오르는 손끝의 감각 추출

**질문 풀**:

일반:
1. "초보자는 모르지만 당신은 자연스럽게 하는 게 있다면?"
2. "같은 일을 남들보다 빠르게 하는 방법이 있다면?"
3. "동료들이 물어보면 주로 알려주는 팁이 있나요?"
4. "책이나 학원에선 안 가르치는데 실무에서 중요한 것이 있다면?"
5. "작년보다 올해 더 잘하게 된 부분이 있다면, 비결은?"
6. "일을 쉽게 만드는 당신만의 루틴이 있다면?"
7. "매일 반복해도 지겹지 않은 이유는 뭐라고 생각하세요?"

---

## 질문 선택 알고리즘

### 초기 선택 (인터뷰 시작 시)

```typescript
async function selectQuestions(
  profile: BasicProfile,
  totalCount: number = 40
): Promise<InterviewQuestion[]> {
  const questionsPerCategory = Math.floor(totalCount / 6);
  const result: InterviewQuestion[] = [];

  for (const category of CATEGORIES) {
    const pool = await getQuestionPool(category, profile.domain, profile.subtype);
    
    // 가중치: 필수 > 도메인 특화 > 일반
    const selected = weightedSample(pool, questionsPerCategory);
    result.push(...selected);
  }

  // 경력에 따라 조정
  if (profile.yearsOfExperience < 3) {
    // 초보자는 "성공 경험" 줄이고 "일상 업무" 더 묻기
    rebalance(result, { success_stories: -2, daily_work: +2 });
  }
  if (profile.yearsOfExperience > 20) {
    // 베테랑은 "노하우" 더 묻기
    rebalance(result, { know_how: +3, daily_work: -1 });
  }

  return shuffleWithinCategory(result);
}
```

### 동적 후속 질문 (답변 중)

사용자 답변이 특정 조건에 해당하면 후속 질문 추가:

```typescript
async function detectFollowUp(
  question: InterviewQuestion,
  answer: string
): Promise<InterviewQuestion | null> {
  // 1. 구체적인 사례 언급 없이 추상적 답변
  if (answer.length < 30 && category === 'success_stories') {
    return {
      text: '그 중에 가장 기억나는 구체적인 사례 하나만 더 자세히 들려주실 수 있나요?',
      isFollowUp: true,
      parentId: question.id,
    };
  }

  // 2. 숫자나 시간 언급
  if (/\d+년|\d+개월/.test(answer)) {
    return {
      text: '그 시기에 가장 많이 배운 것은 무엇이었나요?',
      isFollowUp: true,
    };
  }

  // 3. 부정어 강조 ("절대", "결코")
  if (/절대|결코|never/.test(answer)) {
    return {
      text: '그 기준은 어떤 경험에서 생긴 건가요?',
      isFollowUp: true,
    };
  }

  // 4. Claude API로 판단 (빈도 낮게)
  if (Math.random() < 0.15) {
    const follow = await askClaudeForFollowUp(question, answer);
    if (follow) return follow;
  }

  return null;
}
```

후속 질문은 최대 세션당 5개 이하로 제한 (너무 길어지면 이탈).

---

## UI/UX 세부 설계

### 인터뷰 화면 레이아웃

```
┌─────────────────────────────────────┐
│ Tacit     인터뷰 진행 중    [나가기] │  ← 헤더
├─────────────────────────────────────┤
│                                     │
│  현재: 판단 기준 (3/6 카테고리)       │
│  ▓▓▓▓▓▓░░░░░░░░░░░░  28 / 45       │  ← 프로그레스
│                                     │
├─────────────────────────────────────┤
│                                     │
│  💭 질문 28                          │
│                                     │
│  일할 때 가장 중요하게 생각하는       │
│  원칙 3가지만 꼽아주세요              │
│                                     │
│  💡 힌트: 구체적일수록 좋아요          │
│                                     │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ (답변 입력 영역)                │  │
│  │                                │  │
│  │                                │  │
│  └───────────────────────────────┘  │
│                                     │
│  🎤 말로 입력하기    [건너뛰기]      │
│                                     │
├─────────────────────────────────────┤
│   [이전]              [다음 →]      │  ← 하단 고정
└─────────────────────────────────────┘
```

### 특수 상태

**카테고리 전환 시 축하 애니메이션**:
```
전체 화면 페이드 → 
"'일상 업무' 완료! 👏" 2초 표시 →
"다음: 판단 기준" 1초 표시 →
다음 질문으로
```

**30분 넘게 진행 시 안내**:
```
"거의 다 왔어요! 12개 질문 남았습니다.
지금 저장하고 나중에 이어하시겠어요?"
[지금 저장] [계속 진행]
```

---

## 음성 입력 구현

### 기술 스택
- **Web Speech API** (브라우저 내장, 무료, 정확도 보통)
- **대체**: OpenAI Whisper API (서버사이드, 유료, 정확도 높음)

### 4-50대 사용자를 위한 설계

**1. 시작 버튼이 크고 명확**
```tsx
<Button 
  size="xl"  // 56x56px
  className="rounded-full"
  onClick={startRecording}
>
  <Mic size={32} />
  말로 입력하기
</Button>
```

**2. 녹음 중 시각 피드백**
- 마이크 아이콘 주변 파동 애니메이션
- 음성 레벨 바 표시
- "듣고 있어요..." 텍스트

**3. 실시간 변환 표시**
- 말하는 동안 텍스트가 즉시 나타남
- 틀린 단어는 터치 후 수정 가능

**4. 자동 정지**
- 3초 이상 침묵 감지 → 자동 정지
- "다시 말하기" / "이대로 저장" 선택지

### 구현 코드

```typescript
// lib/voice-input.ts
export class VoiceInput {
  private recognition: any;
  private isListening = false;
  
  constructor(onResult: (text: string, isFinal: boolean) => void) {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'ko-KR';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    
    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      onResult(final || interim, !!final);
    };
  }
  
  start() {
    this.isListening = true;
    this.recognition.start();
  }
  
  stop() {
    this.isListening = false;
    this.recognition.stop();
  }
}
```

### 폴백
- 브라우저 미지원 → 텍스트 입력만 노출
- iOS Safari → Whisper API 사용 (서버 업로드)

---

## 프로필 생성 알고리즘

### 입력
- 모든 질문에 대한 답변 `Answer[]`
- 기본 정보 (도메인, 경력 등)

### 처리

**Step 1. 답변 분류 및 정리**

```typescript
async function organizeAnswers(answers: Answer[]): Promise<OrganizedAnswers> {
  const grouped = groupByCategory(answers);
  
  // 각 카테고리별로 Claude에게 정리 요청
  const organized = await Promise.all(
    Object.entries(grouped).map(async ([category, items]) => {
      const result = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        system: `당신은 사용자의 답변을 구조화된 프로필로 변환하는 분석가입니다.`,
        messages: [{
          role: 'user',
          content: `
다음은 '${category}' 카테고리의 질문과 답변입니다.
이를 분석해 다음 JSON으로 요약하세요:

{
  "summary": "2~3문장 요약",
  "key_points": ["핵심 포인트 1", "핵심 포인트 2", ...],
  "vocabulary": ["이 사람이 자주 쓰는 도메인 용어 5~10개"],
  "patterns": ["관찰된 행동·사고 패턴 2~3개"]
}

질문과 답변:
${formatQA(items)}
          `.trim(),
        }],
        max_tokens: 1500,
      });
      return { category, ...parseJSON(result) };
    })
  );
  
  return mergeCategoriesIntoProfile(organized);
}
```

**Step 2. 최종 프로필 조립**

```typescript
interface DomainProfile {
  summary: string;                    // "25년차 제주 해산물 전문 식당 운영자"
  strengths: string[];                // 상위 5개 강점
  criteria: string[];                 // 판단 기준 5개
  vocabulary: string[];               // 전문 어휘 20개
  communicationStyle: {
    tone: string;                     // "따뜻하고 담담한"
    preferredLength: string;          // "간결하게"
    avoidList: string[];              // 사용 안 하는 표현들
  };
  successPatterns: string[];          // 성공 사례 3~5개 (요약)
  failurePatterns: string[];          // 실패 회피 사례 3~5개
  customerInsights: string[];         // 고객 통찰 3~5개
  knowHow: string[];                  // 노하우 팁 5~10개
  embedding?: number[];               // Supabase에 별도 저장
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}
```

**Step 3. 임베딩 생성**

```typescript
async function embedProfile(profile: DomainProfile): Promise<number[]> {
  const text = [
    profile.summary,
    ...profile.strengths,
    ...profile.criteria,
    ...profile.knowHow,
  ].join(' ');

  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return embedding.data[0].embedding; // 1536-dim
}
```

Supabase `profile_embeddings` 테이블에 저장. Square 추천·유사 사용자 찾기에 활용.

---

## 다중 프로필 관리

한 사용자가 여러 도메인을 가진 경우:
- 예: "낮에는 식당 사장, 저녁에는 요리 강사"
- 각 도메인당 별도 프로필 저장
- 프롬프트 생성 시 "어느 프로필로 만들까요?" 선택 UI

```typescript
interface User {
  // ...
  profiles: DomainProfile[];
  activeProfileId: string | null;
}
```

UI:
```tsx
<ProfileSwitcher>
  <ProfileOption active profile={profile1}>
    제주 해산물 식당 (25년차)
  </ProfileOption>
  <ProfileOption profile={profile2}>
    요리 강사 (3년차)
  </ProfileOption>
  <Button variant="ghost">+ 새 프로필 추가</Button>
</ProfileSwitcher>
```

---

## 프로필 업데이트

### 전체 재인터뷰
- 경력·업종이 크게 바뀐 경우
- 기존 프로필은 "이전 버전"으로 보관

### 부분 추가 인터뷰
- 특정 카테고리만 다시 진행
- 예: "노하우 카테고리만 추가로 더 답하기"
- 기존 답변에 추가되는 방식

### 인라인 편집
- 생성된 프로필의 각 항목 직접 수정
- 수정 시 임베딩 자동 재계산

---

## 프라이버시·윤리

1. **답변 내용은 본인만 열람** — 관리자도 기본 접근 불가
2. **임베딩은 익명화 저장** — Square 추천에 활용되지만 원문 노출 없음
3. **계정 삭제 시 완전 삭제** — GDPR/개인정보보호법 준수
4. **민감 정보 필터**:
   - 주민번호, 카드번호, 주소 등 감지 시 경고
   - 저장 전 사용자에게 "이 정보 제거하시겠어요?" 확인

---

## 측정 지표

| 지표 | 목표 |
|------|------|
| 인터뷰 시작율 (가입자 대비) | ≥ 30% |
| 인터뷰 완료율 | ≥ 40% |
| 평균 소요 시간 | 25~35분 |
| 프로필 활성화 후 30일 리텐션 | ≥ 50% |
| 음성 입력 사용률 (모바일) | ≥ 25% |
| 프로필 활용 프롬프트 / 총 프롬프트 | ≥ 70% |

---

## 확장 로드맵

### 1차 (MVP)
- 기본 인터뷰 (텍스트 + 음성)
- 6카테고리 × 5~8질문
- 단일 프로필

### 2차 (3개월)
- 다중 프로필
- 부분 재인터뷰
- 인라인 편집

### 3차 (6개월)
- **영상 기록 분석** — 작업 영상 업로드 → Vision AI 추출
- **세대 간 전수 모드** — 부모 프로필을 자녀가 이어받기
- **프로필 공유** — 팀/가족 단위로 프로필 공유

---

## 참고 문서

- 데이터 스키마: `DATABASE_SCHEMA.md`
- 엔진 연동: `PROMPT_ENGINE.md`
- UI 컴포넌트: `UI_COMPONENTS.md`
