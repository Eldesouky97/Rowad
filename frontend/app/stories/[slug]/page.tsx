import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSuccessStory, getSuccessStories, getGovernorates, ApiException } from '@/lib/publicApi';
import { isHtmlContent, sanitizeRichContent } from '@/lib/sanitizeContent';
import SuccessStoryCard from '@/components/SuccessStoryCard';
import { ArrowIcon, PinIcon, StarIcon, UsersIcon } from '@/components/icons';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const story = await getSuccessStory(params.slug);
    return { title: `قصة ${story.name} — رُوَّاد المحافظات الحدودية`, description: story.quote };
  } catch {
    return { title: 'رُوَّاد المحافظات الحدودية' };
  }
}

export default async function SuccessStoryPage({ params }: { params: { slug: string } }) {
  let story;
  try {
    story = await getSuccessStory(params.slug);
  } catch (err) {
    if (err instanceof ApiException && err.status === 404) notFound();
    throw err;
  }

  const [allStories, governorates] = await Promise.all([
    getSuccessStories().catch(() => []),
    getGovernorates().catch(() => []),
  ]);
  const otherStories = allStories.filter((s) => s.id !== story.id).slice(0, 3);
  const governorateSlug = story.governorate ? governorates.find((g) => g.name === story.governorate)?.slug : undefined;
  const hasFullStory = !!story.full_story && story.full_story.trim().length > 0;

  return (
    <>
      <section className="relative overflow-hidden bg-night pb-14 pt-24 text-cream">
        {story.image_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.image_url} alt={story.name} className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-t from-night via-night/85 to-night/60" />
          </>
        )}
        <div className="relative mx-auto max-w-[760px] px-5 sm:px-6">
          <Link href="/#testimonials" className="mb-6 inline-flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
            <ArrowIcon className="h-4 w-4 rotate-180" /> العودة إلى قصص النجاح
          </Link>

          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-2 ring-gold-2/50">
              {story.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.image_url} alt={story.name} className="h-full w-full object-cover" />
              ) : (
                <UsersIcon className="h-7 w-7 opacity-80" />
              )}
            </span>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl">{story.name}</h1>
              <p className="mt-1 opacity-75">{story.role_title}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="flex gap-1 text-gold-2">
              {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} className="h-4 w-4" />)}
            </span>
            {governorateSlug && (
              <Link
                href={`/governorates/${governorateSlug}`}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-utility text-xs font-bold text-cream/85 transition hover:bg-white/20"
              >
                <PinIcon className="h-3.5 w-3.5" /> {story.governorate}
              </Link>
            )}
            {!governorateSlug && story.governorate && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-utility text-xs font-bold text-cream/85">
                <PinIcon className="h-3.5 w-3.5" /> {story.governorate}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-[760px] px-5 sm:px-6">
          {hasFullStory ? (
            isHtmlContent(story.full_story!) ? (
              <div
                className="rich-content text-[1.02rem] leading-8 opacity-90"
                dangerouslySetInnerHTML={{ __html: sanitizeRichContent(story.full_story!) }}
              />
            ) : (
              <div className="space-y-4 text-[1.02rem] leading-8 opacity-90">
                {story.full_story!.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )
          ) : (
            <blockquote className="border-r-4 border-gold-2 pr-5 text-xl italic leading-9 opacity-90">
              &quot;{story.quote}&quot;
            </blockquote>
          )}

          {story.author && <p className="mt-8 text-sm font-bold text-rust/70">بقلم: {story.author}</p>}
        </div>
      </section>

      {otherStories.length > 0 && (
        <section className="bg-sand py-16">
          <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
            <h2 className="mb-8 font-display text-2xl">قصص نجاح أخرى</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherStories.map((s) => (
                <SuccessStoryCard key={s.id} story={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
