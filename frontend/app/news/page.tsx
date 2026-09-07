'use client';

import { useEffect, useState } from 'react';
import ArticleCard from '@/components/ArticleCard';
import Reveal from '@/components/Reveal';
import { getArticles } from '@/lib/api';
import type { Article } from '@/lib/types';
import { SearchIcon } from '@/components/icons';

const CATS = ['الكل', 'أخبار الكيان', 'قصص نجاح', 'فعاليات', 'تنمية مجتمعية', 'مقالات رأي'];

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('الكل');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      getArticles({ category, q: query })
        .then(setArticles)
        .catch(() => setArticles([]))
        .finally(() => setLoading(false));
    }, 250); // تأخير بسيط لتقليل عدد الطلبات أثناء الكتابة في البحث
    return () => clearTimeout(handle);
  }, [category, query]);

  return (
    <>
      <section className="bg-night pb-10 pt-16 text-cream">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
            <span className="h-0.5 w-6 bg-gold-2" /> البوابة الإخبارية
          </p>
          <h1 className="max-w-[22ch] font-display text-3xl sm:text-4xl">
            أخبار ومقالات من قلب المحافظات الحدودية
          </h1>
          <p className="mt-4 max-w-[60ch] opacity-75">
            تغطية فعالياتنا، قصص نجاح موثّقة، ومقالات رأي بأقلام شبابية.
          </p>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative max-w-[360px] flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في الأخبار والمقالات…"
                className="w-full rounded-full border-[1.5px] border-gold/30 bg-white py-3 pl-4 pr-10 text-sm"
              />
              <SearchIcon className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7a5c]" />
            </div>
          </Reveal>

          <Reveal className="mb-8 flex flex-wrap gap-3">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border-[1.5px] px-5 py-2 font-utility text-sm font-bold transition ${
                  category === c ? 'border-night bg-night text-cream' : 'border-gold/30 hover:bg-night hover:text-cream'
                }`}
              >
                {c}
              </button>
            ))}
          </Reveal>

          {loading ? (
            <p className="py-16 text-center opacity-60">جارٍ التحميل…</p>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center opacity-70">
              <SearchIcon className="mx-auto mb-3 h-9 w-9" />
              <p>لا توجد نتائج مطابقة لبحثك</p>
            </div>
          ) : (
            <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
