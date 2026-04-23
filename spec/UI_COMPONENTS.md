# UI_COMPONENTS.md — Tacit 컴포넌트 명세

> shadcn/ui 기반. 모든 컴포넌트는 `components/ui/`에 위치하며, Tacit 디자인 시스템에 맞게 커스터마이즈.

## 1. 기본 컴포넌트 (shadcn/ui 베이스)

### 1.1 Button

**변형(variants)**:
- `primary`: Amber 배경 (기본 CTA)
- `secondary`: Tacit Ink 배경
- `outline`: 테두리만
- `ghost`: 배경 없음, hover 시 muted
- `destructive`: 삭제 등
- `link`: 링크 스타일

**크기(sizes)**:
- `sm`: h-9 px-3 text-sm
- `default`: h-11 px-5 text-base
- `lg`: h-12 px-6 text-lg
- `xl`: h-14 px-8 text-xl (중년층 친화 큰 버튼)
- `icon`: h-11 w-11

**필수 속성**:
- 모든 버튼은 `aria-label` 또는 텍스트 필수
- 로딩 상태: `<Button disabled><Spinner /> 처리 중...</Button>`
- 최소 터치 타깃: 44x44px

**예시**:
```tsx
<Button variant="primary" size="lg">
  시작하기
</Button>

<Button variant="outline" size="default">
  <Plus className="mr-2 size-5" />
  새 프롬프트
</Button>
```

### 1.2 Input / Textarea

- 폰트 사이즈 16px 이상 (iOS 자동 확대 방지)
- placeholder 색상: muted-foreground
- focus: ring-2 ring-accent
- 최소 높이: Input 44px, Textarea 120px

```tsx
<Input 
  placeholder="예: 제주 카페 신메뉴 포스터" 
  className="text-base"
/>

<Textarea 
  placeholder="자세히 설명해 주세요" 
  rows={4}
  maxLength={500}
/>
```

### 1.3 Select / Combobox

- Radix UI Select 기반
- 드롭다운은 자동 위치 조정
- 선택지 많을 시 검색 가능한 Combobox로 전환

### 1.4 Checkbox / Radio

- 터치 타깃 충분히 (최소 24x24px)
- 레이블 클릭도 토글 작동
- `indeterminate` 상태 지원

### 1.5 Switch

- 테마 토글 등에 사용
- 애니메이션 부드럽게 (150ms)

### 1.6 Dialog / Modal

- 최대 너비: mobile 100%, desktop max-w-lg (기본)
- 백드롭 클릭 시 닫기 (destructive 확인 다이얼로그 제외)
- ESC 키 지원
- 포커스 트랩

### 1.7 Sheet (사이드 패널)

- 모바일에서 하단 bottom sheet
- 데스크톱에서 우측 slide over
- 인터뷰 설정, 필터 등에 사용

### 1.8 Toast

- 우측 하단 (데스크톱) / 상단 (모바일)
- 자동 소멸 5초
- variant: default, success, error, info

### 1.9 Tooltip

- Hover 200ms 지연
- 터치 디바이스에서는 long-press 후 표시

### 1.10 Tabs

- 수평 (기본) / 수직 (설정 화면)
- 활성 탭: 하단 2px accent 바

### 1.11 Accordion

- FAQ, 중첩된 설정 등에 사용
- 한 번에 하나만 열리는 옵션

### 1.12 Progress

- 선형 (기본)
- 원형 (인터뷰 진행률)
- 불확정 상태 (로딩)

### 1.13 Avatar

- 원형
- 이미지 + fallback 이니셜
- 크기: sm(32), default(40), lg(56), xl(80)

### 1.14 Badge

- variant: default, secondary, accent, outline, destructive
- 크기 sm / default

### 1.15 Skeleton

- 로딩 플레이스홀더
- Pulse 애니메이션 기본

---

## 2. Tacit 커스텀 컴포넌트

### 2.1 `TacitLogo`

```tsx
interface TacitLogoProps {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'full' | 'mark';
}
```

- 라이트/다크 모드별 다른 SVG
- `mark`: 심볼만, `full`: 심볼 + 워드마크

### 2.2 `TypeCard` (유형 선택 카드)

**구성**:
- 상단 아이콘 (48x48)
- 제목 (text-xl semibold)
- 설명 (text-sm muted)
- 하단 메타: 평균 소요 시간, 난이도

**상태**:
- default
- hover: scale-[1.02], shadow-md
- selected: border-accent, bg-accent-muted

```tsx
<TypeCard
  icon={ImageIcon}
  title="이미지/포스터"
  description="포스터, 인스타 피드, 썸네일 등"
  averageTime="3분"
  difficulty={1}
  onClick={() => handleSelect('image')}
/>
```

### 2.3 `DomainCard` (도메인 템플릿 카드)

**구성**:
- 히어로 이미지 또는 그러데이션 배경
- 도메인 라벨 (예: "식당 사장")
- 이 템플릿으로 만들 수 있는 것 예시 3개
- 가격 뱃지 (무료 / 유료)
- 활성 사용자 수 (신뢰도)

### 2.4 `QuestionCard` (질문 카드)

**구성**:
- 질문 번호 / 총 질문 수 (상단)
- 질문 본문 (text-xl, font-medium)
- 답변 힌트 (text-sm muted) — 접기/펼치기 가능
- 답변 입력 영역 (유형별 다름)
- 하단 버튼:
  - "이전" (ghost)
  - "잘 모르겠어요" (outline, 우측 정렬)
  - "다음" (primary, 우측 정렬)

```tsx
<QuestionCard
  number={3}
  total={7}
  question="이 포스터는 어떤 매장 분위기와 어울려야 하나요?"
  examples={['따뜻한 우드 인테리어', '모던 미니멀', '빈티지 카페']}
  inputType="select"
  options={[...]}
  onAnswer={handleAnswer}
  onSkip={handleSkip}
/>
```

### 2.5 `PromptOutput` (프롬프트 출력 영역)

**구성**:
- 상단: 산출물 유형 아이콘 + "이미지 프롬프트" 레이블
- 메인: 프롬프트 텍스트 (코드 블록 스타일, 스크롤 가능)
- 하단 액션:
  - "복사" (primary)
  - "편집" (outline)
  - "[외부 도구]에서 열기" (primary, 큼)
  - "내 서재에 저장" (outline)
- 추천 도구 로고 표시

### 2.6 `InterviewBar` (인터뷰 진행률 바)

- 상단 고정 또는 사이드
- 현재 질문 번호 / 전체
- 카테고리별 진행 상황 시각화
- "중단" 버튼 (저장됨 안내)

### 2.7 `VoiceInput` (음성 입력 버튼)

- 크게. Floating Action Button 스타일 (모바일)
- 녹음 중: 빨간 파동 애니메이션
- STT 실시간 표시
- 녹음 중지 후 편집 가능

### 2.8 `ProfileBadge`

- 현재 활성 프로필 표시
- 클릭 시 프로필 전환 모달
- 프로필 없으면 "프로필 만들기" CTA

### 2.9 `SquareCard` (Square 피드 카드)

**구성**:
- 상단: 작성자 Avatar + 이름 + 도메인
- 제목
- 요약 (2줄 제한)
- 태그 (max 3)
- 하단 메타: 좋아요, 복사 수, 날짜
- 우하단 "복제하기" 버튼

### 2.10 `LibraryCard` (내 서재 카드)

**구성**:
- 썸네일 (이미지 결과물) 또는 첫 줄 (텍스트 결과물)
- 제목
- 유형 뱃지
- 생성일
- 만족도 별점
- 우상단 드롭다운 (편집/복제/삭제/공개)

### 2.11 `EmptyState`

```tsx
<EmptyState
  icon={FolderOpen}
  title="아직 저장된 프롬프트가 없어요"
  description="첫 프롬프트를 만들어보세요. 여기에 모두 자동으로 저장됩니다."
  action={
    <Button variant="primary" size="lg">
      <Plus className="mr-2 size-5" />
      새 프롬프트 만들기
    </Button>
  }
/>
```

### 2.12 `LoadingState`

상황별 로딩:
- `skeleton`: 레이아웃 유지하며 로딩
- `spinner`: 작은 영역
- `thinking`: "AI가 생각 중이에요..." (인터뷰/생성 시)

### 2.13 `ErrorState`

```tsx
<ErrorState
  title="문제가 발생했어요"
  description="잠시 후 다시 시도해 주세요."
  action={<Button onClick={retry}>다시 시도</Button>}
  supportLink="/help"
/>
```

---

## 3. 레이아웃 컴포넌트

### 3.1 `AppShell`

앱 내부 페이지의 공통 레이아웃.

**구성**:
- 상단 헤더 (고정)
- 좌측 사이드바 (데스크톱) / 햄버거 메뉴 (모바일)
- 메인 콘텐츠 영역
- 하단 네비 (모바일)

### 3.2 `MarketingShell`

랜딩/요금제/소개 페이지용.

**구성**:
- 상단 투명 헤더 (스크롤 시 배경 fill)
- 풀블리드 섹션
- 푸터

### 3.3 `Header`

- 로고
- 주요 네비 (스튜디오, 서재, Square, 인터뷰)
- 사용자 메뉴 (로그인 전: 시작하기 / 후: 아바타 드롭다운)
- 테마 토글

### 3.4 `Sidebar`

- 주요 메뉴 (아이콘 + 텍스트)
- 활성 프로필 표시
- 하단: 설정, 도움말

### 3.5 `MobileNav`

- 하단 고정 탭바 (4-5개 주요 메뉴)
- 중앙 + 버튼 (새 프롬프트)

### 3.6 `Footer`

- 회사 정보
- 법적 페이지 (이용약관, 개인정보)
- 소셜 링크
- 뉴스레터 구독 (선택)

---

## 4. 특수 컴포넌트

### 4.1 `OnboardingTour`

- 최초 로그인 시 4단계 투어
- react-joyride 기반
- 스킵 가능, 나중에 다시 보기 가능

### 4.2 `FontSizeAdjuster`

접근성 도구. 우하단 floating 버튼.

```tsx
<FontSizeAdjuster 
  current="normal" 
  onChange={(size) => updatePreference('fontSize', size)} 
/>
```

### 4.3 `ThemeToggle`

→ `DARK_LIGHT_MODE.md` 참고

### 4.4 `CommandPalette`

- Cmd/Ctrl+K로 열림
- 프롬프트 검색, 메뉴 이동, 설정 등
- 고급 사용자용 (메인 사용자 대상 아님)

---

## 5. 컴포넌트 작성 규칙

### 5.1 파일 구조
```
components/
  ui/                        # shadcn/ui 기반 기본
    button.tsx
    input.tsx
    ...
  tacit/                     # Tacit 커스텀
    TypeCard.tsx
    QuestionCard.tsx
    ...
  layout/
    AppShell.tsx
    Header.tsx
    ...
  theme/
    ThemeProvider.tsx
    ThemeToggle.tsx
```

### 5.2 파일 내부 규칙
- 'use client' 상단에 명시 (인터랙티브 시)
- Props 인터페이스 export
- cn() 유틸로 className 병합
- forwardRef는 Radix 래핑 시만

### 5.3 스토리북 (2차)
- 2차에 Storybook 도입
- 모든 컴포넌트의 variants, states 문서화

---

## 6. 상태별 시각 처리

### 6.1 모든 인터랙티브 요소의 상태
1. **Default**: 기본
2. **Hover**: 마우스 오버 (데스크톱만)
3. **Focus**: 키보드 포커스 (ring-2 ring-accent)
4. **Active**: 클릭 순간
5. **Disabled**: opacity-50, cursor-not-allowed
6. **Loading**: 스피너, disabled
7. **Selected**: accent 계열 강조

### 6.2 데이터 상태
1. **Loading**: Skeleton 또는 Spinner
2. **Empty**: EmptyState 컴포넌트
3. **Error**: ErrorState 컴포넌트
4. **Success**: 일반 렌더링

---

## 7. 반응형 패턴

### 7.1 브레이크포인트별 동작
| 요소 | Mobile (< 768) | Tablet (768-1023) | Desktop (≥ 1024) |
|------|----------------|-------------------|------------------|
| Header | 햄버거 + 로고 | 풀 메뉴 | 풀 메뉴 |
| Sidebar | 드로워 | 접힌 아이콘만 | 풀 사이드바 |
| Type grid | 2열 | 3열 | 4열 |
| Square feed | 1열 | 2열 | 3열 |
| Bottom Nav | 표시 | 숨김 | 숨김 |

### 7.2 컨테이너
```tsx
<div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
  {/* content */}
</div>
```

---

## 8. 접근성 체크리스트 (컴포넌트별)

모든 컴포넌트 구현 시:
- [ ] 키보드 네비게이션 가능
- [ ] 포커스 가시화 (ring)
- [ ] 스크린리더 레이블
- [ ] ARIA 속성 (role, state)
- [ ] 색 대비 WCAG AA
- [ ] 터치 타깃 44x44px
- [ ] 움직임 감소 모드 지원

Radix UI 기반 shadcn/ui를 쓰면 대부분 자동 지원. 커스텀 컴포넌트에서 체크 필요.
