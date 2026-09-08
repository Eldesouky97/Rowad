'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * رقم يتصاعد من صفر للقيمة الفعلية لحظة ظهوره في الشاشة (IntersectionObserver
 * + requestAnimationFrame، مش setInterval، عشان الحركة تكون سلسة بمعدل الشاشة
 * الفعلي). العرض بالأرقام العربية-الهندية (toLocaleString('ar-EG')) اتساقًا
 * مع باقي نصوص الموقع.
 */
export default function Counter({
  value,
  prefix = '',
  suffix = '',
  duration = 1600,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.unobserve(el);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setDisplay(value);
          return;
        }

        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString('ar-EG')}
      {suffix}
    </span>
  );
}
