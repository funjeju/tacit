import { NextRequest, NextResponse } from 'next/server';
import { anthropic, MODELS } from '@/lib/anthropic/client';
import { LAYER_A_IDENTITY, buildLayerB, buildQuestionPlannerTask } from '@/lib/anthropic/prompts/system';
import type { OutputType } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { outputType, seedKeyword, domainId } = body as {
      outputType: OutputType;
      seedKeyword: string;
      domainId?: string;
    };

    if (!outputType || !seedKeyword) {
      return NextResponse.json({ error: '유형과 키워드가 필요해요.' }, { status: 400 });
    }

    const layerB = buildLayerB({ outputType, domain: domainId });
    const layerC = buildQuestionPlannerTask({ outputType, seedKeyword });

    const response = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 2048,
      system: [
        { type: 'text', text: LAYER_A_IDENTITY, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: layerB, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: layerC }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // JSON 파싱
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ questions: parsed.questions });
  } catch (error) {
    console.error('[API /prompt/questions]', error);
    return NextResponse.json(
      { error: '질문 생성 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
