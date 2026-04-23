import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

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

    // 원본 프롬프트 조회 (공개된 것만)
    const sourceRef = adminDb.collection('prompts').doc(promptId);
    const sourceDoc = await sourceRef.get();
    if (!sourceDoc.exists) {
      return NextResponse.json({ error: '주문서를 찾을 수 없어요.' }, { status: 404 });
    }

    const source = sourceDoc.data()!;
    if (!source.isPublished) {
      return NextResponse.json({ error: '공개된 주문서만 복제할 수 있어요.' }, { status: 403 });
    }

    // 내 서재에 복사본 생성
    const copyRef = adminDb.collection('prompts').doc();
    const now = FieldValue.serverTimestamp();

    await copyRef.set({
      promptId: copyRef.id,
      ownerId: userId,
      sourcePromptId: promptId,
      type: source.type ?? source.outputType ?? 'report',
      outputType: source.outputType ?? source.type ?? 'report',
      domainId: source.domainId ?? null,
      templateId: source.templateId ?? null,
      finalPrompt: source.finalPrompt ?? '',
      qaHistory: source.qaHistory ?? [],
      targetTool: source.targetTool ?? 'chatgpt',
      tags: source.tags ?? [],
      isPublished: false,
      status: 'completed',
      stats: { views: 0, copies: 0, likes: 0, uses: 0 },
      createdAt: now,
      updatedAt: now,
    });

    // 원본 copies 카운트 증가
    await sourceRef.update({
      'stats.copies': FieldValue.increment(1),
    });

    return NextResponse.json({ promptId: copyRef.id });
  } catch (error) {
    console.error('[API /square/[promptId]/copy]', error);
    return NextResponse.json({ error: '복제에 실패했어요.' }, { status: 500 });
  }
}
