import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const PRO_PRICE = 9900; // 원

export async function POST(req: NextRequest) {
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

    // 이미 Pro 플랜인지 확인
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data() ?? {};
    if (
      userData.plan === 'pro' &&
      userData.planExpiresAt?.toDate?.() > new Date()
    ) {
      return NextResponse.json({ error: '이미 Pro 플랜 이용 중이에요.' }, { status: 400 });
    }

    // 주문 생성
    const orderId = `tacit_pro_${userId}_${Date.now()}`;
    await adminDb.collection('orders').doc(orderId).set({
      orderId,
      userId,
      amount: PRO_PRICE,
      status: 'pending',
      plan: 'pro',
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      orderId,
      amount: PRO_PRICE,
      orderName: 'Tacit Pro 1개월',
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '',
    });
  } catch (error) {
    console.error('[API /billing/checkout]', error);
    return NextResponse.json({ error: '결제 준비에 실패했어요.' }, { status: 500 });
  }
}
