'use client';

import { useEffect, useState } from 'react';
import { getSiteSettings } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';
import { buildArticleShareCaption, getArticleSharePlatforms, openSharePopup, type ShareArticleInput } from '@/lib/socialShare';
import { CloseIcon, CheckIcon, FacebookIcon, XIcon, LinkIcon } from '@/components/icons';

interface ShareArticle extends ShareArticleInput {
  image_url?: string | null;
}

const PLATFORM_STYLE: Record<string, { icon: React.ReactNode; color: string }> = {
  facebook: { icon: <FacebookIcon className="h-4 w-4" />, color: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]' },
  twitter: { icon: <XIcon className="h-3.5 w-3.5" />, color: 'hover:bg-night hover:text-cream' },
  whatsapp: { icon: null, color: 'hover:bg-[#25D366] hover:text-white hover:border-[#25D366]' },
  linkedin: { icon: null, color: 'hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]' },
};

/** نافذة "مشاركة على السوشيال ميديا" — بتظهر للناشر لحظة ما المقال يبقى منشورًا
 * فعليًا (سوبر أدمن بينشئ مباشرة، أو سوبر أدمن بيوافق على مقال محرر من قسم
 * "بانتظار المراجعة"). بتجهّز نص منشور احترافي جاهز، وبتعرض بس أزرار المنصات
 * اللي ليها رابط مضبوط في "إعدادات الموقع" — مفيش نشر تلقائي فعلي عبر API
 * (محتاج مفاتيح رسمية لكل منصة)، ده بيفتح نافذة المشاركة الجاهزة لكل منصة
 * بنقرة واحدة بدل ما الناشر يعمل نسخ/لصق يدوي. لو "النشر التلقائي" مفعّل في
 * الإعدادات، النوافذ دي بتتفتح تلقائيًا من غير ما ينتظر ضغط الأزرار (راجع
 * autoOpenSharePopups في lib/socialShare.ts). */
export default function SocialShareModal({ article, onClose }: { article: ShareArticle; onClose: () => void }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getSiteSettings().then(setSettings).catch(() => setSettings({}));
  }, []);

  const pageUrl = typeof window !== 'undefined' ? `${window.location.origin}/news/${article.slug}` : '';
  const caption = buildArticleShareCaption(article, pageUrl);
  const platforms = settings ? getArticleSharePlatforms(article, settings, pageUrl) : [];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // تجاهل
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-night/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mt-10 w-full max-w-[520px] rounded-[20px] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">شارك الخبر على السوشيال ميديا</h3>
            <p className="mt-1 text-xs text-ink/50">المقال بقى منشورًا فعليًا للعامة — انشره دلوقتي على صفحات الكيان</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/50 hover:bg-ink/10" aria-label="إغلاق">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex gap-3 rounded-xl border border-ink/10 bg-sand/40 p-3">
          {article.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.image_url} alt={article.title} className="h-16 w-16 shrink-0 rounded-lg bg-sand-2 object-contain" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{article.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-ink/55">{article.excerpt}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="font-utility text-xs font-bold text-ink/70">نص المنشور الجاهز</label>
            <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-bold text-rust hover:underline">
              {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
              {copied ? 'تم النسخ' : 'نسخ النص'}
            </button>
          </div>
          <textarea readOnly rows={5} value={caption} className="w-full resize-none rounded-lg border border-ink/10 bg-sand/30 p-3 text-xs leading-6" />
        </div>

        {settings === null ? (
          <p className="py-4 text-center text-sm text-ink/50">جارٍ تجهيز خيارات المشاركة…</p>
        ) : platforms.length === 0 ? (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            مفيش روابط سوشيال ميديا مضبوطة في &quot;إعدادات الموقع&quot; حاليًا — اضبطها الأول عشان أزرار المشاركة المباشرة تظهر هنا. تقدر برضه تنسخ النص وتلصقه يدويًا.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button
                key={p.key}
                onClick={() => openSharePopup(p.url)}
                className={`flex items-center gap-2 rounded-full border-[1.5px] border-gold/30 px-4 py-2 text-sm font-bold transition ${PLATFORM_STYLE[p.key].color}`}
              >
                {PLATFORM_STYLE[p.key].icon} {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
