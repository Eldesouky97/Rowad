'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminGetGovernorates, adminCreateGovernorate, adminUpdateGovernorate, adminDeleteGovernorate, ApiException } from '@/lib/api';
import type { Governorate } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon, PinIcon } from '@/components/icons';
import { ART_THEMES, inputClass, labelClass, SectionCard, EmptyState, ErrorText, PublisherNote, type Notify } from './shared';

const ART_BG: Record<string, string> = {
  'art-1': 'from-sea to-[#0a4247]',
  'art-2': 'from-rust to-[#7a3620]',
  'art-3': 'from-gold to-[#a9782c]',
  'art-4': 'from-night-3 to-night',
};

export default function GovernoratesManager({ canEdit, showToast }: { canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<Governorate[]>([]);
  const [editing, setEditing] = useState<Governorate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetGovernorates().then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, []);

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(g: Governorate) { setEditing(g); setShowForm(true); }
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
        await adminUpdateGovernorate(editing.id, formData);
        showToast('تم تحديث المحافظة');
      } else {
        await adminCreateGovernorate(formData);
        showToast('تم إضافة المحافظة');
      }
      closeForm();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ المحافظة');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('تأكيد حذف هذه المحافظة؟')) return;
    await adminDeleteGovernorate(id);
    showToast('تم حذف المحافظة');
    if (editing?.id === id) closeForm();
    refresh();
  }

  return (
    <SectionCard
      title="إدارة المحافظات"
      description={`${items.length} محافظة`}
      action={
        canEdit && (
          <button onClick={openCreate} className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700">
            <PlusIcon className="h-3.5 w-3.5" /> إضافة محافظة
          </button>
        )
      }
    >
      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl bg-sand/60 p-5 sm:grid-cols-2">
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
            <label className={labelClass}>نمط التصميم (عند عدم وجود صورة)</label>
            <select name="art_theme" defaultValue={editing?.art_theme ?? 'art-1'} className={inputClass}>
              {ART_THEMES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>الترتيب</label>
            <input name="order" type="number" min={0} defaultValue={editing?.order ?? 0} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>اسم الكاتب (اختياري — يظهر للجمهور)</label>
            <input name="author" defaultValue={editing?.author ?? ''} placeholder="مثال: فريق المحتوى" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>صورة المحافظة (اختياري)</label>
            <input name="image" type="file" accept="image/*" className={inputClass} />
          </div>
          <ErrorText message={error} />
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة محافظة'}
            </button>
            <button type="button" onClick={closeForm} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">إلغاء</button>
            {editing && <PublisherNote item={editing} />}
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState message="لا توجد محافظات بعد." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((g) => (
            <div key={g.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink/10">
              {g.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.image_url} alt={g.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${ART_BG[g.art_theme]}`}>
                  <PinIcon className="h-9 w-9 text-white/70" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                <b className="block font-display text-base">{g.name}</b>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-white/75">
                  <span>{g.projects_completed} مشروع</span>
                  <span>{g.completion_percentage}٪ إنجاز</span>
                </div>
                {g.created_by_name && (
                  <p className="mt-1 truncate text-[10px] text-white/50">نُشر بواسطة {g.created_by_name}</p>
                )}
              </div>
              {canEdit && (
                <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => openEdit(g)} className="rounded-lg bg-white/90 p-1.5 text-ink/60 shadow hover:text-ink" aria-label="تعديل"><EditIcon className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(g.id)} className="rounded-lg bg-white/90 p-1.5 text-rose-500 shadow hover:bg-rose-50" aria-label="حذف"><TrashIcon className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
