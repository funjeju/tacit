import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const ADMIN_UIDS = (process.env.ADMIN_UIDS ?? '').split(',').filter(Boolean);

async function getAdminUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    if (ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(decoded.uid)) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

// 신고된 프롬프트 목록
export async function GET(req: NextRequest) {
  const uid = await getAdminUser(req);
  if (!uid) return NextResponse.json({ error: '권한이 없어요.' }, { status: 403 });

  const snap = await adminDb
    .collection('prompts')
    .where('stats.reports', '>', 0)
    .orderBy('stats.reports', 'desc')
    .limit(20)
    .get();

  const items = await Promise.all(
    snap.docs.map(async (doc) => {
      const d = doc.data();
      // 최신 신고 3건
      const reportsSnap = await doc.ref
        .collection('reports')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get();
      const reports = reportsSnap.docs.map((r) => ({
        reason: r.data().reason,
        createdAt: r.data().createdAt?.toDate?.()?.toISOString() ?? null,
      }));
      return {
        promptId: doc.id,
        finalPrompt: (d.finalPrompt ?? '').slice(0, 100),
        type: d.type,
        ownerId: d.ownerId,
        isPublished: d.isPublished,
        reportCount: d.stats?.reports ?? 0,
        reports,
      };
    })
  );

  return NextResponse.json({ items });
}

// 신고 처리 (unpublish 또는 dismiss)
export async function POST(req: NextRequest) {
  const uid = await getAdminUser(req);
  if (!uid) return NextResponse.json({ error: '권한이 없어요.' }, { status: 403 });

  const { promptId, action } = (await req.json()) as {
    promptId: string;
    action: 'unpublish' | 'dismiss';
  };

  if (!promptId || !['unpublish', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 });
  }

  const ref = adminDb.collection('prompts').doc(promptId);

  if (action === 'unpublish') {
    await ref.update({ isPublished: false, updatedAt: FieldValue.serverTimestamp() });
  }

  // 모든 pending 신고를 resolved로 마킹
  const reportsSnap = await ref.collection('reports').where('status', '==', 'pending').get();
  const batch = adminDb.batch();
  reportsSnap.docs.forEach((r) => {
    batch.update(r.ref, { status: action === 'unpublish' ? 'accepted' : 'dismissed' });
  });
  await batch.commit();

  // 신고 카운트 리셋
  await ref.update({ 'stats.reports': 0 });

  return NextResponse.json({ ok: true });
}
