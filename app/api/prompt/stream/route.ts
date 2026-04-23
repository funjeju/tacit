import { NextRequest } from 'next/server';
import { getAnthropicClient, MODELS } from '@/lib/anthropic/client';
import { LAYER_A_IDENTITY, buildLayerB, buildAssemblerTask } from '@/lib/anthropic/prompts/system';
import type { OutputType } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { outputType, qaHistory, domainId } = body as {
    outputType: OutputType;
    qaHistory: Array<{ question: string; answer: string }>;
    domainId?: string;
  };

  if (!outputType || !qaHistory?.length) {
    return new Response(JSON.stringify({ error: '필수 정보가 부족해요.' }), { status: 400 });
  }

  const client = getAnthropicClient();
  const layerB = buildLayerB({ outputType, domain: domainId });
  const layerC = buildAssemblerTask({ outputType, qaHistory });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: MODELS.sonnet,
          max_tokens: 2048,
          system: [
            { type: 'text', text: LAYER_A_IDENTITY, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: layerB, cache_control: { type: 'ephemeral' } },
          ],
          messages: [{ role: 'user', content: layerC }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const data = `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (err) {
        const errorData = `data: ${JSON.stringify({ error: '스트리밍 오류가 발생했어요.' })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
