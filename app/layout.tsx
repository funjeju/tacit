import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: {
    default: 'Tacit — AI 인터뷰어',
    template: '%s | Tacit',
  },
  description: '당신의 30년 경험을 AI가 끌어내 자산화해 드립니다. 프롬프트를 몰라도 전문가 수준 결과물.',
  keywords: ['AI', '프롬프트', '암묵지', '도메인 전문가', 'AI 도구'],
  authors: [{ name: 'Tacit Team' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Tacit — AI 인터뷰어',
    description: '당신의 30년 경험을 AI가 끌어내 자산화해 드립니다.',
    locale: 'ko_KR',
    type: 'website',
    url: 'https://tacit.kr',
    siteName: 'Tacit',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tacit — AI 인터뷰어',
    description: '당신의 30년 경험을 AI가 끌어내 자산화해 드립니다.',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://tacit.kr'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* FOUC 방지 — React 하이드레이션 전에 실행 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tacit-theme')||'system';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.classList.add(r);document.documentElement.style.colorScheme=r;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
