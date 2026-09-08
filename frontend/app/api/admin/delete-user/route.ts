import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// نفس حماية السوبر أدمن الرئيسي الموجودة في lib/api.ts وdatabase.rules.json —
// مكرّرة هنا لأن هذا الراوت بيستخدم Admin SDK اللي بيتخطى كل الـ rules تمامًا،
// فلازم يفرض نفس القيد بنفسه.
const PROTECTED_SUPER_ADMIN_EMAIL = 'eldesouky71@gmail.com';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ACCOUNT_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function deleteR2Object(key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
  } catch {
    // فشل حذف الصورة القديمة (مثلًا لو محذوفة بالفعل) ما يوقفش باقي العملية
  }
}

/** بيستخرج مفتاح الملف داخل R2 من رابط الصورة الكامل (photo_url) */
function extractR2Key(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  if (base && url.startsWith(`${base}/`)) return url.slice(base.length + 1);
  return null;
}

/**
 * حذف نهائي وكامل لحساب مستخدم — بيتطلب Admin SDK (مفتاح خدمة سرّي) لأن حذف
 * حساب Firebase Authentication تاني غير حساب الطالب نفسه مش ممكن أبدًا من
 * SDK العميل (Client SDK) لأي سبب أمني بديهي. الراوت ده بيتحقق من هوية
 * وصلاحية الطالب بنفسه (Admin SDK بيتخطى database.rules.json تمامًا).
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    console.error('Firebase Admin env vars missing — /api/admin/delete-user disabled');
    return NextResponse.json(
      { message: 'ميزة الحذف النهائي غير مفعّلة على السيرفر بعد (متغيرات Firebase Admin غير مضبوطة)' },
      { status: 503 }
    );
  }

  let callerUid: string;
  let callerEmail: string | undefined;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    callerUid = decoded.uid;
    callerEmail = decoded.email;
  } catch {
    return NextResponse.json({ message: 'جلسة غير صالحة، سجّل الدخول من جديد' }, { status: 401 });
  }

  const db = adminDb();
  const callerSnap = await db.ref(`admins/${callerUid}/role`).get();
  if (callerSnap.val() !== 'super_admin') {
    return NextResponse.json({ message: 'ليس لديك صلاحية لحذف المستخدمين نهائيًا' }, { status: 403 });
  }
  const isCallerProtected = callerEmail === PROTECTED_SUPER_ADMIN_EMAIL;

  const body = await req.json().catch(() => null);
  const uid = body?.uid;
  if (!uid || typeof uid !== 'string') {
    return NextResponse.json({ message: 'المعرّف مطلوب' }, { status: 422 });
  }
  if (uid === callerUid) {
    return NextResponse.json({ message: 'لا يمكنك حذف حسابك الخاص' }, { status: 422 });
  }

  // نتأكد من وجود الحساب في Firebase Authentication نفسها (مش بس في RTDB) —
  // عشان أي حساب موجود في الموقع فعليًا يتقدر يتحذف حتى لو ملوش سجل site_users
  // (مثلًا حساب اتعمل ولسه ما سجّلش دخول قط).
  let targetAuthEmail: string | null = null;
  try {
    const authUser = await adminAuth().getUser(uid);
    targetAuthEmail = authUser.email || null;
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (code !== 'auth/user-not-found') throw err;
  }

  const [targetAdminSnap, targetSiteUserSnap] = await Promise.all([
    db.ref(`admins/${uid}`).get(),
    db.ref(`site_users/${uid}`).get(),
  ]);
  const targetAdmin = targetAdminSnap.exists() ? (targetAdminSnap.val() as { email?: string; role?: string }) : null;
  const targetSiteUser = targetSiteUserSnap.exists() ? (targetSiteUserSnap.val() as { email?: string; photo_url?: string }) : null;

  if (!targetAuthEmail && !targetAdmin && !targetSiteUser) {
    return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
  }

  const targetEmail = targetAuthEmail || targetAdmin?.email || targetSiteUser?.email || null;
  if (targetEmail === PROTECTED_SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ message: 'لا يمكن حذف السوبر أدمن الرئيسي' }, { status: 422 });
  }

  // السوبر أدمن الرئيسي المحمي غير قابل للحذف أو التخفيض إطلاقًا (الشرط
  // فوق)، فوجوده مضمون دايمًا — بالتالي لو هو اللي بينفّذ عملية الحذف نفسه،
  // قيد "منع حذف آخر Super Admin متبقٍّ" مالوش داعي يوقفه (النظام مايُقفلش
  // أبدًا مهما حذف). القيد ده بيفضل شغّال بس لما يكون المنفّذ سوبر أدمن تاني
  // (غير المحمي) عشان يمنعه يمسح كل باقي فريق الإدارة بالغلط.
  if (targetAdmin?.role === 'super_admin' && !isCallerProtected) {
    const allAdminsSnap = await db.ref('admins').get();
    const allAdmins = (allAdminsSnap.val() || {}) as Record<string, { role?: string }>;
    const superAdminCount = Object.values(allAdmins).filter((a) => a.role === 'super_admin').length;
    if (superAdminCount <= 1) {
      return NextResponse.json({ message: 'لا يمكن حذف آخر Super Admin متبقٍّ' }, { status: 422 });
    }
  }

  // امسح كل الحجوزات المرتبطة بالمستخدم ده من كل الفعاليات
  const bookingsSnap = await db.ref('bookings').get();
  const bookingsByEvent = (bookingsSnap.val() || {}) as Record<string, Record<string, { user_id?: string }> | null>;
  const dbUpdates: Record<string, null> = {
    ...(targetSiteUser ? { [`site_users/${uid}`]: null } : {}),
    ...(targetAdmin ? { [`admins/${uid}`]: null } : {}),
  };
  for (const [eventId, eventBookings] of Object.entries(bookingsByEvent)) {
    for (const [bookingId, booking] of Object.entries(eventBookings || {})) {
      if (booking?.user_id === uid) {
        dbUpdates[`bookings/${eventId}/${bookingId}`] = null;
      }
    }
  }

  try {
    await db.ref().update(dbUpdates);
  } catch {
    return NextResponse.json({ message: 'تعذّر حذف بيانات المستخدم من قاعدة البيانات' }, { status: 500 });
  }

  const photoKey = extractR2Key(targetSiteUser?.photo_url);
  if (photoKey) await deleteR2Object(photoKey);

  try {
    await adminAuth().deleteUser(uid);
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (code !== 'auth/user-not-found') {
      // فشل حقيقي في حذف حساب المصادقة نفسه (صلاحيات service account ناقصة
      // غالبًا) — بيانات RTDB اتمسحت فعلًا، لكن لازم نبلّغ الأدمن بوضوح إن
      // الشخص لسه يقدر يسجّل دخول بنفس الحساب، بدل ما نرجّع "تم" مضلِّلة.
      console.error('adminAuth().deleteUser failed', err);
      return NextResponse.json(
        {
          message:
            'اتمسحت بيانات المستخدم من الموقع، لكن تعذّر حذف حساب الدخول (Authentication) نفسه — الشخص لسه يقدر يسجّل دخول بنفس الحساب. راجع صلاحيات مفتاح خدمة Firebase Admin (لازم يملك دور Firebase Authentication Admin).',
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ message: 'تم حذف الحساب وكل بياناته نهائيًا' });
}
