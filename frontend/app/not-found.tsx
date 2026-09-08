import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-sand px-5 text-center">
      <h1 className="font-display text-3xl">الصفحة غير موجودة</h1>
      <p className="max-w-[50ch] opacity-70">الصفحة اللي بتدور عليها مش موجودة أو تم نقلها.</p>
      <Link href="/" className="rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white hover:bg-violet-700">
        العودة للرئيسية
      </Link>
    </section>
  );
}
