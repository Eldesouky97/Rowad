'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getArticles } from '@/lib/api';
import type { Article } from '@/lib/types';
import { CloseIcon } from './icons';

const DISMISS_KEY = 'rowwad-ticker-dismissed';

/** شريط "عاجل" أعلى الموقع بالكامل — يعرض آخر الأخبار المنشورة في تمرير أفقي
 * مستمر. يُخفى لباقي الجلسة لو المستخدم قفله (sessionStorage، تجربة مستخدم
 * بحتة وليس تفضيلًا دائمًا). */
export default function BreakingNewsTicker() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') setDismissed(true);
    } catch {
      // تجاهل — الشريط يفضل ظاهر
    }
    getArticles()
      .then((list) => setArticles(list.slice(0, 6)))
      .catch(() => setArticles([]));
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // تجاهل
    }
  }

  if (dismissed || articles.length === 0) return null;

  return (
    <div className="flex items-center gap-3 border-b border-gold/20 bg-rust px-4 py-2 text-cream">
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-utility text-[11px] font-extrabold tracking-wide">
        عاجل
      </span>
      <div className="flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {[...articles, ...articles].map((a, i) => (
            <Link
              key={`${a.id}-${i}`}
              href={`/news/${a.slug}`}
              className="font-utility text-sm font-bold opacity-90 transition hover:opacity-100 hover:underline"
            >
              {a.title}
            </Link>
          ))}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="إغلاق شريط الأخبار العاجلة"
        className="shrink-0 rounded-full p-1 opacity-70 transition hover:bg-white/15 hover:opacity-100"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
