import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { OutputType } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 인증 필수
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
    const { sessionId, finalPrompt, qaHistory, outputType, targetTool, domainId } = body as {
      sessionId?: string;
      finalPrompt: string;
      qaHistory: Array<{ question: string; answer: string }>;
      outputType: OutputType;
      targetTool: string;
      domainId?: string;
    };

    if (!finalPrompt) {
      return NextResponse.json({ error: '저장할 주문서가 없어요.' }, { status: 400 });
    }

    const answers = qaHistory.map((qa, i) => ({
      questionId: `q${i + 1}`,
      questionText: qa.question,
      answer: qa.answer,
    }));

    // 기존 세션 업데이트 or 신규 생성
    const ref = sessionId
      ? adminDb.collection('prompts').doc(sessionId)
      : adminDb.collection('prompts').doc();

    await ref.set(
      {
        promptId: ref.id,
        ownerId: userId,
        type: outputType,
        domainId: domainId ?? null,
        userInputs: { initialKeyword: qaHistory[0]?.answer ?? '', answers },
        finalPrompt,
        targetTool,
        isPublished: false,
        stats: { views: 0, copies: 0, likes: 0, uses: 0 },
        tags: [],
        currentVersion: 1,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 사용량 카운터 증가
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usageRef = adminDb.doc(`users/${userId}/usage/${yearMonth}`);
    await usageRef.set(
      {
        yearMonth,
        userId,
        promptGenerations: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ promptId: ref.id });
  } catch (error) {
    console.error('[API /prompt/save]', error);
    return NextResponse.json({ error: '저장에 실패했어요.' }, { status: 500 });
  }
}
