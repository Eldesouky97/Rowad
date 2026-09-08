'use client';

import { useEffect, useRef, useState } from 'react';

type RevealVariant = 'up' | 'scale' | 'right' | 'left' | 'stagger';

const VARIANT_CLASS: Record<RevealVariant, string> = {
  up: 'reveal',
  scale: 'reveal-scale',
  right: 'reveal-right',
  left: 'reveal-left',
  stagger: 'reveal-stagger',
};

export default function Reveal({
  children,
  className = '',
  variant = 'up',
}: {
  children: React.ReactNode;
  className?: string;
  /** up: ظهور من تحت (افتراضي) — scale: تكبير خفيف — right/left: انزلاق أفقي — stagger: عناصر الأبناء تظهر واحد ورا التاني */
  variant?: RevealVariant;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${VARIANT_CLASS[variant]} ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  );
}
