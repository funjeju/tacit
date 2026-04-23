'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { signOut } from '@/lib/firebase/auth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  Sparkles,
  BookOpen,
  Users,
  Settings,
  LogOut,
  LogIn,
  Menu,
  X,
  LayoutDashboard,
  UserCircle,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/studio', label: 'AI 주문서', Icon: Sparkles },
  { href: '/library', label: '내 서재', Icon: BookOpen },
  { href: '/square', label: '광장', Icon: Users },
];

export function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    setMobileOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
            Tacit
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent hidden sm:inline">
              Beta
            </span>
          </Link>

          {/* 데스크탑 내비 */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${pathname.startsWith(href)
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* 우측 액션 */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${pathname.startsWith('/dashboard')
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <LayoutDashboard className="size-4" />
                  대시보드
                </Link>
                <Link
                  href="/profile"
                  className={`flex size-9 items-center justify-center rounded-lg transition-colors
                    ${pathname.startsWith('/profile')
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="size-6 rounded-full" />
                  ) : (
                    <UserCircle className="size-4" />
                  )}
                </Link>
                <Link
                  href="/settings"
                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="size-4" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <LogOut className="size-4" />
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/upgrade"
                  className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/20 transition-colors"
                >
                  <Sparkles className="size-4" />
                  Pro
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <LogIn className="size-4" />
                  로그인
                </Link>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="absolute right-0 top-14 w-64 bg-background border-l border-b border-border shadow-lg p-4 space-y-1">
            {NAV_ITEMS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-colors
                  ${pathname.startsWith(href)
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground hover:bg-muted'
                  }`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border mt-2">
              {user ? (
                <>
                  <div className="px-3 py-2 text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-foreground hover:bg-muted"
                  >
                    <Settings className="size-5" />
                    설정
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <LogOut className="size-5" />
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
                >
                  <LogIn className="size-5" />
                  로그인
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
