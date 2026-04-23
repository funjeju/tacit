import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
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

    const snap = await adminDb
      .collection('interviews')
      .where('userId', '==', userId)
      .where('status', '==', 'in_progress')
      .orderBy('lastActivityAt', 'desc')
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ session: null });
    }

    const doc = snap.docs[0];
    const d = doc.data();
    return NextResponse.json({
      session: {
        sessionId: doc.id,
        domainId: d.domainId,
        questionsAnswered: d.questionsAnswered ?? 0,
        targetQuestionCount: d.targetQuestionCount ?? 20,
        lastActivityAt: d.lastActivityAt?.toDate?.()?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('[API /interview/resume]', error);
    return NextResponse.json({ error: '이어하기 정보를 불러오지 못했어요.' }, { status: 500 });
  }
}
