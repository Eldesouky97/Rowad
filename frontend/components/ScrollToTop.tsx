'use client';

import { useEffect, useState } from 'react';
import { ArrowIcon } from './icons';

/** زرار عائم "للأعلى" — يظهر بعد ما المستخدم ينزل مسافة معينة في الصفحة */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 640);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="العودة لأعلى الصفحة"
      className={`fixed bottom-6 left-6 z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-card transition-all duration-300 hover:bg-violet-700 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowIcon className="h-4 w-4 rotate-90" />
    </button>
  );
}
