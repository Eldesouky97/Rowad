'use client';

import { useEffect, useState } from 'react';
import EventCard from '@/components/EventCard';
import BookingModal from '@/components/BookingModal';
import Reveal from '@/components/Reveal';
import { getEvents, getSiteSettings } from '@/lib/api';
import { getMyBookedEventIds } from '@/lib/bookings';
import type { EventItem, SiteSettings } from '@/lib/types';
import { SITE_DEFAULTS } from '@/lib/siteDefaults';
import { CalendarIcon } from '@/components/icons';

type Filter = 'all' | 'upcoming' | 'past';

export default function ActivitiesPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [bookedIds, setBookedIds] = useState<string[]>([]);
  const [bookingEvent, setBookingEvent] = useState<EventItem | null>(null);
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    setBookedIds(getMyBookedEventIds());
    getSiteSettings().then(setSettings).catch(() => setSettings({}));
  }, []);

  useEffect(() => {
    setLoading(true);
    getEvents(filter)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <>
      <section className="bg-night pb-10 pt-16 text-cream">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
            <span className="h-0.5 w-6 bg-gold-2" /> {settings.activities_hero_tag || SITE_DEFAULTS.activities_hero_tag}
          </p>
          <h1 className="max-w-[22ch] font-display text-3xl sm:text-4xl">
            {settings.activities_hero_title || SITE_DEFAULTS.activities_hero_title}
          </h1>
          <p className="mt-4 max-w-[60ch] opacity-75">
            {settings.activities_hero_subtitle || SITE_DEFAULTS.activities_hero_subtitle}
          </p>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-8 flex flex-wrap gap-3">
            {(
              [
                ['all', 'كل الفعاليات'],
                ['upcoming', 'القادمة'],
                ['past', 'المنتهية'],
              ] as [Filter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full border-[1.5px] px-5 py-2 font-utility text-sm font-bold transition ${
                  filter === value ? 'border-night bg-night text-cream' : 'border-gold/30 hover:bg-night hover:text-cream'
                }`}
              >
                {label}
              </button>
            ))}
          </Reveal>

          {loading ? (
            <p className="py-16 text-center opacity-60">جارٍ تحميل الفعاليات…</p>
          ) : events.length === 0 ? (
            <div className="py-16 text-center opacity-70">
              <CalendarIcon className="mx-auto mb-3 h-9 w-9" />
              <p>لا توجد فعاليات في هذا التصنيف حاليًا</p>
            </div>
          ) : (
            <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} booked={bookedIds.includes(ev.id)} onBook={setBookingEvent} />
              ))}
            </Reveal>
          )}
        </div>
      </section>

      {bookingEvent && (
        <BookingModal
          event={bookingEvent}
          onClose={() => setBookingEvent(null)}
          onBooked={(id) => {
            setBookedIds((prev) => [...prev, id]);
            setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, seats_taken: e.seats_taken + 1 } : e)));
          }}
        />
      )}
    </>
  );
}
