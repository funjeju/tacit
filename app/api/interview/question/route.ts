import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAnthropicClient, MODELS } from '@/lib/anthropic/client';
import {
  buildInterviewerPrompt,
  buildNextQuestionTask,
} from '@/lib/anthropic/prompts/interview';

export const runtime = 'nodejs';

// 직전 답변 저장 + 다음 질문 스트리밍
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

    const body = await req.json();
    const { sessionId, answer } = body as { sessionId: string; answer: string };

    if (!sessionId) {
      return NextResponse.json({ error: '세션 ID가 필요해요.' }, { status: 400 });
    }

    // 세션 조회
    const sessionRef = adminDb.collection('interviews').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists || sessionDoc.data()!.userId !== userId) {
      return NextResponse.json({ error: '세션을 찾을 수 없어요.' }, { status: 404 });
    }

    const session = sessionDoc.data()!;
    const qaHistory: Array<{ question: string; answer: string }> = session.qaHistory ?? [];
    const domainId: string = session.domainId;

    // 마지막 질문에 답변 저장
    if (qaHistory.length > 0) {
      qaHistory[qaHistory.length - 1].answer = answer;
    }

    const answeredCount = qaHistory.filter((qa) => qa.answer.trim()).length;
    const targetCount: number = session.targetQuestionCount ?? 20;

    // 질문 한도 도달 시 완료 신호 반환
    if (answeredCount >= targetCount) {
      await sessionRef.update({
        qaHistory,
        questionsAnswered: answeredCount,
        lastActivityAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ done: true, answeredCount });
    }

    // 다음 질문 생성 (스트리밍)
    const systemPrompt = buildInterviewerPrompt(domainId);
    const task = buildNextQuestionTask({
      qaHistory: qaHistory.filter((qa) => qa.answer.trim()),
      questionCount: answeredCount,
      targetCount,
      domain: domainId,
    });

    const client = getAnthropicClient();
    const stream = client.messages.stream({
      model: MODELS.haiku,
      max_tokens: 300,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: task }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        let fullQuestion = '';
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const text = event.delta.text;
              fullQuestion += text;
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          // 다음 질문을 히스토리에 추가 및 Firestore 업데이트
          const nextQA = { question: fullQuestion.trim(), answer: '' };
          const updatedHistory = [...qaHistory, nextQA];

          await sessionRef.update({
            qaHistory: updatedHistory,
            questionsAsked: updatedHistory.length,
            questionsAnswered: answeredCount,
            lastActivityAt: FieldValue.serverTimestamp(),
          });

          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ done: false, answeredCount })}\n\n`)
          );
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('[interview/question stream]', err);
          controller.error(err);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[API /interview/question]', error);
    return NextResponse.json({ error: '질문 생성에 실패했어요.' }, { status: 500 });
  }
}
