import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground tracking-tight">Tacit</span>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Beta</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/studio" className="hover:text-foreground transition-colors">AI 주문서 만들기</Link>
            <Link href="/square" className="hover:text-foreground transition-colors">광장</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">요금</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              로그인
            </Link>
            <Link href="/studio" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors">
              무료로 시작
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">© 2026 Tacit. 사내 프로젝트. 외부 배포 금지.</div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">이용약관</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
