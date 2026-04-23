import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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

    const ym = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();

    const [userDoc, usageDoc, recentSnap] = await Promise.all([
      adminDb.collection('users').doc(userId).get(),
      adminDb.collection('users').doc(userId).collection('usage').doc(ym).get(),
      adminDb
        .collection('prompts')
        .where('ownerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get(),
    ]);

    const userData = userDoc.data() ?? {};
    const usageThisMonth: number = usageDoc.exists ? (usageDoc.data()!.count ?? 0) : 0;

    const isPro =
      userData.plan === 'pro' &&
      userData.planExpiresAt?.toDate?.() > new Date();
    const monthlyLimit = isPro ? 100 : 10;

    const recent = recentSnap.docs.map((d) => {
      const data = d.data();
      return {
        promptId: data.promptId,
        type: data.type,
        finalPrompt: (data.finalPrompt ?? '').slice(0, 80) + '...',
        targetTool: data.targetTool,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({
      user: {
        uid: userId,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL,
        role: userData.role ?? 'user',
        theme: userData.theme ?? 'system',
        plan: isPro ? 'pro' : 'free',
        planExpiresAt: userData.planExpiresAt?.toDate?.()?.toISOString() ?? null,
        onboardingCompleted: userData.onboardingCompleted ?? false,
      },
      usage: {
        thisMonth: usageThisMonth,
        limit: monthlyLimit,
      },
      usageThisMonth,
      recent,
    });
  } catch (error) {
    console.error('[API /me]', error);
    return NextResponse.json({ error: '사용자 정보를 불러오지 못했어요.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const allowed = ['theme', 'language', 'fontSize', 'displayName'] as const;
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    await adminDb.collection('users').doc(userId).set(update, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API /me PATCH]', error);
    return NextResponse.json({ error: '업데이트에 실패했어요.' }, { status: 500 });
  }
}
