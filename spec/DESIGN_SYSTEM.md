# DESIGN_SYSTEM.md — Tacit 디자인 시스템

> 4-50대 도메인 보유자를 위한 명료하고 신뢰감 있는 디자인 시스템

## 1. 디자인 철학

### 1.1 3가지 원칙
1. **명료함 (Clarity)**: 어떤 버튼도 뭐 하는 건지 즉시 알 수 있어야 한다
2. **존중감 (Dignity)**: 4-50대 사용자를 "초보자" 취급하지 않는다. 우아하고 신뢰감 있게
3. **쌓임 (Accumulation)**: 사용자의 자산이 쌓이고 있음을 시각적으로 보여준다

### 1.2 금기 사항
- 과한 네온 컬러 (젊은 AI 스타트업 톤 금지)
- 너무 작은 폰트 (14px 이하 사용 금지)
- 폭발적 애니메이션 (절제된 모션)
- 영어 약어 남발 (AI, API, DB 등은 한국어 병기)

---

## 2. 브랜드 컬러

### 2.1 Primary: Tacit Ink (암묵지의 깊이)

**라이트 모드 기준**:
- `tacit-ink-50`: `#F5F7FA`
- `tacit-ink-100`: `#E4E9F0`
- `tacit-ink-200`: `#CAD3DE`
- `tacit-ink-300`: `#9FACBD`
- `tacit-ink-400`: `#6C7A8F`
- `tacit-ink-500`: `#475669`  ← **기본**
- `tacit-ink-600`: `#364353`
- `tacit-ink-700`: `#283341`
- `tacit-ink-800`: `#1B232E`
- `tacit-ink-900`: `#0E141C`

### 2.2 Accent: Amber Warmth (경험의 따뜻함)

경험·시간·노하우를 상징. 4-50대 타깃 친화.

- `amber-50`: `#FEFBF3`
- `amber-100`: `#FEF3D7`
- `amber-200`: `#FCE4A7`
- `amber-300`: `#F8CE6C`
- `amber-400`: `#F1B232`
- `amber-500`: `#D99611`  ← **기본 액센트**
- `amber-600`: `#B4780A`
- `amber-700`: `#8A5A07`
- `amber-800`: `#603E06`
- `amber-900`: `#3A2504`

### 2.3 Secondary: Moss Green (성장·쌓임)

Square 네트워크 및 자산 성장 시각화.

- `moss-50` 부터 `moss-900`까지
- `moss-500`: `#5A8F47` ← **기본**

### 2.4 Neutral: Warm Gray (따뜻한 회색)

순수 블랙/화이트 금지. 따뜻한 회색 계열 사용.

- `neutral-50`: `#FAFAF9`
- `neutral-100`: `#F5F5F4`
- `neutral-200`: `#E7E5E4`
- `neutral-300`: `#D6D3D1`
- `neutral-400`: `#A8A29E`
- `neutral-500`: `#78716C`
- `neutral-600`: `#57534E`
- `neutral-700`: `#44403C`
- `neutral-800`: `#292524`
- `neutral-900`: `#1C1917`
- `neutral-950`: `#0C0A09`

### 2.5 Semantic Colors

| 의미 | 라이트 | 다크 |
|------|--------|------|
| Success | `#16A34A` | `#22C55E` |
| Warning | `#D97706` | `#F59E0B` |
| Error | `#DC2626` | `#EF4444` |
| Info | `#0284C7` | `#0EA5E9` |

### 2.6 컬러 사용 규칙

- **Primary (Tacit Ink)**: 주요 텍스트, 구조적 요소, 버튼 주조색
- **Accent (Amber)**: CTA 버튼, 활성 상태, 강조
- **Moss Green**: 성장 그래프, 프로필 레벨, Square 내 긍정 지표
- **Neutral**: 배경, 보더, 보조 텍스트

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
--font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
--font-serif: 'Noto Serif KR', Georgia, serif;  /* 강조용 */
--font-mono: 'D2Coding', 'JetBrains Mono', monospace;
```

**선정 이유**:
- Pretendard: 한국어/영어 혼용 시 가장 우수. 무료. 가변 폰트
- Noto Serif KR: 브랜드 타이틀, 인용 등 강조
- D2Coding: 프롬프트 미리보기 등 모노스페이스

### 3.2 폰트 사이즈 (Scale)

**기본 크기 16px 이상 원칙**. `rem` 단위 사용.

| 토큰 | 크기 | 용도 |
|------|------|------|
| `text-xs` | 12px | 메타 정보, 레이블 |
| `text-sm` | 14px | 보조 텍스트 |
| `text-base` | 16px | **기본 본문** |
| `text-lg` | 18px | 강조 본문, 소제목 |
| `text-xl` | 20px | 카드 제목 |
| `text-2xl` | 24px | 섹션 제목 |
| `text-3xl` | 30px | 페이지 제목 |
| `text-4xl` | 36px | 히어로 제목 |
| `text-5xl` | 48px | 랜딩 히어로 |
| `text-6xl` | 60px | 특수 강조 |

### 3.3 사용자 글자 크기 설정 (접근성)

사용자 설정으로 전체 스케일 조정 가능:
- `normal` (1x): 기본
- `large` (1.125x): 18px 기본
- `xlarge` (1.25x): 20px 기본

구현: `html` 태그에 `font-size` 동적 설정, 나머지는 `rem` 상속.

### 3.4 라인 하이트

| 토큰 | 값 | 용도 |
|------|-----|------|
| `leading-none` | 1 | 큰 헤드라인 |
| `leading-tight` | 1.25 | 제목 |
| `leading-snug` | 1.375 | 부제목 |
| `leading-normal` | 1.5 | 본문 |
| `leading-relaxed` | 1.625 | **기본 본문 (4-50대 친화)** |
| `leading-loose` | 2 | 긴 문서 |

### 3.5 Font Weight

- `light` (300): 사용 안 함 (너무 얇음, 가독성 저하)
- `regular` (400): 기본 본문
- `medium` (500): 강조 본문
- `semibold` (600): 소제목
- `bold` (700): 제목

---

## 4. 간격 (Spacing)

8px 그리드 기반.

| 토큰 | 값 |
|------|-----|
| `space-0` | 0 |
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |
| `space-24` | 96px |

**기본 규칙**:
- 섹션 간: 64~96px
- 카드 내부 패딩: 24px
- 버튼 내부 패딩: 12px 16px
- 폼 필드 간격: 16px

---

## 5. 라운딩 (Border Radius)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `rounded-none` | 0 | - |
| `rounded-sm` | 4px | 작은 태그 |
| `rounded-md` | 8px | 입력 필드, 작은 버튼 |
| `rounded-lg` | 12px | **기본 카드, 버튼** |
| `rounded-xl` | 16px | 큰 카드 |
| `rounded-2xl` | 24px | 히어로 카드, 모달 |
| `rounded-3xl` | 32px | 특수 강조 |
| `rounded-full` | 9999px | 아바타, 둥근 버튼 |

---

## 6. 그림자 (Shadow)

4-50대 친화를 위해 **과한 그림자 금지**. 미묘한 elevation만.

```css
--shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
--shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
--shadow-md: 0 4px 6px rgba(15, 23, 42, 0.05), 0 2px 4px rgba(15, 23, 42, 0.04);
--shadow-lg: 0 10px 15px rgba(15, 23, 42, 0.06), 0 4px 6px rgba(15, 23, 42, 0.04);
--shadow-xl: 0 20px 25px rgba(15, 23, 42, 0.08), 0 10px 10px rgba(15, 23, 42, 0.04);

/* Dark mode */
--shadow-xs-dark: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-sm-dark: 0 1px 3px rgba(0, 0, 0, 0.4);
/* ... */
```

---

## 7. 브레이크포인트

모바일 우선.

| 토큰 | 최소 너비 | 설명 |
|------|-----------|------|
| `sm` | 640px | 큰 폰 |
| `md` | 768px | 태블릿 |
| `lg` | 1024px | 데스크톱 |
| `xl` | 1280px | 큰 데스크톱 |
| `2xl` | 1536px | 와이드 |

기본 디자인은 375px (iPhone SE) 기준.

---

## 8. 모션 (애니메이션)

절제된 모션. 속도감보다 자연스러움.

### 8.1 Duration
- `duration-75`: 75ms (즉각 반응 - hover)
- `duration-150`: 150ms (**기본**)
- `duration-300`: 300ms (페이지 전환)
- `duration-500`: 500ms (드라마틱)

### 8.2 Easing
- `ease-in-out`: 기본
- `ease-[cubic-bezier(0.4,0,0.2,1)]`: 자연스러움

### 8.3 주요 모션 패턴
- **Fade In**: opacity 0 → 1, 300ms
- **Slide Up**: translateY(8px → 0) + fade, 300ms
- **Scale Hover**: scale(1 → 1.02), 150ms
- **Skeleton Loading**: pulse 1.5s infinite

### 8.4 Reduced Motion
`prefers-reduced-motion` 사용자는 모든 모션 비활성화.

---

## 9. 아이콘

### 9.1 라이브러리
**Lucide React** 전용. 커스텀 아이콘 필요 시 SVG 직접 구현.

### 9.2 사이즈
- `size-4` (16px): 인라인 텍스트와 함께
- `size-5` (20px): 버튼 내부
- `size-6` (24px): **기본 UI**
- `size-8` (32px): 카드 내 강조
- `size-12` (48px): 히어로

### 9.3 도메인 아이콘 매핑
- 식당: `UtensilsCrossed`
- 교사: `GraduationCap`
- 공인중개사: `Home`
- 미용실: `Scissors`
- 변호사: `Scale`

---

## 10. 일러스트레이션

### 10.1 스타일
- **한국적 소재**: 먹·붓·한지·전통 문양 모티브
- **그러데이션 허용**: 단색 대신 부드러운 그러데이션
- **인물 묘사**: 4-50대가 주인공. 20대 모델 지양

### 10.2 제작 가이드
- Figma에서 SVG 제작
- 조명: 따뜻한 톤 (amber 계열)
- 배경: 뉴트럴 + 소량 브랜드 컬러

---

## 11. 보이스 & 톤

### 11.1 말투 원칙
- **존댓말** 기본
- **쉬운 한국어**: 외래어 지양
- **짧은 문장**: 한 문장 20자 이내 선호
- **따뜻하지만 프로페셔널**

### 11.2 안 좋은 예시 / 좋은 예시

❌ "AI가 당신의 프롬프트를 optimization합니다"
✅ "AI가 당신의 질문을 딱 맞게 다듬어드려요"

❌ "Generate"
✅ "만들기"

❌ "로그인 실패"
✅ "로그인에 실패했어요. 다시 시도해 주세요."

❌ "Subscribe to unlock premium features"
✅ "더 많은 기능을 이용하려면 이용권을 구독해 주세요"

### 11.3 다국어
- 1차: 한국어
- 2차: 한국어 + 영어 병기 (교육용)
- 3차: 영어, 일본어 완전 지원

---

## 12. Tailwind CSS 설정

`tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'tacit-ink': {
          50: '#F5F7FA',
          100: '#E4E9F0',
          200: '#CAD3DE',
          300: '#9FACBD',
          400: '#6C7A8F',
          500: '#475669',
          600: '#364353',
          700: '#283341',
          800: '#1B232E',
          900: '#0E141C',
        },
        amber: {
          50: '#FEFBF3',
          100: '#FEF3D7',
          200: '#FCE4A7',
          300: '#F8CE6C',
          400: '#F1B232',
          500: '#D99611',
          600: '#B4780A',
          700: '#8A5A07',
          800: '#603E06',
          900: '#3A2504',
        },
        moss: {
          50: '#F3F7EF',
          500: '#5A8F47',
          /* 나머지 생략 */
        },
        // 의미적 토큰은 CSS 변수로 연결
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... (DARK_LIGHT_MODE.md 참고)
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'Pretendard', 'sans-serif'],
        serif: ['var(--font-noto-serif-kr)', 'Georgia', 'serif'],
        mono: ['var(--font-d2coding)', 'monospace'],
      },
      fontSize: {
        'base': ['1rem', { lineHeight: '1.625', letterSpacing: '-0.011em' }],
        'lg': ['1.125rem', { lineHeight: '1.625' }],
        'xl': ['1.25rem', { lineHeight: '1.5' }],
      },
      borderRadius: {
        'lg': '0.75rem',  // 12px
        'xl': '1rem',     // 16px
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(15, 23, 42, 0.04)',
        'sm': '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-in-out',
        'slide-up': 'slideUp 300ms ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};

export default config;
```

---

## 13. 글로벌 CSS

`app/globals.css`의 핵심 구조 (상세는 `DARK_LIGHT_MODE.md`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* 라이트 모드 의미적 토큰 */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 217 25% 35%;
  /* ... DARK_LIGHT_MODE.md 참고 */
}

.dark {
  /* 다크 모드 의미적 토큰 */
}

@layer base {
  html {
    font-size: 16px;
  }
  
  html[data-font-size="large"] {
    font-size: 18px;
  }
  
  html[data-font-size="xlarge"] {
    font-size: 20px;
  }
  
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
  
  /* 포커스 링 */
  :focus-visible {
    @apply outline-none ring-2 ring-amber-500 ring-offset-2 ring-offset-background;
  }
}
```
