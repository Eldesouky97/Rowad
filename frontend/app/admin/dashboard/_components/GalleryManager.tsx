'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  adminGetGallery,
  adminCreateGalleryImage,
  adminUpdateGalleryImage,
  adminDeleteGalleryImage,
  adminCreateGalleryImagesBulk,
  adminAssignImagesToAlbum,
  adminGetAlbums,
  adminCreateAlbum,
  adminUpdateAlbum,
  adminDeleteAlbum,
  ApiException,
} from '@/lib/api';
import type { GalleryImage, GalleryAlbum } from '@/lib/types';
import {
  PlusIcon, EditIcon, TrashIcon, ImageIcon, CloseIcon,
  UploadIcon, CheckSquareIcon, LayersIcon, CheckIcon,
} from '@/components/icons';
import { ART_THEMES, inputClass, labelClass, SectionCard, Badge, EmptyState, ErrorText, PublisherNote, type Notify } from './shared';

const ART_BG: Record<string, string> = {
  'art-1': 'from-sea to-[#0a4247]',
  'art-2': 'from-rust to-[#7a3620]',
  'art-3': 'from-gold to-[#a9782c]',
  'art-4': 'from-night-3 to-night',
};

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

  // الألبوم اللي بيتم إدارة صوره حاليًا (رفع جديد أو اختيار من الموجود) — مودال منفصل
  const [managingAlbum, setManagingAlbum] = useState<GalleryAlbum | null>(null);

  function refreshImages() {
    adminGetGallery().then(setItems).catch(() => setItems([]));
  }
  function refreshAlbums() {
    adminGetAlbums().then(setAlbums).catch(() => setAlbums([]));
  }
  useEffect(() => { refreshImages(); refreshAlbums(); }, []);

  const albumTitleById = useMemo(() => new Map(albums.map((a) => [a.id, a.title])), [albums]);
  const imagesByAlbum = useMemo(() => {
    const map = new Map<string, GalleryImage[]>();
    for (const g of items) {
      if (!g.album_id) continue;
      map.set(g.album_id, [...(map.get(g.album_id) ?? []), g]);
    }
    return map;
  }, [items]);
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
      {/* الألبومات — كروت بصورة غلاف */}
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {albums.map((a) => {
              const albumImages = imagesByAlbum.get(a.id) ?? [];
              const cover = albumImages[0];
              return (
                <div key={a.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink/10">
                  {cover?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.image_url} alt={a.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${ART_BG[cover?.art_theme || 'art-1']}`}>
                      <LayersIcon className="h-9 w-9 text-white/70" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <b className="block truncate font-display text-sm">{a.title}</b>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-white/70">
                      <ImageIcon className="h-3 w-3" /> {albumImages.length} صورة
                    </span>
                    {a.created_by_name && <p className="mt-0.5 truncate text-[10px] text-white/50">نُشر بواسطة {a.created_by_name}</p>}
                  </div>

                  {canEdit ? (
                    <>
                      <button
                        onClick={() => setManagingAlbum(a)}
                        className="absolute inset-0"
                        aria-label={`إدارة صور ألبوم ${a.title}`}
                      />
                      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditAlbum(a); }}
                          className="pointer-events-auto rounded-lg bg-white/90 p-1.5 text-ink/60 shadow hover:text-ink"
                          aria-label="تعديل بيانات الألبوم"
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(a); }}
                          className="pointer-events-auto rounded-lg bg-white/90 p-1.5 text-rose-500 shadow hover:bg-rose-50"
                          aria-label="حذف الألبوم"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-violet-600 py-2 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                        <UploadIcon className="h-3.5 w-3.5" /> إدارة الصور
                      </span>
                    </>
                  ) : (
                    <button onClick={() => setAlbumFilter(a.id)} className="absolute inset-0" aria-label={`عرض صور ${a.title}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* الصور */}
      <SectionCard
        title="كل الصور"
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
        {/* فلترة سريعة بالألبوم */}
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setAlbumFilter('all')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${albumFilter === 'all' ? 'bg-violet-600 text-white' : 'bg-sand text-ink/60 hover:bg-sand/70'}`}
          >
            الكل ({items.length})
          </button>
          <button
            onClick={() => setAlbumFilter('none')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${albumFilter === 'none' ? 'bg-violet-600 text-white' : 'bg-sand text-ink/60 hover:bg-sand/70'}`}
          >
            بدون ألبوم ({items.filter((g) => !g.album_id).length})
          </button>
          {albums.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlbumFilter(a.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${albumFilter === a.id ? 'bg-violet-600 text-white' : 'bg-sand text-ink/60 hover:bg-sand/70'}`}
            >
              {a.title} ({imagesByAlbum.get(a.id)?.length ?? 0})
            </button>
          ))}
        </div>

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
            <div>
              <label className={labelClass}>اسم الكاتب/المصور (اختياري — يظهر للجمهور)</label>
              <input name="author" defaultValue={editing?.author ?? ''} placeholder="مثال: أحمد المصور" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>رفع صورة حقيقية (اختياري)</label>
              <input name="image" type="file" accept="image/*" className={inputClass} />
            </div>
            <ErrorText message={error} />
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
                {submitting ? 'جارٍ الحفظ…' : editing ? 'حفظ التعديلات' : 'إضافة صورة'}
              </button>
              <button type="button" onClick={closeForm} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">إلغاء</button>
              {editing && <PublisherNote item={editing} />}
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
                  <PublisherNote item={g} className="mt-1 block" />
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

      {managingAlbum && canEdit && (
        <AlbumImagesModal
          album={managingAlbum}
          allImages={items}
          onClose={() => setManagingAlbum(null)}
          onChanged={refreshImages}
          showToast={showToast}
        />
      )}
    </div>
  );
}

/**
 * مودال إدارة صور ألبوم واحد — تبويبين: رفع صور جديدة مباشرة جوّه الألبوم،
 * أو اختيار صور موجودة بالفعل في المعرض (من ألبومات تانية أو بدون ألبوم)
 * وضمّها له بدل رفعها تاني (adminAssignImagesToAlbum بيحدّث album_id بس).
 */
function AlbumImagesModal({
  album,
  allImages,
  onClose,
  onChanged,
  showToast,
}: {
  album: GalleryAlbum;
  allImages: GalleryImage[];
  onClose: () => void;
  onChanged: () => void;
  showToast: Notify;
}) {
  const [tab, setTab] = useState<'upload' | 'pick'>('upload');

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  const albumImages = allImages.filter((g) => g.album_id === album.id);
  const otherImages = allImages.filter((g) => g.album_id !== album.id);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleUpload() {
    if (files.length === 0) {
      setUploadError('اختر صورة واحدة على الأقل');
      return;
    }
    setUploadError(null);
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    try {
      await adminCreateGalleryImagesBulk(
        files,
        { album_id: album.id, art_theme: 'art-1', is_published: true, startOrder: albumImages.length },
        (done, total) => setProgress({ done, total })
      );
      showToast(`تم رفع ${files.length} صورة للألبوم`);
      setFiles([]);
      onChanged();
    } catch (err) {
      setUploadError(err instanceof ApiException ? err.message : 'تعذّر رفع بعض الصور');
    } finally {
      setUploading(false);
    }
  }

  async function handleAssignSelected() {
    if (selected.size === 0) return;
    setAssigning(true);
    try {
      await adminAssignImagesToAlbum(Array.from(selected), album.id);
      showToast(`تم إضافة ${selected.size} صورة للألبوم`);
      setSelected(new Set());
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiException ? err.message : 'تعذّر إضافة الصور');
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemoveFromAlbum(id: string) {
    try {
      await adminAssignImagesToAlbum([id], null);
      showToast('تم إزالة الصورة من الألبوم');
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiException ? err.message : 'تعذّر الإزالة');
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm sm:items-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="my-8 w-full max-w-[820px] rounded-[20px] bg-white p-6 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl">إدارة صور «{album.title}»</h3>
            <p className="mt-1 text-xs text-ink/50">{albumImages.length} صورة في الألبوم حاليًا</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10" aria-label="إغلاق">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* تبويبات */}
        <div className="mb-5 flex gap-2 border-b border-ink/10">
          <button
            onClick={() => setTab('upload')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-bold transition ${tab === 'upload' ? 'border-violet-600 text-violet-700' : 'border-transparent text-ink/50 hover:text-ink'}`}
          >
            <UploadIcon className="h-4 w-4" /> رفع صور جديدة
          </button>
          <button
            onClick={() => setTab('pick')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-bold transition ${tab === 'pick' ? 'border-violet-600 text-violet-700' : 'border-transparent text-ink/50 hover:text-ink'}`}
          >
            <CheckSquareIcon className="h-4 w-4" /> اختيار من الصور الموجودة ({otherImages.length})
          </button>
        </div>

        {tab === 'upload' ? (
          <div className="grid gap-4">
            <div>
              <label className={labelClass}>اختر صورة أو أكثر لرفعها مباشرة داخل هذا الألبوم</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className={inputClass}
              />
              {files.length > 0 && <p className="mt-1.5 text-xs text-ink/55">تم اختيار {files.length} صورة</p>}
            </div>
            {uploading && (
              <div>
                <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full bg-violet-600 transition-all" style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-ink/55">{progress.done} من {progress.total}</p>
              </div>
            )}
            <ErrorText message={uploadError} />
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="justify-self-start rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {uploading ? 'جارٍ الرفع…' : `رفع ${files.length || ''} صورة للألبوم`}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {otherImages.length === 0 ? (
              <EmptyState message="مفيش صور تانية متاحة في المعرض دلوقتي." />
            ) : (
              <>
                <div className="grid max-h-[360px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {otherImages.map((g) => {
                    const isSelected = selected.has(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleSelect(g.id)}
                        className={`group relative aspect-square overflow-hidden rounded-lg transition ${isSelected ? 'ring-[3px] ring-violet-600' : 'ring-1 ring-ink/10 hover:ring-violet-300'}`}
                      >
                        {g.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={g.image_url} alt={g.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-sand text-[9px] font-bold text-ink/40">{g.title}</div>
                        )}
                        <div className={`absolute inset-0 flex items-center justify-center bg-violet-600/40 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          {isSelected && (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white">
                              <CheckIcon className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleAssignSelected}
                  disabled={selected.size === 0 || assigning}
                  className="justify-self-start rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {assigning ? 'جارٍ الإضافة…' : `إضافة ${selected.size || ''} صورة للألبوم`}
                </button>
              </>
            )}
          </div>
        )}

        {/* صور الألبوم الحالية */}
        {albumImages.length > 0 && (
          <div className="mt-7 border-t border-ink/10 pt-5">
            <h4 className="mb-3 text-sm font-bold text-ink/70">صور الألبوم الحالية</h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {albumImages.map((g) => (
                <div key={g.id} className="group relative aspect-square overflow-hidden rounded-lg">
                  {g.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.image_url} alt={g.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-sand text-[9px] font-bold text-ink/40">{g.title}</div>
                  )}
                  <button
                    onClick={() => handleRemoveFromAlbum(g.id)}
                    className="absolute inset-x-1 bottom-1 rounded-md bg-black/60 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100"
                  >
                    إزالة من الألبوم
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
