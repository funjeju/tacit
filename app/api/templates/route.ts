import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

const DOMAINS = ['restaurant', 'education', 'real_estate'] as const;
type Domain = typeof DOMAINS[number];

function loadTemplates(domain: Domain) {
  const filePath = path.join(
    process.cwd(),
    'seeds',
    'templates',
    domain,
    `${domain}_templates.json`
  );
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') as Domain | null;
    const templateId = searchParams.get('id');

    if (templateId) {
      // 특정 템플릿 조회
      for (const d of DOMAINS) {
        const templates = loadTemplates(d);
        const found = templates.find((t: { id: string }) => t.id === templateId);
        if (found) return NextResponse.json({ template: found });
      }
      return NextResponse.json({ error: '템플릿을 찾을 수 없어요.' }, { status: 404 });
    }

    if (domain && DOMAINS.includes(domain)) {
      const templates = loadTemplates(domain);
      return NextResponse.json({ templates });
    }

    // 전체
    const all = DOMAINS.flatMap((d) => loadTemplates(d));
    return NextResponse.json({ templates: all });
  } catch (error) {
    console.error('[API /templates]', error);
    return NextResponse.json({ error: '템플릿을 불러오지 못했어요.' }, { status: 500 });
  }
}
