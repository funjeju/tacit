import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getOpeningQuestion } from '@/lib/anthropic/prompts/interview';

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

    const body = await req.json();
    const { domainId, targetQuestionCount = 20 } = body as {
      domainId: string;
      targetQuestionCount?: number;
    };

    if (!domainId) {
      return NextResponse.json({ error: '도메인을 선택해주세요.' }, { status: 400 });
    }

    const openingQuestion = getOpeningQuestion(domainId);

    const ref = adminDb.collection('interviews').doc();
    await ref.set({
      interviewId: ref.id,
      userId,
      domainId,
      status: 'in_progress',
      questionsAsked: 1,
      questionsAnswered: 0,
      targetQuestionCount,
      inputMode: 'text',
      qaHistory: [{ question: openingQuestion, answer: '' }],
      generatedProfileId: null,
      startedAt: FieldValue.serverTimestamp(),
      lastActivityAt: FieldValue.serverTimestamp(),
      completedAt: null,
    });

    return NextResponse.json({
      sessionId: ref.id,
      openingQuestion,
    });
  } catch (error) {
    console.error('[API /interview/start]', error);
    return NextResponse.json({ error: '인터뷰를 시작하지 못했어요.' }, { status: 500 });
  }
}
