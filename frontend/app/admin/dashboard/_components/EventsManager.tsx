'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminGetEvents, adminCreateEvent, adminUpdateEvent, adminDeleteEvent, ApiException } from '@/lib/api';
import type { EventItem } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon, CalendarIcon, PinIcon, SeatIcon } from '@/components/icons';
import {
  GOVS, EVENT_MODES, ART_THEMES, inputClass, labelClass, toDatetimeLocalValue,
  SectionCard, Badge, EmptyState, ErrorText, PublisherNote, SearchBox, type Notify,
} from './shared';

const ART_BG: Record<string, string> = {
  'art-1': 'from-sea to-[#0a4247]',
  'art-2': 'from-rust to-[#7a3620]',
  'art-3': 'from-gold to-[#a9782c]',
  'art-4': 'from-night-3 to-night',
};

export default function EventsManager({
  canEdit,
  isSuperAdmin,
  showToast,
}: {
  canEdit: boolean;
  isSuperAdmin: boolean;
  showToast: Notify;
}) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetEvents().then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((ev) =>
      `${ev.title} ${ev.category} ${ev.governorate} ${ev.location}`.toLowerCase().includes(q)
    );
  }, [items, search]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(ev: EventItem) {
    setEditing(ev);
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const imageEntry = formData.get('image');
    if (imageEntry instanceof File && imageEntry.size === 0) formData.delete('image');

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateEvent(editing.id, formData);
        showToast(isSuperAdmin ? 'تم تحديث الفعالية' : 'تم إرسال التعديلات لانتظار المراجعة');
      } else {
        await adminCreateEvent(formData);
        showToast(isSuperAdmin ? 'تم إضافة الفعالية' : 'تم إرسال الفعالية لانتظار المراجعة');
      }
      closeForm();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ الفعالية');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('تأكيد حذف هذه الفعالية؟')) return;
    await adminDeleteEvent(id);
    showToast('تم حذف الفعالية');
    if (editing?.id === id) closeForm();
    refresh();
  }

  return (
    <SectionCard
      title="إدارة الفعاليات"
      description={`${filteredItems.length} من ${items.length} فعالية`}
      action={
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <SearchBox value={search} onChange={setSearch} placeholder="ابحث بالعنوان أو المحافظة…" />
          {canEdit && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
            >
              <PlusIcon className="h-3.5 w-3.5" /> إضافة فعالية
            </button>
          )}
        </div>
      }
    >
      {!isSuperAdmin && canEdit && (
        <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
          بصفتك محرر، أي فعالية تضيفها أو تعدّلها هتتحفظ "بانتظار المراجعة" لحد ما سوبر أدمن يوافق عليها.
        </p>
      )}

      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl bg-sand/60 p-5 sm:grid-cols-2">
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
            <label className={labelClass}>نمط التصميم (عند عدم وجود صورة)</label>
            <select name="art_theme" defaultValue={editing?.art_theme ?? 'art-1'} className={inputClass}>
              {ART_THEMES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>اسم الكاتب (اختياري — يظهر للجمهور)</label>
            <input name="author" defaultValue={editing?.author ?? ''} placeholder="مثال: فريق الفعاليات" className={inputClass} />
          </div>
          {isSuperAdmin && editing && (
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-bold text-ink/70">
              <input type="checkbox" name="is_published" defaultChecked={editing.is_published} /> منشورة
            </label>
          )}
          <div className="sm:col-span-2">
            <label className={labelClass}>صورة الفعالية (اختياري)</label>
            <input name="image" type="file" accept="image/*" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>الوصف</label>
            <textarea name="description" required rows={3} defaultValue={editing?.description} className={inputClass} />
          </div>
          <ErrorText message={error} />
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة فعالية'}
            </button>
            <button type="button" onClick={closeForm} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">
              إلغاء
            </button>
            {editing && <PublisherNote item={editing} />}
          </div>
        </form>
      )}

      {filteredItems.length === 0 ? (
        <EmptyState message={search ? 'لا توجد فعاليات مطابقة لبحثك.' : 'لا توجد فعاليات بعد.'} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((ev) => (
            <div key={ev.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
              {ev.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ev.image_url} alt={ev.title} className="h-24 w-full object-cover" />
              ) : (
                <div className={`flex h-24 items-center justify-center bg-gradient-to-br text-white ${ART_BG[ev.art_theme]}`}>
                  <CalendarIcon className="h-8 w-8 opacity-80" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-sm font-bold leading-snug">{ev.title}</h3>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone={ev.is_published ? 'success' : 'neutral'}>{ev.is_published ? 'منشورة' : 'غير منشورة'}</Badge>
                    {ev.pending_review && <Badge tone="warning">بانتظار المراجعة</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-ink/55">
                  <span className="flex items-center gap-1"><PinIcon className="h-3.5 w-3.5" /> {ev.governorate}</span>
                  <span className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> {new Date(ev.starts_at).toLocaleDateString('ar-EG')}</span>
                  <span className="flex items-center gap-1"><SeatIcon className="h-3.5 w-3.5" /> {ev.seats_taken}/{ev.seats_total}</span>
                </div>
                <PublisherNote item={ev} className="mt-auto pt-1" />
              </div>
              {(canEdit || isSuperAdmin) && (
                <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition group-hover:opacity-100">
                  {canEdit && (
                    <button onClick={() => openEdit(ev)} className="rounded-lg bg-white/90 p-1.5 text-ink/60 shadow hover:text-ink" aria-label="تعديل"><EditIcon className="h-3.5 w-3.5" /></button>
                  )}
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(ev.id)} className="rounded-lg bg-white/90 p-1.5 text-rose-500 shadow hover:bg-rose-50" aria-label="حذف"><TrashIcon className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
