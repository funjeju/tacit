import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

const ADMIN_UIDS = (process.env.ADMIN_UIDS ?? '').split(',').filter(Boolean);

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

    if (ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(userId)) {
      return NextResponse.json({ error: '권한이 없어요.' }, { status: 403 });
    }

    const [usersSnap, promptsSnap, interviewsSnap, profilesSnap] = await Promise.all([
      adminDb.collection('users').count().get(),
      adminDb.collection('prompts').count().get(),
      adminDb.collection('interviews').count().get(),
      adminDb.collection('domainProfiles').count().get(),
    ]);

    const publishedSnap = await adminDb
      .collection('prompts')
      .where('isPublished', '==', true)
      .count()
      .get();

    const completedInterviewsSnap = await adminDb
      .collection('interviews')
      .where('status', '==', 'completed')
      .count()
      .get();

    // 최근 프롬프트 10개
    const recentPromptsSnap = await adminDb
      .collection('prompts')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentPrompts = recentPromptsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        promptId: doc.id,
        ownerId: d.ownerId,
        type: d.type ?? d.outputType,
        domainId: d.domainId ?? null,
        isPublished: d.isPublished ?? false,
        stats: d.stats ?? {},
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({
      stats: {
        totalUsers: usersSnap.data().count,
        totalPrompts: promptsSnap.data().count,
        publishedPrompts: publishedSnap.data().count,
        totalInterviews: interviewsSnap.data().count,
        completedInterviews: completedInterviewsSnap.data().count,
        totalProfiles: profilesSnap.data().count,
      },
      recentPrompts,
    });
  } catch (error) {
    console.error('[API /admin/stats]', error);
    return NextResponse.json({ error: '통계를 불러오지 못했어요.' }, { status: 500 });
  }
}
