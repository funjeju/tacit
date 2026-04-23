import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { OutputType } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 인증 확인 (선택적 — 비회원도 사용 가능, 회원은 저장)
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const decoded = await adminAuth.verifyIdToken(token);
        userId = decoded.uid;
      } catch {
        // 토큰 오류 무시 (비회원 처리)
      }
    }

    const body = await req.json();
    const { outputType, seedKeyword, domainId, templateId } = body as {
      outputType: OutputType;
      seedKeyword: string;
      domainId?: string;
      templateId?: string;
    };

    // 세션 문서 생성
    const sessionRef = adminDb.collection('prompts').doc();
    const sessionData = {
      promptId: sessionRef.id,
      ownerId: userId ?? 'guest',
      type: outputType,
      domainId: domainId ?? null,
      typeSubcategory: templateId ?? null,
      userInputs: {
        initialKeyword: seedKeyword,
        answers: [],
      },
      finalPrompt: '',
      targetTool: 'chatgpt',
      isPublished: false,
      stats: { views: 0, copies: 0, likes: 0, uses: 0 },
      tags: [],
      currentVersion: 1,
      status: 'in_progress',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await sessionRef.set(sessionData);

    return NextResponse.json({ sessionId: sessionRef.id });
  } catch (error) {
    console.error('[API /prompt/start]', error);
    return NextResponse.json({ error: '세션 생성에 실패했어요.' }, { status: 500 });
  }
}
