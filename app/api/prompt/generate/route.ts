import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { anthropic, MODELS } from '@/lib/anthropic/client';
import { LAYER_A_IDENTITY, buildLayerB, buildAssemblerTask } from '@/lib/anthropic/prompts/system';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { checkRateLimit } from '@/lib/rateLimit';
import type { OutputType, DomainProfile } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { outputType, qaHistory, domainId, profileId } = body as {
      outputType: OutputType;
      qaHistory: Array<{ question: string; answer: string }>;
      domainId?: string;
      profileId?: string;
    };

    if (!outputType || !qaHistory?.length) {
      return NextResponse.json({ error: '필수 정보가 부족해요.' }, { status: 400 });
    }

    // Rate limit 체크 (로그인 사용자만)
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
        const rl = await checkRateLimit(decoded.uid);
        if (!rl.allowed) {
          return NextResponse.json(
            {
              error: rl.isPro
                ? `이번 달 Pro 플랜 생성 횟수(${rl.limit}회)를 모두 사용했어요. 다음 달에 초기화됩니다.`
                : `이번 달 무료 생성 횟수(${rl.limit}회)를 모두 사용했어요. Pro 플랜으로 업그레이드하면 월 100회 사용할 수 있어요.`,
              rateLimited: true,
              limit: rl.limit,
              current: rl.current,
            },
            { status: 429 }
          );
        }
      } catch {
        // 토큰 오류 시 rate limit 무시 (비회원처럼 처리)
      }
    }

    // DomainProfile 조회 (선택적 — 로그인 + profileId 제공 시)
    let profile: DomainProfile | null = null;
    if (profileId) {
      try {
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
          const profileDoc = await adminDb.collection('domainProfiles').doc(profileId).get();
          if (profileDoc.exists && profileDoc.data()!.userId === decoded.uid) {
            profile = profileDoc.data() as DomainProfile;
          }
        }
      } catch {
        // 프로필 없어도 생성 계속
      }
    }

    const layerB = buildLayerB({ outputType, domain: domainId, profile });
    const layerC = buildAssemblerTask({ outputType, qaHistory, profile });

    const response = await anthropic.messages.create({
      model: MODELS.sonnet,
      max_tokens: 2048,
      system: [
        { type: 'text', text: LAYER_A_IDENTITY, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: layerB, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: layerC }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // JSON 파싱
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ result });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'prompt/generate' } });
    console.error('[API /prompt/generate]', error);
    return NextResponse.json(
      { error: '주문서 생성 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
