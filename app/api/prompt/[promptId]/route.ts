import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getAnthropicClient, MODELS } from '@/lib/anthropic/client';

export const runtime = 'nodejs';

async function generateTags(finalPrompt: string, domainId?: string): Promise<string[]> {
  try {
    const client = getAnthropicClient();
    const domain = domainId ?? '일반';
    const response = await client.messages.create({
      model: MODELS.haiku,
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `다음 AI 주문서에 어울리는 한국어 태그 3~5개를 JSON 배열로만 출력하세요. 설명 없이 배열만.
도메인: ${domain}
주문서: ${finalPrompt.slice(0, 300)}

출력 예시: ["신메뉴", "포스터", "이미지생성"]`,
      }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;

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

    const doc = await adminDb.collection('prompts').doc(promptId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: '찾을 수 없는 주문서예요.' }, { status: 404 });
    }

    const data = doc.data()!;
    if (data.ownerId !== userId && !data.isPublished) {
      return NextResponse.json({ error: '접근 권한이 없어요.' }, { status: 403 });
    }

    // 조회수 증가
    await adminDb
      .collection('prompts')
      .doc(promptId)
      .update({ 'stats.views': (data.stats?.views ?? 0) + 1 });

    return NextResponse.json({
      prompt: {
        promptId: data.promptId,
        type: data.type,
        domainId: data.domainId,
        finalPrompt: data.finalPrompt,
        targetTool: data.targetTool,
        isPublished: data.isPublished,
        stats: data.stats,
        tags: data.tags,
        userInputs: data.userInputs,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
        ownerId: data.ownerId,
      },
    });
  } catch (error) {
    console.error('[API /prompt/[promptId]]', error);
    return NextResponse.json({ error: '불러오지 못했어요.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;

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

    const doc = await adminDb.collection('prompts').doc(promptId).get();
    if (!doc.exists || doc.data()!.ownerId !== userId) {
      return NextResponse.json({ error: '수정 권한이 없어요.' }, { status: 403 });
    }

    const body = await req.json();
    const allowed = ['isPublished', 'tags'] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: '변경할 내용이 없어요.' }, { status: 400 });
    }

    // 공개 전환 시 태그 자동 생성 (태그가 비어있을 때만)
    const data = doc.data()!;
    if (update.isPublished === true && (!data.tags || data.tags.length === 0)) {
      const autoTags = await generateTags(data.finalPrompt ?? '', data.domainId);
      if (autoTags.length > 0) update.tags = autoTags;
    }

    await adminDb.collection('prompts').doc(promptId).update(update);
    return NextResponse.json({ ok: true, tags: update.tags ?? data.tags ?? [] });
  } catch (error) {
    console.error('[API /prompt/[promptId] PATCH]', error);
    return NextResponse.json({ error: '수정에 실패했어요.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;

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

    const doc = await adminDb.collection('prompts').doc(promptId).get();
    if (!doc.exists || doc.data()!.ownerId !== userId) {
      return NextResponse.json({ error: '삭제 권한이 없어요.' }, { status: 403 });
    }

    await adminDb.collection('prompts').doc(promptId).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API /prompt/[promptId] DELETE]', error);
    return NextResponse.json({ error: '삭제에 실패했어요.' }, { status: 500 });
  }
}
