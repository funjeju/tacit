# SQUARE_NETWORK.md — Square 공유 네트워크

Tacit의 네트워크 레이어. 사용자가 만든 프롬프트를 공유·복제·거래하는 공간. 시간이 갈수록 가치가 쌓이는 비복제적 자산 구조입니다.

---

## 설계 철학

1. **받는 것보다 주는 것이 쉽다** — 좋아요·복제는 1탭, 공유는 확인 거침
2. **동업자 네트워크** — 같은 도메인끼리 자연스럽게 묶인다
3. **품질이 자동 정렬된다** — 좋아요·복제 수 기반 랭킹
4. **복제는 기록된다** — 원본 작성자와 링크 유지
5. **시간이 지날수록 강해진다** — 초기엔 빈약해도, 쌓이면 해자가 된다

---

## 3단계 성장 전략

### 1단계 (런칭~3개월): 큐레이션 주도
- 운영진이 직접 고품질 프롬프트 30개 시드
- 도메인별 10개씩 균형 있게 배치
- 초기 사용자에게 "공유 시 +5회 무료 사용권" 인센티브

### 2단계 (3~9개월): 커뮤니티 주도
- 자발적 공유 > 큐레이션
- 주간 "이 주의 프롬프트" 선정
- 우수 작성자에게 배지·리워드

### 3단계 (9개월+): 마켓플레이스
- 유료 프롬프트 거래 활성화
- 작성자 수익 배분 (70:30)
- 소상공인협회 공식 템플릿 연계

---

## 데이터 모델

DATABASE_SCHEMA.md의 `square` 컬렉션 참조. 핵심 필드:

```typescript
interface SquareEntry {
  id: string;
  promptId: string;                // 원본 prompts 컬렉션 참조
  authorId: string;
  authorNickname: string;
  authorDomain: string;
  title: string;                   // 사용자가 설정
  description: string;             // "이 프롬프트는 ~에 쓰기 좋아요"
  outputType: OutputType;
  tags: string[];                  // 자동 생성 + 수동 편집
  embedding: number[];             // Supabase 별도
  
  stats: {
    views: number;
    likes: number;
    copies: number;
    reports: number;
  };
  
  pricing: {
    type: 'free' | 'paid';
    price?: number;                // KRW, paid일 때
    priceType?: 'one_time' | 'subscription';
  };
  
  sampleOutput?: {
    type: 'image' | 'text' | 'video';
    url?: string;
    content?: string;
  };
  
  moderation: {
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    reviewedBy?: string;
    reviewedAt?: Timestamp;
    reason?: string;
  };
  
  visibility: 'public' | 'unlisted' | 'deleted';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastRankedAt?: Timestamp;
}
```

---

## 피드 랭킹 알고리즘

### 주요 피드 3종

1. **추천 (for_you)** — 개인화, 벡터 유사도 + 품질 점수
2. **최신 (latest)** — 시간 역순 + 기본 품질 필터
3. **인기 (trending)** — 기간별 핫스코어

### 기본 랭킹 수식

```
Score = (Likes × 1.0) + (Copies × 3.0) + (Views × 0.1)
      - (Reports × 10.0)
      × TimeDecay(createdAt)

TimeDecay(t) = 1 / (1 + 0.05 × days_since_created)
```

- 복제가 좋아요보다 3배 가중 (실제 활용 신호)
- 신고는 큰 페널티
- 시간 감쇠는 느리게 (좋은 프롬프트는 오래 살아남는다)

### 추천 (for_you) 알고리즘

**개인화 점수 계산**:
```
PersonalizedScore = BaseScore × (1 + 2.0 × VectorSimilarity)
                             × DomainMatchBoost
                             × FreshnessBonus
                             
VectorSimilarity = cosine(userProfileEmbedding, entryEmbedding)
DomainMatchBoost = 1.5 if 같은 도메인 else 1.0
FreshnessBonus = 1.2 if 3일 이내 else 1.0
```

**쿼리**:

```sql
-- Supabase pgvector
SELECT 
  e.entry_id,
  1 - (e.embedding <=> $userEmbedding::vector) as similarity
FROM square_embeddings e
JOIN square_entries_meta m ON m.id = e.entry_id
WHERE m.visibility = 'public'
  AND m.moderation_status = 'approved'
  AND ($outputType IS NULL OR m.output_type = $outputType)
ORDER BY similarity DESC
LIMIT 50;
```

그 후 서버에서 `BaseScore × 가중치` 재계산 → 상위 20개 반환.

### 트렌딩 (trending) 알고리즘

```
TrendingScore = (LikesLastHours + CopiesLastHours × 3)
              / Max(hours_since_created, 2) ^ 1.5
```

- 시간당 가속도 + 시간 감쇠
- 새 글이 빠르게 반응 받으면 상단에

### 최신 (latest)
- 단순 `createdAt DESC`
- 단, 신고 2회 이상은 자동 제외

---

## 태그 자동 생성

프롬프트가 Square에 공개될 때 Claude API로 태그 생성:

```typescript
async function generateTags(entry: SquareEntry): Promise<string[]> {
  const result = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `
다음 프롬프트에 어울리는 태그를 5~8개 생성하세요.
JSON 배열로만 답하세요.

프롬프트 제목: ${entry.title}
설명: ${entry.description}
유형: ${entry.outputType}
도메인: ${entry.authorDomain}

태그는:
- 한국어 명사형
- 짧게 (2~4글자)
- 구체적 (예: "신메뉴", "인스타그램", "여름한정")
- 도메인 + 유형 + 용도 조합
      `.trim(),
    }],
  });

  return JSON.parse(result.content[0].text);
}
```

태그 정규화:
- 소문자·공백 제거
- 중복 제거
- 금칙 태그 필터

---

## 모더레이션

### 자동 검수 (자동 승인 파이프라인)

프롬프트 공개 시도 → 다음 체크 → 통과 시 즉시 공개, 실패 시 수동 검수 큐

```typescript
async function autoModerate(entry: SquareEntry): Promise<ModerationResult> {
  const checks = await Promise.all([
    checkProfanity(entry),           // 욕설
    checkPII(entry),                 // 개인정보
    checkMaliciousPrompt(entry),     // 악의적 프롬프트 (우회)
    checkCopyright(entry),           // 명백한 저작권 침해
    checkSpam(entry),                // 도배·광고
  ]);

  const failed = checks.filter(c => !c.passed);
  if (failed.length === 0) {
    return { status: 'approved', auto: true };
  }

  return {
    status: 'pending',
    auto: false,
    reasons: failed.map(c => c.reason),
  };
}
```

### 신고 시스템

사용자가 프롬프트 신고 가능:
- 사유: 부적절, 저작권, 스팸, 위험, 기타
- 신고 2회 누적 → 자동 숨김 + 관리자 큐
- 신고 5회 누적 → 즉시 비공개

### 관리자 대시보드

`/admin/moderation` 페이지:
- `pending` 상태 목록
- 각 항목 [승인] / [거절] / [작성자에게 수정 요청]
- 거절 시 사유 입력 (작성자에게 통보)

---

## 복제 플로우

### 무료 프롬프트 복제

```typescript
async function copyFreePrompt(
  userId: string, 
  squareId: string
): Promise<string> {
  // 1. 원본 가져오기
  const entry = await getSquareEntry(squareId);
  const originalPrompt = await getPrompt(entry.promptId);

  // 2. 내 서재에 복사본 생성
  const copiedPrompt = await createPrompt({
    userId,
    ...originalPrompt,
    id: undefined,  // 새 ID
    copiedFrom: squareId,
    copiedAt: serverTimestamp(),
    visibility: 'private',
  });

  // 3. Square 통계 업데이트
  await updateSquareStats(squareId, { copies: increment(1) });

  // 4. 작성자에게 알림 (옵션)
  await createNotification(entry.authorId, {
    type: 'prompt_copied',
    promptId: squareId,
    copiedBy: userId,
  });

  return copiedPrompt.id;
}
```

### 유료 프롬프트 구매

```
[구매 플로우]
1. 사용자가 "₩3,000 구매하기" 클릭
   ↓
2. 결제 모달 (토스페이먼츠)
   ↓
3. 결제 성공 시 트랜잭션 저장
   ↓
4. 원본 프롬프트 잠금 해제 + 내 서재에 복사
   ↓
5. 작성자 수익 지갑에 70% 적립 (30% 플랫폼 수수료)
```

```typescript
interface PromptPurchase {
  id: string;
  buyerId: string;
  sellerId: string;
  squareId: string;
  amount: number;              // 소비자가
  sellerEarning: number;       // 70%
  platformFee: number;         // 30%
  paymentMethod: 'card' | 'kakao_pay' | 'naver_pay';
  tossTransactionId: string;
  status: 'pending' | 'paid' | 'refunded';
  purchasedAt: Timestamp;
}
```

### 환불 정책
- 구매 후 24시간 내 + 0회 사용 → 전액 환불
- 그 외 환불 불가 (디지털 콘텐츠 특성)

---

## 작성자 수익 구조

### 수익 계산
```
작성자 수익 = 판매가 × 0.7
플랫폼 수수료 = 판매가 × 0.3 (여기서 결제 수수료 2.9% + VAT 10%는 플랫폼 부담)
```

### 정산
- 최소 정산 금액: ₩30,000
- 월 1회 정산 (매월 15일)
- 사업자등록증 등록 시 사업 소득, 없으면 기타 소득 (원천징수 3.3%)

### 작성자 대시보드 (`/creator`)
- 이번 달 판매 건수·수익
- 누적 수익
- 개별 프롬프트별 성과
- [정산 신청] 버튼

---

## 동업자 네트워크 (Domain Community)

같은 도메인 사용자끼리 자동으로 묶이는 구조:

### 도메인별 홈 (`/square/domain/[domainId]`)
- 해당 도메인의 인기 프롬프트
- 해당 도메인의 활발한 작성자 (팔로우 가능)
- 도메인 챌린지 (월간)

### 팔로우 기능
- 좋아하는 작성자 팔로우
- 팔로우한 작성자 새 프롬프트 시 알림
- 팔로우 카운트는 작성자 페이지에 공개

### 챌린지
```
[예시] "2026년 5월 식당 사장님 챌린지: 여름 신메뉴 포스터"
- 참여 기간: 5/1 ~ 5/31
- 태그: #식당챌린지2605
- 상위 10개에 Pro 1개월 무료 / 배지 / 운영진 피처링
```

---

## 추천 시스템

### "이 프롬프트를 복제한 사람이 좋아한 다른 프롬프트"

- 협업 필터링 (Collaborative Filtering) 기본
- 초기엔 아이템 기반 CF만 구현
- Firebase Functions 주간 배치로 사전 계산

```typescript
// functions/cf-recommendation.ts
export const computeRecommendations = onSchedule('every sunday 03:00', async () => {
  // 1. 복제 행동 매트릭스 추출
  // 2. 아이템-아이템 코사인 유사도 계산
  // 3. Firestore `square/{id}/recommendations` 에 상위 10개 저장
});
```

### "당신과 비슷한 도메인의 사람들이 쓰는 프롬프트"

- 프로필 임베딩 벡터 유사도 기반
- Supabase pgvector 쿼리

---

## UI 구성

### Square 홈 (`/square`)

```
┌─────────────────────────────────┐
│ 상단 탭: 추천 | 최신 | 인기 | 내 도메인│
├─────────────────────────────────┤
│  🔥 이번 주 트렌딩              │
│  [가로 스크롤 카드 5개]          │
├─────────────────────────────────┤
│  당신의 도메인 'restaurant' 추천 │
│  [세로 그리드 카드 n개]          │
├─────────────────────────────────┤
│  최근 활동 많은 작성자          │
│  [작성자 아바타 리스트]          │
└─────────────────────────────────┘
```

### Square 카드

```
┌─────────────────────────────┐
│ [이미지 썸네일 또는 유형 아이콘] │
├─────────────────────────────┤
│ 제목 (16px Bold)             │
│ @작성자명 · 식당 · 25년차     │
│                              │
│ 💡 "이런 분에게 좋아요"       │
│ 설명 2줄 말줄임                │
│                              │
│ [유형 배지] [가격 배지]        │
│                              │
│ ❤️ 128  🔄 45  👁 1,203       │
└─────────────────────────────┘
```

---

## 검색

### 일반 검색 (`/square/search`)
- 제목·설명·태그·작성자명 대상
- Algolia or Firestore 기반 텍스트 검색
- 필터: 유형·도메인·가격 (무료/유료)·정렬

### 시맨틱 검색 (Pro 기능)
```
"여름에 가족 단위 손님 유치할 수 있는 포스터"
  ↓
임베딩 생성 → Supabase 벡터 검색
  ↓
자연어 의미가 유사한 프롬프트 반환
```

---

## 스팸·남용 방지

### Rate Limit
- 시간당 공유 최대 5개
- 일일 공유 최대 20개

### 품질 필터
- 최소 설명 길이 20자
- 동일 사용자의 유사 프롬프트 3개 이상 시 중복 경고

### 신규 계정 제한
- 가입 후 7일간 Square 공개 불가 (어뷰즈 방지)
- Pro 가입 시 즉시 해제

---

## 분석 대시보드 (관리자)

`/admin/square/analytics` 페이지:
- DAU·WAU·MAU
- 공유 수 / 복제 수 / 유료 판매 수 (시계열)
- 도메인별 활성도 히트맵
- 이탈률 (공유했지만 복제 0회)

---

## 확장 로드맵

### 2차 (3~6개월)
- 팔로우·피드 개인화 고도화
- 챌린지 기능 정식 출시
- 작성자 배지 시스템

### 3차 (6~12개월)
- 유료 프롬프트 시장 활성화
- B2B 프롬프트 묶음 판매 (소상공인협회)
- 국제화 (일본·베트남 먼저)

---

## 참고 문서

- 데이터: `DATABASE_SCHEMA.md`
- API: `API_SPEC.md`
- UI: `UI_COMPONENTS.md` (SquareCard)
- 플로우: `USER_FLOWS.md` (Flow 4)
