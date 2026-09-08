'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import ArticleCard from '@/components/ArticleCard';
import SuccessStoryCard from '@/components/SuccessStoryCard';
import BookingModal from '@/components/BookingModal';
import Reveal from '@/components/Reveal';
import { getGovernorate, getEvents, getArticles, getSuccessStories } from '@/lib/api';
import { getMyBookedEventIds } from '@/lib/bookings';
import type { Governorate, EventItem, Article, SuccessStory } from '@/lib/types';
import { PinIcon, ArrowIcon, CalendarIcon, BookIcon, UsersIcon } from '@/components/icons';

export default function GovernoratePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [governorate, setGovernorate] = useState<Governorate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [bookedIds, setBookedIds] = useState<string[]>([]);
  const [bookingEvent, setBookingEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBookedIds(getMyBookedEventIds());
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    getGovernorate(slug)
      .then((g) => {
        setGovernorate(g);
        return Promise.all([getEvents('all'), getArticles(), getSuccessStories()]).then(
          ([allEvents, allArticles, allStories]) => {
            setEvents(allEvents.filter((e) => e.governorate === g.name));
            setArticles(allArticles.filter((a) => a.governorate === g.name));
            setStories(allStories.filter((s) => s.governorate === g.name));
          }
        );
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <section className="bg-cream py-24">
        <p className="text-center opacity-60">جارٍ تحميل بيانات المحافظة…</p>
      </section>
    );
  }

  if (notFound || !governorate) {
    return (
      <section className="bg-cream py-24">
        <div className="mx-auto max-w-[560px] px-5 text-center">
          <PinIcon className="mx-auto mb-4 h-10 w-10 opacity-40" />
          <h1 className="font-display text-2xl">المحافظة غير موجودة</h1>
          <p className="mt-2 opacity-70">لعلها لم تُنشر بعد أو تم تغيير رابطها.</p>
          <Link href="/#governorates" className="mt-6 inline-flex rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700">
            العودة إلى المحافظات
          </Link>
        </div>
      </section>
    );
  }

  const g = governorate;
  const hasRelated = events.length > 0 || articles.length > 0 || stories.length > 0;

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-night pb-14 pt-24 text-cream">
        {g.image_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.image_url} alt={g.name} className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-night via-night/85 to-night/60" />
          </>
        )}
        <div className="relative mx-auto max-w-[1180px] px-5 sm:px-6">
          <Link href="/#governorates" className="mb-6 inline-flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
            <ArrowIcon className="h-4 w-4 rotate-180" /> العودة إلى المحافظات
          </Link>
          <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
            <PinIcon className="h-4 w-4" /> محافظة
          </p>
          <h1 className="max-w-[24ch] font-display text-3xl sm:text-4xl">{g.name}</h1>
          {g.tagline && <p className="mt-4 max-w-[60ch] opacity-80">{g.tagline}</p>}
          <div className="mt-8 flex flex-wrap gap-8">
            <div>
              <b className="block font-utility text-2xl text-gold-2">{g.projects_completed}</b>
              <span className="text-xs opacity-70">مشروع منجز</span>
            </div>
            <div>
              <b className="block font-utility text-2xl text-gold-2">{g.population}</b>
              <span className="text-xs opacity-70">عدد السكان</span>
            </div>
            <div>
              <b className="block font-utility text-2xl text-gold-2">{g.completion_percentage}٪</b>
              <span className="text-xs opacity-70">نسبة الإنجاز</span>
            </div>
            <div>
              <b className="block font-utility text-2xl text-gold-2">{events.length + articles.length + stories.length}</b>
              <span className="text-xs opacity-70">محتوى مرتبط</span>
            </div>
          </div>
        </div>
      </section>

      {!hasRelated ? (
        <section className="bg-cream py-20">
          <p className="text-center opacity-60">لا يوجد بعد محتوى مرتبط منشور بهذه المحافظة.</p>
        </section>
      ) : (
        <>
          {/* ============ RELATED EVENTS ============ */}
          {events.length > 0 && (
            <section className="bg-cream py-16">
              <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
                <Reveal className="mb-8 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-rust" />
                  <h2 className="font-display text-2xl">فعاليات في {g.name}</h2>
                </Reveal>
                <Reveal variant="stagger" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((ev) => (
                    <EventCard key={ev.id} event={ev} booked={bookedIds.includes(ev.id)} onBook={setBookingEvent} />
                  ))}
                </Reveal>
              </div>
            </section>
          )}

          {/* ============ RELATED ARTICLES ============ */}
          {articles.length > 0 && (
            <section className="bg-sand py-16">
              <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
                <Reveal className="mb-8 flex items-center gap-2">
                  <BookIcon className="h-5 w-5 text-rust" />
                  <h2 className="font-display text-2xl">مقالات وأخبار عن {g.name}</h2>
                </Reveal>
                <Reveal variant="stagger" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {articles.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </Reveal>
              </div>
            </section>
          )}

          {/* ============ RELATED SUCCESS STORIES ============ */}
          {stories.length > 0 && (
            <section className="bg-cream py-16">
              <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
                <Reveal className="mb-8 flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-rust" />
                  <h2 className="font-display text-2xl">قصص نجاح من {g.name}</h2>
                </Reveal>
                <Reveal variant="stagger" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {stories.map((s) => (
                    <SuccessStoryCard key={s.id} story={s} />
                  ))}
                </Reveal>
              </div>
            </section>
          )}
        </>
      )}

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
