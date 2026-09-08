import Link from 'next/link';
import type { Article } from '@/lib/types';
import { BookIcon, UsersIcon, CalendarIcon, EyeIcon } from './icons';

const ART_BG: Record<string, string> = {
  'art-1': 'bg-gradient-to-br from-sea to-[#0a4247]',
  'art-2': 'bg-gradient-to-br from-rust to-[#7a3620]',
  'art-3': 'bg-gradient-to-br from-gold to-[#a9782c]',
  'art-4': 'bg-gradient-to-br from-night-3 to-night',
};

export default function ArticleCard({ article }: { article: Article }) {
  const dateLabel = new Date(article.published_at).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-[18px] border border-gold/25 bg-cream shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
    >
      <div className={`flex h-[132px] items-center justify-center overflow-hidden text-cream/85 ${ART_BG[article.art_theme]}`}>
        <BookIcon className="h-11 w-11 opacity-90 transition-transform duration-500 group-hover:scale-110" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="font-utility text-[11px] font-bold text-rust">{article.category}</span>
          <span className="rounded-full bg-sea/10 px-3 py-1 font-utility text-[11px] font-bold text-sea">
            {article.governorate}
          </span>
        </div>
        <h3 className="font-display text-lg leading-snug transition-colors group-hover:text-violet-700">{article.title}</h3>
        <p className="flex-1 text-sm opacity-85">{article.excerpt}</p>
        <div className="flex flex-wrap gap-3 font-utility text-xs text-[#6b5f4c]">
          <span className="flex items-center gap-1"><UsersIcon className="h-3.5 w-3.5" /> {article.author}</span>
          <span className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> {dateLabel}</span>
          {article.views != null && article.views > 0 && (
            <span className="flex items-center gap-1"><EyeIcon className="h-3.5 w-3.5" /> {article.views.toLocaleString('ar-EG')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
