'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  adminMe,
  adminLogout,
  adminGetEventBookings,
  adminGetContactMessages,
  adminGetPrograms,
  adminCreateProgram,
  adminUpdateProgram,
  adminDeleteProgram,
  adminGetGovernorates,
  adminCreateGovernorate,
  adminUpdateGovernorate,
  adminDeleteGovernorate,
  adminGetSuccessStories,
  adminCreateSuccessStory,
  adminUpdateSuccessStory,
  adminDeleteSuccessStory,
  adminGetGallery,
  adminCreateGalleryImage,
  adminUpdateGalleryImage,
  adminDeleteGalleryImage,
  adminGetEvents,
  adminCreateEvent,
  adminUpdateEvent,
  adminDeleteEvent,
  adminGetArticles,
  adminCreateArticle,
  adminUpdateArticle,
  adminDeleteArticle,
  adminGetUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  getStorageUrl,
  ApiException,
} from '@/lib/api';
import { getAdminToken, clearAdminToken } from '@/lib/adminAuth';
import { useToast } from '@/components/Toast';
import type {
  AdminUser, Booking, EventItem, Program, Governorate, SuccessStory, GalleryImage, Article,
} from '@/lib/types';
import { CheckIcon } from '@/components/icons';

const ARTICLE_CATEGORIES = ['أخبار الكيان', 'قصص نجاح', 'فعاليات', 'تنمية مجتمعية', 'مقالات رأي'];
const GOVS = [
  'شمال سيناء', 'جنوب سيناء', 'أسوان', 'الوادي الجديد', 'مطروح',
  'البحر الأحمر', 'السويس', 'الإسماعيلية', 'القاهرة الكبرى', 'الشرقية', 'عام',
];
const PROGRAM_CATEGORIES = ['التعليم', 'السياحة', 'التضامن', 'الزراعة', 'الإعلام', 'الصحة'];
const ART_THEMES = ['art-1', 'art-2', 'art-3', 'art-4'];
const EVENT_MODES = ['حضوري', 'أونلاين', 'هجين'];
const ROLES: AdminUser['role'][] = ['super_admin', 'editor', 'viewer'];
const ROLE_LABELS: Record<AdminUser['role'], string> = {
  super_admin: 'مدير عام',
  editor: 'محرر',
  viewer: 'مشاهد',
};

const inputClass = 'w-full rounded-lg border border-gold/40 px-3 py-3 text-sm';
const labelClass = 'mb-1.5 block font-utility text-sm font-bold';

function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = getAdminToken();
    if (!t) {
      router.replace('/admin/login');
      return;
    }
    setToken(t);
    adminMe(t)
      .then(setUser)
      .catch(() => {
        clearAdminToken();
        router.replace('/admin/login');
      })
      .finally(() => setChecking(false));
  }, [router]);

  async function handleLogout() {
    if (token) {
      try { await adminLogout(token); } catch { /* تجاهل خطأ الشبكة عند تسجيل الخروج */ }
    }
    clearAdminToken();
    router.replace('/admin/login');
  }

  if (checking) {
    return <p className="py-24 text-center opacity-60">جارٍ التحقق من الجلسة…</p>;
  }
  if (!token || !user) return null;

  const canEdit = user.role !== 'viewer';
  const isSuperAdmin = user.role === 'super_admin';

  return (
    <section className="bg-sand py-12">
      <div className="mx-auto max-w-[1000px] px-5 sm:px-6">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl">لوحة تحكم رُوَّاد</h1>
            <p className="text-sm opacity-70">
              مرحبًا، {user.name}
              <span className="mr-2 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
                {ROLE_LABELS[user.role]}
              </span>
            </p>
          </div>
          <button onClick={handleLogout} className="rounded-full border-2 border-ink px-5 py-2.5 font-utility text-sm font-bold hover:bg-ink/5">
            تسجيل الخروج
          </button>
        </div>

        <EventsManager token={token} canEdit={canEdit} showToast={showToast} />
        <ArticlesManager token={token} canEdit={canEdit} showToast={showToast} />
        <BookingsCard token={token} />
        <ContactMessagesCard token={token} />
        <ProgramsManager token={token} canEdit={canEdit} showToast={showToast} />
        <GovernoratesManager token={token} canEdit={canEdit} showToast={showToast} />
        <SuccessStoriesManager token={token} canEdit={canEdit} showToast={showToast} />
        <GalleryManager token={token} canEdit={canEdit} showToast={showToast} />
        {isSuperAdmin && <UsersManager token={token} currentUserId={user.id} showToast={showToast} />}
      </div>
    </section>
  );
}

/* ============ Bookings viewer ============ */
function BookingsCard({ token }: { token: string }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminGetEvents(token).then(setEvents).catch(() => setEvents([]));
  }, [token]);

  useEffect(() => {
    if (!selected) { setBookings([]); return; }
    setLoading(true);
    adminGetEventBookings(token, Number(selected))
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [selected, token]);

  return (
    <div className="mb-8 rounded-[20px] border border-gold/25 bg-white p-7">
      <h2 className="mb-5 font-display text-xl">حجوزات الفعاليات</h2>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-5 w-full max-w-sm rounded-lg border border-gold/40 px-3 py-3 text-sm"
      >
        <option value="">اختر فعالية لعرض حجوزاتها</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>{ev.title} ({ev.seats_taken}/{ev.seats_total})</option>
        ))}
      </select>

      {loading && <p className="text-sm opacity-60">جارٍ التحميل…</p>}
      {!loading && selected && bookings.length === 0 && (
        <p className="text-sm opacity-60">لا توجد حجوزات على هذه الفعالية بعد.</p>
      )}
      {bookings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gold/25 text-right font-utility text-xs opacity-60">
                <th className="py-2 pl-4">الاسم</th>
                <th className="py-2 pl-4">الهاتف</th>
                <th className="py-2 pl-4">البريد</th>
                <th className="py-2 pl-4">المحافظة</th>
                <th className="py-2">كود التأكيد</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-gold/10">
                  <td className="py-2 pl-4">{b.full_name}</td>
                  <td className="py-2 pl-4">{b.phone}</td>
                  <td className="py-2 pl-4">{b.email}</td>
                  <td className="py-2 pl-4">{b.governorate || '—'}</td>
                  <td className="py-2 font-utility">{b.confirmation_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============ Contact messages ============ */
function ContactMessagesCard({ token }: { token: string }) {
  const [messages, setMessages] = useState<Array<{ id: number; name: string; email: string; message: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetContactMessages(token)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="mb-8 rounded-[20px] border border-gold/25 bg-white p-7">
      <h2 className="mb-5 font-display text-xl">رسائل التواصل الواردة</h2>
      {loading ? (
        <p className="text-sm opacity-60">جارٍ التحميل…</p>
      ) : messages.length === 0 ? (
        <p className="text-sm opacity-60">لا توجد رسائل حتى الآن.</p>
      ) : (
        <ul className="divide-y divide-gold/10">
          {messages.map((m) => (
            <li key={m.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-utility font-bold">{m.name}</span>
                <span className="text-xs opacity-55">{m.email}</span>
              </div>
              <p className="mt-1.5 text-sm opacity-80">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Notify = (message: string) => void;

/* ============ Events manager ============ */
function EventsManager({ token, canEdit, showToast }: { token: string; canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetEvents(token).then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      title: String(form.get('title') || '').trim(),
      category: String(form.get('category') || '').trim(),
      governorate: String(form.get('governorate') || GOVS[0]),
      location: String(form.get('location') || '').trim(),
      mode: String(form.get('mode') || EVENT_MODES[0]),
      starts_at: String(form.get('starts_at') || ''),
      ends_at: String(form.get('ends_at') || '') || undefined,
      description: String(form.get('description') || '').trim(),
      seats_total: Number(form.get('seats_total') || 1),
      price: String(form.get('price') || '').trim() || undefined,
      organizer: String(form.get('organizer') || '').trim() || undefined,
      art_theme: String(form.get('art_theme') || 'art-1'),
    };
    if (editing) payload.is_published = form.get('is_published') === 'on';

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateEvent(token, editing.id, payload);
        showToast('تم تحديث الفعالية');
      } else {
        await adminCreateEvent(token, payload as never);
        showToast('تم إضافة الفعالية');
      }
      setEditing(null);
      (e.target as HTMLFormElement).reset();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ الفعالية');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('تأكيد حذف هذه الفعالية؟')) return;
    await adminDeleteEvent(token, id);
    showToast('تم حذف الفعالية');
    if (editing?.id === id) setEditing(null);
    refresh();
  }

  return (
    <div className="mb-8 rounded-[20px] border border-gold/25 bg-white p-7">
      <h2 className="mb-5 font-display text-xl">إدارة الفعاليات</h2>

      <ul className="mb-6 divide-y divide-gold/10">
        {items.map((ev) => (
          <li key={ev.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <span className="font-utility font-bold">{ev.title}</span>
              <span className="mr-2 text-xs opacity-60">
                ({ev.seats_taken}/{ev.seats_total} · {ev.is_published ? 'منشورة' : 'غير منشورة'})
              </span>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(ev)} className="rounded-full border border-gold/40 px-4 py-1.5 text-xs font-bold hover:bg-sand">تعديل</button>
                <button onClick={() => handleDelete(ev.id)} className="rounded-full border border-[#e08a6b]/50 px-4 py-1.5 text-xs font-bold text-[#c0532f] hover:bg-[#e08a6b]/10">حذف</button>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="py-3 text-sm opacity-60">لا توجد فعاليات بعد.</li>}
      </ul>

      {canEdit && (
        <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>عنوان الفعالية</label>
            <input name="title" required defaultValue={editing?.title} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>التصنيف</label>
            <input name="category" required placeholder="مؤتمر / ورشة عمل / ..." defaultValue={editing?.category} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>المحافظة</label>
            <select name="governorate" defaultValue={editing?.governorate ?? GOVS[0]} className={inputClass}>
              {GOVS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>المكان</label>
            <input name="location" required defaultValue={editing?.location} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>نوع الحضور</label>
            <select name="mode" defaultValue={editing?.mode ?? EVENT_MODES[0]} className={inputClass}>
              {EVENT_MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>عدد المقاعد</label>
            <input name="seats_total" type="number" min={1} required defaultValue={editing?.seats_total ?? 30} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>تاريخ ووقت البداية</label>
            <input name="starts_at" type="datetime-local" required defaultValue={toDatetimeLocalValue(editing?.starts_at)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>تاريخ ووقت النهاية (اختياري)</label>
            <input name="ends_at" type="datetime-local" defaultValue={toDatetimeLocalValue(editing?.ends_at)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>السعر (اختياري)</label>
            <input name="price" placeholder="مجاني / ٥٠ جنيه" defaultValue={editing?.price ?? ''} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>الجهة المنظمة (اختياري)</label>
            <input name="organizer" defaultValue={editing?.organizer ?? ''} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>نمط التصميم</label>
            <select name="art_theme" defaultValue={editing?.art_theme ?? 'art-1'} className={inputClass}>
              {ART_THEMES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          {editing && (
            <label className="flex items-center gap-2 self-end pb-3 font-utility text-sm font-bold">
              <input type="checkbox" name="is_published" defaultChecked={editing.is_published} /> منشورة
            </label>
          )}
          <div className="sm:col-span-2">
            <label className={labelClass}>الوصف</label>
            <textarea name="description" required rows={3} defaultValue={editing?.description} className={inputClass} />
          </div>
          {error && <p className="text-sm text-[#e08a6b] sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة فعالية'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-gold/40 px-6 py-3 font-utility text-sm font-bold">
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/* ============ Articles manager ============ */
function ArticlesManager({ token, canEdit, showToast }: { token: string; canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetArticles(token).then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const tagsRaw = String(form.get('tags') || '').trim();
    const payload: Record<string, unknown> = {
      title: String(form.get('title') || '').trim(),
      category: String(form.get('category') || ARTICLE_CATEGORIES[0]),
      governorate: String(form.get('governorate') || 'عام'),
      author: String(form.get('author') || '').trim(),
      excerpt: String(form.get('excerpt') || '').trim(),
      content: String(form.get('content') || '').trim(),
      tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [],
      read_minutes: Number(form.get('read_minutes') || 5),
      is_featured: form.get('is_featured') === 'on',
    };
    if (editing) payload.is_published = form.get('is_published') === 'on';

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateArticle(token, editing.id, payload);
        showToast('تم تحديث المقال');
      } else {
        await adminCreateArticle(token, payload as never);
        showToast('تم نشر المقال بنجاح');
      }
      setEditing(null);
      (e.target as HTMLFormElement).reset();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ المقال');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('تأكيد حذف هذا المقال؟')) return;
    await adminDeleteArticle(token, id);
    showToast('تم حذف المقال');
    if (editing?.id === id) setEditing(null);
    refresh();
  }

  return (
    <div className="mb-8 rounded-[20px] border border-gold/25 bg-white p-7">
      <h2 className="mb-5 font-display text-xl">إدارة المقالات والأخبار</h2>

      <ul className="mb-6 divide-y divide-gold/10">
        {items.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <span className="font-utility font-bold">{a.title}</span>
              <span className="mr-2 text-xs opacity-60">({a.category} · {a.is_published ? 'منشور' : 'غير منشور'})</span>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(a)} className="rounded-full border border-gold/40 px-4 py-1.5 text-xs font-bold hover:bg-sand">تعديل</button>
                <button onClick={() => handleDelete(a.id)} className="rounded-full border border-[#e08a6b]/50 px-4 py-1.5 text-xs font-bold text-[#c0532f] hover:bg-[#e08a6b]/10">حذف</button>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="py-3 text-sm opacity-60">لا توجد مقالات بعد.</li>}
      </ul>

      {canEdit && (
        <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>العنوان</label>
            <input name="title" required defaultValue={editing?.title} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>اسم الكاتب</label>
            <input name="author" required defaultValue={editing?.author} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>التصنيف</label>
            <select name="category" defaultValue={editing?.category ?? ARTICLE_CATEGORIES[0]} className={inputClass}>
              {ARTICLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>المحافظة المرتبطة</label>
            <select name="governorate" defaultValue={editing?.governorate ?? 'عام'} className={inputClass}>
              {GOVS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>وقت القراءة (دقائق)</label>
            <input name="read_minutes" type="number" min={1} defaultValue={editing?.read_minutes ?? 5} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>الوسوم (مفصولة بفاصلة)</label>
            <input name="tags" placeholder="تمكين, سيناء" defaultValue={editing?.tags?.join(', ') ?? ''} className={inputClass} />
          </div>
          <div className="flex items-center gap-6 self-end pb-3">
            <label className="flex items-center gap-2 font-utility text-sm font-bold">
              <input type="checkbox" name="is_featured" defaultChecked={editing?.is_featured} /> مقال مميّز
            </label>
            {editing && (
              <label className="flex items-center gap-2 font-utility text-sm font-bold">
                <input type="checkbox" name="is_published" defaultChecked={editing.is_published} /> منشور
              </label>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>نبذة مختصرة</label>
            <textarea name="excerpt" required rows={2} defaultValue={editing?.excerpt} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>نص المقال الكامل</label>
            <textarea name="content" required rows={6} defaultValue={editing?.content} className={inputClass} />
          </div>
          {error && <p className="text-sm text-[#e08a6b] sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-fit items-center gap-2 rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              <CheckIcon className="h-4 w-4" /> {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'نشر الآن'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-gold/40 px-6 py-3 font-utility text-sm font-bold">
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/* ============ Programs manager ============ */
function ProgramsManager({ token, canEdit, showToast }: { token: string; canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<Program[]>([]);
  const [editing, setEditing] = useState<Program | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetPrograms(token).then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload: Partial<Program> = {
      title: String(form.get('title') || '').trim(),
      category: String(form.get('category') || PROGRAM_CATEGORIES[0]) as Program['category'],
      description: String(form.get('description') || '').trim(),
      art_theme: String(form.get('art_theme') || 'art-1') as Program['art_theme'],
      order: Number(form.get('order') || 0),
    };

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateProgram(token, editing.id, payload);
        showToast('تم تحديث البرنامج');
      } else {
        await adminCreateProgram(token, payload);
        showToast('تم إضافة البرنامج');
      }
      setEditing(null);
      (e.target as HTMLFormElement).reset();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ البرنامج');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('تأكيد حذف هذا البرنامج؟')) return;
    await adminDeleteProgram(token, id);
    showToast('تم حذف البرنامج');
    if (editing?.id === id) setEditing(null);
    refresh();
  }

  return (
    <div className="mb-8 rounded-[20px] border border-gold/25 bg-white p-7">
      <h2 className="mb-5 font-display text-xl">إدارة البرامج</h2>

      <ul className="mb-6 divide-y divide-gold/10">
        {items.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <span className="font-utility font-bold">{p.title}</span>
              <span className="mr-2 text-xs opacity-60">({p.category})</span>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(p)} className="rounded-full border border-gold/40 px-4 py-1.5 text-xs font-bold hover:bg-sand">تعديل</button>
                <button onClick={() => handleDelete(p.id)} className="rounded-full border border-[#e08a6b]/50 px-4 py-1.5 text-xs font-bold text-[#c0532f] hover:bg-[#e08a6b]/10">حذف</button>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="py-3 text-sm opacity-60">لا توجد برامج بعد.</li>}
      </ul>

      {canEdit && (
        <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>عنوان البرنامج</label>
            <input name="title" required defaultValue={editing?.title} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>القطاع</label>
            <select name="category" defaultValue={editing?.category} className={inputClass}>
              {PROGRAM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>الوصف</label>
            <textarea name="description" required rows={3} defaultValue={editing?.description} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>نمط التصميم</label>
            <select name="art_theme" defaultValue={editing?.art_theme ?? 'art-1'} className={inputClass}>
              {ART_THEMES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>الترتيب</label>
            <input name="order" type="number" min={0} defaultValue={editing?.order ?? 0} className={inputClass} />
          </div>
          {error && <p className="text-sm text-[#e08a6b] sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة برنامج'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-gold/40 px-6 py-3 font-utility text-sm font-bold">
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/* ============ Governorates manager ============ */
function GovernoratesManager({ token, canEdit, showToast }: { token: string; canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<Governorate[]>([]);
  const [editing, setEditing] = useState<Governorate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetGovernorates(token).then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload: Partial<Governorate> = {
      name: String(form.get('name') || '').trim(),
      tagline: String(form.get('tagline') || '').trim(),
      population: String(form.get('population') || '').trim(),
      projects_completed: Number(form.get('projects_completed') || 0),
      completion_percentage: Number(form.get('completion_percentage') || 0),
      art_theme: String(form.get('art_theme') || 'art-1') as Governorate['art_theme'],
      order: Number(form.get('order') || 0),
    };

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateGovernorate(token, editing.id, payload);
        showToast('تم تحديث المحافظة');
      } else {
        await adminCreateGovernorate(token, payload);
        showToast('تم إضافة المحافظة');
      }
      setEditing(null);
      (e.target as HTMLFormElement).reset();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ المحافظة');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('تأكيد حذف هذه المحافظة؟')) return;
    await adminDeleteGovernorate(token, id);
    showToast('تم حذف المحافظة');
    if (editing?.id === id) setEditing(null);
    refresh();
  }

  return (
    <div className="mb-8 rounded-[20px] border border-gold/25 bg-white p-7">
      <h2 className="mb-5 font-display text-xl">إدارة المحافظات</h2>

      <ul className="mb-6 divide-y divide-gold/10">
        {items.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <span className="font-utility font-bold">{g.name}</span>
              <span className="mr-2 text-xs opacity-60">({g.projects_completed} مشروع · {g.completion_percentage}٪)</span>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(g)} className="rounded-full border border-gold/40 px-4 py-1.5 text-xs font-bold hover:bg-sand">تعديل</button>
                <button onClick={() => handleDelete(g.id)} className="rounded-full border border-[#e08a6b]/50 px-4 py-1.5 text-xs font-bold text-[#c0532f] hover:bg-[#e08a6b]/10">حذف</button>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="py-3 text-sm opacity-60">لا توجد محافظات بعد.</li>}
      </ul>

      {canEdit && (
        <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>اسم المحافظة</label>
            <input name="name" required defaultValue={editing?.name} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>وصف مختصر (تحت الاسم)</label>
            <input name="tagline" required defaultValue={editing?.tagline} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>عدد السكان (نص حر)</label>
            <input name="population" required defaultValue={editing?.population} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>المشاريع المنجزة</label>
            <input name="projects_completed" type="number" min={0} defaultValue={editing?.projects_completed ?? 0} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>نسبة الإنجاز (٪)</label>
            <input name="completion_percentage" type="number" min={0} max={100} defaultValue={editing?.completion_percentage ?? 0} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>نمط التصميم</label>
            <select name="art_theme" defaultValue={editing?.art_theme ?? 'art-1'} className={inputClass}>
              {ART_THEMES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>الترتيب</label>
            <input name="order" type="number" min={0} defaultValue={editing?.order ?? 0} className={inputClass} />
          </div>
          {error && <p className="text-sm text-[#e08a6b] sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة محافظة'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-gold/40 px-6 py-3 font-utility text-sm font-bold">
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/* ============ Success stories manager ============ */
function SuccessStoriesManager({ token, canEdit, showToast }: { token: string; canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<SuccessStory[]>([]);
  const [editing, setEditing] = useState<SuccessStory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetSuccessStories(token).then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') || '').trim(),
      role_title: String(form.get('role_title') || '').trim(),
      governorate: String(form.get('governorate') || '') || undefined,
      quote: String(form.get('quote') || '').trim(),
      order: Number(form.get('order') || 0),
    };

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateSuccessStory(token, editing.id, payload);
        showToast('تم تحديث قصة النجاح');
      } else {
        await adminCreateSuccessStory(token, payload);
        showToast('تم إضافة قصة النجاح');
      }
      setEditing(null);
      (e.target as HTMLFormElement).reset();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ قصة النجاح');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('تأكيد حذف قصة النجاح هذه؟')) return;
    await adminDeleteSuccessStory(token, id);
    showToast('تم حذف قصة النجاح');
    if (editing?.id === id) setEditing(null);
    refresh();
  }

  return (
    <div className="mb-8 rounded-[20px] border border-gold/25 bg-white p-7">
      <h2 className="mb-5 font-display text-xl">إدارة قصص النجاح</h2>

      <ul className="mb-6 divide-y divide-gold/10">
        {items.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <span className="font-utility font-bold">{s.name}</span>
              <span className="mr-2 text-xs opacity-60">({s.role_title})</span>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(s)} className="rounded-full border border-gold/40 px-4 py-1.5 text-xs font-bold hover:bg-sand">تعديل</button>
                <button onClick={() => handleDelete(s.id)} className="rounded-full border border-[#e08a6b]/50 px-4 py-1.5 text-xs font-bold text-[#c0532f] hover:bg-[#e08a6b]/10">حذف</button>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="py-3 text-sm opacity-60">لا توجد قصص نجاح بعد.</li>}
      </ul>

      {canEdit && (
        <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>الاسم</label>
            <input name="name" required defaultValue={editing?.name} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>الصفة (مثال: رائد أعمال من مطروح)</label>
            <input name="role_title" required defaultValue={editing?.role_title} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>المحافظة</label>
            <select name="governorate" defaultValue={editing?.governorate ?? ''} className={inputClass}>
              <option value="">—</option>
              {GOVS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>الترتيب</label>
            <input name="order" type="number" min={0} defaultValue={editing?.order ?? 0} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>نص الاقتباس</label>
            <textarea name="quote" required rows={3} defaultValue={editing?.quote} className={inputClass} />
          </div>
          {error && <p className="text-sm text-[#e08a6b] sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة قصة نجاح'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-gold/40 px-6 py-3 font-utility text-sm font-bold">
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/* ============ Gallery manager ============ */
function GalleryManager({ token, canEdit, showToast }: { token: string; canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetGallery(token).then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const imageEntry = formData.get('image');
    if (imageEntry instanceof File && imageEntry.size === 0) formData.delete('image');

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateGalleryImage(token, editing.id, formData);
        showToast('تم تحديث الصورة');
      } else {
        await adminCreateGalleryImage(token, formData);
        showToast('تم إضافة الصورة');
      }
      setEditing(null);
      (e.target as HTMLFormElement).reset();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ الصورة');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('تأكيد حذف هذه الصورة؟')) return;
    await adminDeleteGalleryImage(token, id);
    showToast('تم حذف الصورة');
    if (editing?.id === id) setEditing(null);
    refresh();
  }

  return (
    <div className="mb-8 rounded-[20px] border border-gold/25 bg-white p-7">
      <h2 className="mb-5 font-display text-xl">إدارة معرض الصور</h2>

      <ul className="mb-6 divide-y divide-gold/10">
        {items.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="flex items-center gap-3">
              {g.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getStorageUrl(g.image_path)} alt={g.title} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sand text-[10px] opacity-60">{g.art_theme}</span>
              )}
              <span className="font-utility font-bold">{g.title}</span>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(g)} className="rounded-full border border-gold/40 px-4 py-1.5 text-xs font-bold hover:bg-sand">تعديل</button>
                <button onClick={() => handleDelete(g.id)} className="rounded-full border border-[#e08a6b]/50 px-4 py-1.5 text-xs font-bold text-[#c0532f] hover:bg-[#e08a6b]/10">حذف</button>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="py-3 text-sm opacity-60">لا توجد صور بعد.</li>}
      </ul>

      {canEdit && (
        <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>العنوان</label>
            <input name="title" required defaultValue={editing?.title} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>وصف مختصر</label>
            <input name="caption" defaultValue={editing?.caption ?? ''} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>نمط التصميم (عند عدم وجود صورة)</label>
            <select name="art_theme" defaultValue={editing?.art_theme ?? 'art-1'} className={inputClass}>
              {ART_THEMES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>الترتيب</label>
            <input name="order" type="number" min={0} defaultValue={editing?.order ?? 0} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>رفع صورة حقيقية (اختياري)</label>
            <input name="image" type="file" accept="image/*" className={inputClass} />
          </div>
          {error && <p className="text-sm text-[#e08a6b] sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة صورة'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-gold/40 px-6 py-3 font-utility text-sm font-bold">
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/* ============ Users manager (super_admin only) ============ */
function UsersManager({ token, currentUserId, showToast }: { token: string; currentUserId: number; showToast: Notify }) {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetUsers(token).then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') || '');
    const payload = {
      name: String(form.get('name') || '').trim(),
      email: String(form.get('email') || '').trim(),
      role: String(form.get('role') || 'editor') as AdminUser['role'],
      ...(password ? { password } : {}),
    };

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateUser(token, editing.id, payload);
        showToast('تم تحديث المستخدم');
      } else {
        if (!password) {
          setError('كلمة المرور مطلوبة عند إضافة مستخدم جديد');
          setSubmitting(false);
          return;
        }
        await adminCreateUser(token, { ...payload, password });
        showToast('تم إضافة المستخدم');
      }
      setEditing(null);
      (e.target as HTMLFormElement).reset();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ المستخدم');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('تأكيد حذف هذا المستخدم؟')) return;
    try {
      await adminDeleteUser(token, id);
      showToast('تم حذف المستخدم');
      if (editing?.id === id) setEditing(null);
      refresh();
    } catch (err) {
      showToast(err instanceof ApiException ? err.message : 'تعذّر حذف المستخدم');
    }
  }

  return (
    <div className="mt-8 rounded-[20px] border border-gold/25 bg-white p-7">
      <h2 className="mb-5 font-display text-xl">إدارة حسابات لوحة التحكم</h2>

      <ul className="mb-6 divide-y divide-gold/10">
        {items.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <span className="font-utility font-bold">{u.name}</span>
              <span className="mr-2 text-xs opacity-60">({u.email} · {ROLE_LABELS[u.role]})</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(u)} className="rounded-full border border-gold/40 px-4 py-1.5 text-xs font-bold hover:bg-sand">تعديل</button>
              <button
                onClick={() => handleDelete(u.id)}
                disabled={u.id === currentUserId}
                className="rounded-full border border-[#e08a6b]/50 px-4 py-1.5 text-xs font-bold text-[#c0532f] hover:bg-[#e08a6b]/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                حذف
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="py-3 text-sm opacity-60">لا توجد حسابات أخرى بعد.</li>}
      </ul>

      <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>الاسم</label>
          <input name="name" required defaultValue={editing?.name} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>البريد الإلكتروني</label>
          <input name="email" type="email" required defaultValue={editing?.email} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>الدور</label>
          <select name="role" defaultValue={editing?.role ?? 'editor'} className={inputClass}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{editing ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}</label>
          <input name="password" type="password" minLength={8} required={!editing} className={inputClass} />
        </div>
        {error && <p className="text-sm text-[#e08a6b] sm:col-span-2">{error}</p>}
        <div className="flex gap-3 sm:col-span-2">
          <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
            {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة مستخدم'}
          </button>
          {editing && (
            <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-gold/40 px-6 py-3 font-utility text-sm font-bold">
              إلغاء
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
