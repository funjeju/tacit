# FIGMA_MCP_GUIDE.md — Figma MCP 연동 가이드

Claude Code가 Figma MCP(Model Context Protocol)를 통해 디자인 → 코드 변환을 자동화하는 절차입니다.

---

## 왜 Figma MCP인가

1. **디자인 토큰 싱크** — Figma Variables → Tailwind config → CSS 변수까지 단일 출처
2. **컴포넌트 1:1 매핑** — Figma 컴포넌트 = shadcn/ui 컴포넌트 = 실제 React 컴포넌트
3. **반복 수정 비용 0** — 디자인 변경 시 Claude Code가 자동으로 코드 업데이트
4. **4-50대 UX 규칙 엄수** — 폰트/간격/터치영역 기준을 Figma에 고정해 이탈 방지

---

## 사전 준비

### 1. Figma 계정 & 파일
- Figma 팀 워크스페이스 (무료 Starter 가능, Variables 쓰려면 Professional 권장)
- Tacit 디자인 파일 (URL을 Claude Code가 접근 가능해야 함)
- 파일 권한: "Anyone with the link can view" 이상

### 2. Figma MCP Server 설치

Claude Code의 `claude_desktop_config.json` 또는 프로젝트 `.mcp.json`에 추가:

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--figma-api-key=FIGMA_ACCESS_TOKEN"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_..."
      }
    }
  }
}
```

### 3. Figma Personal Access Token 발급
1. Figma → Settings → Account → Personal access tokens
2. "Generate new token" 클릭, 이름: `tacit-claude-code`
3. 스코프: `file_read`, `library_content:read`, `library_assets:read`
4. 토큰을 `.env.local`에 저장 (커밋 금지)

---

## Figma 파일 구조 (강제)

Tacit의 Figma 파일은 반드시 다음 구조를 따릅니다. Claude Code가 MCP로 정확히 파싱하기 위함입니다.

```
Tacit Design File
├── 📄 00 - Cover
├── 📄 01 - Design Tokens         ← Variables 정의
│   ├── Colors (Primary, Accent, Secondary, Neutral, Semantic)
│   ├── Typography (Font sizes xs~6xl, weights, line-heights)
│   ├── Spacing (0.5~32)
│   ├── Radius (none, sm, md, lg, xl, full)
│   └── Shadows (sm, md, lg, xl)
├── 📄 02 - Components
│   ├── Buttons (Primary, Secondary, Ghost, Destructive × size 4)
│   ├── Inputs (Text, Textarea, Select, Checkbox, Switch)
│   ├── Cards (Type, Domain, Question, Square, Library)
│   ├── Overlays (Dialog, Sheet, Toast, Tooltip)
│   └── Navigation (Header, Sidebar, MobileNav)
├── 📄 03 - Flows
│   ├── Onboarding
│   ├── Create Prompt
│   ├── Tacit Interview
│   └── Square
├── 📄 04 - Screens — Light
│   └── 모든 화면의 라이트 모드 버전
├── 📄 05 - Screens — Dark
│   └── 모든 화면의 다크 모드 버전
└── 📄 06 - Prototype Links
```

### 네이밍 규칙 (Claude Code가 파싱)

- **프레임**: `Screen/Create/InterviewStep-3`
- **컴포넌트**: `Button/Primary/Size-lg`
- **Variant 속성**: `intent=primary, size=lg, state=default`
- **Variables**: `color/primary/500`, `typography/size/base`

---

## 워크플로우 1. 디자인 토큰 싱크

### 목적
Figma Variables에 정의된 토큰을 `tailwind.config.ts`와 `globals.css`에 자동 반영.

### 절차

**Step 1. Figma에 Variables 정의**

Figma `01 - Design Tokens` 페이지에서 Variables 패널을 열고 다음 구조로 정의:

```
color/
├── primary/50 → #f5f7fa
├── primary/100 → #e4ebf2
├── ...
├── primary/900 → #1a2332
├── accent/500 → #D99611
├── moss/500 → #5A8F47
└── ...

typography/
├── size/xs → 12px
├── size/sm → 14px
├── size/base → 16px   ← 본문 최소
├── size/lg → 18px
├── size/xl → 20px
└── ...

spacing/
├── 0.5 → 2px
├── 1 → 4px
├── 2 → 8px
└── ...
```

**Step 2. Claude Code에서 추출**

```bash
# Claude Code 프롬프트 예시
"Figma MCP로 파일 FIGMA_FILE_KEY의 Design Tokens 페이지를 읽어서,
tailwind.config.ts와 app/globals.css를 업데이트해줘.
라이트/다크 모드 CSS 변수는 DESIGN_SYSTEM.md의 규칙을 따라."
```

**Step 3. Claude Code가 실행하는 작업**

1. `mcp__figma__get_file_variables(fileKey)` 호출
2. JSON 응답 파싱 → 토큰 구조로 변환
3. `tailwind.config.ts`의 `theme.extend.colors`, `fontSize`, `spacing` 업데이트
4. `app/globals.css`의 `:root`, `.dark` CSS 변수 업데이트
5. 변경 사항 diff 표시 → 사용자 승인 후 커밋

---

## 워크플로우 2. 컴포넌트 → 코드 변환

### 목적
Figma에서 디자인된 컴포넌트를 React/TypeScript/Tailwind 코드로 변환.

### 절차

**Step 1. Figma 컴포넌트 준비**
- `02 - Components` 페이지에서 Main Component로 정의
- Variant 속성을 명시 (intent, size, state 등)
- Auto Layout 필수 (고정 위치 금지)

**Step 2. Claude Code 명령**

```
"Figma 컴포넌트 node-id=1234:5678을 읽어서
src/components/ui/button.tsx에 shadcn/ui 스타일로 구현해줘.
CVA(class-variance-authority)를 사용하고,
모든 variant를 TypeScript Props로 노출해."
```

**Step 3. Claude Code 작업 순서**

1. `mcp__figma__get_node(fileKey, nodeId)` 호출
2. 응답에서 다음 추출:
   - 컴포넌트 이름 + variant 속성
   - Layout 정보 (padding, gap, direction)
   - 사용된 토큰 (color, typography, radius, shadow)
3. 토큰 → Tailwind 클래스 매핑
4. CVA 기반 컴포넌트 생성:

```tsx
// 생성 예시
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      intent: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600',
        secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        ghost: 'bg-transparent hover:bg-neutral-100',
        destructive: 'bg-semantic-error text-white hover:bg-semantic-error/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        xl: 'h-14 px-8 text-xl',  // 4-50대용 초대형
      },
    },
  }
);
```

5. 생성된 코드 → 프로젝트에 저장 → 타입체크 실행

---

## 워크플로우 3. 화면(Screen) → 페이지 변환

### 목적
Figma 프레임을 Next.js 페이지로 변환.

### 절차

**Step 1. Figma 프레임 지정**
- `04 - Screens — Light` 에서 변환할 프레임 선택 (예: `Screen/Create/InterviewStep`)
- 대응되는 다크 모드 버전이 `05 - Screens — Dark`에 있어야 함

**Step 2. Claude Code 명령**

```
"Figma 프레임 node-id=5678:9012을
app/create/[type]/interview/page.tsx로 구현해줘.
다음 조건 준수:
- 이미 존재하는 컴포넌트(Button, Input, QuestionCard 등)를 최대한 재사용
- 모바일/데스크탑 반응형
- 다크/라이트 모드 모두 대응
- USER_FLOWS.md의 Flow 1 [4]번 단계 로직과 연동
- 서버 컴포넌트로 시작하되, 인터랙션 필요한 부분만 'use client' 분리"
```

**Step 3. Claude Code 작업 순서**

1. `mcp__figma__get_node` 로 라이트 버전 구조 파악
2. `mcp__figma__get_node` 로 다크 버전과 대조, 색상 차이 확인
3. 프레임 내 서브 노드들을 기존 컴포넌트와 매칭:
   - "Button/Primary/Size-lg" → `<Button intent="primary" size="lg">`
   - "Input/Textarea" → `<Textarea />`
4. Layout 재구성 (Grid/Flex 활용)
5. 이미지/아이콘: Figma export → `/public` 또는 Lucide 아이콘 매칭
6. 페이지 코드 작성

---

## 워크플로우 4. 디자인 변경 감지 & 동기화

### 목적
디자이너가 Figma를 수정했을 때 Claude Code가 변경 사항만 반영.

### 절차

**Step 1. 주간 싱크 명령**

```
"Figma 파일 FILE_KEY의 최근 7일 변경 사항을 확인해서,
코드와 불일치하는 부분을 리포트해줘.
자동 수정하지 말고, 변경 목록만 먼저 보여줘."
```

**Step 2. Claude Code 작업**

1. `mcp__figma__get_file_versions(fileKey)` 로 히스토리 조회
2. 최신 version과 마지막 싱크 시점의 version 비교
3. 변경된 노드 ID 목록 추출
4. 각 노드에 대해:
   - 타입이 Variable이면 → `tailwind.config.ts` 영향
   - 타입이 Component면 → 해당 React 컴포넌트 영향
   - 타입이 Frame이면 → 해당 페이지 영향
5. 마크다운 리포트 생성:

```markdown
## Figma 변경 감지 (2026-05-01 기준)

### 디자인 토큰 변경 (3건)
- color/primary/500: #475669 → #3F4D5F (Button, Card 영향)
- typography/size/base: 16px → 17px (전역 영향, 신중 검토 필요)
- spacing/2: 8px → 10px (레이아웃 전반 영향)

### 컴포넌트 변경 (1건)
- Button/Primary/Size-lg: padding 수정 (px-4 → px-5)

### 화면 변경 (2건)
- Screen/Create/InterviewStep-3: QuestionCard 위치 변경
- Screen/Library: Empty State 추가
```

**Step 3. 사용자 승인 후 개별 반영**

```
"디자인 토큰 변경 3건만 먼저 반영해줘. 화면 변경은 일단 보류."
```

---

## 워크플로우 5. 다크/라이트 모드 페어 검증

### 목적
모든 화면의 라이트/다크 버전이 일치하는지 확인.

### Claude Code 명령

```
"Figma의 '04 - Screens — Light'와 '05 - Screens — Dark' 페이지의 프레임을
이름 기준으로 매칭해서, 다음을 확인해줘:
1. 페어가 없는 프레임 (한쪽에만 존재)
2. 구조가 다른 페어 (노드 개수 불일치)
3. 대비 비율이 WCAG AA 미달인 조합

리포트만 마크다운으로 만들어줘."
```

---

## 자주 쓰는 Claude Code 프롬프트 템플릿

### 템플릿 A. 신규 페이지 생성
```
"Figma node-id=<ID>를 /app/<route>/page.tsx로 구현해줘.
- USER_FLOWS.md의 <Flow>와 연동
- 기존 컴포넌트 재사용 우선
- 모바일/데스크탑/다크/라이트 모두 대응
- 서버 컴포넌트 기본, 필요한 부분만 'use client'
- 타입 안전성 100% (any 금지)"
```

### 템플릿 B. 컴포넌트 추가
```
"Figma 컴포넌트 <이름> (node-id=<ID>)을
src/components/<path>.tsx에 CVA 기반으로 구현해줘.
Storybook 파일도 함께 생성하고,
UI_COMPONENTS.md에 문서화 항목 추가해줘."
```

### 템플릿 C. 토큰 싱크
```
"Figma Design Tokens 페이지를 기준으로
tailwind.config.ts와 app/globals.css를 동기화해줘.
변경 사항은 diff로 보여주고, 커밋은 내 승인 후."
```

### 템플릿 D. 디자인 검증
```
"현재 구현된 <컴포넌트/페이지>가 Figma 디자인(node-id=<ID>)과
얼마나 일치하는지 검증해줘.
픽셀 단위 비교는 필요 없고, 구조·색상·간격·타이포그래피 기준으로."
```

---

## 주의사항

### 해야 할 것
- Figma 파일은 항상 Auto Layout 사용
- Variables 사용 철저 (하드코딩 컬러 금지)
- 컴포넌트 Variant는 명확한 속성으로 (boolean/string enum)
- 프레임/컴포넌트 네이밍 규칙 엄수

### 하지 말아야 할 것
- Figma에서 직접 그려진 아이콘 → Lucide로 대체
- 이미지 placeholder 그대로 export → 실제 이미지 필요
- Figma의 애니메이션 Prototype → 코드에선 Framer Motion으로 재구현
- 한 프레임에 여러 상태 혼재 (default/hover/active는 Variant로 분리)

---

## 트러블슈팅

### MCP 서버 연결 안 됨
```bash
# 확인
npx figma-developer-mcp --figma-api-key=$FIGMA_ACCESS_TOKEN --help

# 로그 확인
tail -f ~/.claude/logs/mcp-figma.log
```

### 토큰 파싱 오류
- Figma Variables 이름에 `/` 외의 특수문자 금지
- Variables를 Collection으로 정리 (Color, Typography, Spacing 분리)

### 컴포넌트 Variant 누락
- Figma에서 반드시 "Combine as Variants" 실행
- 속성 이름 영문 소문자 권장 (`intent`, `size`)

---

## 참고 자료

- Figma MCP 공식: `https://github.com/figma/mcp-server` (MVP 시점에 존재)
- shadcn/ui 컴포넌트 규칙: `https://ui.shadcn.com/docs`
- 디자인 시스템 전체: `DESIGN_SYSTEM.md`
- 다크/라이트 규칙: `DARK_LIGHT_MODE.md`
