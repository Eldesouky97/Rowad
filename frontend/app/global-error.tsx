'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
          <h1 className="text-3xl font-bold">حدث خطأ غير متوقع</h1>
          <p className="max-w-[50ch] opacity-70">برجاء المحاولة مرة أخرى.</p>
          <button
            onClick={reset}
            className="rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-700"
          >
            إعادة المحاولة
          </button>
        </section>
      </body>
    </html>
  );
}
