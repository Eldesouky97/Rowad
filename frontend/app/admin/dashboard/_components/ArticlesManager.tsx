'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminGetArticles, adminCreateArticle, adminUpdateArticle, adminDeleteArticle, ApiException } from '@/lib/api';
import type { Article } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/icons';
import {
  ARTICLE_CATEGORIES, GOVS, inputClass, labelClass,
  SectionCard, Badge, EmptyState, ErrorText, PublisherNote, type Notify,
} from './shared';

export default function ArticlesManager({ canEdit, showToast }: { canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    adminGetArticles().then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, []);

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(a: Article) { setEditing(a); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setError(null); }

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
        await adminUpdateArticle(editing.id, payload);
        showToast('تم تحديث المقال');
      } else {
        await adminCreateArticle(payload as never);
        showToast('تم نشر المقال بنجاح');
      }
      closeForm();
      refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ المقال');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('تأكيد حذف هذا المقال؟')) return;
    await adminDeleteArticle(id);
    showToast('تم حذف المقال');
    if (editing?.id === id) closeForm();
    refresh();
  }

  return (
    <SectionCard
      title="إدارة المقالات والأخبار"
      description={`${items.length} مقال`}
      action={
        canEdit && (
          <button onClick={openCreate} className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700">
            <PlusIcon className="h-3.5 w-3.5" /> مقال جديد
          </button>
        )
      }
    >
      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl bg-sand/60 p-5 sm:grid-cols-2">
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
          <div className="flex items-center gap-6 self-end pb-2.5">
            <label className="flex items-center gap-2 text-sm font-bold text-ink/70">
              <input type="checkbox" name="is_featured" defaultChecked={editing?.is_featured} /> مقال مميّز
            </label>
            {editing && (
              <label className="flex items-center gap-2 text-sm font-bold text-ink/70">
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
          <ErrorText message={error} />
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'نشر الآن'}
            </button>
            <button type="button" onClick={closeForm} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">
              إلغاء
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState message="لا توجد مقالات بعد." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-right text-xs font-bold text-ink/45">
                <th className="py-2.5 pl-4">العنوان</th>
                <th className="py-2.5 pl-4">التصنيف</th>
                <th className="py-2.5 pl-4">الكاتب</th>
                <th className="py-2.5 pl-4">نُشر بواسطة</th>
                <th className="py-2.5 pl-4">الحالة</th>
                {canEdit && <th className="py-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-3 pl-4 font-bold">{a.title}{a.is_featured && ' ⭐'}</td>
                  <td className="py-3 pl-4 text-ink/60">{a.category}</td>
                  <td className="py-3 pl-4 text-ink/60">{a.author}</td>
                  <td className="py-3 pl-4 text-ink/45"><PublisherNote item={a} /></td>
                  <td className="py-3 pl-4"><Badge tone={a.is_published ? 'success' : 'neutral'}>{a.is_published ? 'منشور' : 'غير منشور'}</Badge></td>
                  {canEdit && (
                    <td className="py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(a)} className="rounded-lg p-2 text-ink/50 hover:bg-sand hover:text-ink" aria-label="تعديل"><EditIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(a.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50" aria-label="حذف"><TrashIcon className="h-4 w-4" /></button>
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
