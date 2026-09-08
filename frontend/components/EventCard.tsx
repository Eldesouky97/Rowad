'use client';

import type { EventItem } from '@/lib/types';
import { CalendarIcon, PinIcon, SeatIcon, CheckIcon } from './icons';

const ART_BG: Record<string, string> = {
  'art-1': 'bg-gradient-to-br from-sea to-[#0a4247]',
  'art-2': 'bg-gradient-to-br from-rust to-[#7a3620]',
  'art-3': 'bg-gradient-to-br from-gold to-[#a9782c]',
  'art-4': 'bg-gradient-to-br from-night-3 to-night',
};

export default function EventCard({
  event,
  booked,
  onBook,
}: {
  event: EventItem;
  booked?: boolean;
  onBook?: (event: EventItem) => void;
}) {
  const pct = Math.min(100, Math.round((event.seats_taken / event.seats_total) * 100));
  const full = event.seats_taken >= event.seats_total;
  const dateLabel = new Date(event.starts_at).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="group flex flex-col overflow-hidden rounded-[18px] border border-gold/25 bg-cream shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      {event.image_url ? (
        <div className="h-[132px] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image_url}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      ) : (
        <div className={`relative flex h-[132px] items-center justify-center overflow-hidden text-cream/85 ${ART_BG[event.art_theme]}`}>
          <CalendarIcon className="h-11 w-11 opacity-90 transition-transform duration-500 group-hover:scale-110" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-1 font-utility text-[11px] font-bold ${
              event.status === 'upcoming' ? 'bg-sea/10 text-sea' : 'bg-[#6b5f4c]/15 text-[#6b5f4c]'
            }`}
          >
            {event.status === 'upcoming' ? 'قادمة' : 'منتهية'}
          </span>
          <span className="rounded-full bg-sea/10 px-3 py-1 font-utility text-[11px] font-bold text-sea">
            {event.category}
          </span>
        </div>
        <h3 className="font-display text-lg leading-snug transition-colors group-hover:text-violet-700">{event.title}</h3>
        <div className="flex flex-wrap gap-3 font-utility text-xs text-[#6b5f4c]">
          <span className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> {dateLabel}</span>
          <span className="flex items-center gap-1"><PinIcon className="h-3.5 w-3.5" /> {event.location}</span>
        </div>
        <p className="flex-1 text-sm opacity-85">{event.description}</p>
        {event.author && <p className="text-[11px] font-bold text-[#6b5f4c]">بقلم: {event.author}</p>}
        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-rust/15">
            <div className="h-full rounded-full bg-sea" style={{ width: `${pct}%` }} />
          </div>
          <span className="mt-1.5 block font-utility text-xs text-[#6b5f4c]">
            {event.seats_taken} / {event.seats_total} مقعد محجوز
          </span>
        </div>
        <div className="mt-1">
          {event.status === 'past' ? (
            <button disabled className="w-full rounded-full border-2 border-current px-4 py-2 font-utility text-sm font-bold opacity-50">
              الفعالية انتهت
            </button>
          ) : booked ? (
            <button disabled className="flex w-full items-center justify-center gap-2 rounded-full bg-night px-4 py-2 font-utility text-sm font-bold text-cream opacity-70">
              <CheckIcon className="h-4 w-4" /> تم حجز مكانك
            </button>
          ) : full ? (
            <button disabled className="w-full rounded-full border-2 border-current px-4 py-2 font-utility text-sm font-bold opacity-50">
              اكتملت المقاعد
            </button>
          ) : (
            <button
              onClick={() => onBook?.(event)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-2 font-utility text-sm font-bold text-white transition hover:bg-violet-700"
            >
              <SeatIcon className="h-4 w-4" /> احجز مكانك
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
