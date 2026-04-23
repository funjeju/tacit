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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const q = searchParams.get('q')?.toLowerCase().trim() ?? '';
    // 검색 시 더 많이 가져와서 Node.js에서 필터링
    const fetchLimit = q ? 50 : parseInt(searchParams.get('limit') ?? '20');

    let query = adminDb
      .collection('prompts')
      .where('ownerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(fetchLimit);

    if (type && !q) {
      query = adminDb
        .collection('prompts')
        .where('ownerId', '==', userId)
        .where('type', '==', type)
        .orderBy('createdAt', 'desc')
        .limit(fetchLimit) as typeof query;
    }

    const snapshot = await query.get();
    let prompts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        promptId: data.promptId ?? doc.id,
        type: data.type,
        domainId: data.domainId,
        finalPrompt: (data.finalPrompt ?? '').slice(0, 120) + ((data.finalPrompt?.length ?? 0) > 120 ? '...' : ''),
        targetTool: data.targetTool,
        isPublished: data.isPublished,
        stats: data.stats,
        tags: data.tags ?? [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    // 검색어 필터링 (finalPrompt + tags 대상)
    if (q) {
      prompts = prompts.filter(
        (p) =>
          p.finalPrompt.toLowerCase().includes(q) ||
          (p.tags ?? []).some((t: string) => t.toLowerCase().includes(q))
      );
      if (type) prompts = prompts.filter((p) => p.type === type);
    }

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('[API /prompts]', error);
    return NextResponse.json({ error: '목록을 불러오지 못했어요.' }, { status: 500 });
  }
}
