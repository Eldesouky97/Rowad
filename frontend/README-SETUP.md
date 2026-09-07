# رُوَّاد المحافظات الحدودية — Frontend (Next.js)

## المتطلبات
- Node.js 18.18+ (يُفضّل 20+)
- تشغيل الـ Backend (Laravel) أولًا — راجع `README-SETUP.md` في مجلد `rowwad-laravel`

## 1) تثبيت الحزم

```bash
npm install
```

## 2) ضبط رابط الـ API

```bash
cp .env.local.example .env.local
```
تأكد أن `NEXT_PUBLIC_API_URL` يشير لعنوان تشغيل الـ Laravel API لديك
(افتراضيًا `http://localhost:8000/api`).

## 3) تشغيل بيئة التطوير

```bash
npm run dev
```
الموقع هيشتغل على `http://localhost:3000`.

## البنية

```
app/
  page.tsx              الرئيسية
  about/                من نحن
  activities/           الأنشطة والفعاليات + الحجز
  news/                 البوابة الإخبارية
  news/[slug]/          تفاصيل مقال
  contact/              تواصل معنا
  admin/login/          دخول لوحة التحكم
  admin/dashboard/      لوحة تحكم الأدمن (نشر مقالات، عرض الحجوزات والرسائل)
components/             مكوّنات مشتركة (Header, Footer, EventCard...)
lib/api.ts              عميل الاتصال بالـ Laravel API
lib/types.ts            أنواع TypeScript المشتركة
public/brand/logo.jpg   الشعار الرسمي للكيان
```

## دخول لوحة التحكم

بعد تشغيل الـ Backend وعمل `migrate --seed`، استخدم:
- **البريد:** `admin@rowwad-borders.test`
- **كلمة المرور:** `ChangeMe123!`

⚠️ **مهم:** هذا نظام مصادقة مبسّط لأغراض العرض — التوكن يُحفظ في `localStorage`
والتحقق من الجلسة يحدث في المتصفح (client-side) وليس عبر Middleware على مستوى
السيرفر. قبل الاستخدام الفعلي في الإنتاج، يُفضّل:
- إضافة Next.js Middleware للتحقق من الجلسة على مستوى السيرفر
- استخدام HttpOnly Cookies بدل localStorage لتخزين التوكن (أكثر أمانًا ضد XSS)
- تفعيل HTTPS وسياسات كلمات مرور أقوى

## النشر المجاني الفعلي — Vercel (بدون بطاقة ائتمان)

Vercel هو الخيار الأنسب لموقع Next.js: مجاني فعليًا على خطة Hobby بدون طلب بطاقة
ائتمان، ودعم كامل لكل مميزات Next.js من غير إعدادات إضافية.

> ℹ️ ليه مش Firebase؟ Firebase App Hosting (اللي بيستضيف تطبيقات Next.js) بيتطلب
> ترقية المشروع لخطة Blaze المدفوعة (وربط بطاقة ائتمان) حتى لو استخدامك هيفضل
> ضمن الحد المجاني. وعلى أي حال Firebase مش بيدعم تشغيل Laravel/PHP للباك إند
> إطلاقًا (بيدعم Node.js وPython وGo بس). فـ Vercel + Render (راجع README الباك
> إند) بيدّولك تجربة مجانية كاملة من غير بطاقة ائتمان على الاتنين.

### الخطوات

1. ثبّت أداة سطر الأوامر:
   ```bash
   npm install -g vercel
   ```
2. من داخل مجلد المشروع:
   ```bash
   vercel login
   vercel --prod
   ```
   هيسألك اسم المشروع وبعض الإعدادات (اقبل الافتراضي)، وهيرفع الموقع فعليًا
   ويديك رابط مباشر.

3. بعد ما الباك إند يبقى شغال على Render (راجع `rowwad-laravel/README-SETUP.md`):
   - من [Vercel Dashboard](https://vercel.com/dashboard) → مشروعك → Settings →
     Environment Variables
   - ضيف `NEXT_PUBLIC_API_URL` بقيمة رابط الباك إند + `/api` (مثلاً
     `https://rowwad-api.onrender.com/api`)
   - اعمل Redeploy عشان القيمة الجديدة تتفعّل

### للتحديث التلقائي عند كل push (اختياري وأفضل على المدى الطويل)

بدل `vercel --prod` اليدوي، اربط المشروع بمستودع GitHub من نفس الداشبورد
(Add New → Project → Import Git Repository) — وبعدين أي `git push` هيعمل نشر
تلقائي.

## ملاحظة حول هذه البيئة

تم كتابة كل ملفات هذا المشروع يدويًا دون تشغيل `npm install` أو `next dev`،
لأن بيئة التطوير التي أنشأت بها المشروع لا تملك اتصال إنترنت لتنزيل الحزم.
لذلك يُنصح بعد تثبيت الحزم لديك بمراجعة الموقع صفحة بصفحة للتأكد من عدم وجود
أي فروقات طفيفة قد تحتاج تعديلًا بسيطًا.
