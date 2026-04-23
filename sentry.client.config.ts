import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // 프로덕션에서만 오류 전송, 개발 중엔 콘솔 출력으로 충분
  enabled: process.env.NODE_ENV === 'production',

  // 성능 트레이싱 — 10% 샘플링 (비용 절약)
  tracesSampleRate: 0.1,

  // 세션 리플레이 — 에러 발생 시 직전 10% 캡처
  replaysOnErrorSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],
});
