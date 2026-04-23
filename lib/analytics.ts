'use client';

import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';

let _analytics: Analytics | null = null;

async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (_analytics) return _analytics;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    const { default: app } = await import('@/lib/firebase/client');
    if (!app) return null;
    _analytics = getAnalytics(app);
    return _analytics;
  } catch {
    return null;
  }
}

// ── Event definitions ──────────────────────────────────────────────────────────

export async function trackPromptGenerated(params: {
  type: string;
  domainId?: string;
  hasProfile: boolean;
}) {
  const a = await getAnalyticsInstance();
  if (!a) return;
  logEvent(a, 'prompt_generated', {
    output_type: params.type,
    domain_id: params.domainId ?? 'none',
    has_profile: params.hasProfile,
  });
}

export async function trackPromptPublished(params: { promptId: string; type: string }) {
  const a = await getAnalyticsInstance();
  if (!a) return;
  logEvent(a, 'prompt_published', { prompt_id: params.promptId, output_type: params.type });
}

export async function trackPromptCopied(params: { promptId: string; source: 'library' | 'square' }) {
  const a = await getAnalyticsInstance();
  if (!a) return;
  logEvent(a, 'prompt_copied', { prompt_id: params.promptId, source: params.source });
}

export async function trackPromptForked(params: { promptId: string }) {
  const a = await getAnalyticsInstance();
  if (!a) return;
  logEvent(a, 'prompt_forked', { prompt_id: params.promptId });
}

export async function trackInterviewStarted(params: { domainId: string }) {
  const a = await getAnalyticsInstance();
  if (!a) return;
  logEvent(a, 'interview_started', { domain_id: params.domainId });
}

export async function trackInterviewCompleted(params: {
  domainId: string;
  questionsAnswered: number;
}) {
  const a = await getAnalyticsInstance();
  if (!a) return;
  logEvent(a, 'interview_completed', {
    domain_id: params.domainId,
    questions_answered: params.questionsAnswered,
  });
}

export async function trackProfileCreated(params: { domainId: string }) {
  const a = await getAnalyticsInstance();
  if (!a) return;
  logEvent(a, 'profile_created', { domain_id: params.domainId });
}

export async function trackPageView(pageName: string) {
  const a = await getAnalyticsInstance();
  if (!a) return;
  logEvent(a, 'page_view', { page_title: pageName });
}
