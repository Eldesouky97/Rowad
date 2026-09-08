'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onVisitorAuthChange } from '@/lib/api';
import VisitorAuthGate from '@/components/VisitorAuthGate';
import { CompassIcon } from '@/components/icons';

function VisitorLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onVisitorAuthChange((user) => {
      setChecking(false);
      if (user) router.replace(searchParams.get('next') || '/');
    });
    return unsub;
  }, [router, searchParams]);

  if (checking) {
    return <p className="py-24 text-center opacity-60">جارٍ التحقق…</p>;
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-sand px-5 py-16">
      <div className="w-full max-w-[420px] rounded-[20px] border border-gold/25 bg-white p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <CompassIcon className="mb-3 h-10 w-10 text-rust" />
          <h1 className="font-display text-2xl">حسابك في رُوَّاد</h1>
          <p className="mt-1 text-sm opacity-70">سجّل الدخول لحجز الفعاليات ومتابعة نشاطك</p>
        </div>
        <VisitorAuthGate showHeading={false} onAuthed={() => router.replace(searchParams.get('next') || '/')} />
      </div>
    </section>
  );
}

export default function VisitorLoginPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center opacity-60">جارٍ التحميل…</p>}>
      <VisitorLoginContent />
    </Suspense>
  );
}
