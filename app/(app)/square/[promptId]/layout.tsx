import type { Metadata } from 'next';
import { adminDb } from '@/lib/firebase/admin';

export async function generateMetadata(
  { params }: { params: Promise<{ promptId: string }> }
): Promise<Metadata> {
  const { promptId } = await params;
  try {
    const doc = await adminDb.collection('prompts').doc(promptId).get();
    if (!doc.exists || !doc.data()!.isPublished) {
      return { title: 'AI 주문서' };
    }
    const data = doc.data()!;
    const preview = (data.finalPrompt ?? '').slice(0, 100);
    const typeLabel: Record<string, string> = {
      image: '이미지', report: '보고서', video: '영상', ppt: '발표자료', code: '코드', music: '음악',
    };
    const label = typeLabel[data.type] ?? 'AI 주문서';
    return {
      title: `${label} 주문서`,
      description: preview,
      openGraph: {
        title: `${label} 주문서 | Tacit 광장`,
        description: preview,
        type: 'article',
      },
    };
  } catch {
    return { title: 'AI 주문서' };
  }
}

export default function SquareDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
