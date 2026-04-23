import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry 프로젝트 연결 (소스맵 업로드용)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 소스맵은 빌드 후 자동 삭제 (번들에 포함 안 됨)
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // 빌드 중 Sentry CLI 출력 숨기기
  silent: !process.env.CI,

  // 자동 인스트루멘테이션 (Turbopack 호환)
  webpack: {
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: true,
  },
});
