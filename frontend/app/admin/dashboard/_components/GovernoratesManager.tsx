'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminGetGovernorates, adminCreateGovernorate, adminUpdateGovernorate, adminDeleteGovernorate, ApiException } from '@/lib/api';
import type { Governorate } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/icons';
import { ART_THEMES, inputClass, labelClass, SectionCard, EmptyState, ErrorText, type Notify } from './shared';

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
        await adminUpdateGovernorate(editing.id, payload);
        showToast('تم تحديث المحافظة');
      } else {
        await adminCreateGovernorate(payload);
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
            <label className={labelClass}>نمط التصميم</label>
            <select name="art_theme" defaultValue={editing?.art_theme ?? 'art-1'} className={inputClass}>
              {ART_THEMES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>الترتيب</label>
            <input name="order" type="number" min={0} defaultValue={editing?.order ?? 0} className={inputClass} />
          </div>
          <ErrorText message={error} />
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة محافظة'}
            </button>
            <button type="button" onClick={closeForm} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">إلغاء</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState message="لا توجد محافظات بعد." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-right text-xs font-bold text-ink/45">
                <th className="py-2.5 pl-4">الاسم</th>
                <th className="py-2.5 pl-4">المشاريع</th>
                <th className="py-2.5 pl-4">نسبة الإنجاز</th>
                {canEdit && <th className="py-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((g) => (
                <tr key={g.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-3 pl-4 font-bold">{g.name}</td>
                  <td className="py-3 pl-4 text-ink/60">{g.projects_completed}</td>
                  <td className="py-3 pl-4 text-ink/60">{g.completion_percentage}٪</td>
                  {canEdit && (
                    <td className="py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(g)} className="rounded-lg p-2 text-ink/50 hover:bg-sand hover:text-ink" aria-label="تعديل"><EditIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(g.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="حذف"><TrashIcon className="h-4 w-4" /></button>
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
