import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticle, getArticles, ApiException } from '@/lib/publicApi';
import ArticleCard from '@/components/ArticleCard';
import ArticleEngagement from '@/components/ArticleEngagement';
import { UsersIcon, CalendarIcon, ArrowIcon, BookIcon } from '@/components/icons';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const article = await getArticle(params.slug);
    return { title: `${article.title} — رُوَّاد المحافظات الحدودية`, description: article.excerpt };
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

  const allArticles = await getArticles().catch(() => []);
  const related = allArticles
    .filter((a) => a.id !== article.id && a.category === article.category)
    .slice(0, 3);
  const relatedFallback = related.length > 0
    ? related
    : allArticles.filter((a) => a.id !== article.id).slice(0, 3);

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
        <div className="mb-6 flex flex-wrap gap-4 text-sm opacity-65">
          <span className="flex items-center gap-1.5"><UsersIcon className="h-4 w-4" /> {article.author}</span>
          <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {dateLabel}</span>
          <span className="flex items-center gap-1.5"><BookIcon className="h-4 w-4" /> {article.read_minutes} دقائق قراءة</span>
        </div>

        <ArticleEngagement
          articleId={article.id}
          initialViews={article.views ?? 0}
          initialLikes={article.likes ?? 0}
          title={article.title}
        />

        <div className="mt-8 space-y-4 text-[1.02rem] leading-8 opacity-90">
          {article.content.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/news?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-sand-2 px-3.5 py-1.5 font-utility text-xs font-bold text-ink/70 transition hover:bg-rust/10 hover:text-rust"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {relatedFallback.length > 0 && (
        <div className="mx-auto mt-16 max-w-[1180px] border-t border-gold/15 px-5 pt-12 sm:px-6">
          <h2 className="mb-6 font-display text-2xl">مقالات ذات صلة</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedFallback.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
