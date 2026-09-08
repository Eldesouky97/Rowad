import Link from 'next/link';
import type { SuccessStory } from '@/lib/types';
import { UsersIcon, StarIcon } from './icons';

/** بيلف محتوى الكارت في Link (بدون كسر تخطيط الـ flex/gap) لو القصة عندها
 * رابط صفحة مستقلة، وإلا بيرجّع المحتوى زي ما هو (قصص قديمة من غير slug) */
function CardLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="contents">
      {children}
    </Link>
  );
}

export default function SuccessStoryCard({ story }: { story: SuccessStory }) {
  const href = story.slug ? `/stories/${story.slug}` : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-[18px] border border-gold/25 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      <CardLink href={href}>
        {story.image_url ? (
          <div className="relative h-40 w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={story.image_url}
              alt={story.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-night/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-cream">
              <b className="block font-utility text-sm">{story.name}</b>
              <span className="text-xs opacity-80">{story.role_title}</span>
            </div>
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-gold/20 to-rust/10">
            <UsersIcon className="h-10 w-10 text-rust/50" />
          </div>
        )}
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex gap-1 text-gold">
            {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} className="h-4 w-4" />)}
          </div>
          <p className="flex-1 text-sm italic opacity-85">&quot;{story.quote}&quot;</p>
          {!story.image_url && (
            <div className="mt-4 border-t border-gold/15 pt-3">
              <b className="block font-utility text-sm">{story.name}</b>
              <span className="text-xs opacity-65">{story.role_title}</span>
            </div>
          )}
          {story.author && (
            <p className="mt-3 text-[11px] font-bold text-rust/70">بقلم: {story.author}</p>
          )}
          {href && (
            <span className="mt-3 flex items-center gap-1.5 font-utility text-xs font-bold text-violet-700">
              اقرأ القصة كاملة
            </span>
          )}
        </div>
      </CardLink>
    </div>
  );
}
