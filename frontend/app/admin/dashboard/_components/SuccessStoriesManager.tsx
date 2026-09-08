'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminGetSuccessStories, adminCreateSuccessStory, adminUpdateSuccessStory, adminDeleteSuccessStory, ApiException } from '@/lib/api';
import type { SuccessStory } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon, UsersIcon } from '@/components/icons';
import { GOVS, inputClass, labelClass, SectionCard, EmptyState, ErrorText, type Notify } from './shared';

export default function SuccessStoriesManager({ canEdit, showToast }: { canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<SuccessStory[]>([]);
  const [editing, setEditing] = useState<SuccessStory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetSuccessStories().then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, []);

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(s: SuccessStory) { setEditing(s); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setError(null); }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const imageEntry = formData.get('image');
    if (imageEntry instanceof File && imageEntry.size === 0) formData.delete('image');

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateSuccessStory(editing.id, formData);
        showToast('تم تحديث قصة النجاح');
      } else {
        await adminCreateSuccessStory(formData);
        showToast('تم إضافة قصة النجاح');
      }
      closeForm();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ قصة النجاح');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('تأكيد حذف قصة النجاح هذه؟')) return;
    await adminDeleteSuccessStory(id);
    showToast('تم حذف قصة النجاح');
    if (editing?.id === id) closeForm();
    refresh();
  }

  return (
    <SectionCard
      title="إدارة قصص النجاح"
      description={`${items.length} قصة`}
      action={
        canEdit && (
          <button onClick={openCreate} className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700">
            <PlusIcon className="h-3.5 w-3.5" /> إضافة قصة
          </button>
        )
      }
    >
      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl bg-sand/60 p-5 sm:grid-cols-2">
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
          <div className="sm:col-span-2">
            <label className={labelClass}>صورة شخصية (اختياري)</label>
            <input name="image" type="file" accept="image/*" className={inputClass} />
          </div>
          <ErrorText message={error} />
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة قصة نجاح'}
            </button>
            <button type="button" onClick={closeForm} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">إلغاء</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState message="لا توجد قصص نجاح بعد." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <div key={s.id} className="group relative flex flex-col rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-violet-700">
                  {s.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <UsersIcon className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{s.name}</p>
                  <p className="truncate text-xs text-ink/55">{s.role_title}</p>
                </div>
              </div>
              <p className="flex-1 text-sm italic text-ink/70">&quot;{s.quote}&quot;</p>
              {s.governorate && <p className="mt-3 text-xs font-bold text-ink/45">{s.governorate}</p>}
              {canEdit && (
                <div className="absolute left-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => openEdit(s)} className="rounded-lg bg-white p-1.5 text-ink/60 shadow hover:text-ink" aria-label="تعديل"><EditIcon className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(s.id)} className="rounded-lg bg-white p-1.5 text-rose-500 shadow hover:bg-rose-50" aria-label="حذف"><TrashIcon className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
