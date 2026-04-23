import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

async function getUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const userId = await getUser(req);
  if (!userId) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });

  const { profileId } = await params;
  const ref = adminDb.collection('domainProfiles').doc(profileId);
  const doc = await ref.get();

  if (!doc.exists || doc.data()!.userId !== userId) {
    return NextResponse.json({ error: '수정 권한이 없어요.' }, { status: 403 });
  }

  const { isActive } = (await req.json()) as { isActive: boolean };
  await ref.update({ isActive, updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true, isActive });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const userId = await getUser(req);
  if (!userId) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });

  const { profileId } = await params;
  const ref = adminDb.collection('domainProfiles').doc(profileId);
  const doc = await ref.get();

  if (!doc.exists || doc.data()!.userId !== userId) {
    return NextResponse.json({ error: '삭제 권한이 없어요.' }, { status: 403 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
