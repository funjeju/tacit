import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAnthropicClient, MODELS } from '@/lib/anthropic/client';
import { buildInterviewerPrompt, buildProfileGenerationTask } from '@/lib/anthropic/prompts/interview';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
      userId = decoded.uid;
    } catch {
      return NextResponse.json({ error: '인증에 실패했어요.' }, { status: 401 });
    }

    const { sessionId } = await req.json() as { sessionId: string };
    if (!sessionId) {
      return NextResponse.json({ error: '세션 ID가 필요해요.' }, { status: 400 });
    }

    const sessionRef = adminDb.collection('interviews').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists || sessionDoc.data()!.userId !== userId) {
      return NextResponse.json({ error: '세션을 찾을 수 없어요.' }, { status: 404 });
    }

    const session = sessionDoc.data()!;
    const qaHistory: Array<{ question: string; answer: string }> = (
      session.qaHistory ?? []
    ).filter((qa: { answer: string }) => qa.answer?.trim());
    const domainId: string = session.domainId;

    if (qaHistory.length < 3) {
      return NextResponse.json({ error: '인터뷰 답변이 너무 적어요. 최소 3개는 필요해요.' }, { status: 400 });
    }

    // Claude Sonnet으로 DomainProfile 생성
    const client = getAnthropicClient();
    const task = buildProfileGenerationTask({ domain: domainId, qaHistory });

    const message = await client.messages.create({
      model: MODELS.sonnet,
      max_tokens: 2000,
      system: [
        {
          type: 'text',
          text: buildInterviewerPrompt(domainId),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: task }],
    });

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // JSON 파싱
    const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) ?? rawText.match(/\{[\s\S]*\}/);
    let profileData: Record<string, unknown>;
    try {
      profileData = JSON.parse(jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : rawText);
    } catch {
      return NextResponse.json({ error: '프로필 생성에 실패했어요. 다시 시도해 주세요.' }, { status: 500 });
    }

    // DomainProfile 저장
    const profileRef = adminDb.collection('domainProfiles').doc();
    const profileDoc = {
      profileId: profileRef.id,
      userId,
      domainId,
      sourceInterviewId: sessionId,
      isActive: true,
      usageCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...profileData,
    };
    await profileRef.set(profileDoc);

    // 인터뷰 세션 완료 처리
    await sessionRef.update({
      status: 'completed',
      generatedProfileId: profileRef.id,
      questionsAnswered: qaHistory.length,
      completedAt: FieldValue.serverTimestamp(),
      lastActivityAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      profileId: profileRef.id,
      profile: profileData,
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'interview/complete' } });
    console.error('[API /interview/complete]', error);
    return NextResponse.json({ error: '프로필 생성에 실패했어요.' }, { status: 500 });
  }
}
