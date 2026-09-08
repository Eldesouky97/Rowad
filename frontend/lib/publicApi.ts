// ملاحظة مهمة: هذا الملف يُستخدم من Server Components (مثل صفحة تفاصيل المقال)
// التي تُنفَّذ على السيرفر وقت البناء/الطلب. يجب ألا يستورد أي شيء من حزمة
// "firebase" (SDK) بشكل ساكن — استيراد كهذا يحاول تهيئة Firebase Auth فورًا
// وقت تحميل الموديول، وهذا يفشل في بيئة الخادم. القراءات هنا REST خالصة
// (fetch عادي عبر firebaseHelpers، وهي بدورها لا تستورد Firebase SDK إطلاقًا).
import { objectToArray, restGet, restPost, computeEventFields, ApiException } from './firebaseHelpers';
import type { Article, EventItem, Program, Governorate, SuccessStory, GalleryImage, GalleryAlbum, ContactMessagePayload, SiteSettings } from './types';

export { ApiException };

/* ============ Public: Events ============ */
export const getEvents = async (status: 'all' | 'upcoming' | 'past' = 'all'): Promise<EventItem[]> => {
  const raw = await restGet<Record<string, EventItem>>('events');
  let list = objectToArray(raw)
    .filter((e) => e.is_published)
    .map(computeEventFields) as EventItem[];
  if (status !== 'all') list = list.filter((e) => e.status === status);
  list.sort((a, b) =>
    status === 'past'
      ? new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
      : new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
  return list;
};

export const getEvent = async (slug: string): Promise<EventItem> => {
  const raw = await restGet<Record<string, EventItem>>('events');
  const found = objectToArray(raw)
    .filter((e) => e.is_published)
    .map(computeEventFields)
    .find((e) => e.slug === slug);
  if (!found) throw new ApiException('الفعالية غير موجودة', 404);
  return found as EventItem;
};

/* ============ Public: Articles ============ */
export const getArticles = async (params: { category?: string; q?: string } = {}): Promise<Article[]> => {
  const raw = await restGet<Record<string, Article>>('articles');
  let list = objectToArray(raw).filter((a) => a.is_published) as Article[];
  if (params.category && params.category !== 'الكل') {
    list = list.filter((a) => a.category === params.category);
  }
  if (params.q) {
    const q = params.q.trim();
    list = list.filter(
      (a) => a.title.includes(q) || a.excerpt.includes(q) || a.author.includes(q) || (a.tags ?? []).some((tag) => tag === q)
    );
  }
  list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return list;
};

export const getArticle = async (slug: string): Promise<Article> => {
  const raw = await restGet<Record<string, Article>>('articles');
  const found = objectToArray(raw)
    .filter((a) => a.is_published)
    .find((a) => a.slug === slug);
  if (!found) throw new ApiException('المقال غير موجود', 404);
  return found as Article;
};

/* ============ Public: Contact ============ */
export const sendContactMessage = async (payload: ContactMessagePayload): Promise<{ message: string }> => {
  await restPost('contact_messages', {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    governorate: payload.governorate ?? null,
    message: payload.message,
    is_read: false,
    created_at: new Date().toISOString(),
  });
  return { message: 'تم استلام رسالتك بنجاح' };
};

/* ============ Public: Programs / Governorates / Success stories / Gallery ============ */
export const getPrograms = async (): Promise<Program[]> => {
  const raw = await restGet<Record<string, Program>>('programs');
  return objectToArray(raw)
    .filter((p) => p.is_published)
    .sort((a, b) => a.order - b.order) as Program[];
};

export const getGovernorates = async (): Promise<Governorate[]> => {
  const raw = await restGet<Record<string, Governorate>>('governorates');
  return objectToArray(raw)
    .filter((g) => g.is_published)
    .sort((a, b) => a.order - b.order) as Governorate[];
};

export const getGovernorate = async (slug: string): Promise<Governorate> => {
  const raw = await restGet<Record<string, Governorate>>('governorates');
  const found = objectToArray(raw)
    .filter((g) => g.is_published)
    .find((g) => g.slug === slug);
  if (!found) throw new ApiException('المحافظة غير موجودة', 404);
  return found as Governorate;
};

export const getSuccessStories = async (): Promise<SuccessStory[]> => {
  const raw = await restGet<Record<string, SuccessStory>>('success_stories');
  return objectToArray(raw)
    .filter((s) => s.is_published)
    .sort((a, b) => a.order - b.order) as SuccessStory[];
};

export const getGallery = async (): Promise<GalleryImage[]> => {
  const raw = await restGet<Record<string, GalleryImage>>('gallery_images');
  return objectToArray(raw)
    .filter((g) => g.is_published)
    .sort((a, b) => a.order - b.order) as GalleryImage[];
};

export const getGalleryAlbums = async (): Promise<GalleryAlbum[]> => {
  const raw = await restGet<Record<string, GalleryAlbum>>('gallery_albums');
  return objectToArray(raw)
    .filter((a) => a.is_published)
    .sort((a, b) => a.order - b.order) as GalleryAlbum[];
};

/** إعدادات الموقع العامة (تواصل، سوشيال ميديا، إظهار/إخفاء أقسام) — سجل واحد لا مجموعة */
export const getSiteSettings = async (): Promise<SiteSettings> => {
  const raw = await restGet<SiteSettings>('site_settings');
  return raw || {};
};
