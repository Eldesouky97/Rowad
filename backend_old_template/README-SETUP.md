# رُوَّاد المحافظات الحدودية — Backend (Laravel API)

هذا المجلد يحتوي على **الملفات الخاصة بالمشروع فقط** (Models, Controllers, Migrations,
Seeders, Routes, config/cors.php) وليس تنصيب Laravel كاملًا بكل ملفاته الأساسية
(vendor, bootstrap, public/index.php...إلخ)، لأن هذه الملفات الأساسية يتم توليدها
تلقائيًا عبر Composer، ولا يمكن توليدها بدون اتصال إنترنت فعلي بسيرفرات Packagist.

اتبع الخطوات التالية بالترتيب على جهازك (يلزم توفر PHP 8.2+ وComposer):

## 1) إنشاء مشروع Laravel جديد فارغ

```bash
composer create-project laravel/laravel rowwad-backend
cd rowwad-backend
```

## 2) تثبيت Sanctum (المصادقة الخاصة بلوحة تحكم الأدمن)

```bash
composer require laravel/sanctum
php artisan install:api
```
هذا الأمر (خاص بـ Laravel 11) يفعّل ملف `routes/api.php` تلقائيًا ويثبّت Sanctum.

## 3) انسخ ملفات هذا المجلد فوق المشروع الجديد

انسخ (وادمج/استبدل عند الطلب) المجلدات والملفات التالية من هذا المجلد إلى مجلد
`rowwad-backend` الذي أنشأته:

```
app/Models/*.php                → app/Models/
app/Http/Controllers/Api/*.php  → app/Http/Controllers/Api/
database/migrations/*.php       → database/migrations/
database/seeders/*.php          → database/seeders/
routes/api.php                  → routes/api.php   (استبدال)
config/cors.php                 → config/cors.php  (استبدال)
```

## 4) اضبط ملف البيئة `.env`

انسخ القيم المهمة من ملف `.env.example` الموجود هنا إلى ملف `.env` في مشروعك
(خصوصًا `FRONTEND_URL`، `SANCTUM_STATEFUL_DOMAINS`، وإعدادات قاعدة البيانات).

لأسهل تشغيل محلي بدون تنصيب MySQL:
```bash
touch database/database.sqlite
```
وتأكد أن `DB_CONNECTION=sqlite` في `.env`.

## 5) شغّل المايجريشن والبيانات التجريبية

```bash
php artisan key:generate
php artisan migrate --seed
```

سيُنشئ الأمر:
- ٦ فعاليات تجريبية موزعة بين المحافظات الخمس
- ٦ مقالات إخبارية تجريبية
- مستخدم أدمن افتراضي:
  - **البريد:** `admin@rowwad-borders.test`
  - **كلمة المرور:** `ChangeMe123!`
  - ⚠️ غيّرها فورًا عبر `php artisan tinker` أو لوحة التحكم بعد أول تسجيل دخول.

## 6) شغّل السيرفر

```bash
php artisan serve
```
الـ API هيشتغل على `http://localhost:8000/api`.

## أهم نقاط الوصول (Endpoints)

| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/api/events?status=upcoming\|past\|all` | كل الفعاليات |
| GET | `/api/events/{slug}` | تفاصيل فعالية |
| POST | `/api/events/{slug}/bookings` | حجز مكان في فعالية |
| GET | `/api/articles?category=..&q=..` | كل الأخبار/المقالات مع فلترة وبحث |
| GET | `/api/articles/{slug}` | تفاصيل مقال |
| POST | `/api/contact-messages` | إرسال رسالة تواصل |
| POST | `/api/admin/login` | دخول لوحة التحكم (يرجع token) |
| POST/PUT/DELETE | `/api/admin/events...` | إدارة الفعاليات (Bearer token) |
| POST/PUT/DELETE | `/api/admin/articles...` | إدارة المقالات (Bearer token) |
| GET | `/api/admin/events/{id}/bookings` | قائمة حجوزات فعالية معيّنة |
| GET | `/api/admin/contact-messages` | رسائل التواصل الواردة |

المسارات تحت `/admin` (عدا `login`) تتطلب ترويسة:
`Authorization: Bearer <token>`

## النشر المجاني الفعلي — Render (بدون بطاقة ائتمان)

Render يوفّر استضافة مجانية حقيقية بدون طلب بطاقة ائتمان، وبيدعم Docker بشكل رسمي
لتطبيقات Laravel. هنستخدم صورة `Dockerfile` و`deploy.sh` الموجودين في هذا المجلد
(مبنيين على الطريقة الموثّقة رسميًا من Render: https://render.com/docs/deploy-php-laravel-docker).

### الخطوات

1. **جهّز مشروع Laravel كامل محليًا** أولًا حسب الخطوات في أول هذا الملف (خطوات ١-٤: إنشاء
   المشروع، تثبيت Sanctum، نسخ الملفات، ضبط `.env`) — بما فيها نسخ `Dockerfile`,
   `deploy.sh`, و`.dockerignore` الموجودين هنا لجذر المشروع.

2. **ارفع المشروع على GitHub** (مستودع خاص أو عام، مفيش فرق):
   ```bash
   git init
   git add .
   git commit -m "أول نسخة من رُوَّاد API"
   git remote add origin https://github.com/USERNAME/rowwad-backend.git
   git push -u origin main
   ```

3. **أنشئ قاعدة بيانات PostgreSQL مجانية على Render:**
   - من [Render Dashboard](https://dashboard.render.com/new/database) → New PostgreSQL
   - اختر الخطة **Free**
   - بعد الإنشاء، انسخ قيمة **Internal Database URL**

4. **أنشئ Web Service جديد:**
   - New → Web Service → اختر مستودع GitHub اللي رفعته
   - Runtime: **Docker**
   - Plan: **Free**
   - في قسم Environment Variables (Advanced) ضيف:

   | المتغيّر | القيمة |
   |---|---|
   | `DATABASE_URL` | الـ Internal Database URL من الخطوة ٣ |
   | `DB_CONNECTION` | `pgsql` |
   | `APP_KEY` | نتيجة تشغيل `php artisan key:generate --show` محليًا |
   | `ASSET_URL` | رابط تطبيقك على Render نفسه (مثلاً `https://rowwad-api.onrender.com`) — يظهر بعد أول نشر، ترجع تضيفه وتعمل Redeploy |
   | `FRONTEND_URL` | رابط موقعك على Vercel (مثلاً `https://rowwad-borders.vercel.app`) |
   | `SANCTUM_STATEFUL_DOMAINS` | نفس نطاق Vercel بدون `https://` |

5. اضغط **Create Web Service**. Render هيبني الصورة تلقائيًا، ويشغّل `deploy.sh`
   (تثبيت composer، تخزين مؤقت للإعدادات، تشغيل المايجريشن) ثم يشغّل السيرفر.

6. بعد أول نشر ناجح، شغّل السيدرز مرة واحدة من تبويب **Shell** في Render:
   ```bash
   php artisan db:seed --force
   ```

### ملاحظات مهمة على الخطة المجانية من Render

- الخدمة المجانية بتنام (Sleep) بعد ١٥ دقيقة من عدم الاستخدام، وأول طلب بعدها
  بياخد ٣٠-٦٠ ثانية تقريبًا لحد ما تصحى (Cold Start) — طبيعي وليس عطلًا.
- ٧٥٠ ساعة تشغيل مجانية شهريًا (كافية لخدمة واحدة شغالة ٢٤/٧ تقريبًا).
- قاعدة البيانات المجانية محدودة المساحة (كافية لحجم بيانات هذا المشروع بسهولة).



هذا Backend نموذج مرجعي جاهز للتطوير المحلي. قبل النشر الفعلي (Production):
- فعّل HTTPS واضبط `APP_ENV=production` و`APP_DEBUG=false`
- استخدم قاعدة بيانات حقيقية (MySQL/PostgreSQL) بدل SQLite
- أضف Rate Limiting على مسارات الحجز والرسائل لمنع الإساءة
- فعّل التحقق من البريد الإلكتروني وسياسات كلمات مرور أقوى لحسابات الأدمن
