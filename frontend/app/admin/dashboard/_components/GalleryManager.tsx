'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  adminGetGallery,
  adminCreateGalleryImage,
  adminUpdateGalleryImage,
  adminDeleteGalleryImage,
  adminCreateGalleryImagesBulk,
  adminGetAlbums,
  adminCreateAlbum,
  adminUpdateAlbum,
  adminDeleteAlbum,
  ApiException,
} from '@/lib/api';
import type { GalleryImage, GalleryAlbum } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon, ImageIcon } from '@/components/icons';
import { ART_THEMES, inputClass, labelClass, SectionCard, Badge, EmptyState, ErrorText, type Notify } from './shared';

export default function GalleryManager({ canEdit, showToast }: { canEdit: boolean; showToast: Notify }) {
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [albumFilter, setAlbumFilter] = useState<string>('all');

  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkAlbumId, setBulkAlbumId] = useState('');
  const [bulkTheme, setBulkTheme] = useState(ART_THEMES[0]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [bulkError, setBulkError] = useState<string | null>(null);

  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [albumEditing, setAlbumEditing] = useState<GalleryAlbum | null>(null);
  const [albumSubmitting, setAlbumSubmitting] = useState(false);
  const [albumError, setAlbumError] = useState<string | null>(null);

  function refreshImages() {
    adminGetGallery().then(setItems).catch(() => setItems([]));
  }
  function refreshAlbums() {
    adminGetAlbums().then(setAlbums).catch(() => setAlbums([]));
  }
  useEffect(() => { refreshImages(); refreshAlbums(); }, []);

  const albumTitleById = useMemo(() => new Map(albums.map((a) => [a.id, a.title])), [albums]);
  const filteredItems = useMemo(() => {
    if (albumFilter === 'all') return items;
    if (albumFilter === 'none') return items.filter((g) => !g.album_id);
    return items.filter((g) => g.album_id === albumFilter);
  }, [items, albumFilter]);

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(g: GalleryImage) { setEditing(g); setShowForm(true); }
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
        await adminUpdateGalleryImage(editing.id, formData);
        showToast('تم تحديث الصورة');
      } else {
        await adminCreateGalleryImage(formData);
        showToast('تم إضافة الصورة');
      }
      closeForm();
      refreshImages();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ الصورة');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('تأكيد حذف هذه الصورة؟')) return;
    await adminDeleteGalleryImage(id);
    showToast('تم حذف الصورة');
    if (editing?.id === id) closeForm();
    refreshImages();
  }

  function handleBulkFilesChange(e: ChangeEvent<HTMLInputElement>) {
    setBulkFiles(Array.from(e.target.files ?? []));
  }

  async function handleBulkUpload() {
    if (bulkFiles.length === 0) {
      setBulkError('اختر صورة واحدة على الأقل');
      return;
    }
    setBulkError(null);
    setBulkUploading(true);
    setBulkProgress({ done: 0, total: bulkFiles.length });
    try {
      await adminCreateGalleryImagesBulk(
        bulkFiles,
        { album_id: bulkAlbumId || null, art_theme: bulkTheme, is_published: true, startOrder: items.length },
        (done, total) => setBulkProgress({ done, total })
      );
      showToast(`تم رفع ${bulkFiles.length} صورة بنجاح`);
      setShowBulkForm(false);
      setBulkFiles([]);
      refreshImages();
    } catch (err) {
      setBulkError(err instanceof ApiException ? err.message : 'تعذّر رفع بعض الصور');
    } finally {
      setBulkUploading(false);
    }
  }

  function openCreateAlbum() { setAlbumEditing(null); setShowAlbumForm(true); }
  function openEditAlbum(a: GalleryAlbum) { setAlbumEditing(a); setShowAlbumForm(true); }
  function closeAlbumForm() { setShowAlbumForm(false); setAlbumEditing(null); setAlbumError(null); }

  async function handleAlbumSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAlbumError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get('title') || '').trim(),
      description: String(form.get('description') || '').trim() || undefined,
      order: Number(form.get('order') || 0),
    };
    setAlbumSubmitting(true);
    try {
      if (albumEditing) {
        await adminUpdateAlbum(albumEditing.id, payload);
        showToast('تم تحديث الألبوم');
      } else {
        await adminCreateAlbum(payload);
        showToast('تم إنشاء الألبوم');
      }
      closeAlbumForm();
      refreshAlbums();
    } catch (err) {
      setAlbumError(err instanceof ApiException ? err.message : 'تعذّر حفظ الألبوم');
    } finally {
      setAlbumSubmitting(false);
    }
  }

  async function handleDeleteAlbum(a: GalleryAlbum) {
    const count = items.filter((g) => g.album_id === a.id).length;
    const msg = count > 0
      ? `حذف ألبوم "${a.title}" هيحذف كل الصور اللي جواه كمان (${count} صورة). تأكيد؟`
      : `تأكيد حذف ألبوم "${a.title}"؟`;
    if (!confirm(msg)) return;
    try {
      await adminDeleteAlbum(a.id);
      showToast('تم حذف الألبوم');
      if (albumFilter === a.id) setAlbumFilter('all');
      refreshAlbums();
      refreshImages();
    } catch (err) {
      showToast(err instanceof ApiException ? err.message : 'تعذّر حذف الألبوم');
    }
  }

  return (
    <div className="grid gap-6">
      {/* الألبومات */}
      <SectionCard
        title="ألبومات الصور"
        description={`${albums.length} ألبوم`}
        action={
          canEdit && (
            <button onClick={openCreateAlbum} className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700">
              <PlusIcon className="h-3.5 w-3.5" /> ألبوم جديد
            </button>
          )
        }
      >
        {showAlbumForm && canEdit && (
          <form onSubmit={handleAlbumSubmit} className="mb-5 grid gap-4 rounded-xl bg-sand/60 p-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>اسم الألبوم</label>
              <input name="title" required defaultValue={albumEditing?.title} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>الترتيب</label>
              <input name="order" type="number" min={0} defaultValue={albumEditing?.order ?? 0} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>وصف مختصر (اختياري)</label>
              <input name="description" defaultValue={albumEditing?.description ?? ''} className={inputClass} />
            </div>
            <ErrorText message={albumError} />
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" disabled={albumSubmitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
                {albumSubmitting ? 'جارٍ الحفظ…' : albumEditing ? 'حفظ التعديلات' : 'إنشاء الألبوم'}
              </button>
              <button type="button" onClick={closeAlbumForm} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">إلغاء</button>
            </div>
          </form>
        )}

        {albums.length === 0 ? (
          <EmptyState message="لا توجد ألبومات بعد. أنشئ ألبوم لتنظيم الصور." />
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAlbumFilter('all')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${albumFilter === 'all' ? 'bg-violet-600 text-white' : 'bg-sand text-ink/60 hover:bg-sand/70'}`}
            >
              كل الصور ({items.length})
            </button>
            <button
              onClick={() => setAlbumFilter('none')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${albumFilter === 'none' ? 'bg-violet-600 text-white' : 'bg-sand text-ink/60 hover:bg-sand/70'}`}
            >
              بدون ألبوم ({items.filter((g) => !g.album_id).length})
            </button>
            {albums.map((a) => (
              <div key={a.id} className={`flex items-center gap-1.5 rounded-full pr-1.5 pl-1 py-1 text-xs font-bold transition ${albumFilter === a.id ? 'bg-violet-600 text-white' : 'bg-sand text-ink/60 hover:bg-sand/70'}`}>
                <button onClick={() => setAlbumFilter(a.id)} className="px-2.5 py-1">
                  {a.title} ({items.filter((g) => g.album_id === a.id).length})
                </button>
                {canEdit && (
                  <span className="flex items-center gap-0.5">
                    <button onClick={() => openEditAlbum(a)} className={`rounded-full p-1.5 ${albumFilter === a.id ? 'hover:bg-white/20' : 'hover:bg-white'}`} aria-label="تعديل الألبوم"><EditIcon className="h-3 w-3" /></button>
                    <button onClick={() => handleDeleteAlbum(a)} className={`rounded-full p-1.5 ${albumFilter === a.id ? 'hover:bg-white/20' : 'hover:bg-white'}`} aria-label="حذف الألبوم"><TrashIcon className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* الصور */}
      <SectionCard
        title="إدارة معرض الصور"
        description={`${filteredItems.length} صورة${albumFilter !== 'all' ? ' في هذا التصنيف' : ''}`}
        action={
          canEdit && (
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setShowBulkForm((v) => !v)} className="flex items-center gap-1.5 rounded-full border border-violet-200 px-4 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50">
                <ImageIcon className="h-3.5 w-3.5" /> رفع عدة صور
              </button>
              <button onClick={openCreate} className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700">
                <PlusIcon className="h-3.5 w-3.5" /> إضافة صورة
              </button>
            </div>
          )
        }
      >
        {showBulkForm && canEdit && (
          <div className="mb-6 grid gap-4 rounded-xl bg-sand/60 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>اختر عدة صور</label>
              <input type="file" accept="image/*" multiple onChange={handleBulkFilesChange} className={inputClass} />
              {bulkFiles.length > 0 && <p className="mt-1.5 text-xs text-ink/55">تم اختيار {bulkFiles.length} صورة</p>}
            </div>
            <div>
              <label className={labelClass}>الألبوم (اختياري)</label>
              <select value={bulkAlbumId} onChange={(e) => setBulkAlbumId(e.target.value)} className={inputClass}>
                <option value="">بدون ألبوم</option>
                {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>نمط التصميم (عند فشل الرفع)</label>
              <select value={bulkTheme} onChange={(e) => setBulkTheme(e.target.value)} className={inputClass}>
                {ART_THEMES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            {bulkUploading && (
              <div className="sm:col-span-2">
                <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full bg-violet-600 transition-all" style={{ width: `${(bulkProgress.done / Math.max(bulkProgress.total, 1)) * 100}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-ink/55">{bulkProgress.done} من {bulkProgress.total}</p>
              </div>
            )}
            <ErrorText message={bulkError} />
            <div className="flex gap-3 sm:col-span-2">
              <button onClick={handleBulkUpload} disabled={bulkUploading} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
                {bulkUploading ? 'جارٍ الرفع…' : `رفع ${bulkFiles.length || ''} صورة`}
              </button>
              <button type="button" onClick={() => { setShowBulkForm(false); setBulkFiles([]); setBulkError(null); }} disabled={bulkUploading} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">إلغاء</button>
            </div>
          </div>
        )}

        {showForm && canEdit && (
          <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl bg-sand/60 p-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>العنوان</label>
              <input name="title" required defaultValue={editing?.title} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>وصف مختصر</label>
              <input name="caption" defaultValue={editing?.caption ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>الألبوم (اختياري)</label>
              <select name="album_id" defaultValue={editing?.album_id ?? ''} className={inputClass}>
                <option value="">بدون ألبوم</option>
                {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
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
            <ErrorText message={error} />
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
                {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة صورة'}
              </button>
              <button type="button" onClick={closeForm} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">إلغاء</button>
            </div>
          </form>
        )}

        {filteredItems.length === 0 ? (
          <EmptyState message="لا توجد صور في هذا التصنيف." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((g) => (
              <div key={g.id} className="group relative overflow-hidden rounded-xl border border-ink/10">
                <div className="aspect-square bg-sand">
                  {g.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.image_url} alt={g.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-ink/40">{g.art_theme}</div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-bold">{g.title}</p>
                  {g.album_id && albumTitleById.has(g.album_id) && (
                    <Badge tone="violet">{albumTitleById.get(g.album_id)}</Badge>
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
    </div>
  );
}
