'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
import Reveal from '@/components/Reveal';
import { getArticles } from '@/lib/api';
import type { Article } from '@/lib/types';
import { SearchIcon, EyeIcon, StarIcon, BookIcon } from '@/components/icons';

const CATS = ['الكل', 'أخبار الكيان', 'قصص نجاح', 'فعاليات', 'تنمية مجتمعية', 'مقالات رأي'];
const ART_BG: Record<string, string> = {
  'art-1': 'bg-gradient-to-br from-sea to-[#0a4247]',
  'art-2': 'bg-gradient-to-br from-rust to-[#7a3620]',
  'art-3': 'bg-gradient-to-br from-gold to-[#a9782c]',
  'art-4': 'bg-gradient-to-br from-night-3 to-night',
};

function NewsPageInner() {
  const searchParams = useSearchParams();
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('الكل');
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // نجيب كل المقالات مرة واحدة عشان نحسب منها الخبر الرئيسي وقائمة "الأكثر قراءة"
  useEffect(() => {
    getArticles().then(setAllArticles).catch(() => setAllArticles([]));
  }, []);

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

  const featured = useMemo(() => {
    const list = allArticles.filter((a) => a.is_featured);
    return (list.length > 0 ? list : allArticles)
      .slice()
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0];
  }, [allArticles]);

  const mostRead = useMemo(
    () => allArticles.slice().sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5),
    [allArticles]
  );

  const isDefaultView = category === 'الكل' && query === '';
  const gridArticles = isDefaultView && featured ? articles.filter((a) => a.id !== featured.id) : articles;

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

      {/* ============ الخبر الرئيسي ============ */}
      {isDefaultView && featured && (
        <section className="bg-cream pt-12">
          <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
            <Reveal>
              <Link
                href={`/news/${featured.slug}`}
                className="group grid overflow-hidden rounded-[22px] border border-gold/25 bg-white shadow-card transition-all duration-300 hover:shadow-xl md:grid-cols-2"
              >
                <div className={`relative flex h-56 items-center justify-center overflow-hidden text-cream/85 md:h-full ${ART_BG[featured.art_theme]}`}>
                  <BookIcon className="h-14 w-14 opacity-90 transition-transform duration-500 group-hover:scale-110" />
                  <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-gold-2 px-3 py-1 font-utility text-[11px] font-bold text-night">
                    <StarIcon className="h-3.5 w-3.5" /> الخبر الرئيسي
                  </span>
                </div>
                <div className="flex flex-col justify-center gap-3 p-8">
                  <span className="font-utility text-xs font-bold text-rust">{featured.category} · {featured.governorate}</span>
                  <h2 className="font-display text-2xl leading-snug transition-colors group-hover:text-violet-700">{featured.title}</h2>
                  <p className="opacity-80">{featured.excerpt}</p>
                  <div className="mt-2 flex flex-wrap gap-4 font-utility text-xs text-[#6b5f4c]">
                    <span>{featured.author}</span>
                    {featured.views != null && featured.views > 0 && (
                      <span className="flex items-center gap-1"><EyeIcon className="h-3.5 w-3.5" /> {featured.views.toLocaleString('ar-EG')} مشاهدة</span>
                    )}
                  </div>
                </div>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      <section className="bg-cream py-16">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 sm:px-6 lg:grid-cols-[1fr_300px]">
          <div>
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
            ) : gridArticles.length === 0 ? (
              <div className="py-16 text-center opacity-70">
                <SearchIcon className="mx-auto mb-3 h-9 w-9" />
                <p>لا توجد نتائج مطابقة لبحثك</p>
              </div>
            ) : (
              <Reveal variant="stagger" className="grid gap-6 sm:grid-cols-2">
                {gridArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </Reveal>
            )}
          </div>

          {/* ============ الأكثر قراءة ============ */}
          {mostRead.length > 0 && (
            <aside className="h-fit rounded-[20px] border border-gold/20 bg-white p-6 lg:sticky lg:top-24">
              <h3 className="mb-5 flex items-center gap-2 font-display text-lg">
                <EyeIcon className="h-5 w-5 text-rust" /> الأكثر قراءة
              </h3>
              <ol className="flex flex-col gap-4">
                {mostRead.map((a, i) => (
                  <li key={a.id}>
                    <Link href={`/news/${a.slug}`} className="group flex items-start gap-3">
                      <span className="mt-0.5 font-display text-xl text-gold/60 transition group-hover:text-rust">{i + 1}</span>
                      <span>
                        <span className="block text-sm font-bold leading-snug transition-colors group-hover:text-violet-700">{a.title}</span>
                        {a.views != null && (
                          <span className="mt-1 flex items-center gap-1 font-utility text-[11px] text-[#8a7a5c]">
                            <EyeIcon className="h-3 w-3" /> {a.views.toLocaleString('ar-EG')} مشاهدة
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </div>
      </section>
    </>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="bg-cream py-24 text-center opacity-60">جارٍ التحميل…</div>}>
      <NewsPageInner />
    </Suspense>
  );
}
