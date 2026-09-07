# رُوَّاد المحافظات الحدودية — Backend (Laravel API)

✅ **هذا المجلد الآن تنصيب Laravel حقيقي وكامل** (`vendor/`, `artisan`, `bootstrap/`,
`public/index.php`...إلخ) — جاهز للتشغيل مباشرة:

```bash
cd backend
composer install    # فقط لو vendor/ غير موجود (مثلاً بعد clone جديد)
php artisan migrate --seed
php artisan storage:link
php artisan serve   # -> http://localhost:8000/api
```

الأقسام ١-٦ التالية موثّقة تاريخيًا لتوضيح كيف تم تجهيز المشروع من ملفات قالب فقط
(الحالة القديمة، محفوظة في `../backend_old_template/`) — يمكنك تخطّيها والذهاب مباشرة
لقسم "النشر على Firebase Hosting + Cloud Run" أدناه.

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

## النشر على Firebase Hosting + Cloud Run

⚠️ **مهم:** Firebase **لا يشغّل PHP/Laravel مباشرة إطلاقًا** — لا في Hosting (استضافة
ملفات ثابتة فقط) ولا في Cloud Functions (Node.js/Python/Go/Java/.NET/Ruby فقط، بدون PHP).
الطريقة الوحيدة لتشغيل باك إند حقيقي تحت مظلة Firebase/Google Cloud هي **Cloud Run**
(حاوية Docker)، مع توجيه Firebase Hosting لها كطبقة rewrite. Cloud Run نفسه بيوفّر
حدًا مجانيًا شهريًا كافيًا لمشروع بالحجم ده، **لكنه يتطلب ربط بطاقة ائتمان/خصم** بحساب
Google Cloud (ترقية لخطة Blaze) حتى لو استخدامك فعليًا هيفضل ضمن الحد المجاني —
هذا قيد من Google نفسه وليس بالإمكان تجاوزه.

الملفات الجاهزة لهذا المسار في هذا المجلد:
- `Dockerfile` + `docker/` (صورة `php:8.2-apache` تستمع على المنفذ `8080` كما تتطلّب Cloud Run)
- `firebase.json` (يوجّه كل الطلبات لخدمة Cloud Run باسم `rowwad-api` في منطقة `us-central1`)

### المتطلبات المسبقة

```bash
npm install -g firebase-tools   # firebase CLI (مثبّت بالفعل غالبًا)
# ثبّت Google Cloud CLI من: https://cloud.google.com/sdk/docs/install
gcloud auth login
firebase login
```

من [console.cloud.google.com/billing](https://console.cloud.google.com/billing) اربط
بطاقة ائتمان بمشروعك (أو أنشئ مشروع Firebase جديد من [console.firebase.google.com](https://console.firebase.google.com)
ثم رقّه لخطة **Blaze** من إعدادات المشروع).

### قاعدة البيانات

⚠️ **لا تستخدم SQLite على Cloud Run** — نظام الملفات في الحاوية مؤقت (يُمسح مع كل
إعادة نشر/تشغيل) وCloud Run ممكن يشغّل أكتر من نسخة (instance) في نفس الوقت، فكل
نسخة هتشوف قاعدة بيانات فاضية منفصلة. استخدم قاعدة بيانات خارجية حقيقية:
- **Cloud SQL** (PostgreSQL/MySQL من Google) — مدمجة بسهولة مع Cloud Run لكن مدفوعة.
- أو خدمة PostgreSQL مجانية خارجية بدون بطاقة (مثل [Neon](https://neon.tech) أو
  [Supabase](https://supabase.com)) — تكفي تمامًا لحجم بيانات هذا المشروع.

احتفظ ببيانات الاتصال (Host, Database, Username, Password) لاستخدامها في خطوة النشر.

### خطوات النشر

1. **انشر الحاوية على Cloud Run** من مجلد `backend/`:
   ```bash
   gcloud run deploy rowwad-api \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars APP_KEY=$(php artisan key:generate --show),APP_ENV=production,APP_DEBUG=false,DB_CONNECTION=pgsql,DB_HOST=<host>,DB_PORT=5432,DB_DATABASE=<db>,DB_USERNAME=<user>,DB_PASSWORD=<pass>,FRONTEND_URL=https://your-app.vercel.app,SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app,SESSION_DOMAIN=your-app.vercel.app
   ```
   `gcloud` هيبني الصورة عبر Cloud Build تلقائيًا (مش محتاج Docker مثبّت محليًا)،
   وهيديك رابط مباشر لـ Cloud Run (مثل `https://rowwad-api-xxxxx-uc.a.run.app`) —
   جرّبه مباشرة (`/api/events`) قبل ما تكمّل.

2. **(اختياري) اربط Firebase Hosting كطبقة أمامية** لرابط أنضف تحت نفس مشروع Firebase:
   ```bash
   firebase use --add        # اختر مشروع Firebase/Google Cloud بتاعك
   firebase deploy --only hosting
   ```
   بعدها الـ API هيبقى متاح كمان على `https://<project-id>.web.app/...`.

3. **حدّث الواجهة الأمامية** على Vercel: غيّر `NEXT_PUBLIC_API_URL` لرابط Cloud Run
   (أو رابط Firebase Hosting لو استخدمته) + `/api`، واعمل Redeploy.

4. **راجع** أن `FRONTEND_URL`/`SANCTUM_STATEFUL_DOMAINS` في متغيرات البيئة فوق تطابق
   فعليًا نطاق Vercel النهائي (تقدر تعدّل متغيرات بيئة خدمة موجودة عبر `gcloud run services update rowwad-api --update-env-vars ...` بدون إعادة بناء الصورة).

### ملاحظات

- المايجريشن بتشتغل تلقائيًا عند كل تشغيل حاوية جديدة (`docker/entrypoint.sh`) — كافي
  لمشروع بهذا الحجم؛ لمشروع أكبر يُفضّل تشغيلها كخطوة منفصلة (Cloud Run Job) بدل تكرارها
  عند كل بدء تشغيل.
- لتشغيل السيدرز مرة واحدة بعد أول نشر: `gcloud run services proxy rowwad-api --port 8080` محليًا ثم اتصال به، أو أبسط: أضف استدعاء `php artisan db:seed --force` مؤقتًا في `entrypoint.sh` وأزله بعد أول نشر ناجح.
- ملفات `Dockerfile.render` و`deploy.render.sh` محفوظة كبديل لو حبيت ترجع لاستضافة Render (مجانية فعليًا بدون بطاقة، لكن بدون علامة Firebase).

## بديل: Render (مجاني فعليًا بدون بطاقة ائتمان)

Render يوفّر استضافة مجانية حقيقية بدون طلب بطاقة ائتمان، وبيدعم Docker بشكل رسمي
لتطبيقات Laravel. لاستخدام هذا المسار بدل Cloud Run، أعد تسمية `Dockerfile.render` إلى
`Dockerfile` و`deploy.render.sh` إلى `deploy.sh` (مبنيين على الطريقة الموثّقة رسميًا من Render: https://render.com/docs/deploy-php-laravel-docker).

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
