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
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  linkWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth';
import { auth, db, getSecondaryAuth } from './firebase';
import { objectToArray, restGet, makeSlug, makeConfirmationCode, computeEventFields, ApiException } from './firebaseHelpers';
import type {
  ArticleItemPayload,
  Article,
  EventItem,
  EventItemPayload,
  Booking,
  AdminUser,
  AdminUserPayload,
  AdminRole,
  SiteUser,
  Program,
  Governorate,
  SuccessStory,
  GalleryImage,
  GalleryAlbum,
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
  getSuccessStories,
  getGallery,
  getGalleryAlbums,
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
  return new ApiException(message || 'حدث خطأ غير متوقع', 500);
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

export const adminLogin = async (email: string, password: string): Promise<{ user: AdminUser }> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await get(ref(db, `admins/${cred.user.uid}`));
    if (!snap.exists()) {
      await signOut(auth);
      throw new ApiException('هذا الحساب غير مصرح له بالدخول للوحة التحكم', 403);
    }
    return { user: { id: cred.user.uid, ...snap.val() } as AdminUser };
  } catch (err) {
    if (err instanceof ApiException) throw err;
    throw translateFirebaseError(err);
  }
};

export const adminLoginWithGoogle = async (): Promise<{ user: AdminUser }> => {
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    const snap = await get(ref(db, `admins/${cred.user.uid}`));
    if (!snap.exists()) {
      await signOut(auth);
      throw new ApiException('هذا الحساب غير مصرح له بالدخول للوحة التحكم', 403);
    }
    return { user: { id: cred.user.uid, ...snap.val() } as AdminUser };
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

/* ============ Admin: Events (full CRUD) ============ */
export const adminGetEvents = async (): Promise<EventItem[]> => {
  const snap = await get(ref(db, 'events'));
  return objectToArray<EventItem>(snap.val())
    .map(computeEventFields)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()) as EventItem[];
};

export const adminCreateEvent = async (payload: EventItemPayload): Promise<EventItem> => {
  const data = {
    ...payload,
    slug: makeSlug(payload.title),
    mode: payload.mode ?? 'حضوري',
    art_theme: payload.art_theme ?? 'art-1',
    is_published: payload.is_published ?? true,
    seats_taken: 0,
    ends_at: payload.ends_at ?? null,
    price: payload.price ?? null,
    organizer: payload.organizer ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  try {
    const newRef = push(ref(db, 'events'));
    await set(newRef, data);
    return computeEventFields({ id: newRef.key!, ...data }) as EventItem;
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminUpdateEvent = async (id: string, payload: Partial<EventItemPayload>): Promise<void> => {
  try {
    await update(ref(db, `events/${id}`), { ...payload, updated_at: new Date().toISOString() });
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminDeleteEvent = async (id: string): Promise<void> => {
  try {
    await remove(ref(db, `events/${id}`));
    await remove(ref(db, `bookings/${id}`));
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

export const adminCreateArticle = async (payload: ArticleItemPayload): Promise<Article> => {
  const data = {
    ...payload,
    slug: makeSlug(payload.title),
    governorate: payload.governorate ?? 'عام',
    tags: payload.tags ?? null,
    read_minutes: payload.read_minutes ?? 5,
    is_featured: payload.is_featured ?? false,
    is_published: payload.is_published ?? true,
    art_theme: 'art-1' as const,
    views: 0,
    likes: 0,
    published_at: new Date().toISOString(),
  };
  try {
    const newRef = push(ref(db, 'articles'));
    await set(newRef, data);
    return { id: newRef.key!, ...data } as Article;
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminUpdateArticle = async (id: string, payload: Partial<ArticleItemPayload>): Promise<void> => {
  try {
    await update(ref(db, `articles/${id}`), payload);
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

/* ============ Admin: Programs ============ */
export const adminGetPrograms = async (): Promise<Program[]> => {
  const snap = await get(ref(db, 'programs'));
  return objectToArray<Program>(snap.val()).sort((a, b) => a.order - b.order);
};

export const adminCreateProgram = async (payload: Partial<Program>): Promise<Program> => {
  const data = { ...payload, art_theme: payload.art_theme ?? 'art-1', order: payload.order ?? 0, is_published: payload.is_published ?? true };
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
    await update(ref(db, `programs/${id}`), payload);
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

export const adminCreateGovernorate = async (payload: Partial<Governorate>): Promise<Governorate> => {
  const data = {
    ...payload,
    slug: makeSlug(payload.name ?? ''),
    art_theme: payload.art_theme ?? 'art-1',
    order: payload.order ?? 0,
    is_published: payload.is_published ?? true,
  };
  try {
    const newRef = push(ref(db, 'governorates'));
    await set(newRef, data);
    return { id: newRef.key!, ...data } as Governorate;
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminUpdateGovernorate = async (id: string, payload: Partial<Governorate>): Promise<void> => {
  try {
    await update(ref(db, `governorates/${id}`), payload);
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
  const data: Record<string, unknown> = {
    name: formData.get('name'),
    role_title: formData.get('role_title'),
    governorate: formData.get('governorate') || null,
    quote: formData.get('quote'),
    order: Number(formData.get('order') || 0),
    is_published: formData.get('is_published') !== 'false',
    storage_path: null,
    image_url: null,
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
    order: Number(formData.get('order') || 0),
    is_published: formData.get('is_published') !== 'false',
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
async function uploadImageToR2(
  file: File,
  folder: 'gallery' | 'avatars' = 'gallery'
): Promise<{ storage_path: string; image_url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
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
    is_published: formData.get('is_published') !== 'false',
    storage_path: null,
    image_url: null,
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
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
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
    is_published: formData.get('is_published') !== 'false',
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
        is_published: meta.is_published,
        storage_path: uploaded.storage_path,
        image_url: uploaded.image_url,
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
    is_published: payload.is_published ?? true,
    created_at: new Date().toISOString(),
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
    await update(ref(db, `gallery_albums/${id}`), payload);
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
async function adjustSuperAdminCount(delta: number): Promise<void> {
  await runTransaction(ref(db, 'admin_meta/super_admin_count'), (current) => Math.max(0, (current ?? 0) + delta));
}

export const adminGetUsers = async (): Promise<AdminUser[]> => {
  const snap = await get(ref(db, 'admins'));
  return objectToArray<AdminUser>(snap.val());
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
    if (payload.role === 'super_admin') await adjustSuperAdminCount(1);
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
    const countSnap = await get(ref(db, 'admin_meta/super_admin_count'));
    if ((countSnap.val() ?? 1) <= 1) {
      throw new ApiException('لا يمكن تغيير دور آخر Super Admin متبقٍّ', 422);
    }
  }

  const updates: Record<string, unknown> = {};
  if (payload.name) updates.name = payload.name;
  if (payload.role) updates.role = payload.role;

  try {
    await update(ref(db, `admins/${uid}`), updates);
    if (payload.role && payload.role !== current.role) {
      if (current.role === 'super_admin') await adjustSuperAdminCount(-1);
      if (payload.role === 'super_admin') await adjustSuperAdminCount(1);
    }
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const adminDeleteUser = async (uid: string): Promise<void> => {
  if (auth.currentUser?.uid === uid) {
    throw new ApiException('لا يمكنك حذف حسابك الخاص', 422);
  }
  const snap = await get(ref(db, `admins/${uid}`));
  const target = snap.val() as AdminUser | null;
  if (!target) throw new ApiException('المستخدم غير موجود', 404);
  if (target.email === PROTECTED_SUPER_ADMIN_EMAIL) {
    throw new ApiException('لا يمكن حذف السوبر أدمن الرئيسي', 422);
  }
  if (target.role === 'super_admin') {
    const countSnap = await get(ref(db, 'admin_meta/super_admin_count'));
    if ((countSnap.val() ?? 1) <= 1) {
      throw new ApiException('لا يمكن حذف آخر Super Admin متبقٍّ', 422);
    }
  }
  try {
    await remove(ref(db, `admins/${uid}`));
    if (target.role === 'super_admin') await adjustSuperAdminCount(-1);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

export const sendAdminPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

/* ============ Admin: كل المستخدمين المسجلين في الموقع (زوار عاديون) ============ */
export const adminGetSiteUsers = async (): Promise<SiteUser[]> => {
  const snap = await get(ref(db, 'site_users'));
  return objectToArray<SiteUser>(snap.val()).sort(
    (a, b) => new Date(b.last_login_at || 0).getTime() - new Date(a.last_login_at || 0).getTime()
  );
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
    if (payload.role === 'super_admin') await adjustSuperAdminCount(1);
  } catch (err) {
    throw translateFirebaseError(err);
  }
};

// بيشيل بروفايل الزائر من /site_users بس — حساب Firebase Auth بتاعه بيفضل
// شغال (مفيش طريقة نحذفه فعليًا من غير Admin SDK)، فهيظهر تاني لو سجّل دخول.
// استخدم adminDeleteUserCompletely لحذف حقيقي شامل بما فيه حساب المصادقة.
export const adminDeleteSiteUser = async (uid: string): Promise<void> => {
  try {
    await remove(ref(db, `site_users/${uid}`));
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
