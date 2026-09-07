import type {
  ArticleItemPayload,
  ContactMessagePayload,
  Article,
  EventItem,
  EventItemPayload,
  Booking,
  AdminUser,
  AdminUserPayload,
  ApiError,
  Program,
  Governorate,
  SuccessStory,
  GalleryImage,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// رابط أصل الملفات الثابتة (تخزين الصور) مشتق من رابط الـ API بإزالة "/api" من النهاية
export const getStorageUrl = (path: string) => `${API_URL.replace(/\/api\/?$/, '')}/storage/${path}`;

export class ApiException extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    cache: options.cache ?? 'no-store',
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const err = (body as ApiError) || { message: 'حدث خطأ غير متوقع' };
    throw new ApiException(err.message || 'حدث خطأ غير متوقع', res.status, err.errors);
  }

  return body as T;
}

/* ============ Public: Events ============ */
export const getEvents = (status: 'all' | 'upcoming' | 'past' = 'all') =>
  request<EventItem[]>(`/events?status=${status}`);

export const getEvent = (slug: string) => request<EventItem>(`/events/${slug}`);

export const createBooking = (
  slug: string,
  payload: { full_name: string; phone: string; email: string; governorate?: string; notes?: string }
) =>
  request<Booking>(`/events/${slug}/bookings`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

/* ============ Public: Articles ============ */
export const getArticles = (params: { category?: string; q?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.category && params.category !== 'الكل') qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<Article[]>(`/articles${suffix}`);
};

export const getArticle = (slug: string) => request<Article>(`/articles/${slug}`);

/* ============ Public: Contact ============ */
export const sendContactMessage = (payload: ContactMessagePayload) =>
  request<{ message: string }>('/contact-messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

/* ============ Admin: Auth ============ */
export const adminLogin = (email: string, password: string) =>
  request<{ token: string; user: AdminUser }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const adminLogout = (token: string) =>
  request<{ message: string }>('/admin/logout', { method: 'POST' }, token);

export const adminMe = (token: string) => request<AdminUser>('/admin/me', {}, token);

/* ============ Admin: Content management ============ */
export const adminCreateArticle = (token: string, payload: ArticleItemPayload) =>
  request<Article>(
    '/admin/articles',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );

export const adminGetEventBookings = (token: string, eventId: number) =>
  request<Booking[]>(`/admin/events/${eventId}/bookings`, {}, token);

export const adminGetContactMessages = (token: string) =>
  request<Array<{ id: number; name: string; email: string; message: string; created_at: string }>>(
    '/admin/contact-messages',
    {},
    token
  );

/* ============ Public: Programs ============ */
export const getPrograms = () => request<Program[]>('/programs');

export const adminGetPrograms = (token: string) => request<Program[]>('/admin/programs', {}, token);

export const adminCreateProgram = (token: string, payload: Partial<Program>) =>
  request<Program>('/admin/programs', { method: 'POST', body: JSON.stringify(payload) }, token);

export const adminUpdateProgram = (token: string, id: number, payload: Partial<Program>) =>
  request<Program>(`/admin/programs/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token);

export const adminDeleteProgram = (token: string, id: number) =>
  request<{ message: string }>(`/admin/programs/${id}`, { method: 'DELETE' }, token);

/* ============ Public: Governorates ============ */
export const getGovernorates = () => request<Governorate[]>('/governorates');

export const adminGetGovernorates = (token: string) => request<Governorate[]>('/admin/governorates', {}, token);

export const adminCreateGovernorate = (token: string, payload: Partial<Governorate>) =>
  request<Governorate>('/admin/governorates', { method: 'POST', body: JSON.stringify(payload) }, token);

export const adminUpdateGovernorate = (token: string, id: number, payload: Partial<Governorate>) =>
  request<Governorate>(`/admin/governorates/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token);

export const adminDeleteGovernorate = (token: string, id: number) =>
  request<{ message: string }>(`/admin/governorates/${id}`, { method: 'DELETE' }, token);

/* ============ Public: Success stories ============ */
export const getSuccessStories = () => request<SuccessStory[]>('/success-stories');

export const adminGetSuccessStories = (token: string) => request<SuccessStory[]>('/admin/success-stories', {}, token);

export const adminCreateSuccessStory = (token: string, payload: Partial<SuccessStory>) =>
  request<SuccessStory>('/admin/success-stories', { method: 'POST', body: JSON.stringify(payload) }, token);

export const adminUpdateSuccessStory = (token: string, id: number, payload: Partial<SuccessStory>) =>
  request<SuccessStory>(`/admin/success-stories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token);

export const adminDeleteSuccessStory = (token: string, id: number) =>
  request<{ message: string }>(`/admin/success-stories/${id}`, { method: 'DELETE' }, token);

/* ============ Public: Gallery ============ */
export const getGallery = () => request<GalleryImage[]>('/gallery');

export const adminGetGallery = (token: string) => request<GalleryImage[]>('/admin/gallery', {}, token);

export const adminCreateGalleryImage = (token: string, formData: FormData) =>
  request<GalleryImage>('/admin/gallery', { method: 'POST', body: formData }, token);

// PUT مع رفع ملف عبر multipart/form-data غير مدعوم مباشرة، لذا نستخدم POST + _method spoofing
export const adminUpdateGalleryImage = (token: string, id: number, formData: FormData) => {
  formData.set('_method', 'PUT');
  return request<GalleryImage>(`/admin/gallery/${id}`, { method: 'POST', body: formData }, token);
};

export const adminDeleteGalleryImage = (token: string, id: number) =>
  request<{ message: string }>(`/admin/gallery/${id}`, { method: 'DELETE' }, token);

/* ============ Admin: Events (full CRUD) ============ */
export const adminGetEvents = (token: string) => request<EventItem[]>('/admin/events', {}, token);

export const adminCreateEvent = (token: string, payload: EventItemPayload) =>
  request<EventItem>('/admin/events', { method: 'POST', body: JSON.stringify(payload) }, token);

export const adminUpdateEvent = (token: string, id: number, payload: Partial<EventItemPayload>) =>
  request<EventItem>(`/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token);

export const adminDeleteEvent = (token: string, id: number) =>
  request<{ message: string }>(`/admin/events/${id}`, { method: 'DELETE' }, token);

/* ============ Admin: Articles (full CRUD) ============ */
export const adminGetArticles = (token: string) => request<Article[]>('/admin/articles', {}, token);

export const adminUpdateArticle = (token: string, id: number, payload: Partial<ArticleItemPayload>) =>
  request<Article>(`/admin/articles/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token);

export const adminDeleteArticle = (token: string, id: number) =>
  request<{ message: string }>(`/admin/articles/${id}`, { method: 'DELETE' }, token);

/* ============ Admin: Users (super_admin only) ============ */
export const adminGetUsers = (token: string) => request<AdminUser[]>('/admin/users', {}, token);

export const adminCreateUser = (token: string, payload: AdminUserPayload) =>
  request<AdminUser>('/admin/users', { method: 'POST', body: JSON.stringify(payload) }, token);

export const adminUpdateUser = (token: string, id: number, payload: Partial<AdminUserPayload>) =>
  request<AdminUser>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token);

export const adminDeleteUser = (token: string, id: number) =>
  request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }, token);
