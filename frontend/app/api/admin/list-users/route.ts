import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import type { FirebaseAccountRow } from '@/lib/types';

const PROTECTED_SUPER_ADMIN_EMAIL = 'eldesouky71@gmail.com';

/**
 * بيسرد كل حساب موجود فعليًا في Firebase Authentication (مش بس الحسابات
 * اللي كتبت سجل في site_users عند أول تسجيل دخول) — محتاج Admin SDK لأن
 * سرد كل مستخدمي Auth مش متاح من Client SDK إطلاقًا. سوبر أدمن فقط.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    console.error('Firebase Admin env vars missing — /api/admin/list-users disabled');
    return NextResponse.json(
      { message: 'ميزة عرض كل الحسابات غير مفعّلة على السيرفر بعد (متغيرات Firebase Admin غير مضبوطة)' },
      { status: 503 }
    );
  }

  // ملفوف بالكامل في try/catch — أي خطأ غير متوقع (زي مفتاح خدمة مكتوب غلط
  // في إعدادات Vercel) كان بيسقط الراوت كله ويرجّع صفحة خطأ HTML عامة من
  // Vercel مش JSON، فالواجهة كانت بتعرض رسالة عامة مش مفيدة. دلوقتى بيرجع
  // رسالة الخطأ الحقيقية عشان يبان السبب بالظبط.
  try {
    let callerUid: string;
    try {
      const decoded = await adminAuth().verifyIdToken(token);
      callerUid = decoded.uid;
    } catch {
      return NextResponse.json({ message: 'جلسة غير صالحة، سجّل الدخول من جديد' }, { status: 401 });
    }

    const db = adminDb();
    const callerRoleSnap = await db.ref(`admins/${callerUid}/role`).get();
    if (callerRoleSnap.val() !== 'super_admin') {
      return NextResponse.json({ message: 'ليس لديك صلاحية لعرض كل الحسابات' }, { status: 403 });
    }

    const [adminsSnap, siteUsersSnap] = await Promise.all([db.ref('admins').get(), db.ref('site_users').get()]);
    const admins = (adminsSnap.val() || {}) as Record<string, { name?: string; email?: string; role?: FirebaseAccountRow['role'] }>;
    const siteUsers = (siteUsersSnap.val() || {}) as Record<
      string,
      { name?: string; email?: string; profile_completed?: boolean; provider?: string; last_login_at?: string; created_at?: string }
    >;

    const rows: FirebaseAccountRow[] = [];
    let pageToken: string | undefined;
    do {
      const page = await adminAuth().listUsers(1000, pageToken);
      for (const u of page.users) {
        const adminRecord = admins[u.uid];
        const siteUserRecord = siteUsers[u.uid];
        const provider = siteUserRecord?.provider || u.providerData[0]?.providerId?.replace('.com', '') || null;
        rows.push({
          id: u.uid,
          name: adminRecord?.name || siteUserRecord?.name || u.displayName || u.email || 'بدون اسم',
          email: adminRecord?.email || siteUserRecord?.email || u.email || '',
          role: adminRecord?.role ?? null,
          provider,
          profile_completed: !!siteUserRecord?.profile_completed,
          has_site_user_record: !!siteUserRecord,
          created_at: siteUserRecord?.created_at || u.metadata.creationTime || null,
          last_login_at: siteUserRecord?.last_login_at || u.metadata.lastSignInTime || null,
          is_protected: (adminRecord?.email || u.email) === PROTECTED_SUPER_ADMIN_EMAIL,
        });
      }
      pageToken = page.pageToken;
    } while (pageToken);

    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error('/api/admin/list-users failed', err);
    const message = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ message: `تعذّر جلب قائمة الحسابات: ${message}` }, { status: 500 });
  }
}
