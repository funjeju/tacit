'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { signOut } from '@/lib/firebase/auth';
import {
  User,
  Palette,
  Bell,
  Shield,
  LogOut,
  Loader2,
  Check,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'normal' | 'large';

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: '라이트', icon: Sun },
  { value: 'dark', label: '다크', icon: Moon },
  { value: 'system', label: '시스템', icon: Monitor },
];

const FONT_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'small', label: '작게' },
  { value: 'normal', label: '보통' },
  { value: 'large', label: '크게' },
];

export default function SettingsPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  const [theme, setTheme] = useState<Theme>('system');
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?redirect=/settings');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    // Load current settings from localStorage as initial state
    const storedTheme = (localStorage.getItem('tacit-theme') as Theme) ?? 'system';
    setTheme(storedTheme);
  }, [user]);

  async function saveSettings() {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, fontSize }),
      });

      // Apply theme immediately
      localStorage.setItem('tacit-theme', theme);
      const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);
      document.documentElement.style.colorScheme = resolved;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
      router.push('/');
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">설정</h1>

      <div className="space-y-6">
        {/* 프로필 */}
        <Section icon={<User className="size-4" />} title="프로필">
          <div className="flex items-center gap-4 p-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt="프로필" className="size-14 rounded-full" />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full bg-muted text-xl font-bold text-foreground">
                {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{user.displayName ?? '이름 없음'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                무료 플랜
              </span>
            </div>
          </div>
        </Section>

        {/* 테마 */}
        <Section icon={<Palette className="size-4" />} title="화면 설정">
          <div className="p-4 space-y-5">
            {/* 테마 선택 */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">테마</p>
              <div className="flex gap-2">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors
                      ${theme === value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 글자 크기 */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">글자 크기</p>
              <div className="flex gap-2">
                {FONT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFontSize(value)}
                    className={`flex flex-1 items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors
                      ${fontSize === value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : saved ? (
                <Check className="size-4" />
              ) : null}
              {saved ? '저장됨' : saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </Section>

        {/* 알림 (추후 구현) */}
        <Section icon={<Bell className="size-4" />} title="알림">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-foreground">이메일 알림</p>
              <p className="text-xs text-muted-foreground mt-0.5">새로운 기능 및 업데이트 안내</p>
            </div>
            <span className="text-xs text-muted-foreground">준비 중</span>
          </div>
        </Section>

        {/* 계정 */}
        <Section icon={<Shield className="size-4" />} title="계정">
          <div className="divide-y divide-border">
            <SettingsRow
              label="구독 관리 / Pro 업그레이드"
              href="/settings/billing"
            />
            <SettingsRow
              label="이용약관"
              href="#"
            />
            <SettingsRow
              label="개인정보처리방침"
              href="#"
            />
            <div className="px-4 py-3">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 text-sm font-medium text-destructive hover:opacity-80 transition-opacity"
              >
                {loggingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                로그아웃
              </button>
            </div>
          </div>
        </Section>

        <p className="text-center text-xs text-muted-foreground pt-2">Tacit v0.1.0</p>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SettingsRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
    >
      <span className="text-sm text-foreground">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </a>
  );
}
