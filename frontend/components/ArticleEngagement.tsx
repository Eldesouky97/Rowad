'use client';

import { useEffect, useState } from 'react';
import { incrementArticleViews, toggleArticleLike } from '@/lib/api';
import { hasLikedArticle, setArticleLiked } from '@/lib/articleLikes';
import { EyeIcon, HeartIcon, LinkIcon } from './icons';

const VIEWED_KEY = 'rowwad-viewed-articles';

function hasCountedView(articleId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = sessionStorage.getItem(VIEWED_KEY);
    const viewed: string[] = raw ? JSON.parse(raw) : [];
    return viewed.includes(articleId);
  } catch {
    return true;
  }
}

function markViewCounted(articleId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(VIEWED_KEY);
    const viewed: string[] = raw ? JSON.parse(raw) : [];
    sessionStorage.setItem(VIEWED_KEY, JSON.stringify([...viewed, articleId]));
  } catch {
    // تجاهل
  }
}

/** عدّاد مشاهدات حقيقي + زر إعجاب + مشاركة — يُضمَّن في صفحة المقال (Server
 * Component) كمكوّن عميل صغير مستقل، عشان صفحة المقال نفسها تفضل تُصدَّر
 * على السيرفر لأسباب الـ SEO بينما التفاعل يبقى في المتصفح فقط. */
export default function ArticleEngagement({
  articleId,
  initialViews,
  initialLikes,
  title,
}: {
  articleId: string;
  initialViews: number;
  initialLikes: number;
  title: string;
}) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLiked(hasLikedArticle(articleId));
    if (!hasCountedView(articleId)) {
      markViewCounted(articleId);
      setViews((v) => v + 1);
      incrementArticleViews(articleId);
    }
  }, [articleId]);

  async function handleLikeClick() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    setArticleLiked(articleId, next);
    try {
      await toggleArticleLike(articleId, next);
    } catch {
      // ارجع للحالة القديمة لو فشل الحفظ في قاعدة البيانات
      setLiked(!next);
      setLikes((n) => n - (next ? 1 : -1));
      setArticleLiked(articleId, !next);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // المستخدم لغى المشاركة — تجاهل
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // تجاهل
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} — ${typeof window !== 'undefined' ? window.location.href : ''}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-3 border-y border-gold/15 py-4">
      <span className="flex items-center gap-1.5 text-sm opacity-65">
        <EyeIcon className="h-4 w-4" /> {views.toLocaleString('ar-EG')} مشاهدة
      </span>

      <button
        onClick={handleLikeClick}
        className={`flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-1.5 text-sm font-bold transition ${
          liked ? 'border-rust bg-rust/10 text-rust' : 'border-gold/30 hover:bg-rust/5'
        }`}
      >
        <HeartIcon className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {likes.toLocaleString('ar-EG')}
      </button>

      <span className="mx-1 hidden h-5 w-px bg-gold/20 sm:inline-block" />

      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-full border-[1.5px] border-gold/30 px-4 py-1.5 text-sm font-bold transition hover:bg-night hover:text-cream"
      >
        <LinkIcon className="h-4 w-4" /> {copied ? 'تم نسخ الرابط' : 'مشاركة'}
      </button>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border-[1.5px] border-gold/30 px-4 py-1.5 text-sm font-bold transition hover:bg-night hover:text-cream"
      >
        واتساب
      </a>
    </div>
  );
}
