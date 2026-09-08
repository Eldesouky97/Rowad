'use client';

import { useEffect, useRef, useState } from 'react';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, ZoomIcon } from './icons';

export interface LightboxImage {
  id: string;
  src: string;
  title: string;
  caption?: string | null;
}

/**
 * صندوق عرض الصور المكبّر — بيتنقل بالأسهم/لوحة المفاتيح/السحب على الموبايل،
 * وبيدعم تكبير الصورة الحالية بالنقر عليها (toggle zoom). مبني يدويًا بـ
 * Tailwind + React عادي من غير مكتبة خارجية، اتساقًا مع باقي المكوّنات
 * (Toast, BookingModal) في المشروع.
 */
export default function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: LightboxImage[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const current = images[index];

  function goNext() {
    setZoomed(false);
    setIndex((i) => (i + 1) % images.length);
  }
  function goPrev() {
    setZoomed(false);
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goPrev(); // RTL: يمين = السابق بصريًا
      if (e.key === 'ArrowLeft') goNext();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) (diff > 0 ? goPrev : goNext)();
    touchStartX.current = null;
  }

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[600] flex flex-col bg-black/95 backdrop-blur-sm"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* الشريط العلوي */}
      <div className="flex items-center justify-between gap-3 px-4 py-4 text-cream sm:px-6">
        <span className="font-utility text-xs font-bold tracking-wider text-cream/60">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {/* الصورة + أزرار التنقل */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 sm:px-4">
        <button
          onClick={goPrev}
          aria-label="الصورة السابقة"
          className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-cream transition hover:bg-white/25 sm:right-6 sm:h-12 sm:w-12"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>

        <div
          className={`relative flex max-h-full max-w-full items-center justify-center transition-transform duration-300 ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => setZoomed((v) => !v)}
        >
          {current.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.src}
              alt={current.title}
              className={`max-h-[75vh] rounded-lg object-contain shadow-2xl transition-transform duration-300 ${
                zoomed ? 'max-h-none max-w-none scale-150 sm:scale-[1.8]' : 'max-w-[92vw] sm:max-w-[80vw]'
              }`}
            />
          ) : (
            <div className="flex h-[50vh] w-[70vw] items-center justify-center rounded-lg bg-night-2 text-cream/40">
              <ZoomIcon className="h-10 w-10" />
            </div>
          )}
          {!zoomed && (
            <span className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-[10px] text-cream/70 sm:flex">
              <ZoomIcon className="h-3 w-3" /> اضغط للتكبير
            </span>
          )}
        </div>

        <button
          onClick={goNext}
          aria-label="الصورة التالية"
          className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-cream transition hover:bg-white/25 sm:left-6 sm:h-12 sm:w-12"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      </div>

      {/* عنوان ووصف الصورة */}
      <div className="px-5 pb-6 pt-3 text-center text-cream sm:px-8">
        <b className="font-display text-base">{current.title}</b>
        {current.caption && <p className="mt-1 text-sm text-cream/60">{current.caption}</p>}
      </div>

      {/* شريط مصغّرات للتنقل السريع (سطح المكتب) */}
      {images.length > 1 && (
        <div className="hidden gap-2 overflow-x-auto border-t border-white/10 px-6 py-3 sm:flex">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => {
                setZoomed(false);
                setIndex(i);
              }}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === index ? 'ring-gold-2' : 'ring-transparent opacity-50 hover:opacity-80'
              }`}
            >
              {img.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.src} alt={img.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-night-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
