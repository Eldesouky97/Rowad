'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Article } from '@/lib/types';
import { ArrowIcon } from './icons';

const ART_BG: Record<string, string> = {
  'art-1': 'bg-gradient-to-br from-sea to-[#0a4247]',
  'art-2': 'bg-gradient-to-br from-rust to-[#7a3620]',
  'art-3': 'bg-gradient-to-br from-gold to-[#a9782c]',
  'art-4': 'bg-gradient-to-br from-night-3 to-night',
};

const AUTO_ADVANCE_MS = 5500;

/** سلايدر إخباري متحرك أعلى الصفحة الرئيسية — صورة كاملة العرض + عنوان الخبر
 * لكل شريحة، بيتنقّل تلقائيًا كل بضع ثوانٍ (ويتوقف عند تمرير الماوس)، مع
 * أسهم وأزرار نقاط للتنقّل اليدوي. بياخد أحدث الأخبار المميّزة أولًا. */
export default function NewsSlider({ articles }: { articles: Article[] }) {
  const slides = articles.slice(0, 6);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(next, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [next, slides.length, paused]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative h-[280px] w-full overflow-hidden bg-night sm:h-[400px] lg:h-[480px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((a, i) => (
        <Link
          key={a.id}
          href={`/news/${a.slug}`}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
        >
          <div className={`h-full w-full ${ART_BG[a.art_theme]}`}>
            {a.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.image_url} alt={a.title} className="h-full w-full object-contain" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-[1180px] px-5 pb-12 sm:px-6 sm:pb-16">
              <span className="mb-3 inline-block rounded-full bg-gold-2 px-3 py-1 font-utility text-[11px] font-bold text-night">
                {a.category}
              </span>
              <h2 className="max-w-[46ch] font-display text-2xl leading-snug text-cream sm:text-3xl lg:text-[2.2rem]">
                {a.title}
              </h2>
            </div>
          </div>
        </Link>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="الخبر السابق"
            className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-cream backdrop-blur transition hover:bg-white/30"
          >
            <ArrowIcon className="h-5 w-5 rotate-180" />
          </button>
          <button
            onClick={next}
            aria-label="الخبر التالي"
            className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-cream backdrop-blur transition hover:bg-white/30"
          >
            <ArrowIcon className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`اذهب للخبر ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-gold-2' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
