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

    const domainId = req.nextUrl.searchParams.get('domain');

    let query = adminDb
      .collection('domainProfiles')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(10);

    if (domainId) {
      query = adminDb
        .collection('domainProfiles')
        .where('userId', '==', userId)
        .where('domainId', '==', domainId)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(5) as typeof query;
    }

    const snap = await query.get();
    const profiles = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        profileId: doc.id,
        domainId: d.domainId,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
        experience: d.experience ?? null,
        summary: d.summary ?? d.rawSummary ?? '',
      };
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('[API /me/profiles]', error);
    return NextResponse.json({ error: '프로필을 불러오지 못했어요.' }, { status: 500 });
  }
}
