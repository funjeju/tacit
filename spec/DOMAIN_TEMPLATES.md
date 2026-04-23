# DOMAIN_TEMPLATES.md — 도메인별 템플릿

Tacit의 해자(moat). 각 도메인의 암묵지를 질문 트리로 형식화한 자산 집합입니다.

---

## 템플릿 구조

```typescript
interface DomainTemplate {
  id: string;                    // 예: "restaurant_menu_poster"
  domainId: string;              // 예: "restaurant"
  subtype: string;               // 예: "해산물 식당"
  outputType: OutputType;        // image | report | video | ppt | code | music
  name: string;                  // 사용자에게 보이는 이름
  description: string;           // 이 템플릿이 만드는 것
  estimatedTime: string;         // 예상 소요 시간 "3~5분"
  questions: TemplateQuestion[]; // 질문 트리
  assemblyPromptKey: string;     // PROMPT_ENGINE.md의 조립 템플릿 참조
  sampleOutput?: string;         // 예시 결과물 URL
  usageCount: number;            // 집계용
}

interface TemplateQuestion {
  id: string;
  order: number;
  text: string;
  type: 'text' | 'textarea' | 'choice' | 'multichoice' | 'slider' | 'image';
  category: 'purpose' | 'audience' | 'style' | 'content' | 'constraint' | 'context';
  options?: Array<{ value: string; label: string; hint?: string }>;
  placeholder?: string;
  hint?: string;
  required: boolean;
  skippable: boolean;
  dependsOn?: { questionId: string; value: string | string[] }; // 조건부 표시
  prefillFromProfile?: string; // 프로필의 어느 필드에서 가져올지
}
```

---

## MVP 도메인 3종

MVP 출시 시점에는 다음 3개 도메인만 완성도 높게 구현합니다.

1. **요식업 (restaurant)** — 식당·카페·베이커리 사장
2. **교육 (education)** — 학교 교사·학원 강사·과외
3. **부동산 (real_estate)** — 공인중개사·부동산 투자자

각 도메인당 5~7개의 템플릿 (산출물 유형 × 용도).

---

## 도메인 1. 요식업 (restaurant)

### 하위 유형
- 한식·일식·중식·양식·분식 식당
- 카페·베이커리·디저트 가게
- 주점·바
- 배달·도시락 전문점

### 전문 어휘 DB (excerpt)

```json
{
  "menu_structure": ["코스", "세트", "단품", "사이드", "주류"],
  "cooking_methods": ["그릴", "오븐", "튀김", "찜", "조림", "구이"],
  "customer_types": ["단골", "워크인", "예약 손님", "배달 주문"],
  "peak_hours": ["점심 피크", "저녁 피크", "주말 브런치"],
  "seasonality": ["봄 한정", "여름 메뉴", "가을 미각", "겨울 보양"]
}
```

### 템플릿 예시 5종

#### T1. restaurant_new_menu_poster (이미지)
**이름**: 신메뉴 포스터 만들기
**설명**: 가게 앞에 붙일 A4 포스터용 이미지 프롬프트 생성
**예상 시간**: 3~5분

**질문 트리**:

1. `purpose`: "어떤 메뉴의 포스터인가요?"
   - type: text, placeholder: "예: 여름 한정 냉국수"
   - required: true

2. `content`: "그 메뉴의 핵심 재료 3가지만 알려주세요"
   - type: text, placeholder: "예: 해산물, 시금치, 참기름"
   - hint: "가장 눈에 띄는 재료를 쓰면 더 정확해져요"

3. `style`: "어떤 분위기의 포스터가 좋으세요?"
   - type: choice
   - options:
     - { value: 'appetizing', label: '침 넘어가는 먹음직한 느낌' }
     - { value: 'premium', label: '고급스럽고 깔끔한 느낌' }
     - { value: 'homey', label: '따뜻하고 정겨운 집밥 느낌' }
     - { value: 'trendy', label: '젊은 사람에게 어필하는 트렌디한 느낌' }

4. `audience`: "누구에게 보여주고 싶은 포스터인가요?"
   - type: multichoice
   - options: ['20~30대', '40~50대', '가족 단위', '직장인', '관광객']

5. `style`: "메인 색깔은 어떤 느낌이면 좋을까요?"
   - type: choice
   - options: ['따뜻한 빨강·주황 계열', '시원한 파랑·초록 계열', '고급스러운 검정·금색', '자연스러운 베이지·갈색']

6. `content`: "포스터에 꼭 들어가야 할 글자가 있나요?"
   - type: text, placeholder: "예: 여름 한정, 15,000원, 7월 31일까지"
   - skippable: true

7. `constraint`: "어느 곳에 붙일 포스터인가요?"
   - type: choice
   - options: ['가게 유리창', '가게 내부 벽', 'SNS 업로드용', '전단지']

**조립**: `assemblyPromptKey: "image_marketing_poster"` → Midjourney/DALL-E용 영어 프롬프트 생성

---

#### T2. restaurant_review_response (보고서)
**이름**: 리뷰 답글 작성 도우미
**설명**: 네이버·배민·카카오 리뷰에 답글 쓸 때 사용할 템플릿

**질문 트리**:

1. `content`: "받으신 리뷰 내용을 그대로 붙여넣어 주세요"
   - type: textarea, required: true

2. `purpose`: "이 리뷰는 어떤 리뷰인가요?"
   - type: choice
   - options:
     - '칭찬 리뷰 (별 5개)'
     - '보통 리뷰 (별 3~4개)'
     - '불만 리뷰 (별 1~2개, 구체적 이유 있음)'
     - '악성 리뷰 (근거 없는 비방)'

3. `context`: "불만 사항이 사실인가요?" (dependsOn: Q2 = '불만 리뷰')
   - type: choice
   - options: ['사실입니다', '일부만 사실', '사실과 다릅니다', '판단이 어렵습니다']

4. `style`: "어떤 톤으로 답글을 쓰고 싶으세요?"
   - type: choice
   - options:
     - '정중하고 격식 있게'
     - '친근하고 따뜻하게'
     - '사과하되 담백하게'
     - '단호하되 예의 있게'

5. `content`: "이 답글로 어떤 걸 꼭 전달하고 싶으세요?"
   - type: textarea
   - placeholder: "예: 다음 방문 시 사이드 서비스 약속, 메뉴 개선 계획"
   - skippable: true

6. `constraint`: "답글은 얼마나 길어야 할까요?"
   - type: choice
   - options: ['짧게 (2~3문장)', '보통 (4~6문장)', '길게 (7문장 이상)']

**조립**: 리뷰 원문 + 맥락 → ChatGPT/Claude용 답글 생성 프롬프트

---

#### T3. restaurant_instagram_post (이미지)
**이름**: 인스타그램 피드 이미지
**설명**: 정사각형(1:1) 인스타 게시물용 이미지 프롬프트

(질문 트리 생략 — T1과 유사 구조, ratio만 1:1 고정)

---

#### T4. restaurant_menu_description (보고서)
**이름**: 메뉴판 설명 문구 작성
**설명**: 메뉴판에 들어갈 3~5줄짜리 침 넘어가는 설명

**질문 트리 요약**:
1. 메뉴 이름
2. 주요 재료와 조리법
3. 이 메뉴의 특별한 점 (스토리)
4. 어울리는 상황 (혼자/둘이/가족)
5. 톤 (고급/정감/신선)
6. 길이

---

#### T5. restaurant_event_flyer (PPT)
**이름**: 이벤트 전단지 (A4 1장)
**설명**: 할인 이벤트·신메뉴 출시·리뉴얼 오픈 전단지

(질문 트리 생략)

---

## 도메인 2. 교육 (education)

### 하위 유형
- 초·중·고 교사
- 학원 강사 (입시·어학·예체능)
- 과외 (대학생·전업)
- 기업 교육 강사

### 전문 어휘 DB (excerpt)

```json
{
  "assessment_types": ["형성평가", "총괄평가", "수행평가", "지필평가"],
  "learning_styles": ["시각형", "청각형", "체험형", "읽기·쓰기형"],
  "difficulty_levels": ["도입", "기본", "심화", "응용", "창의"],
  "communication_types": ["수업 공지", "상담 응대", "피드백 제공", "진로 조언"]
}
```

### 템플릿 예시 5종

#### T1. education_lesson_plan (보고서)
**이름**: 수업 지도안 초안 만들기
**설명**: 차시별 수업 지도안 초안을 한 번에

**질문 트리**:

1. `context`: "어떤 과목·학년이에요?"
   - type: text, placeholder: "예: 중2 수학, 고1 영어"

2. `content`: "이번 차시의 주제는 무엇인가요?"
   - type: text

3. `purpose`: "학생들이 이 수업 후에 할 수 있어야 하는 것 1가지만 꼽아주세요"
   - type: textarea
   - hint: "구체적일수록 좋아요. '이차방정식을 근의 공식으로 풀 수 있다' 같은"

4. `audience`: "이 반의 특징은 어떤가요?"
   - type: multichoice
   - options: ['적극 참여형', '조용한 분위기', '실력 편차 큼', '집중력 짧음', '질문 많음']

5. `style`: "어떤 수업 방식을 선호하세요?"
   - type: choice
   - options: ['강의 중심', '질문·토론 중심', '개별 과제 중심', '모둠 활동 중심']

6. `constraint`: "수업 시간은 몇 분이에요?"
   - type: slider, min: 30, max: 100

7. `content`: "꼭 다뤄야 할 개념이 있나요?"
   - type: textarea, skippable: true

**조립**: ChatGPT용 "당신은 {학년} {과목} 교사입니다. 다음 조건으로 수업 지도안을 작성하세요..."

---

#### T2. education_parent_communication (보고서)
**이름**: 학부모 상담 답변 템플릿
**설명**: 학부모에게 보내는 메시지·편지

**질문 트리 요약**:
1. 상대 학부모 상황 (문의/불만/칭찬 요청)
2. 원문 내용
3. 전달할 핵심 내용
4. 학생의 현재 상태
5. 톤 (정중/친근/단호)

---

#### T3. education_quiz_generator (보고서)
**이름**: 단원 평가 문제 출제
**설명**: 객관식·단답형·서술형 평가 문항 자동 생성

---

#### T4. education_presentation_slides (PPT)
**이름**: 수업용 슬라이드 기획
**설명**: Gamma용 슬라이드 생성 프롬프트

---

#### T5. education_student_feedback (보고서)
**이름**: 학생별 피드백 코멘트
**설명**: 학기말 학생 개별 피드백 문구 작성

---

## 도메인 3. 부동산 (real_estate)

### 하위 유형
- 주거용 중개 (아파트·빌라·원룸)
- 상업용 중개 (상가·오피스)
- 토지·분양
- 부동산 투자자

### 전문 어휘 DB (excerpt)

```json
{
  "property_types": ["아파트", "빌라", "단독주택", "오피스텔", "원룸", "상가", "사무실", "토지"],
  "transaction_types": ["매매", "전세", "월세", "반전세", "분양"],
  "buyer_personas": ["신혼부부", "1인 가구", "은퇴 세대", "투자자", "사업자"],
  "value_factors": ["역세권", "학군", "조망", "층수", "향(南東)", "평면구조"]
}
```

### 템플릿 예시 5종

#### T1. real_estate_listing_description (보고서)
**이름**: 매물 소개 글 작성
**설명**: 네이버 부동산·직방·다방·블로그용 매물 설명

**질문 트리**:

1. `content`: "매물 기본 정보를 알려주세요"
   - 서브 질문: 유형(아파트/빌라/...), 평수, 층수, 방 개수, 화장실, 주차

2. `content`: "위치 정보 (동네·역세권 여부)"
   - type: text, placeholder: "예: 제주시 노형동, 공항 10분 거리"

3. `purpose`: "매매/전세/월세 중 어떤 거래인가요?"
   - type: choice, options: ['매매', '전세', '월세', '반전세']

4. `content`: "가격 정보"
   - type: text, placeholder: "예: 매매 5억 5천, 전세 4억 2천"

5. `audience`: "어떤 분에게 적합한 매물인가요?"
   - type: multichoice
   - options: ['신혼부부', '1인 가구', '자녀 있는 가족', '은퇴 세대', '투자자']

6. `content`: "이 매물의 가장 큰 장점 3가지"
   - type: textarea
   - hint: "채광·동선·조용함·주차 등 구체적으로"

7. `constraint`: "언급하고 싶지 않은 부분이 있나요?"
   - type: textarea, skippable: true
   - hint: "약점을 가리는 게 아니라, 먼저 부각시키고 싶은 게 있으면 적어주세요"

8. `style`: "톤은 어떻게?"
   - type: choice
   - options: ['정보 중심 담백하게', '감성적이고 스토리 있게', '긴급감 있게 (금주 한정 등)', '프리미엄 매물처럼']

**조립**: ChatGPT용 매물 소개 작성 프롬프트. 허위·과장 광고 금지 조항 자동 포함.

---

#### T2. real_estate_customer_response (보고서)
**이름**: 고객 문의 답변
**설명**: 카톡·문자 문의에 대한 답변

---

#### T3. real_estate_market_report (보고서)
**이름**: 동네 시장 분석 리포트
**설명**: 특정 지역의 시세·트렌드 분석 리포트

---

#### T4. real_estate_property_photo_enhance (이미지)
**이름**: 매물 사진 보정 프롬프트
**설명**: AI 이미지 편집 도구용 프롬프트 (채광 보정, 가구 배치 등)

---

#### T5. real_estate_contract_explainer (보고서)
**이름**: 계약 조건 쉬운 설명
**설명**: 고객에게 특약·등기부 등 복잡한 내용을 쉽게 설명

---

## 템플릿 확장 계획 (포스트-MVP)

### 3개월 차 추가 도메인
4. **뷰티·헬스** — 미용실, 피부관리실, 헬스 트레이너
5. **소공인·제조업** — 공방, 작은 공장 운영자
6. **서비스업** — 청소업체, 택배·배달 기사

### 6개월 차 추가 도메인
7. 전문직 (회계사, 세무사, 법무사)
8. 의료 (의원, 한의원, 치과)
9. 농업·수산업 (특산물 판매자)

### 12개월 차 확장
- **사용자 생성 템플릿** (User-Generated Templates)
  - Pro 사용자가 자신의 질문 트리를 직접 저장
  - 다른 사용자에게 공유 가능 (Square)
  - 고품질 템플릿은 운영진이 검수 후 공식 템플릿으로 승격

---

## 템플릿 품질 관리

### 1. 초기 설계 (전문가 참여)
- 각 도메인당 실제 종사자 3~5명 인터뷰
- 인터뷰 녹취 → AI 분석 → 초안 질문 트리 생성
- 전문가 검수 후 MVP 반영

### 2. 사용 데이터 기반 개선
- 사용자 완주율 < 60% → 질문 순서 재검토
- 건너뛰기 비율 > 40%인 질문 → 질문 자체 재설계
- 결과물 평가 < 3.5/5 → 조립 프롬프트 개선

### 3. A/B 테스트
- 같은 도메인×유형에 두 가지 질문 트리 동시 운용
- 2주 후 완주율·평가 기반 선택

---

## 템플릿 저장 구조

Firestore `templates` 컬렉션 (DATABASE_SCHEMA.md 참조):

```
templates/
├── {templateId}
│   ├── id
│   ├── domainId
│   ├── subtype
│   ├── outputType
│   ├── name
│   ├── description
│   ├── estimatedTime
│   ├── questions: [...]       ← 임베디드
│   ├── assemblyPromptKey
│   ├── sampleOutput
│   ├── version: number
│   ├── isOfficial: true
│   ├── createdAt
│   └── updatedAt
```

### 버전 관리
- 템플릿 수정 시 `version` 증가
- 이전 버전으로 생성된 프롬프트는 `prompts.templateVersion`에 기록 (재현성)

---

## Seed Data

초기 DB 시딩용 JSON 파일 위치:

```
/seeds/
├── domains.json         # 6개 기본 도메인
├── templates/
│   ├── restaurant/      # 5개 템플릿 × JSON
│   ├── education/
│   └── real_estate/
└── vocabulary/
    ├── restaurant.json
    ├── education.json
    └── real_estate.json
```

Firebase CLI 시딩 스크립트:

```bash
npm run seed:templates   # /scripts/seed-templates.ts 실행
```

---

## 참고 문서

- 스키마: `DATABASE_SCHEMA.md`
- 엔진 동작: `PROMPT_ENGINE.md`
- 인터뷰 UX: `TACIT_INTERVIEW.md`
