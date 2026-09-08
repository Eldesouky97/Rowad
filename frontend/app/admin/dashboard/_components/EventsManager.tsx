'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminGetEvents, adminCreateEvent, adminUpdateEvent, adminDeleteEvent, ApiException } from '@/lib/api';
import type { EventItem } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/icons';
import {
  GOVS, EVENT_MODES, ART_THEMES, inputClass, labelClass, toDatetimeLocalValue,
  SectionCard, Badge, EmptyState, ErrorText, type Notify,
} from './shared';

export default function EventsManager({ canEdit, showToast }: { canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetEvents().then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, []);

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
        await adminUpdateEvent(editing.id, payload);
        showToast('تم تحديث الفعالية');
      } else {
        await adminCreateEvent(payload as never);
        showToast('تم إضافة الفعالية');
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
      description={`${items.length} فعالية`}
      action={
        canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
          >
            <PlusIcon className="h-3.5 w-3.5" /> إضافة فعالية
          </button>
        )
      }
    >
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
            <label className={labelClass}>نمط التصميم</label>
            <select name="art_theme" defaultValue={editing?.art_theme ?? 'art-1'} className={inputClass}>
              {ART_THEMES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          {editing && (
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-bold text-ink/70">
              <input type="checkbox" name="is_published" defaultChecked={editing.is_published} /> منشورة
            </label>
          )}
          <div className="sm:col-span-2">
            <label className={labelClass}>الوصف</label>
            <textarea name="description" required rows={3} defaultValue={editing?.description} className={inputClass} />
          </div>
          <ErrorText message={error} />
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة فعالية'}
            </button>
            <button type="button" onClick={closeForm} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">
              إلغاء
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState message="لا توجد فعاليات بعد." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-right text-xs font-bold text-ink/45">
                <th className="py-2.5 pl-4">العنوان</th>
                <th className="py-2.5 pl-4">المحافظة</th>
                <th className="py-2.5 pl-4">التاريخ</th>
                <th className="py-2.5 pl-4">المقاعد</th>
                <th className="py-2.5 pl-4">الحالة</th>
                {canEdit && <th className="py-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((ev) => (
                <tr key={ev.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-3 pl-4 font-bold">{ev.title}</td>
                  <td className="py-3 pl-4 text-ink/60">{ev.governorate}</td>
                  <td className="py-3 pl-4 text-ink/60">{new Date(ev.starts_at).toLocaleDateString('ar-EG')}</td>
                  <td className="py-3 pl-4 text-ink/60">{ev.seats_taken}/{ev.seats_total}</td>
                  <td className="py-3 pl-4">
                    <Badge tone={ev.is_published ? 'success' : 'neutral'}>{ev.is_published ? 'منشورة' : 'غير منشورة'}</Badge>
                  </td>
                  {canEdit && (
                    <td className="py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(ev)} className="rounded-lg p-2 text-ink/50 hover:bg-sand hover:text-ink" aria-label="تعديل">
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(ev.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="حذف">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
