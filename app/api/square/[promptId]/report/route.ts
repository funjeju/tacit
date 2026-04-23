import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const REPORT_REASONS = ['spam', 'inappropriate', 'copyright', 'misinformation', 'other'] as const;
type ReportReason = typeof REPORT_REASONS[number];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
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

    const { promptId } = await params;
    const { reason, detail } = (await req.json()) as { reason: ReportReason; detail?: string };

    if (!REPORT_REASONS.includes(reason)) {
      return NextResponse.json({ error: '신고 사유를 선택해주세요.' }, { status: 400 });
    }

    // 이미 신고했는지 확인 (중복 방지)
    const existingReport = await adminDb
      .collection('prompts')
      .doc(promptId)
      .collection('reports')
      .doc(userId)
      .get();

    if (existingReport.exists) {
      return NextResponse.json({ error: '이미 신고한 주문서예요.' }, { status: 409 });
    }

    // 신고 저장
    await adminDb
      .collection('prompts')
      .doc(promptId)
      .collection('reports')
      .doc(userId)
      .set({
        reporterId: userId,
        reason,
        detail: detail?.slice(0, 200) ?? '',
        createdAt: FieldValue.serverTimestamp(),
        status: 'pending',
      });

    // 신고 수 증가
    await adminDb.collection('prompts').doc(promptId).update({
      'stats.reports': FieldValue.increment(1),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API /square/[promptId]/report]', error);
    return NextResponse.json({ error: '신고에 실패했어요.' }, { status: 500 });
  }
}
