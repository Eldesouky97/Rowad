'use client';

import { useEffect, useState } from 'react';
import {
  adminGetEvents,
  adminGetArticles,
  adminGetPrograms,
  adminGetGovernorates,
  adminGetSuccessStories,
  adminGetGallery,
  adminGetContactMessages,
} from '@/lib/api';
import {
  CalendarIcon, BookIcon, HandsIcon, PinIcon, StarIcon, ImageIcon, MailIcon, SeatIcon,
} from '@/components/icons';

interface Stats {
  events: number;
  upcomingEvents: number;
  seatsBooked: number;
  articles: number;
  programs: number;
  governorates: number;
  successStories: number;
  gallery: number;
  messages: number;
}

const CARD_STYLES: { key: keyof Stats; label: string; icon: (p: { className?: string }) => JSX.Element; tone: string }[] = [
  { key: 'events', label: 'الفعاليات', icon: CalendarIcon, tone: 'from-violet-500 to-violet-700' },
  { key: 'upcomingEvents', label: 'فعاليات قادمة', icon: CalendarIcon, tone: 'from-sky-500 to-sky-700' },
  { key: 'seatsBooked', label: 'مقاعد محجوزة', icon: SeatIcon, tone: 'from-emerald-500 to-emerald-700' },
  { key: 'articles', label: 'المقالات', icon: BookIcon, tone: 'from-amber-500 to-amber-700' },
  { key: 'programs', label: 'البرامج', icon: HandsIcon, tone: 'from-rose-500 to-rose-700' },
  { key: 'governorates', label: 'المحافظات', icon: PinIcon, tone: 'from-indigo-500 to-indigo-700' },
  { key: 'successStories', label: 'قصص النجاح', icon: StarIcon, tone: 'from-fuchsia-500 to-fuchsia-700' },
  { key: 'gallery', label: 'صور المعرض', icon: ImageIcon, tone: 'from-teal-500 to-teal-700' },
  { key: 'messages', label: 'رسائل التواصل', icon: MailIcon, tone: 'from-orange-500 to-orange-700' },
];

export default function OverviewSection({ userName }: { userName: string }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      adminGetEvents(),
      adminGetArticles(),
      adminGetPrograms(),
      adminGetGovernorates(),
      adminGetSuccessStories(),
      adminGetGallery(),
      adminGetContactMessages(),
    ])
      .then(([events, articles, programs, governorates, successStories, gallery, messages]) => {
        setStats({
          events: events.length,
          upcomingEvents: events.filter((e) => e.status === 'upcoming').length,
          seatsBooked: events.reduce((sum, e) => sum + e.seats_taken, 0),
          articles: articles.length,
          programs: programs.length,
          governorates: governorates.length,
          successStories: successStories.length,
          gallery: gallery.length,
          messages: messages.length,
        });
      })
      .catch(() => setStats(null));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-ink">أهلًا بيك، {userName} 👋</h2>
        <p className="mt-1 text-sm text-ink/55">نظرة سريعة على محتوى الموقع الحالي.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        {CARD_STYLES.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
            <div className="flex items-start justify-between p-5">
              <div>
                <p className="text-xs font-bold text-ink/50">{label}</p>
                <p className="mt-2 font-display text-3xl font-bold text-ink">
                  {stats ? stats[key] : <span className="inline-block h-8 w-10 animate-pulse rounded bg-ink/10" />}
                </p>
              </div>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
