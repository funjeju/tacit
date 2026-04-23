import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;

    const doc = await adminDb.collection('prompts').doc(promptId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: '찾을 수 없는 주문서예요.' }, { status: 404 });
    }

    const data = doc.data()!;
    if (!data.isPublished) {
      return NextResponse.json({ error: '비공개 주문서예요.' }, { status: 403 });
    }

    // 조회수 증가 (비동기 fire-and-forget)
    adminDb.collection('prompts').doc(promptId).update({
      'stats.views': FieldValue.increment(1),
    }).catch(() => {});

    // 로그인 유저면 좋아요 여부 확인
    let liked = false;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
        const likeDoc = await adminDb.doc(`prompts/${promptId}/likes/${decoded.uid}`).get();
        liked = likeDoc.exists;
      } catch {
        // 인증 실패 시 liked = false 유지
      }
    }

    return NextResponse.json({
      prompt: {
        promptId: data.promptId ?? doc.id,
        type: data.type,
        domainId: data.domainId ?? null,
        finalPrompt: data.finalPrompt ?? '',
        targetTool: data.targetTool ?? '',
        stats: data.stats ?? { views: 0, likes: 0, copies: 0 },
        tags: data.tags ?? [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      },
      liked,
    });
  } catch (error) {
    console.error('[API /square/[promptId]]', error);
    return NextResponse.json({ error: '불러오지 못했어요.' }, { status: 500 });
  }
}
