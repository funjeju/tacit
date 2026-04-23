import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;

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

    const likeRef = adminDb.doc(`prompts/${promptId}/likes/${userId}`);
    const likeDoc = await likeRef.get();
    const promptRef = adminDb.collection('prompts').doc(promptId);

    if (likeDoc.exists) {
      // 좋아요 취소
      await likeRef.delete();
      await promptRef.update({ 'stats.likes': FieldValue.increment(-1) });
      return NextResponse.json({ liked: false });
    } else {
      // 좋아요
      await likeRef.set({ userId, createdAt: FieldValue.serverTimestamp() });
      await promptRef.update({ 'stats.likes': FieldValue.increment(1) });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('[API /square/[promptId]/like]', error);
    return NextResponse.json({ error: '처리에 실패했어요.' }, { status: 500 });
  }
}
