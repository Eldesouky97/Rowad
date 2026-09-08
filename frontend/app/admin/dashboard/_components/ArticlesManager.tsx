'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminGetArticles, adminCreateArticle, adminUpdateArticle, adminDeleteArticle, ApiException } from '@/lib/api';
import type { Article } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon, BookIcon } from '@/components/icons';
import RichTextEditor from '@/components/RichTextEditor';
import {
  ARTICLE_CATEGORIES, GOVS, inputClass, labelClass,
  SectionCard, Badge, EmptyState, ErrorText, PublisherNote, PendingBadge, EditorReviewNotice, publishToast, type Notify,
} from './shared';

const ART_BG: Record<string, string> = {
  'art-1': 'from-sea to-[#0a4247]',
  'art-2': 'from-rust to-[#7a3620]',
  'art-3': 'from-gold to-[#a9782c]',
  'art-4': 'from-night-3 to-night',
};

export default function ArticlesManager({
  canEdit,
  isSuperAdmin,
  showToast,
}: {
  canEdit: boolean;
  isSuperAdmin: boolean;
  showToast: Notify;
}) {
  const [items, setItems] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');

  function refresh() {
    adminGetArticles().then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, []);

  function openCreate() { setEditing(null); setContent(''); setShowForm(true); }
  function openEdit(a: Article) { setEditing(a); setContent(a.content); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setError(null); }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const contentText = content.replace(/<[^>]+>/g, '').trim();
    if (!contentText) {
      setError('من فضلك اكتب نص المقال');
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set('content', content);
    const imageEntry = formData.get('image');
    if (imageEntry instanceof File && imageEntry.size === 0) formData.delete('image');
    if (!editing && !formData.get('image')) {
      setError('صورة المقال مطلوبة');
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await adminUpdateArticle(editing.id, formData);
        showToast(publishToast(isSuperAdmin, 'تحديث', 'المقال'));
      } else {
        await adminCreateArticle(formData);
        showToast(publishToast(isSuperAdmin, 'إضافة', 'المقال'));
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
      <EditorReviewNotice isSuperAdmin={isSuperAdmin} canEdit={canEdit} />

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
          <div className="sm:col-span-2">
            <label className={labelClass}>صورة المقال {!editing && <span className="text-rust">(مطلوبة)</span>}</label>
            <div className="flex items-center gap-4">
              {editing?.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editing.image_url} alt={editing.title} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              )}
              <input name="image" type="file" accept="image/*" required={!editing} className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-6 self-end pb-2.5">
            <label className="flex items-center gap-2 text-sm font-bold text-ink/70">
              <input type="checkbox" name="is_featured" defaultChecked={editing?.is_featured} /> مقال مميّز
            </label>
            {isSuperAdmin && editing && (
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
            <RichTextEditor value={content} onChange={setContent} placeholder="اكتب نص المقال هنا… استخدم شريط الأدوات للعناوين والقوائم والروابط" />
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
              <div className="relative h-36 w-full overflow-hidden">
                {a.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image_url} alt={a.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${ART_BG[a.art_theme]}`}>
                    <BookIcon className="h-9 w-9 text-white/70" />
                  </div>
                )}
                <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
                  {!a.is_published && <Badge tone="neutral">غير منشور</Badge>}
                  <PendingBadge item={a} />
                </div>
                {(canEdit || isSuperAdmin) && (
                  <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition group-hover:opacity-100">
                    {canEdit && (
                      <button onClick={() => openEdit(a)} className="rounded-lg bg-white/90 p-1.5 text-ink/60 shadow hover:text-ink" aria-label="تعديل"><EditIcon className="h-3.5 w-3.5" /></button>
                    )}
                    {isSuperAdmin && (
                      <button onClick={() => handleDelete(a.id)} className="rounded-lg bg-white/90 p-1.5 text-rose-500 shadow hover:bg-rose-50" aria-label="حذف"><TrashIcon className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-sand-2 px-2.5 py-0.5 font-utility text-[11px] font-bold text-ink/60">{a.category}</span>
                  {a.is_featured && <span className="text-sm">⭐</span>}
                </div>
                <b className="line-clamp-2 font-display text-base leading-snug">{a.title}</b>
                <p className="mt-1.5 text-xs text-ink/50">{a.author}</p>
                <p className="mt-2 text-[11px] text-ink/40"><PublisherNote item={a} /></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
