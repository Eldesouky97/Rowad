import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticle, ApiException } from '@/lib/api';
import { UsersIcon, CalendarIcon, ArrowIcon } from '@/components/icons';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const article = await getArticle(params.slug);
    return { title: `${article.title} — رُوَّاد المحافظات الحدودية` };
  } catch {
    return { title: 'رُوَّاد المحافظات الحدودية' };
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  let article;
  try {
    article = await getArticle(params.slug);
  } catch (err) {
    if (err instanceof ApiException && err.status === 404) notFound();
    throw err;
  }

  const dateLabel = new Date(article.published_at).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-[760px] px-5 sm:px-6">
        <Link href="/news" className="mb-6 inline-flex items-center gap-2 font-utility text-sm font-bold text-rust">
          <ArrowIcon className="h-4 w-4 rotate-180" /> العودة إلى البوابة الإخبارية
        </Link>

        <span className="font-utility text-xs font-bold text-rust">
          {article.category} · {article.governorate}
        </span>
        <h1 className="mb-3 mt-2 font-display text-3xl leading-snug">{article.title}</h1>
        <div className="mb-8 flex flex-wrap gap-4 text-sm opacity-65">
          <span className="flex items-center gap-1.5"><UsersIcon className="h-4 w-4" /> {article.author}</span>
          <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {dateLabel}</span>
        </div>

        <div className="space-y-4 text-[1.02rem] leading-8 opacity-90">
          {article.content.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
