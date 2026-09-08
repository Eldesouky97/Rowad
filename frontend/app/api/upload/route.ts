import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// يرفع صورة إلى Cloudflare R2 من جانب السيرفر فقط — مفاتيح R2 السرّية
// (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) لا تُستخدم إلا هنا ولا تصل
// للمتصفح إطلاقًا (بعكس متغيرات NEXT_PUBLIC_*).
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ACCOUNT_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MAX_SIZE = 4 * 1024 * 1024; // 4MB، نفس الحد القديم في Laravel

// المجلدات المسموح رفع الصور فيها فقط — أي قيمة تانية بترجع لـ gallery افتراضيًا
// عشان محدش يقدر يكتب في مسار عشوائي جوه الـ bucket.
const ALLOWED_FOLDERS = new Set(['gallery', 'avatars', 'branding']);

/** بيتحقق من هوية الطالب عبر Firebase ID token (Bearer)، ويرجّع uid + هل هو
 * أدمن (موجود في admins/) من عدمه. من غير التحقق ده كان أي حد على الإنترنت
 * (حتى بدون تسجيل دخول) يقدر يرفع ملفات على الباكت أو يمسح أي صورة فيه —
 * ده كان ثغرة حقيقية اكتُشفت في مراجعة أمنية. */
async function verifyCaller(req: NextRequest): Promise<{ uid: string; isAdmin: boolean } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  // فشل verifyIdToken هنا معناه توكن غير صالح (زائر مش مسجّل دخول فعليًا) —
  // بيرجّع null. أي خطأ تاني (زي مفتاح خدمة Admin SDK مكتوب غلط) لازم يتفرقن
  // عنه ويطلع للطالب بوضوح (503) بدل ما يتلبس بـ "سجّل الدخول" المضلِّلة.
  const decoded = await adminAuth()
    .verifyIdToken(token)
    .catch((err) => {
      const code = (err as { code?: string })?.code || '';
      if (code.startsWith('auth/')) return null;
      throw err;
    });
  if (!decoded) return null;
  const roleSnap = await adminDb().ref(`admins/${decoded.uid}/role`).get();
  return { uid: decoded.uid, isAdmin: roleSnap.exists() };
}

export async function POST(req: NextRequest) {
  let caller;
  try {
    caller = await verifyCaller(req);
  } catch (err) {
    console.error('/api/upload verifyCaller failed', err);
    const message = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ message: `خدمة رفع الصور غير مهيّأة على السيرفر بعد: ${message}` }, { status: 503 });
  }
  if (!caller) {
    return NextResponse.json({ message: 'يجب تسجيل الدخول لرفع الصور' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const folderInput = String(formData.get('folder') || 'gallery');
  const folder = ALLOWED_FOLDERS.has(folderInput) ? folderInput : 'gallery';

  // صورة البروفايل الشخصية متاحة لأي زائر مسجّل دخول (لصورته هو)، أما صور
  // المحتوى (المعرض، شعار الموقع) فمقصورة على فريق الإدارة فقط.
  if (folder !== 'avatars' && !caller.isAdmin) {
    return NextResponse.json({ message: 'ليس لديك صلاحية لرفع هذا النوع من الصور' }, { status: 403 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'لم يتم إرفاق أي ملف' }, { status: 422 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ message: 'الملف يجب أن يكون صورة' }, { status: 422 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ message: 'حجم الصورة أكبر من 4 ميجابايت' }, { status: 422 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const key = `${folder}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: bytes,
        ContentType: file.type,
      })
    );
  } catch {
    return NextResponse.json({ message: 'فشل رفع الصورة، حاول مرة أخرى' }, { status: 500 });
  }

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  return NextResponse.json({ storage_path: key, image_url: publicUrl });
}

export async function DELETE(req: NextRequest) {
  let caller;
  try {
    caller = await verifyCaller(req);
  } catch (err) {
    console.error('/api/upload DELETE verifyCaller failed', err);
    const message = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ message: `خدمة حذف الصور غير مهيّأة على السيرفر بعد: ${message}` }, { status: 503 });
  }
  // حذف صورة (استبدال صورة قديمة أو حذف عنصر) عملية إدارية دايمًا حاليًا —
  // ما فيش مسار في التطبيق بيحذف صورة بروفايل زائر عادي.
  if (!caller || !caller.isAdmin) {
    return NextResponse.json({ message: 'ليس لديك صلاحية لحذف هذا الملف' }, { status: 403 });
  }

  const { storage_path } = await req.json();
  if (!storage_path || typeof storage_path !== 'string') {
    return NextResponse.json({ message: 'مسار الملف مطلوب' }, { status: 422 });
  }
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: storage_path }));
  } catch {
    // تجاهل فشل حذف الملف القديم (مثلاً لو محذوف بالفعل) — لا يجب أن يمنع باقي العملية
  }
  return NextResponse.json({ message: 'تم' });
}
