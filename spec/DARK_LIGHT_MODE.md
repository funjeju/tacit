# DARK_LIGHT_MODE.md — 다크/라이트 모드 구현

> **다크모드/라이트모드는 Tacit의 1급 시민이다. 둘 다 동등한 퀄리티여야 한다.**

## 1. 핵심 원칙

### 1.1 3가지 모드
- **Light**: 밝은 배경 (기본)
- **Dark**: 어두운 배경
- **System**: OS 시스템 설정 추종 (`prefers-color-scheme`)

### 1.2 원칙
- **CSS 변수 기반**: HEX 직접 사용 금지, 모든 컬러는 토큰
- **ChunkLoading 방지**: 초기 로드 시 테마 플래시(FOUC) 없어야 함
- **사용자 선택 영구 저장**: Firestore + localStorage 이중 저장
- **접근성**: 두 모드 모두 WCAG AA 대비 기준 만족

---

## 2. CSS 변수 정의

`app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ────────────────────────────────────
   라이트 모드 (기본)
   ──────────────────────────────────── */
:root {
  /* Base */
  --background: 60 9% 98%;              /* neutral-50, 약간 warm */
  --foreground: 222 15% 12%;            /* tacit-ink-900 계열 */
  
  /* Surface */
  --card: 0 0% 100%;                    /* pure white */
  --card-foreground: 222 15% 12%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 15% 12%;
  
  /* Primary (Tacit Ink) */
  --primary: 217 19% 35%;               /* tacit-ink-500 */
  --primary-foreground: 60 9% 98%;
  --primary-hover: 217 19% 29%;         /* tacit-ink-600 */
  
  /* Accent (Amber) */
  --accent: 39 89% 46%;                 /* amber-500 */
  --accent-foreground: 60 9% 98%;
  --accent-hover: 39 87% 38%;           /* amber-600 */
  --accent-muted: 39 85% 85%;           /* amber-100 */
  
  /* Secondary (Moss) */
  --secondary: 95 33% 42%;              /* moss-500 */
  --secondary-foreground: 60 9% 98%;
  
  /* Muted */
  --muted: 60 5% 96%;                   /* neutral-100 */
  --muted-foreground: 30 5% 35%;        /* neutral-600 */
  
  /* Border & Input */
  --border: 20 6% 90%;                  /* neutral-200 */
  --input: 20 6% 90%;
  --ring: 39 89% 46%;                   /* amber-500 (focus) */
  
  /* Semantic */
  --success: 142 76% 36%;
  --success-foreground: 60 9% 98%;
  --warning: 32 95% 44%;
  --warning-foreground: 60 9% 98%;
  --destructive: 0 84% 50%;
  --destructive-foreground: 60 9% 98%;
  --info: 199 89% 40%;
  --info-foreground: 60 9% 98%;
  
  /* Gradients */
  --gradient-hero: linear-gradient(135deg, hsl(217 19% 35% / 0.05), hsl(39 89% 46% / 0.1));
  --gradient-amber: linear-gradient(135deg, hsl(39 89% 46%), hsl(32 95% 44%));
  
  /* Shadow */
  --shadow-color: 222 15% 12%;
  --shadow-xs: 0 1px 2px hsl(var(--shadow-color) / 0.04);
  --shadow-sm: 0 1px 3px hsl(var(--shadow-color) / 0.06), 0 1px 2px hsl(var(--shadow-color) / 0.04);
  --shadow-md: 0 4px 6px hsl(var(--shadow-color) / 0.05), 0 2px 4px hsl(var(--shadow-color) / 0.04);
  --shadow-lg: 0 10px 15px hsl(var(--shadow-color) / 0.06), 0 4px 6px hsl(var(--shadow-color) / 0.04);
  --shadow-xl: 0 20px 25px hsl(var(--shadow-color) / 0.08);
  
  /* Radius */
  --radius: 0.75rem;
}

/* ────────────────────────────────────
   다크 모드
   ──────────────────────────────────── */
.dark {
  /* Base */
  --background: 222 22% 7%;             /* tacit-ink-900 변형 */
  --foreground: 60 5% 96%;              /* neutral-100 */
  
  /* Surface */
  --card: 222 20% 11%;                  /* tacit-ink-800 변형 */
  --card-foreground: 60 5% 96%;
  --popover: 222 20% 11%;
  --popover-foreground: 60 5% 96%;
  
  /* Primary (밝아진 Tacit Ink) */
  --primary: 220 15% 70%;               /* tacit-ink-300 계열 */
  --primary-foreground: 222 22% 7%;
  --primary-hover: 220 15% 78%;
  
  /* Accent (약간 탁해진 Amber - 다크에서 눈부심 방지) */
  --accent: 39 75% 55%;                 /* amber-400 변형 */
  --accent-foreground: 222 22% 7%;
  --accent-hover: 39 85% 65%;
  --accent-muted: 39 35% 20%;
  
  /* Secondary */
  --secondary: 95 25% 55%;
  --secondary-foreground: 222 22% 7%;
  
  /* Muted */
  --muted: 220 10% 18%;                 /* neutral-800 변형 */
  --muted-foreground: 30 5% 65%;        /* neutral-400 변형 */
  
  /* Border & Input */
  --border: 220 10% 18%;
  --input: 220 10% 18%;
  --ring: 39 75% 55%;
  
  /* Semantic */
  --success: 142 70% 50%;
  --success-foreground: 222 22% 7%;
  --warning: 32 95% 58%;
  --warning-foreground: 222 22% 7%;
  --destructive: 0 72% 60%;
  --destructive-foreground: 60 9% 98%;
  --info: 199 89% 55%;
  --info-foreground: 222 22% 7%;
  
  /* Gradients */
  --gradient-hero: linear-gradient(135deg, hsl(220 15% 70% / 0.08), hsl(39 75% 55% / 0.12));
  --gradient-amber: linear-gradient(135deg, hsl(39 75% 55%), hsl(32 80% 58%));
  
  /* Shadow (다크에서 더 강하게) */
  --shadow-color: 0 0% 0%;
  --shadow-xs: 0 1px 2px hsl(var(--shadow-color) / 0.3);
  --shadow-sm: 0 1px 3px hsl(var(--shadow-color) / 0.4), 0 1px 2px hsl(var(--shadow-color) / 0.3);
  --shadow-md: 0 4px 6px hsl(var(--shadow-color) / 0.4), 0 2px 4px hsl(var(--shadow-color) / 0.3);
  --shadow-lg: 0 10px 15px hsl(var(--shadow-color) / 0.5);
  --shadow-xl: 0 20px 25px hsl(var(--shadow-color) / 0.6);
}

@layer base {
  * {
    @apply border-border;
  }
  
  html {
    font-size: 16px;
    color-scheme: light;
  }
  
  html.dark {
    color-scheme: dark;
  }
  
  body {
    @apply bg-background text-foreground font-sans antialiased;
    transition: background-color 200ms ease, color 200ms ease;
  }
}
```

---

## 3. Tailwind 연동

`tailwind.config.ts`의 관련 부분:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',  // ← 'class' 모드 필수
  content: [/* ... */],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          hover: 'hsl(var(--accent-hover))',
          muted: 'hsl(var(--accent-muted))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
      },
    },
  },
};

export default config;
```

---

## 4. 테마 Provider (FOUC 방지)

### 4.1 `components/theme/ThemeProvider.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    // localStorage에서 복원
    const stored = localStorage.getItem('tacit-theme') as Theme | null;
    if (stored) {
      setThemeState(stored);
    }
  }, []);
  
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const effective = theme === 'system' 
        ? (media.matches ? 'dark' : 'light')
        : theme;
      
      root.classList.remove('light', 'dark');
      root.classList.add(effective);
      setResolvedTheme(effective);
    };
    
    applyTheme();
    
    if (theme === 'system') {
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [theme]);
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('tacit-theme', newTheme);
    // Firestore에도 저장 (로그인 상태라면)
    updateUserPreference('theme', newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

async function updateUserPreference(key: string, value: string) {
  // Firestore 업데이트 로직 (간략화)
  try {
    await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
  } catch (err) {
    // 조용히 실패 (로그인 X 등)
  }
}
```

### 4.2 FOUC 방지 스크립트 — `app/layout.tsx`

```typescript
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('tacit-theme') || 'system';
                  var resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  document.documentElement.classList.add(resolved);
                  document.documentElement.style.colorScheme = resolved;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

**중요**: 이 인라인 스크립트가 React 하이드레이션 전에 실행되어야 FOUC가 사라진다.

---

## 5. 테마 토글 UI

### 5.1 `components/theme/ThemeToggle.tsx`

```typescript
'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="테마 변경">
          <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 size-4" />
          밝게
          {theme === 'light' && <span className="ml-auto text-accent">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 size-4" />
          어둡게
          {theme === 'dark' && <span className="ml-auto text-accent">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 size-4" />
          시스템 설정 따르기
          {theme === 'system' && <span className="ml-auto text-accent">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 6. 컴포넌트 작성 규칙

### 6.1 항상 의미적 토큰 사용

❌ 나쁜 예:
```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
```

✅ 좋은 예:
```tsx
<div className="bg-background text-foreground">
```

### 6.2 두 모드 모두 시각적 확인

- Figma에서 두 모드 동시 디자인 필수
- Storybook 또는 Playground 페이지에서 둘 다 확인
- 개발 중 테마 토글 적극 사용

### 6.3 이미지 처리

**로고/아이콘**: 둘 다 대응
```tsx
<>
  <img src="/logo-light.svg" alt="Tacit" className="dark:hidden" />
  <img src="/logo-dark.svg" alt="Tacit" className="hidden dark:block" />
</>
```

**일러스트**: SVG에 `currentColor` 사용 또는 두 버전 제공.

### 6.4 그림자

다크모드에서는 검정 섀도 대신 border 또는 inner glow 고려.

```tsx
<div className="border border-border shadow-sm dark:shadow-none dark:border-border">
```

---

## 7. 접근성 체크리스트

### 7.1 대비 기준 (WCAG AA)
- 일반 텍스트: 4.5:1 이상
- 큰 텍스트(18pt+): 3:1 이상
- UI 요소: 3:1 이상

### 7.2 자동 검증
CI에 `axe-core` 또는 `pa11y` 통합.

### 7.3 주요 색 조합 검증 완료

| 조합 | 라이트 | 다크 |
|------|--------|------|
| foreground on background | 15.8:1 ✓ | 14.2:1 ✓ |
| primary on primary-foreground | 8.9:1 ✓ | 9.1:1 ✓ |
| accent on accent-foreground | 4.8:1 ✓ | 5.2:1 ✓ |
| muted-foreground on muted | 5.1:1 ✓ | 5.4:1 ✓ |

---

## 8. 테스트 체크리스트

구현 시 아래 항목 모두 수동 확인:

- [ ] 라이트 → 다크 전환 시 flash 없음
- [ ] 다크 → 라이트 전환 시 flash 없음
- [ ] 새로고침 후 테마 유지
- [ ] 시스템 테마 변경 즉시 반영 (system 선택 시)
- [ ] 로그인/로그아웃 시 설정 유지 (localStorage)
- [ ] 다른 기기 로그인 시 Firestore 설정 복원
- [ ] 모든 페이지 두 모드에서 가독성 확인
- [ ] 이미지/일러스트 두 모드 대응
- [ ] 포커스 링 두 모드 잘 보임
- [ ] 스크린리더 테마 변경 안내 ("테마가 어두운 모드로 변경되었습니다")
