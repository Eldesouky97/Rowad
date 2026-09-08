import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(firebaseApp);
export const db: Database = getDatabase(firebaseApp);

// تفعيل صريح لحفظ الجلسة في المتصفح (IndexedDB) بحيث يبقى الأدمن مسجّل
// دخول حتى بعد إغلاق المتصفح وإعادة فتحه — هذا سلوك Firebase الافتراضي
// أصلاً، لكن التصريح به هنا يمنع أي تغيير مستقبلي غير مقصود لهذا السلوك.
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    /* بيئات نادرة (خصوصية المتصفح الصارمة) قد ترفض IndexedDB — الجلسة
       تتحول تلقائيًا لذاكرة التبويب بدل فشل تسجيل الدخول بالكامل */
  });
}

// رابط REST مباشر لقاعدة البيانات (بدون SDK) — تُستخدم في القراءات العامة
// حتى تعمل داخل Server Components (مثل صفحة تفاصيل المقال) وليس فقط في المتصفح.
export const DATABASE_REST_URL = (firebaseConfig.databaseURL || '').replace(/\/$/, '');

// تطبيق Firebase ثانوي مستقل يُستخدم فقط عند إنشاء حساب أدمن جديد من لوحة
// التحكم، حتى لا يفقد السوبر أدمن الحالي جلسته (createUserWithEmailAndPassword
// على الـ auth الرئيسي يسجّل دخول تلقائيًا بالحساب الجديد بدل الحالي).
export function getSecondaryAuth(): Auth {
  const name = 'secondary';
  const app = getApps().find((a) => a.name === name) ?? initializeApp(firebaseConfig, name);
  return getAuth(app);
}
