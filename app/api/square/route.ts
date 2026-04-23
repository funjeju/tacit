import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const type = searchParams.get('type');
    const cursor = searchParams.get('cursor'); // promptId for pagination

    let query = adminDb
      .collection('prompts')
      .where('isPublished', '==', true)
      .orderBy('stats.likes', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (type) {
      query = query.where('type', '==', type) as typeof query;
    }

    if (cursor) {
      const cursorDoc = await adminDb.collection('prompts').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc) as typeof query;
      }
    }

    const snapshot = await query.get();
    const prompts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        promptId: data.promptId,
        type: data.type,
        domainId: data.domainId,
        finalPrompt: (data.finalPrompt ?? '').slice(0, 160) + '...',
        targetTool: data.targetTool,
        stats: data.stats,
        tags: data.tags,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    const nextCursor = prompts.length === limit ? prompts[prompts.length - 1].promptId : null;

    return NextResponse.json({ prompts, nextCursor });
  } catch (error) {
    console.error('[API /square]', error);
    return NextResponse.json({ error: '광장을 불러오지 못했어요.' }, { status: 500 });
  }
}
