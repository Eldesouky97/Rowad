import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

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

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  const folderInput = String(formData.get('folder') || 'gallery');
  const folder = ALLOWED_FOLDERS.has(folderInput) ? folderInput : 'gallery';

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
