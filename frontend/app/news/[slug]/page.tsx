import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticle, getArticles, ApiException } from '@/lib/publicApi';
import { isHtmlContent, sanitizeRichContent } from '@/lib/sanitizeContent';
import ArticleCard from '@/components/ArticleCard';
import ArticleEngagement from '@/components/ArticleEngagement';
import { UsersIcon, CalendarIcon, ArrowIcon, BookIcon } from '@/components/icons';
import type { Article } from '@/lib/types';

// ترتيب "مقالات ذات صلة" بالأهمية: وسوم مشتركة (الأقوى) > نفس المحافظة > نفس
// التصنيف > الأحدث نشرًا كمرجّح أخير — بدل ما كان بيعتمد على نفس التصنيف فقط.
function relatedScore(candidate: Article, base: Article): number {
  const baseTags = new Set(base.tags ?? []);
  const sharedTags = (candidate.tags ?? []).filter((t) => baseTags.has(t)).length;
  let score = sharedTags * 3;
  if (candidate.governorate === base.governorate) score += 2;
  if (candidate.category === base.category) score += 1;
  return score;
}

// صورة المقال هنا أساسية لتبويب "openGraph"/"twitter" — دي اللي فيسبوك
// وواتساب وإكس بيقروها لما حد يشارك رابط المقال، مش أي حاجة بيبعتها زرار
// المشاركة نفسه؛ من غيرها المعاينة بتظهر بدون صورة أو بصورة الموقع الافتراضية.
export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const article = await getArticle(decodeURIComponent(params.slug));
    const title = `${article.title} — رُوَّاد المحافظات الحدودية`;
    return {
      title,
      description: article.excerpt,
      openGraph: {
        title,
        description: article.excerpt,
        type: 'article',
        images: article.image_url ? [{ url: article.image_url, width: 1200, height: 630, alt: article.title }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: article.excerpt,
        images: article.image_url ? [article.image_url] : undefined,
      },
    };
  } catch {
    return { title: 'رُوَّاد المحافظات الحدودية' };
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  let article;
  try {
    article = await getArticle(decodeURIComponent(params.slug));
  } catch (err) {
    if (err instanceof ApiException && err.status === 404) notFound();
    throw err;
  }

  const allArticles = await getArticles().catch(() => []);
  const relatedFallback = allArticles
    .filter((a) => a.id !== article.id)
    .sort((a, b) => {
      const scoreDiff = relatedScore(b, article) - relatedScore(a, article);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    })
    .slice(0, 3);

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

        {article.image_url && (
          <div className="mb-8 overflow-hidden rounded-[18px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.image_url} alt={article.title} className="h-auto max-h-[420px] w-full object-cover" />
          </div>
        )}

        <ArticleEngagement
          articleId={article.id}
          initialViews={article.views ?? 0}
          initialLikes={article.likes ?? 0}
          title={article.title}
        />

        {isHtmlContent(article.content) ? (
          <div
            className="rich-content mt-8 text-[1.02rem] leading-8 opacity-90"
            dangerouslySetInnerHTML={{ __html: sanitizeRichContent(article.content) }}
          />
        ) : (
          <div className="mt-8 space-y-4 text-[1.02rem] leading-8 opacity-90">
            {article.content.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

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
