'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminGetPrograms, adminCreateProgram, adminUpdateProgram, adminDeleteProgram, ApiException } from '@/lib/api';
import type { Program } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/icons';
import { PROGRAM_CATEGORIES, ART_THEMES, inputClass, labelClass, SectionCard, EmptyState, ErrorText, PublisherNote, type Notify } from './shared';

export default function ProgramsManager({ canEdit, showToast }: { canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<Program[]>([]);
  const [editing, setEditing] = useState<Program | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetPrograms().then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, []);

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(p: Program) { setEditing(p); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setError(null); }

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
      author: String(form.get('author') || '').trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateProgram(editing.id, payload);
        showToast('تم تحديث البرنامج');
      } else {
        await adminCreateProgram(payload);
        showToast('تم إضافة البرنامج');
      }
      closeForm();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ البرنامج');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('تأكيد حذف هذا البرنامج؟')) return;
    await adminDeleteProgram(id);
    showToast('تم حذف البرنامج');
    if (editing?.id === id) closeForm();
    refresh();
  }

  return (
    <SectionCard
      title="إدارة البرامج"
      description={`${items.length} برنامج`}
      action={
        canEdit && (
          <button onClick={openCreate} className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700">
            <PlusIcon className="h-3.5 w-3.5" /> إضافة برنامج
          </button>
        )
      }
    >
      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl bg-sand/60 p-5 sm:grid-cols-2">
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
          <div>
            <label className={labelClass}>اسم الكاتب (اختياري — يظهر للجمهور)</label>
            <input name="author" defaultValue={editing?.author ?? ''} placeholder="مثال: فريق البرامج" className={inputClass} />
          </div>
          <ErrorText message={error} />
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة برنامج'}
            </button>
            <button type="button" onClick={closeForm} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">إلغاء</button>
            {editing && <PublisherNote item={editing} />}
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState message="لا توجد برامج بعد." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-right text-xs font-bold text-ink/45">
                <th className="py-2.5 pl-4">العنوان</th>
                <th className="py-2.5 pl-4">القطاع</th>
                <th className="py-2.5 pl-4">الترتيب</th>
                <th className="py-2.5 pl-4">نُشر بواسطة</th>
                {canEdit && <th className="py-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-3 pl-4 font-bold">{p.title}</td>
                  <td className="py-3 pl-4 text-ink/60">{p.category}</td>
                  <td className="py-3 pl-4 text-ink/60">{p.order}</td>
                  <td className="py-3 pl-4 text-ink/45"><PublisherNote item={p} /></td>
                  {canEdit && (
                    <td className="py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-ink/50 hover:bg-sand hover:text-ink" aria-label="تعديل"><EditIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="حذف"><TrashIcon className="h-4 w-4" /></button>
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
