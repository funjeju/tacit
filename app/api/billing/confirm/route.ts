import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

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

    const { paymentKey, orderId, amount } = (await req.json()) as {
      paymentKey: string;
      orderId: string;
      amount: number;
    };

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: '결제 정보가 올바르지 않아요.' }, { status: 400 });
    }

    // 주문 검증
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json({ error: '주문을 찾을 수 없어요.' }, { status: 404 });
    }
    const order = orderDoc.data()!;
    if (order.userId !== userId || order.amount !== amount || order.status !== 'pending') {
      return NextResponse.json({ error: '주문 정보가 일치하지 않아요.' }, { status: 400 });
    }

    // 토스페이먼츠 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY ?? '';
    const encoded = Buffer.from(`${secretKey}:`).toString('base64');

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!tossRes.ok) {
      const tossError = await tossRes.json();
      console.error('[Toss confirm error]', tossError);
      await orderDoc.ref.update({ status: 'failed', failedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ error: '결제에 실패했어요. 다시 시도해 주세요.' }, { status: 400 });
    }

    // Pro 플랜 30일 활성화
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await Promise.all([
      adminDb.collection('users').doc(userId).update({
        plan: 'pro',
        planExpiresAt: expiresAt,
        updatedAt: FieldValue.serverTimestamp(),
      }),
      orderDoc.ref.update({
        status: 'paid',
        paymentKey,
        paidAt: FieldValue.serverTimestamp(),
      }),
    ]);

    return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error('[API /billing/confirm]', error);
    return NextResponse.json({ error: '결제 처리 중 오류가 발생했어요.' }, { status: 500 });
  }
}
