import { NextRequest, NextResponse } from 'next/server';

// 로그인 없이 접근 가능한 공개 경로
const PUBLIC_PATHS = ['/', '/auth/login', '/studio', '/square'];

// 로그인 필요 경로 prefix
const PROTECTED_PREFIXES = ['/library', '/interview', '/profile', '/settings', '/admin'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API, 정적 파일은 통과
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // 보호된 경로 확인
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // 세션 쿠키 확인 (Firebase Auth는 클라이언트 사이드 — 미들웨어에서는 쿠키 기반 간단 체크)
  const sessionCookie = request.cookies.get('tacit-session');
  if (!sessionCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
