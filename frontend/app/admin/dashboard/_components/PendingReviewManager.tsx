'use client';

import { useEffect, useState } from 'react';
import { adminGetPendingReviewItems, adminApprovePendingItem, adminRejectPendingItem, getSiteSettings, ApiException, type PendingReviewItem } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';
import { CheckIcon, CloseIcon, UsersIcon } from '@/components/icons';
import { SectionCard, EmptyState, Badge, type Notify } from './shared';
import SocialShareModal from './SocialShareModal';
import { getArticleSharePlatforms, autoOpenSharePopups } from '@/lib/socialShare';

/**
 * قسم "بانتظار المراجعة" — سوبر أدمن فقط. بيجمع كل المحتوى اللي محررين
 * أضافوه أو عدّلوه (pending_review) من كل الأقسام في قائمة واحدة، مع
 * أزرار موافقة (نشر فعلي) أو رفض (حذف نهائي).
 */
export default function PendingReviewManager({ showToast }: { showToast: Notify }) {
  const [items, setItems] = useState<PendingReviewItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [shareItem, setShareItem] = useState<PendingReviewItem | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  function refresh() {
    setItems(null);
    adminGetPendingReviewItems().then(setItems).catch(() => setItems([]));
  }
  useEffect(refresh, []);
  useEffect(() => {
    getSiteSettings().then(setSiteSettings).catch(() => setSiteSettings({}));
  }, []);

  async function handleApprove(item: PendingReviewItem) {
    setBusyId(item.id);
    try {
      await adminApprovePendingItem(item.collection, item.id);
      showToast(`تم نشر «${item.title}»`);
      setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null);
      // لحظة الموافقة هي اللحظة اللي محتوى المحرر بيبقى ظاهر فعليًا للعامة —
      // نعرض خيار المشاركة على السوشيال ميديا هنا بدل صفحة المقال (المحرر
      // نفسه ملوش صلاحية يشوفها لحد ما تتوافق عليه أصلًا)
      if (item.collection === 'articles' && item.slug) {
        setShareItem(item);
        if (siteSettings?.auto_share_on_publish) {
          const pageUrl = `${window.location.origin}/news/${item.slug}`;
          autoOpenSharePopups(
            getArticleSharePlatforms(
              { title: item.title, excerpt: item.excerpt ?? '', slug: item.slug, category: item.category, governorate: item.governorate },
              siteSettings,
              pageUrl
            )
          );
        }
      }
    } catch (err) {
      showToast(err instanceof ApiException ? err.message : 'تعذّرت الموافقة');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(item: PendingReviewItem) {
    if (!confirm(`رفض وحذف «${item.title}» نهائيًا؟`)) return;
    setBusyId(item.id);
    try {
      await adminRejectPendingItem(item.collection, item.id);
      showToast(`تم رفض وحذف «${item.title}»`);
      setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null);
    } catch (err) {
      showToast(err instanceof ApiException ? err.message : 'تعذّر الرفض');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SectionCard
      title="بانتظار المراجعة"
      description={items ? `${items.length} عنصر بانتظار الموافقة` : undefined}
    >
      {items === null ? (
        <p className="py-6 text-center text-sm text-ink/50">جارٍ التحميل…</p>
      ) : items.length === 0 ? (
        <EmptyState message="مفيش أي محتوى بانتظار المراجعة دلوقتي." />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={`${item.collection}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-sand/40 p-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <Badge tone="violet">{item.collectionLabel}</Badge>
                  <Badge tone="warning">بانتظار المراجعة</Badge>
                </div>
                <p className="truncate font-bold">{item.title}</p>
                {item.created_by_name && (
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/45">
                    <UsersIcon className="h-3 w-3" /> نُشر بواسطة {item.created_by_name}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => handleApprove(item)}
                  disabled={busyId === item.id}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <CheckIcon className="h-3.5 w-3.5" /> موافقة ونشر
                </button>
                <button
                  onClick={() => handleReject(item)}
                  disabled={busyId === item.id}
                  className="flex items-center gap-1.5 rounded-full border border-rose-200 px-4 py-2 text-xs font-bold text-rose-500 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  <CloseIcon className="h-3.5 w-3.5" /> رفض وحذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {shareItem && shareItem.slug && (
        <SocialShareModal
          article={{
            title: shareItem.title,
            excerpt: shareItem.excerpt ?? '',
            slug: shareItem.slug,
            image_url: shareItem.image_url,
            category: shareItem.category,
            governorate: shareItem.governorate,
          }}
          onClose={() => setShareItem(null)}
        />
      )}
    </SectionCard>
  );
}
