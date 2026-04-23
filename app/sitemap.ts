import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tacit.kr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/square`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const snap = await adminDb
      .collection('prompts')
      .where('isPublished', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    const promptRoutes: MetadataRoute.Sitemap = snap.docs.map((doc) => ({
      url: `${BASE_URL}/square/${doc.id}`,
      lastModified: doc.data().updatedAt?.toDate?.() ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...promptRoutes];
  } catch {
    return staticRoutes;
  }
}
