import {
  ref,
  get,
  push,
  set,
  update,
  remove,
  runTransaction,
} from 'firebase/database';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  sendEmailVerification,
  applyActionCode,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  linkWithCredential,
  EmailAuthProvider,
  type ActionCodeSettings,
  type User,
} from 'firebase/auth';
import { auth, db, getSecondaryAuth } from './firebase';
import { objectToArray, restGet, makeSlug, makeConfirmationCode, computeEventFields, ApiException } from './firebaseHelpers';
import type {
  Article,
  EventItem,
  EventItemPayload,
  Booking,
  AdminUser,
  AdminUserPayload,
  AdminRole,
  FirebaseAccountRow,
  Program,
  Governorate,
  SuccessStory,
  GalleryImage,
  GalleryAlbum,
  SiteSettings,
} from './types';

// القراءات العامة (REST خالصة، بدون Firebase SDK) منقولة إلى publicApi.ts
// حتى تعمل بأمان من Server Components — انظر التعليق هناك للتفاصيل.
export {
  getEvents,
  getEvent,
  getArticles,
  getArticle,
  sendContactMessage,
  getPrograms,
  getGovernorates,
  getGovernorate,
  getSuccessStories,
  getSuccessStory,
  getGallery,
  getGalleryAlbums,
  getSiteSettings,
  ApiException,
} from './publicApi';

// حساب السوبر أدمن الرئيسي — محمي من الحذف أو تخفيض دوره من أي مكان في
// الواجهة (وأيضًا على مستوى database.rules.json)، حتى لو كل حسابات
// السوبر أدمن التانية اتحذفت بالغلط أو تعطّلت.
export const PROTECTED_SUPER_ADMIN_EMAIL = 'eldesouky71@gmail.com';

function translateFirebaseError(err: unknown): ApiException {
  const code = (err as { code?: string })?.code || '';
  const message = (err as Error)?.message || '';
  if (code === 'PERMISSION_DENIED' || message.includes('PERMISSION_DENIED') || code === 'permission-denied') {
    return new ApiException('ليس لديك صلاحية للقيام بهذا الإجراء', 403);
  }
  if (['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential'].includes(code)) {
    return new ApiException('بيانات الدخول غير صحيحة', 401);
  }
  if (code === 'auth/email-already-in-use') {
    return new ApiException('البريد الإلكتروني مستخدم بالفعل', 422, { email: ['البريد الإلكتروني مستخدم بالفعل'] });
  }
  if (code === 'auth/weak-password') {
    return new ApiException('كلمة المرور ضعيفة جدًا (٨ أحرف على الأقل)', 422, { password: ['كلمة المرور ضعيفة جدًا'] });
  }
  if (code === 'auth/too-many-requests') {
    return new ApiException('محاولات كثيرة جدًا، حاول لاحقًا', 429);
  }
  if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-exists') {
    return new ApiException('في حساب تاني مرتبط بنفس البريد الإلكتروني بالفعل', 422);
  }
  if (code === 'auth/provider-already-linked') {
    return new ApiException('حسابك عنده كلمة مرور بالفعل', 422);
  }
  if (code === 'auth/requires-recent-login') {
    return new ApiException('العملية دي محتاجة تسجّل دخول حديث — سجّل خروج ودخول تاني وحاول مرة أخرى', 401);
  }
  if (code === 'auth/expired-action-code') {
    return new ApiException('انتهت صلاحية هذا الرابط — اطلب رابطًا جديدًا', 410);
  }
  if (code === 'auth/invalid-action-code') {
    return new ApiException('هذا الرابط غير صالح أو استُخدم من قبل — اطلب رابطًا جديدًا', 410);
  }
  if (code === 'auth/user-disabled') {
    return new ApiException('هذا الحساب معطَّل', 403);
  }
  if (code === 'auth/unauthorized-continue-uri') {
    return new ApiException('رابط الموقع غير مُصرَّح به في إعدادات Firebase — أضِف نطاق الموقع في Authentication → Settings → Authorized domains', 500);
  }
  return new ApiException(message || 'حدث خطأ غير متوقع', 500);
}

// متصفحات الموبايل (خصوصًا داخل تطبيقات أو متصفحات معيّنة) بتقفل نافذة
// signInWithPopup تلقائيًا أو بتمنعها من الأساس، فبيطلع خطأ زي
// popup-closed-by-user حتى لو المستخدم مامسكش حاجة. الحل القياسي: لو
// النافذة المنبثقة فشلت لأي سبب متعلّق بالنافذة نفسها (مش برفض المستخدم
// الواعي للصلاحيات)، نرجع لـ signInWithRedirect (تنقّل كامل للصفحة بدل
// نافذة منبثقة) اللي بيشتغل في كل المتصفحات بلا استثناء.
const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
]);
function needsRedirectFallback(err: unknown): boolean {
  const code = (err as { code?: string })?.code || '';
  return POPUP_FALLBACK_CODES.has(code);
}

// رابط صفحة الموقع اللي بتستقبل روابط "إعادة تعيين كلمة المرور" و"تفعيل
// البريد الإلكتروني" مباشرة (handleCodeInApp: true) — بدل ما Firebase يوجّه
// الزائر لصفحته المُستضافة الافتراضية على *.firebaseapp.com أولًا. بكده
// الرابط اللي بيوصل بالإيميل يبقى فيه اسم ورابط الموقع نفسه من الأول.
function authActionCodeSettings(): ActionCodeSettings {
  return {
    url: `${window.location.origin}/auth/action`,
    handleCodeInApp: true,
  };
}

export const createBooking = async (
  slug: string,
  payload: { full_name: string; phone: string; email: string; governorate?: string; notes?: string }
): Promise<Booking> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new ApiException('سجّل الدخول أولًا لإتمام الحجز', 401);
  }

  const raw = await restGet<Record<string, EventItem>>('events');
  const entry = Object.entries(raw ?? {}).find(([, v]) => v.slug === slug);
  if (!entry) throw new ApiException('الفعالية غير موجودة', 404);
  const [eventId, eventData] = entry;

  const seatsRef = ref(db, `events/${eventId}/seats_taken`);
  const result = await runTransaction(seatsRef, (current) => {
    const cur = current ?? 0;
    if (cur >= eventData.seats_total) return undefined;
    return cur + 1;
  });

  if (!result.committed) {
    throw new ApiException('عذرًا، اكتملت مقاعد هذه الفعالية', 409);
  }

  const confirmation_code = makeConfirmationCode();
  const bookingData = {
    full_name: payload.full_name,
    phone: payload.phone,
    email: payload.email,
    governorate: payload.governorate ?? null,
    notes: payload.notes ?? null,
    confirmation_code,
    user_id: currentUser.uid,
    created_at: new Date().toISOString(),
  };
  const newRef = push(ref(db, `bookings/${eventId}`));
  await set(newRef, bookingData);

  return { id: newRef.key!, event_id: eventId, ...bookingData } as Booking;
};

export function waitForAuthUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

/** يراقب حالة تسجيل دخول الزائر (أي مستخدم Firebase Auth، أدمن أو زائر عادي) */
export function onVisitorAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
    // بيسجّل بروفايل الزائر في /site_users مع كل حالة دخول — مش بس عند الضغط
    // الصريح على "دخول"، عشان يغطّي كمان الجلسات المحفوظة اللي بترجع تلقائيًا
    // (بفضل حفظ تسجيل الدخول) من غير ما تعدّي على دوال visitorSignIn/Google.
    if (user) {
      const providerId = user.providerData[0]?.providerId || '';
      recordSiteUserLogin(user, providerId.includes('google') ? 'google' : 'password').catch(() => {});
    }
  });
}

/* ============ Visitor Auth (تسجيل دخول عام مطلوب للحجز في الفعاليات) ============ */
/* ملاحظة: إنشاء حساب جديد بالبريد الإلكتروني اتشال بطلب صريح — إنشاء الحساب بقى
   عن طريق جوجل بس (signInWithPopup بيعمل الحساب تلقائيًا لو مش موجود). البريد
   والباسورد لسه متاحين لتسجيل دخول حساب موجود بالفعل. */

// يسجّل/يحدّث بروفايل الزائر في /site_users عشان يظهر في قسم "المستخدمون" بلوحة
// التحكم — مفيش Admin SDK متاح على خطة Firebase المجانية عشان نسرد كل حسابات
// Firebase Auth مباشرة، فده أقرب بديل: كل زائر بيكتب سجله بنفسه لحظة الدخول.
async function recordSiteUserLogin(user: User, provider: string): Promise<void> {
  try {
    await update(ref(db, `site_users/${user.uid}`), {
      name: user.displayName || null,
      email: user.email,
      provider,
      created_at: user.metadata.creationTime || new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    });
  } catch (err) {
    // فشل تسجيل البروفايل مش لازم يمنع تسجيل الدخول نفسه، بس نسجّله في الكونسول للتشخيص
    console.error('recordSiteUserLogin failed', err);
  }
}

export const visitorSignIn = async (email: string, password: string): Promise<User> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await recordSiteUserLogin(cred.user, 'password');
    return cred.user;
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const visitorSignInWithGoogle = async (): Promise<User> => {
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    await recordSiteUserLogin(cred.user, 'google');
    return cred.user;
  } catch (err) {
    if (needsRedirectFallback(err)) {
      // بينقل المتصفح بالكامل لصفحة جوجل ويرجع تاني — onVisitorAuthChange
      // هيلتقط تسجيل الدخول تلقائيًا لحظة رجوع الصفحة، فمفيش داعي ننتظر نتيجة هنا
      await signInWithRedirect(auth, new GoogleAuthProvider());
      return new Promise<User>(() => {}); // الصفحة هتتنقل قبل ما الوعد ده يتحل أصلًا
    }
    throw translateFirebaseError(err);
  }
};

export const visitorSignOut = async (): Promise<void> => {
  await signOut(auth);
};

/* ============ Visitor: صفحة إعدادات الحساب ============ */

// Firebase بيطلب "دخول حديث" (recent login) قبل تغيير البريد أو كلمة المرور —
// نعيد المصادقة صراحة بكلمة المرور الحالية بدل انتظار خطأ requires-recent-login
// والتعامل معه، عشان تجربة أوضح للمستخدم (بيعرف من الأول إنه محتاج كلمة المرور).
async function reauthenticateVisitor(currentPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new ApiException('سجّل الدخول أولًا', 401);
  }
  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  } catch (err) {
    throw translateFirebaseError(err);
  }
}

/**
 * يحدّث بيانات حساب الزائر: الاسم/الهاتف/الصورة (Auth profile + /site_users)
 * والبيانات الشخصية الإضافية (الرقم القومي، المحافظة، العنوان، السن،
 * المؤهل التعليمي) — نفس الدالة يستخدمها نموذج إكمال البيانات الإجباري
 * وصفحة إعدادات الحساب العادية، فرقهم بس markCompleted.
 */
export const updateVisitorProfile = async (payload: {
  name?: string;
  phone?: string;
  national_id?: string;
  governorate?: string;
  address?: string;
  age?: number;
  education?: string;
  committee?: string;
  photoFile?: File | null;
  /** يعلّم البروفايل كمكتمل — يُستخدم عند إرسال نموذج إكمال البيانات الإجباري */
  markCompleted?: boolean;
}): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new ApiException('سجّل الدخول أولًا', 401);

  if (payload.national_id !== undefined && payload.national_id && !/^\d{14}$/.test(payload.national_id)) {
    throw new ApiException('الرقم القومي يجب أن يتكوّن من ١٤ رقمًا', 422, {
      national_id: ['الرقم القومي يجب أن يتكوّن من ١٤ رقمًا'],
    });
  }

  try {
    let photoURL: string | undefined;
    if (payload.photoFile) {
      const uploaded = await uploadImageToR2(payload.photoFile, 'avatars');
      photoURL = uploaded.image_url;
    }

    if (payload.name || photoURL) {
      await updateProfile(user, {
        ...(payload.name ? { displayName: payload.name } : {}),
        ...(photoURL ? { photoURL } : {}),
      });
    }

    const dbUpdates: Record<string, unknown> = {};
    if (payload.name) dbUpdates.name = payload.name;
    if (payload.phone !== undefined) dbUpdates.phone = payload.phone || null;
    if (payload.national_id !== undefined) dbUpdates.national_id = payload.national_id || null;
    if (payload.governorate !== undefined) dbUpdates.governorate = payload.governorate || null;
    if (payload.address !== undefined) dbUpdates.address = payload.address || null;
    if (payload.age !== undefined) dbUpdates.age = payload.age;
    if (payload.education !== undefined) dbUpdates.education = payload.education || null;
    if (payload.committee !== undefined) dbUpdates.committee = payload.committee || null;
    if (photoURL) dbUpdates.photo_url = photoURL;
    if (payload.markCompleted) dbUpdates.profile_completed = true;
    if (Object.keys(dbUpdates).length) {
      await update(ref(db, `site_users/${user.uid}`), dbUpdates);
    }
  } catch (err) {
    if (err instanceof ApiException) throw err;
    throw translateFirebaseError(err);
  }
};

/** يغيّر البريد الإلكتروني (لحسابات البريد/كلمة المرور فقط) — يتطلب كلمة المرور الحالية */
export const updateVisitorEmail = async (newEmail: string, currentPassword: string): Promise<void> => {
  await reauthenticateVisitor(currentPassword);
  const user = auth.currentUser!;
  try {
    await updateEmail(user, newEmail);
    await update(ref(db, `site_users/${user.uid}`), { email: newEmail });
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/** يغيّر كلمة المرور (لحسابات البريد/كلمة المرور فقط) — يتطلب كلمة المرور الحالية */
export const updateVisitorPassword = async (newPassword: string, currentPassword: string): Promise<void> => {
  await reauthenticateVisitor(currentPassword);
  try {
    await updatePassword(auth.currentUser!, newPassword);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/**
 * يضيف كلمة مرور لحساب اتسجّل أصلًا بجوجل بس (بدون كلمة مرور) — بيربط
 * (link) بيانات دخول بريد/كلمة مرور على نفس حساب Firebase Auth الحالي،
 * بنفس البريد الإلكتروني اللي جوجل رجّعه، فيقدر بعدها يسجّل دخول
 * بالبريد وكلمة المرور دي كمان، مش بجوجل بس.
 */
export const addPasswordToAccount = async (password: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new ApiException('سجّل الدخول أولًا', 401);
  }
  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await linkWithCredential(user, credential);
    await update(ref(db, `site_users/${user.uid}`), { email: user.email });
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/* ============ Admin: Auth ============ */

// لوحة التحكم بقت متاحة لأي حساب مسجّل دخول — أول مرة يدخل بيها أي حساب
// (بجوجل أو بريد/كلمة مرور) بيتعمله سجل admins/{uid} تلقائيًا بدور "مشاهد"
// (viewer) لو معندوش سجل من قبل، بدل رفض الدخول بـ"غير مصرح". الترقية لدور
// أعلى (محرر/سوبر أدمن) لسه محصورة على سوبر أدمن من قسم المستخدمين — القيد
// ده متفروض كمان في database.rules.json (auth.uid === $uid وبس أول مرة
// وبدور viewer)، مش بس هنا.
async function ensureViewerAdminRecord(uid: string, email: string | null, name: string | null): Promise<AdminUser> {
  const adminRef = ref(db, `admins/${uid}`);
  const snap = await get(adminRef);
  if (snap.exists()) {
    return { id: uid, ...snap.val() } as AdminUser;
  }
  const record = { name: name || email || 'مستخدم جديد', email: email || '', role: 'viewer' as AdminRole };
  await set(adminRef, record);
  return { id: uid, ...record };
}

export const adminLogin = async (email: string, password: string): Promise<{ user: AdminUser }> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = await ensureViewerAdminRecord(cred.user.uid, cred.user.email, cred.user.displayName);
    return { user };
  } catch (err) {
    if (err instanceof ApiException) throw err;
    throw translateFirebaseError(err);
  }
};

/** إنشاء حساب جديد بالبريد وكلمة المرور من صفحة دخول لوحة التحكم مباشرة —
 * بيتسجّل بدور "مشاهد" فورًا (زي أي حساب بيدخل أول مرة). */
export const adminSignUpWithEmail = async (name: string, email: string, password: string): Promise<{ user: AdminUser }> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name }).catch(() => {});
    const user = await ensureViewerAdminRecord(cred.user.uid, email, name);
    return { user };
  } catch (err) {
    if (err instanceof ApiException) throw err;
    throw translateFirebaseError(err);
  }
};

async function verifyAdminAndBuild(uid: string, email: string | null, name: string | null): Promise<{ user: AdminUser }> {
  const user = await ensureViewerAdminRecord(uid, email, name);
  return { user };
}

export const adminLoginWithGoogle = async (): Promise<{ user: AdminUser }> => {
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    return await verifyAdminAndBuild(cred.user.uid, cred.user.email, cred.user.displayName);
  } catch (err) {
    if (err instanceof ApiException) throw err;
    if (needsRedirectFallback(err)) {
      await signInWithRedirect(auth, new GoogleAuthProvider());
      return new Promise(() => {}); // الصفحة هتتنقل قبل ما الوعد ده يتحل أصلًا
    }
    throw translateFirebaseError(err);
  }
};

/** بتكمل تسجيل الدخول لما الصفحة ترجع من signInWithRedirect (بديل النافذة
 * المنبثقة على الموبايل) — لازم تتنادى عند تحميل صفحة /admin/login. بترجع
 * null لو الصفحة اتفتحت عادي من غير ما تيجي من رحلة redirect. */
export const completeAdminGoogleRedirect = async (): Promise<{ user: AdminUser } | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    return await verifyAdminAndBuild(result.user.uid, result.user.email, result.user.displayName);
  } catch (err) {
    if (err instanceof ApiException) throw err;
    throw translateFirebaseError(err);
  }
};

export const adminLogout = async (): Promise<void> => {
  await signOut(auth);
};

export const adminMe = async (): Promise<AdminUser | null> => {
  const user = await waitForAuthUser();
  if (!user) return null;
  const snap = await get(ref(db, `admins/${user.uid}`));
  if (!snap.exists()) return null;
  return { id: user.uid, ...snap.val() } as AdminUser;
};

// بيسجّل هوية الأدمن اللي بينشئ المحتوى (created_by_uid/name) ودوره الحالي —
// يُستخدم في كل دوال "إنشاء/تعديل" للمحتوى القابل للنشر. المعلومة دي بتظهر
// بلوحة التحكم بس (مين نشر إيه) ومنفصلة تمامًا عن حقل "author" الاختياري
// اللي الأدمن بيكتبه بنفسه ليظهر للجمهور (زي "بقلم فلان").
async function getPublisherInfo(): Promise<{ created_by_uid: string; created_by_name: string; role: AdminRole | null }> {
  const user = auth.currentUser;
  if (!user) return { created_by_uid: '', created_by_name: 'غير معروف', role: null };
  let name = user.displayName || user.email || 'أدمن';
  let role: AdminRole | null = null;
  try {
    const snap = await get(ref(db, `admins/${user.uid}`));
    if (snap.exists()) {
      const data = snap.val() as { name?: string; role?: AdminRole };
      name = data.name || name;
      role = data.role ?? null;
    }
  } catch {
    // تعذّر قراءة بيانات الأدمن — نكتفي بالقيم الافتراضية أعلاه
  }
  return { created_by_uid: user.uid, created_by_name: name, role };
}

// المحرر (editor) عنده صلاحية النشر والتعديل بس — أي محتوى بينشئه أو يعدّله
// بيتحفظ تلقائيًا "بانتظار المراجعة" (is_published: false, pending_review:
// true) لحد ما سوبر أدمن يوافق عليه من قسم "بانتظار المراجعة". القيد ده
// مفروض هنا وأيضًا على مستوى database.rules.json (حارس أمان حقيقي، مش بس
// واجهة) — سوبر أدمن بينشر فورًا زي ما هو متوقّع من الفورم.
async function buildPublishFields(
  desiredIsPublished: boolean
): Promise<{ created_by_uid: string; created_by_name: string; is_published: boolean; pending_review: boolean }> {
  const { created_by_uid, created_by_name, role } = await getPublisherInfo();
  const isEditor = role === 'editor';
  return {
    created_by_uid,
    created_by_name,
    is_published: isEditor ? false : desiredIsPublished,
    pending_review: isEditor,
  };
}

/* ============ Admin: Events (full CRUD) ============ */
export const adminGetEvents = async (): Promise<EventItem[]> => {
  const snap = await get(ref(db, 'events'));
  return objectToArray<EventItem>(snap.val())
    .map(computeEventFields)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()) as EventItem[];
};

// FormData بدل كائن عادي عشان تدعم رفع صورة اختيارية للفعالية (زي المحافظات وقصص النجاح)
export const adminCreateEvent = async (formData: FormData): Promise<EventItem> => {
  const file = formData.get('image') as File | null;
  const title = String(formData.get('title') || '');
  const endsAt = String(formData.get('ends_at') || '');
  const price = String(formData.get('price') || '').trim();
  const organizer = String(formData.get('organizer') || '').trim();
  const data: Record<string, unknown> = {
    title,
    category: formData.get('category'),
    governorate: formData.get('governorate'),
    location: formData.get('location'),
    mode: formData.get('mode') || 'حضوري',
    starts_at: formData.get('starts_at'),
    ends_at: endsAt || null,
    description: formData.get('description'),
    seats_total: Number(formData.get('seats_total') || 1),
    price: price || null,
    organizer: organizer || null,
    art_theme: formData.get('art_theme') || 'art-1',
    author: formData.get('author') || null,
    slug: makeSlug(title),
    seats_taken: 0,
    storage_path: null,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...(await buildPublishFields(formData.get('is_published') !== 'false')),
  };
  if (file && file.size > 0) {
    const uploaded = await uploadImageToR2(file);
    data.storage_path = uploaded.storage_path;
    data.image_url = uploaded.image_url;
  }
  try {
    const newRef = push(ref(db, 'events'));
    await set(newRef, data);
    const created = { id: newRef.key!, ...data } as EventItem;
    return computeEventFields(created);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminUpdateEvent = async (id: string, formData: FormData): Promise<void> => {
  const file = formData.get('image') as File | null;
  const endsAt = String(formData.get('ends_at') || '');
  const price = String(formData.get('price') || '').trim();
  const organizer = String(formData.get('organizer') || '').trim();
  const data: Record<string, unknown> = {
    title: formData.get('title'),
    category: formData.get('category'),
    governorate: formData.get('governorate'),
    location: formData.get('location'),
    mode: formData.get('mode') || 'حضوري',
    starts_at: formData.get('starts_at'),
    ends_at: endsAt || null,
    description: formData.get('description'),
    seats_total: Number(formData.get('seats_total') || 1),
    price: price || null,
    organizer: organizer || null,
    art_theme: formData.get('art_theme') || 'art-1',
    author: formData.get('author') || null,
    updated_at: new Date().toISOString(),
    ...(await buildPublishFields(formData.get('is_published') !== 'false')),
  };
  if (file && file.size > 0) {
    const existingSnap = await get(ref(db, `events/${id}/storage_path`));
    const uploaded = await uploadImageToR2(file);
    data.storage_path = uploaded.storage_path;
    data.image_url = uploaded.image_url;
    if (existingSnap.exists()) await deleteImageFromR2(existingSnap.val());
  }
  try {
    await update(ref(db, `events/${id}`), data);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminDeleteEvent = async (id: string): Promise<void> => {
  try {
    const existingSnap = await get(ref(db, `events/${id}/storage_path`));
    await remove(ref(db, `events/${id}`));
    await remove(ref(db, `bookings/${id}`));
    if (existingSnap.exists()) await deleteImageFromR2(existingSnap.val());
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminGetEventBookings = async (eventId: string): Promise<Booking[]> => {
  const snap = await get(ref(db, `bookings/${eventId}`));
  return objectToArray<Booking>(snap.val()).map((b) => ({ ...b, event_id: eventId }));
};

/* ============ Admin: Articles (full CRUD) ============ */
export const adminGetArticles = async (): Promise<Article[]> => {
  const snap = await get(ref(db, 'articles'));
  return objectToArray<Article>(snap.val()).sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
};

export const adminCreateArticle = async (formData: FormData): Promise<Article> => {
  const file = formData.get('image') as File | null;
  if (!file || file.size === 0) {
    throw new ApiException('صورة المقال مطلوبة', 422, { image: ['صورة المقال مطلوبة'] });
  }
  const title = String(formData.get('title') || '');
  const tagsRaw = String(formData.get('tags') || '').trim();
  const uploaded = await uploadImageToR2(file);
  const data: Record<string, unknown> = {
    title,
    slug: makeSlug(title),
    category: formData.get('category'),
    governorate: formData.get('governorate') || 'عام',
    author: formData.get('author'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content'),
    tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : null,
    read_minutes: Number(formData.get('read_minutes') || 5),
    is_featured: formData.get('is_featured') === 'on',
    art_theme: 'art-1' as const,
    storage_path: uploaded.storage_path,
    image_url: uploaded.image_url,
    views: 0,
    likes: 0,
    published_at: new Date().toISOString(),
    ...(await buildPublishFields(formData.get('is_published') !== 'false')),
  };
  try {
    const newRef = push(ref(db, 'articles'));
    await set(newRef, data);
    return { id: newRef.key!, ...data } as Article;
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminUpdateArticle = async (id: string, formData: FormData): Promise<void> => {
  const file = formData.get('image') as File | null;
  const tagsRaw = String(formData.get('tags') || '').trim();
  const data: Record<string, unknown> = {
    title: formData.get('title'),
    category: formData.get('category'),
    governorate: formData.get('governorate') || 'عام',
    author: formData.get('author'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content'),
    tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : null,
    read_minutes: Number(formData.get('read_minutes') || 5),
    is_featured: formData.get('is_featured') === 'on',
    ...(await buildPublishFields(formData.get('is_published') !== 'false')),
  };
  if (file && file.size > 0) {
    const existingSnap = await get(ref(db, `articles/${id}/storage_path`));
    const uploaded = await uploadImageToR2(file);
    data.storage_path = uploaded.storage_path;
    data.image_url = uploaded.image_url;
    if (existingSnap.exists()) await deleteImageFromR2(existingSnap.val());
  }
  try {
    await update(ref(db, `articles/${id}`), data);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminDeleteArticle = async (id: string): Promise<void> => {
  try {
    await remove(ref(db, `articles/${id}`));
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/* ============ عام: تفاعل الزوار مع المقالات (مشاهدات + إعجابات) ============
 * مسموح بالكتابة على حقلي views/likes فقط لأي زائر (حتى بدون تسجيل دخول) —
 * القيد الحقيقي مفروض في database.rules.json نفسها (زيادة/نقصان بمقدار ١ فقط
 * في كل عملية)، وليس هنا. */
export const incrementArticleViews = async (id: string): Promise<void> => {
  try {
    await runTransaction(ref(db, `articles/${id}/views`), (current) => (current || 0) + 1);
  } catch {
    // فشل عدّاد المشاهدات مش عملية حرجة — تجاهله بصمت
  }
};

export const toggleArticleLike = async (id: string, liked: boolean): Promise<void> => {
  try {
    await runTransaction(ref(db, `articles/${id}/likes`), (current) => (current || 0) + (liked ? 1 : -1));
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/* ============ Admin: Programs ============ */
export const adminGetPrograms = async (): Promise<Program[]> => {
  const snap = await get(ref(db, 'programs'));
  return objectToArray<Program>(snap.val()).sort((a, b) => a.order - b.order);
};

export const adminCreateProgram = async (payload: Partial<Program>): Promise<Program> => {
  const data = { ...payload, ...(await buildPublishFields(payload.is_published ?? true)), art_theme: payload.art_theme ?? 'art-1', order: payload.order ?? 0 };
  try {
    const newRef = push(ref(db, 'programs'));
    await set(newRef, data);
    return { id: newRef.key!, ...data } as Program;
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminUpdateProgram = async (id: string, payload: Partial<Program>): Promise<void> => {
  try {
    const publishFields = await buildPublishFields(payload.is_published ?? true);
    await update(ref(db, `programs/${id}`), { ...payload, ...publishFields });
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminDeleteProgram = async (id: string): Promise<void> => {
  try {
    await remove(ref(db, `programs/${id}`));
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/* ============ Admin: Governorates ============ */
export const adminGetGovernorates = async (): Promise<Governorate[]> => {
  const snap = await get(ref(db, 'governorates'));
  return objectToArray<Governorate>(snap.val()).sort((a, b) => a.order - b.order);
};

// FormData بدل كائن عادي عشان تدعم رفع صورة اختيارية للمحافظة (زي قصص النجاح)
export const adminCreateGovernorate = async (formData: FormData): Promise<Governorate> => {
  const file = formData.get('image') as File | null;
  const data: Record<string, unknown> = {
    name: formData.get('name'),
    tagline: formData.get('tagline'),
    population: formData.get('population'),
    projects_completed: Number(formData.get('projects_completed') || 0),
    completion_percentage: Number(formData.get('completion_percentage') || 0),
    art_theme: formData.get('art_theme') || 'art-1',
    order: Number(formData.get('order') || 0),
    author: formData.get('author') || null,
    slug: makeSlug(String(formData.get('name') || '')),
    storage_path: null,
    image_url: null,
    ...(await buildPublishFields(formData.get('is_published') !== 'false')),
  };
  if (file && file.size > 0) {
    const uploaded = await uploadImageToR2(file);
    data.storage_path = uploaded.storage_path;
    data.image_url = uploaded.image_url;
  }
  try {
    const newRef = push(ref(db, 'governorates'));
    await set(newRef, data);
    return { id: newRef.key!, ...data } as Governorate;
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminUpdateGovernorate = async (id: string, formData: FormData): Promise<void> => {
  const file = formData.get('image') as File | null;
  const data: Record<string, unknown> = {
    name: formData.get('name'),
    tagline: formData.get('tagline'),
    population: formData.get('population'),
    projects_completed: Number(formData.get('projects_completed') || 0),
    completion_percentage: Number(formData.get('completion_percentage') || 0),
    art_theme: formData.get('art_theme') || 'art-1',
    order: Number(formData.get('order') || 0),
    author: formData.get('author') || null,
    ...(await buildPublishFields(formData.get('is_published') !== 'false')),
  };
  if (file && file.size > 0) {
    const existingSnap = await get(ref(db, `governorates/${id}/storage_path`));
    const uploaded = await uploadImageToR2(file);
    data.storage_path = uploaded.storage_path;
    data.image_url = uploaded.image_url;
    if (existingSnap.exists()) await deleteImageFromR2(existingSnap.val());
  }
  try {
    await update(ref(db, `governorates/${id}`), data);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminDeleteGovernorate = async (id: string): Promise<void> => {
  try {
    await remove(ref(db, `governorates/${id}`));
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/* ============ Admin: Success stories ============ */
export const adminGetSuccessStories = async (): Promise<SuccessStory[]> => {
  const snap = await get(ref(db, 'success_stories'));
  return objectToArray<SuccessStory>(snap.val()).sort((a, b) => a.order - b.order);
};

export const adminCreateSuccessStory = async (formData: FormData): Promise<SuccessStory> => {
  const file = formData.get('image') as File | null;
  const name = String(formData.get('name') || '');
  const data: Record<string, unknown> = {
    name,
    slug: makeSlug(name),
    role_title: formData.get('role_title'),
    governorate: formData.get('governorate') || null,
    quote: formData.get('quote'),
    full_story: formData.get('full_story') || null,
    order: Number(formData.get('order') || 0),
    author: formData.get('author') || null,
    storage_path: null,
    image_url: null,
    ...(await buildPublishFields(formData.get('is_published') !== 'false')),
  };
  if (file && file.size > 0) {
    const uploaded = await uploadImageToR2(file);
    data.storage_path = uploaded.storage_path;
    data.image_url = uploaded.image_url;
  }
  try {
    const newRef = push(ref(db, 'success_stories'));
    await set(newRef, data);
    return { id: newRef.key!, ...data } as SuccessStory;
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminUpdateSuccessStory = async (id: string, formData: FormData): Promise<void> => {
  const file = formData.get('image') as File | null;
  const data: Record<string, unknown> = {
    name: formData.get('name'),
    role_title: formData.get('role_title'),
    governorate: formData.get('governorate') || null,
    quote: formData.get('quote'),
    full_story: formData.get('full_story') || null,
    order: Number(formData.get('order') || 0),
    author: formData.get('author') || null,
    ...(await buildPublishFields(formData.get('is_published') !== 'false')),
  };
  if (file && file.size > 0) {
    const existingSnap = await get(ref(db, `success_stories/${id}/storage_path`));
    const uploaded = await uploadImageToR2(file);
    data.storage_path = uploaded.storage_path;
    data.image_url = uploaded.image_url;
    if (existingSnap.exists()) await deleteImageFromR2(existingSnap.val());
  }
  try {
    await update(ref(db, `success_stories/${id}`), data);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminDeleteSuccessStory = async (id: string): Promise<void> => {
  try {
    const existingSnap = await get(ref(db, `success_stories/${id}/storage_path`));
    await remove(ref(db, `success_stories/${id}`));
    if (existingSnap.exists()) await deleteImageFromR2(existingSnap.val());
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/* ============ رفع الصور عبر Cloudflare R2 (معرض الصور، قصص النجاح، صور البروفايل) ============ */
/** هيدر Authorization: Bearer <idToken> — راوت /api/upload بيتحقق منه قبل أي
 * رفع/حذف صورة (كان مفتوحًا بالكامل لأي زائر مجهول قبل مراجعة أمنية). */
async function authHeader(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function uploadImageToR2(
  file: File,
  folder: 'gallery' | 'avatars' | 'branding' = 'gallery'
): Promise<{ storage_path: string; image_url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const headers = await authHeader();
  const res = await fetch('/api/upload', { method: 'POST', headers, body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'فشل رفع الصورة' }));
    throw new ApiException(body.message || 'فشل رفع الصورة', res.status);
  }
  return res.json();
}

export const adminGetGallery = async (): Promise<GalleryImage[]> => {
  const snap = await get(ref(db, 'gallery_images'));
  return objectToArray<GalleryImage>(snap.val()).sort((a, b) => a.order - b.order);
};

export const adminCreateGalleryImage = async (formData: FormData): Promise<GalleryImage> => {
  const file = formData.get('image') as File | null;
  const data: Record<string, unknown> = {
    title: formData.get('title'),
    caption: formData.get('caption') || null,
    album_id: formData.get('album_id') || null,
    art_theme: formData.get('art_theme') || 'art-1',
    order: Number(formData.get('order') || 0),
    author: formData.get('author') || null,
    storage_path: null,
    image_url: null,
    ...(await buildPublishFields(formData.get('is_published') !== 'false')),
  };
  if (file && file.size > 0) {
    const uploaded = await uploadImageToR2(file);
    data.storage_path = uploaded.storage_path;
    data.image_url = uploaded.image_url;
  }
  try {
    const newRef = push(ref(db, 'gallery_images'));
    await set(newRef, data);
    return { id: newRef.key!, ...data } as GalleryImage;
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

async function deleteImageFromR2(storagePath: string): Promise<void> {
  try {
    const headers = await authHeader();
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ storage_path: storagePath }),
    });
  } catch {
    // فشل حذف الملف القديم لا يجب أن يوقف باقي العملية
  }
}

export const adminUpdateGalleryImage = async (id: string, formData: FormData): Promise<void> => {
  const file = formData.get('image') as File | null;
  const data: Record<string, unknown> = {
    title: formData.get('title'),
    caption: formData.get('caption') || null,
    album_id: formData.get('album_id') || null,
    art_theme: formData.get('art_theme') || 'art-1',
    order: Number(formData.get('order') || 0),
    author: formData.get('author') || null,
    ...(await buildPublishFields(formData.get('is_published') !== 'false')),
  };
  if (file && file.size > 0) {
    const existingSnap = await get(ref(db, `gallery_images/${id}/storage_path`));
    const uploaded = await uploadImageToR2(file);
    data.storage_path = uploaded.storage_path;
    data.image_url = uploaded.image_url;
    if (existingSnap.exists()) await deleteImageFromR2(existingSnap.val());
  }
  try {
    await update(ref(db, `gallery_images/${id}`), data);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminDeleteGalleryImage = async (id: string): Promise<void> => {
  try {
    const existingSnap = await get(ref(db, `gallery_images/${id}/storage_path`));
    await remove(ref(db, `gallery_images/${id}`));
    if (existingSnap.exists()) await deleteImageFromR2(existingSnap.val());
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

// يرفع أكتر من صورة دفعة واحدة (بألبوم/نمط/حالة نشر مشتركة) — كل صورة بتترفع
// بالتتابع عشان نقدر نبلّغ عن نسبة التقدم لحظة بلحظة بدل انتظار الكل مرة واحدة.
export const adminCreateGalleryImagesBulk = async (
  files: File[],
  meta: { album_id: string | null; art_theme: string; is_published: boolean; startOrder: number },
  onProgress?: (done: number, total: number) => void
): Promise<GalleryImage[]> => {
  const results: GalleryImage[] = [];
  const publishFields = await buildPublishFields(meta.is_published);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const uploaded = await uploadImageToR2(file);
      const data: Record<string, unknown> = {
        title: file.name.replace(/\.[^./\\]+$/, '') || `صورة ${meta.startOrder + i + 1}`,
        caption: null,
        album_id: meta.album_id,
        art_theme: meta.art_theme,
        order: meta.startOrder + i,
        storage_path: uploaded.storage_path,
        image_url: uploaded.image_url,
        ...publishFields,
      };
      const newRef = push(ref(db, 'gallery_images'));
      await set(newRef, data);
      results.push({ id: newRef.key!, ...data } as GalleryImage);
    } catch (err) {
      throw translateFirebaseError(err);
    } finally {
      onProgress?.(i + 1, files.length);
    }
  }
  return results;
};

/* ============ Admin: ألبومات معرض الصور ============ */
export const adminGetAlbums = async (): Promise<GalleryAlbum[]> => {
  const snap = await get(ref(db, 'gallery_albums'));
  return objectToArray<GalleryAlbum>(snap.val()).sort((a, b) => a.order - b.order);
};

export const adminCreateAlbum = async (payload: { title: string; description?: string; order?: number; is_published?: boolean }): Promise<GalleryAlbum> => {
  const data = {
    title: payload.title,
    description: payload.description || null,
    order: payload.order ?? 0,
    created_at: new Date().toISOString(),
    ...(await buildPublishFields(payload.is_published ?? true)),
  };
  try {
    const newRef = push(ref(db, 'gallery_albums'));
    await set(newRef, data);
    return { id: newRef.key!, ...data } as GalleryAlbum;
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminUpdateAlbum = async (id: string, payload: Partial<{ title: string; description: string | null; order: number; is_published: boolean }>): Promise<void> => {
  try {
    const publishFields = await buildPublishFields(payload.is_published ?? true);
    await update(ref(db, `gallery_albums/${id}`), { ...payload, ...publishFields });
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

// حذف ألبوم بيشيل الصور اللي جواه كمان (وملفاتها من R2) — عشان محدش يفضل
// معلّق بألبوم مش موجود.
export const adminDeleteAlbum = async (id: string): Promise<void> => {
  try {
    const imagesSnap = await get(ref(db, 'gallery_images'));
    const images = objectToArray<GalleryImage>(imagesSnap.val()).filter((g) => g.album_id === id);
    for (const img of images) {
      await remove(ref(db, `gallery_images/${img.id}`));
      if (img.storage_path) await deleteImageFromR2(img.storage_path);
    }
    await remove(ref(db, `gallery_albums/${id}`));
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

// ينسب مجموعة صور موجودة بالفعل لألبوم معيّن دفعة واحدة (multi-path update)
// — بيُستخدم في اختيار "صور قديمة" من المعرض لضمّها لألبوم بدل رفعها تاني.
// albumId = null معناه فكّ الربط (نقل الصور لقسم "بدون ألبوم"). لو محرر هو
// اللي بينفّذها، لازم كمان نفرض is_published=false على كل صورة (زي أي تعديل
// تاني منه) وإلا database.rules.json هترفض الكتابة بالكامل.
export const adminAssignImagesToAlbum = async (imageIds: string[], albumId: string | null): Promise<void> => {
  if (imageIds.length === 0) return;
  const { role } = await getPublisherInfo();
  const isEditor = role === 'editor';
  const dbUpdates: Record<string, string | boolean | null> = {};
  for (const id of imageIds) {
    dbUpdates[`gallery_images/${id}/album_id`] = albumId;
    if (isEditor) {
      dbUpdates[`gallery_images/${id}/is_published`] = false;
      dbUpdates[`gallery_images/${id}/pending_review`] = true;
    }
  }
  try {
    await update(ref(db), dbUpdates);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/* ============ Admin: Contact messages (قراءة فقط) ============ */
interface ContactMessageRecord {
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export const adminGetContactMessages = async (): Promise<(ContactMessageRecord & { id: string })[]> => {
  const snap = await get(ref(db, 'contact_messages'));
  return objectToArray<ContactMessageRecord>(snap.val()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

/* ============ Admin: Users (super_admin only) ============ */
// بيعدّ عدد السوبر أدمن الفعلي مباشرة من admins/ وقت الطلب، بدل الاعتماد على
// عدّاد منفصل (admin_meta/super_admin_count) كان بينحرف عن الواقع لو أول
// سوبر أدمن (الحساب الأساسي المزروع يدويًا) ما زادش العدّاد وقت إنشائه —
// فكان بيمنع حذف/تخفيض أي سوبر أدمن تاني بالغلط ظانًا إنه "الأخير المتبقي"
// حتى لو فيه أكتر من واحد فعليًا. العدّ المباشر مايعرفش ينحرف عن الحقيقة.
async function countSuperAdmins(): Promise<number> {
  const snap = await get(ref(db, 'admins'));
  return objectToArray<AdminUser>(snap.val()).filter((a) => a.role === 'super_admin').length;
}

/** بيسرد كل حساب موجود فعليًا في Firebase Authentication (عبر Admin SDK،
 * راجع app/api/admin/list-users) — مش بس اللي كتب سجل site_users. */
export const adminListAllAccounts = async (): Promise<FirebaseAccountRow[]> => {
  const headers = await authHeader();
  const res = await fetch('/api/admin/list-users', { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'تعذّر جلب قائمة الحسابات' }));
    throw new ApiException(body.message || 'تعذّر جلب قائمة الحسابات', res.status);
  }
  const body = (await res.json()) as { users: FirebaseAccountRow[] };
  return body.users;
};

export const adminCreateUser = async (payload: AdminUserPayload): Promise<AdminUser> => {
  if (!payload.password) {
    throw new ApiException('كلمة المرور مطلوبة', 422, { password: ['كلمة المرور مطلوبة'] });
  }
  const secondaryAuth = getSecondaryAuth();
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, payload.email, payload.password);
    const uid = cred.user.uid;
    const adminData = { name: payload.name, email: payload.email, role: payload.role };
    await set(ref(db, `admins/${uid}`), adminData);
    await sendEmailVerification(cred.user, authActionCodeSettings()).catch(() => {
      // فشل إرسال إيميل التفعيل مش لازم يوقف إنشاء الحساب نفسه
    });
    await signOut(secondaryAuth);
    return { id: uid, ...adminData };
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

// ملاحظة: لا يمكن من طرف العميل تغيير كلمة مرور أو بريد حساب أدمن آخر (قيد Firebase Auth SDK)
// — استخدم sendAdminPasswordReset لإرسال رابط إعادة تعيين، والاسم/الدور فقط قابلان للتعديل هنا.
export const adminUpdateUser = async (uid: string, payload: Partial<AdminUserPayload>): Promise<void> => {
  const snap = await get(ref(db, `admins/${uid}`));
  const current = snap.val() as AdminUser | null;
  if (!current) throw new ApiException('المستخدم غير موجود', 404);

  if (payload.role && current.role === 'super_admin' && payload.role !== 'super_admin') {
    if (current.email === PROTECTED_SUPER_ADMIN_EMAIL) {
      throw new ApiException('لا يمكن تغيير دور السوبر أدمن الرئيسي', 422);
    }
    // السوبر أدمن الرئيسي المحمي وجوده مضمون دايمًا (غير قابل للحذف أو
    // التخفيض)، فلو هو اللي بينفّذ التخفيض، قيد "آخر سوبر أدمن متبقٍّ"
    // مالوش داعي يوقفه — النظام مايُقفلش أبدًا مهما عمل.
    const isCallerProtected = auth.currentUser?.email === PROTECTED_SUPER_ADMIN_EMAIL;
    if (!isCallerProtected && (await countSuperAdmins()) <= 1) {
      throw new ApiException('لا يمكن تغيير دور آخر Super Admin متبقٍّ', 422);
    }
  }

  const updates: Record<string, unknown> = {};
  if (payload.name) updates.name = payload.name;
  if (payload.role) updates.role = payload.role;

  try {
    await update(ref(db, `admins/${uid}`), updates);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const sendAdminPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email, authActionCodeSettings());
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/** نفس sendAdminPasswordReset باسم عام — تُستخدم من نموذج "نسيت كلمة المرور"
 * في صفحتَي دخول الزوار والأدمن (الدالة مش مقصورة على صلاحية معيّنة أصلًا). */
export const sendPasswordReset = sendAdminPasswordReset;

/** يتأكد إن رابط إعادة تعيين كلمة المرور (oobCode) لسه صالح، ويرجّع البريد
 * الإلكتروني المرتبط بيه — بيُستخدم في صفحة /auth/action قبل عرض نموذج
 * كلمة المرور الجديدة. */
export const verifyPasswordResetLink = async (oobCode: string): Promise<string> => {
  try {
    return await verifyPasswordResetCode(auth, oobCode);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/** يطبّق كلمة المرور الجديدة فعليًا بعد التأكد من صلاحية الرابط */
export const confirmPasswordResetLink = async (oobCode: string, newPassword: string): Promise<void> => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/** يفعّل رابط تفعيل/تأكيد البريد الإلكتروني (verifyEmail) — بيُستخدم في صفحة /auth/action */
export const confirmEmailVerificationLink = async (oobCode: string): Promise<void> => {
  try {
    await applyActionCode(auth, oobCode);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

// يمنح زائر موجود بالفعل صلاحية أدمن مباشرة على نفس حساب Firebase Auth بتاعه
// (بعكس adminCreateUser اللي بيعمل حساب Auth جديد بالكامل) — مفيد لترقية زائر
// اتسجل بجوجل أو بالبريد لدور إداري من غير ما يحتاج حساب تاني.
export const adminPromoteSiteUser = async (uid: string, payload: { name: string; email: string; role: AdminRole }): Promise<void> => {
  const existing = await get(ref(db, `admins/${uid}`));
  if (existing.exists()) {
    throw new ApiException('هذا المستخدم أدمن بالفعل', 422);
  }
  try {
    await set(ref(db, `admins/${uid}`), payload);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/**
 * حذف نهائي وكامل لحساب مستخدم (أدمن أو زائر عادي): حساب Firebase
 * Authentication نفسه + /site_users + /admins لو موجود + كل حجوزاته + صورة
 * بروفايله من R2. سوبر أدمن فقط. ينفّذ عبر app/api/admin/delete-user لأن
 * حذف حساب مصادقة مستخدم تاني مش ممكن من الـ Client SDK إطلاقًا — محتاج
 * Admin SDK بمفتاح خدمة سيرفر-فقط (راجع lib/firebaseAdmin.ts).
 */
export const adminDeleteUserCompletely = async (uid: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new ApiException('سجّل الدخول أولًا', 401);
  const idToken = await user.getIdToken();
  const res = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ uid }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'تعذّر حذف الحساب' }));
    throw new ApiException(body.message || 'تعذّر حذف الحساب', res.status);
  }
};

/* ============ Admin: بانتظار المراجعة (سوبر أدمن فقط) ============ */

export type PendingCollection =
  | 'events' | 'articles' | 'programs' | 'governorates' | 'success_stories' | 'gallery_images' | 'gallery_albums';

export interface PendingReviewItem {
  id: string;
  collection: PendingCollection;
  collectionLabel: string;
  title: string;
  created_by_name?: string;
}

const PENDING_COLLECTIONS: { key: PendingCollection; label: string }[] = [
  { key: 'events', label: 'فعالية' },
  { key: 'articles', label: 'مقال' },
  { key: 'programs', label: 'برنامج' },
  { key: 'governorates', label: 'محافظة' },
  { key: 'success_stories', label: 'قصة نجاح' },
  { key: 'gallery_images', label: 'صورة معرض' },
  { key: 'gallery_albums', label: 'ألبوم صور' },
];

// بيجمع كل العناصر "بانتظار المراجعة" (pending_review) من كل أنواع المحتوى
// السبعة في قائمة واحدة موحّدة — يُستخدم في قسم "بانتظار المراجعة" الجديد.
export const adminGetPendingReviewItems = async (): Promise<PendingReviewItem[]> => {
  const results: PendingReviewItem[] = [];
  for (const { key, label } of PENDING_COLLECTIONS) {
    const snap = await get(ref(db, key));
    const items = objectToArray(snap.val() ?? {}) as Array<
      { id: string; title?: string; name?: string; pending_review?: boolean; created_by_name?: string }
    >;
    for (const item of items) {
      if (item.pending_review) {
        results.push({
          id: item.id,
          collection: key,
          collectionLabel: label,
          title: item.title || item.name || '—',
          created_by_name: item.created_by_name,
        });
      }
    }
  }
  return results;
};

/** يوافق على عنصر معلَّق وينشره فعليًا — سوبر أدمن فقط (مفروض في database.rules.json) */
export const adminApprovePendingItem = async (collection: PendingCollection, id: string): Promise<void> => {
  try {
    await update(ref(db, `${collection}/${id}`), { is_published: true, pending_review: false });
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

// بيرفض عنصر معلَّق بحذفه نهائيًا — بيستخدم دالة الحذف الأصلية لكل نوع (مش
// remove() مباشرة) عشان يتنضّف أي ملف مرفوع على R2 مرتبط بيه كمان.
export const adminRejectPendingItem = async (collection: PendingCollection, id: string): Promise<void> => {
  switch (collection) {
    case 'events': return adminDeleteEvent(id);
    case 'articles': return adminDeleteArticle(id);
    case 'programs': return adminDeleteProgram(id);
    case 'governorates': return adminDeleteGovernorate(id);
    case 'success_stories': return adminDeleteSuccessStory(id);
    case 'gallery_images': return adminDeleteGalleryImage(id);
    case 'gallery_albums': return adminDeleteAlbum(id);
  }
};

/* ============ Admin: إعدادات الموقع (سوبر أدمن فقط) ============ */
// القراءة العامة (getSiteSettings) منقولة إلى publicApi.ts زي باقي القراءات
// العامة — بتحتاج تشتغل من أي مكان (فوتر، صفحة تواصل) بدون Firebase SDK.

export const adminUpdateSiteSettings = async (payload: SiteSettings): Promise<void> => {
  try {
    await update(ref(db, 'site_settings'), payload as Record<string, unknown>);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/** رفع/استبدال شعار الموقع — بيحذف الشعار القديم من R2 لو موجود، وبيرجّع
 * المسار والرابط الجديدين عشان يُضافوا لباقي حقول إعدادات الموقع في نفس الحفظة. */
export const adminUploadSiteLogo = async (file: File): Promise<{ storage_path: string; image_url: string }> => {
  const existingSnap = await get(ref(db, 'site_settings/logo_storage_path'));
  const uploaded = await uploadImageToR2(file, 'branding');
  if (existingSnap.exists()) await deleteImageFromR2(existingSnap.val());
  return uploaded;
};
