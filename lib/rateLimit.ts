import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const FREE_MONTHLY_LIMIT = 10;
const PRO_MONTHLY_LIMIT = 100;

function getYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function checkRateLimit(
  userId: string,
  incrementOnCheck = true
): Promise<{ allowed: boolean; current: number; limit: number; isPro: boolean }> {
  const ym = getYearMonth();

  // 사용자 플랜 확인
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userData = userDoc.data() ?? {};
  const isPro =
    userData.plan === 'pro' &&
    userData.planExpiresAt?.toDate?.() > new Date();

  const monthlyLimit = isPro ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;

  const usageRef = adminDb.collection('users').doc(userId).collection('usage').doc(ym);
  const snap = await usageRef.get();
  const current: number = snap.exists ? (snap.data()!.count ?? 0) : 0;

  if (current >= monthlyLimit) {
    return { allowed: false, current, limit: monthlyLimit, isPro };
  }

  if (incrementOnCheck) {
    if (snap.exists) {
      await usageRef.update({ count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
    } else {
      await usageRef.set({ count: 1, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    }
  }

  return { allowed: true, current: current + (incrementOnCheck ? 1 : 0), limit: monthlyLimit, isPro };
}
