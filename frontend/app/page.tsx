'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import ArticleCard from '@/components/ArticleCard';
import BookingModal from '@/components/BookingModal';
import ContactSection from '@/components/ContactSection';
import Reveal from '@/components/Reveal';
import {
  getEvents,
  getArticles,
  getPrograms,
  getGovernorates,
  getSuccessStories,
  getGallery,
  getStorageUrl,
} from '@/lib/api';
import { getMyBookedEventIds } from '@/lib/bookings';
import type { EventItem, Article, Program, Governorate, SuccessStory, GalleryImage } from '@/lib/types';
import {
  CalendarIcon, ArrowIcon, HandsIcon, BookIcon, CompassIcon,
  LeafIcon, MegaphoneIcon, HeartIcon, StarIcon,
} from '@/components/icons';

const ART_BG: Record<string, string> = {
  'art-1': 'bg-gradient-to-br from-sea to-[#0a4247]',
  'art-2': 'bg-gradient-to-br from-rust to-[#7a3620]',
  'art-3': 'bg-gradient-to-br from-gold to-[#a9782c]',
  'art-4': 'bg-gradient-to-br from-night-3 to-night',
};

const PROGRAM_ICONS: Record<string, (p: { className?: string }) => JSX.Element> = {
  التعليم: BookIcon,
  السياحة: CompassIcon,
  التضامن: HandsIcon,
  الزراعة: LeafIcon,
  الإعلام: MegaphoneIcon,
  الصحة: HeartIcon,
};

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [bookedIds, setBookedIds] = useState<number[]>([]);
  const [bookingEvent, setBookingEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    setBookedIds(getMyBookedEventIds());
    getEvents('upcoming').then((list) => setEvents(list.slice(0, 3))).catch(() => setEvents([]));
    getArticles().then((list) => setArticles(list.slice(0, 3))).catch(() => setArticles([]));
    getPrograms().then(setPrograms).catch(() => setPrograms([]));
    getGovernorates().then(setGovernorates).catch(() => setGovernorates([]));
    getSuccessStories().then(setStories).catch(() => setStories([]));
    getGallery().then(setGallery).catch(() => setGallery([]));
  }, []);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_140%_at_15%_-10%,#4338CA_0%,#1E1B4B_55%,#141235_100%)] pt-16 text-cream">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 pb-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-5 flex items-center gap-2.5 font-utility text-xs font-bold tracking-[0.14em] text-gold-2">
              <span className="h-0.5 w-6 bg-gold-2" />
              مبادرة أهلية معتمدة
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              نحو تنمية شاملة ومستدامة
              <br />
              <em className="not-italic text-gold-2">في المحافظات الحدودية المصرية</em>
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg opacity-90">
              تمكين الشباب وبناء المستقبل — &quot;رُوَّاد&quot; كيان شبابي يعمل على تحويل موقع
              محافظات مصر الحدودية من تحدٍ إلى ميزة، ومن حدّ فاصل إلى بوابة تنمية.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/activities" className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-7 py-3.5 font-utility text-sm font-bold text-white transition hover:bg-violet-700">
                <CalendarIcon className="h-4 w-4" /> ابدأ رحلتك
              </Link>
              <Link href="/about" className="inline-flex items-center gap-2 rounded-full border-2 border-cream/70 px-7 py-3.5 font-utility text-sm font-bold transition hover:bg-gold/10">
                <ArrowIcon className="h-4 w-4" /> تعرف أكثر
              </Link>
            </div>
          </div>

          <div className="rounded-[20px] border border-gold/30 bg-cream/[0.06] p-7 backdrop-blur-sm">
            <h3 className="mb-4 font-utility text-sm text-gold-2">لماذا الحدود تحديدًا؟</h3>
            <ul className="divide-y divide-gold/15">
              <li className="flex items-baseline gap-2 py-3 text-sm first:pt-0">
                <b className="font-utility text-cream">٪ كبيرة من مساحة مصر</b>
                <span className="mr-auto opacity-80">تقع ضمن المحافظات المستهدفة</span>
              </li>
              <li className="flex items-baseline gap-2 py-3 text-sm">
                <b className="font-utility text-cream">فرص واعدة</b>
                <span className="mr-auto opacity-80">سياحة، زراعة صحراوية، ثروة سمكية ومعدنية</span>
              </li>
              <li className="flex items-baseline gap-2 py-3 text-sm last:pb-0">
                <b className="font-utility text-cream">شباب بلا منصة</b>
                <span className="mr-auto opacity-80">طاقات محلية تحتاج تدريبًا وربطًا بالفرص</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section id="about" className="bg-sand py-20">
        <Reveal className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
            <span className="h-0.5 w-6 bg-rust" /> من نحن
          </p>
          <h2 className="max-w-[36ch] font-display text-3xl">
            منظمة متخصصة في دعم وتطوير المحافظات الحدودية المصرية
          </h2>
          <p className="mt-4 max-w-[70ch] opacity-85">
            نعمل من خلال برامج ومبادرات متنوعة على بناء القدرات القيادية والريادية لأبناء وبنات
            المحافظات، وربطهم بمؤسسات الدولة والقطاع الخاص، وتوثيق قصص نجاحهم لتكون نموذجًا يُحتذى.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-[20px] bg-night p-8 text-cream">
              <h3 className="mb-3 font-utility text-lg text-gold-2">رؤيتنا</h3>
              <p className="opacity-90">
                أن نكون المنصة الرائدة في دعم التنمية الشاملة في المحافظات الحدودية، وخلق بيئة
                محفزة للشباب والمبادرات التنموية.
              </p>
            </div>
            <div className="rounded-[20px] border border-gold/25 bg-white p-8">
              <h3 className="mb-3 font-utility text-lg text-rust">رسالتنا</h3>
              <p className="opacity-85">
                تمكين المجتمعات المحلية من خلال برامج تدريبية ومبادرات تنموية مستدامة تهدف إلى
                تحسين جودة الحياة وتعزيز الاقتصاد المحلي.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {['التنمية المستدامة', 'الابتكار والإبداع', 'العمل الجماعي', 'التميز والجودة'].map((v) => (
              <span key={v} className="rounded-full border border-rust/30 bg-white px-4 py-2 font-utility text-xs font-bold text-rust">
                {v}
              </span>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-gold/20 pt-10 md:grid-cols-4">
            <Stat value="+١٢٠٠" label="شاب وشابة مستفيدون" />
            <Stat value="+٦٠" label="مشروع منجز" />
            <Stat value="١٠" label="محافظات مستهدفة" />
            <Stat value="٩٤٪" label="نسبة رضا المستفيدين" />
          </div>

          <div className="mt-10">
            <Link href="/about" className="inline-block rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700">
              المزيد عن قصة الكيان
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============ PROGRAMS ============ */}
      <section id="programs" className="bg-cream py-20">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> برامجنا
            </p>
            <h2 className="font-display text-3xl">برامج متخصصة لتمكين الشباب ودعم التنمية</h2>
          </Reveal>
          <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => {
              const Icon = PROGRAM_ICONS[p.category] ?? BookIcon;
              return (
                <div key={p.id} className="rounded-[18px] border border-gold/25 bg-white p-7 shadow-card transition-transform hover:-translate-y-1">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white ${ART_BG[p.art_theme]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="mb-2 block font-utility text-[11px] font-bold text-rust">{p.category}</span>
                  <h3 className="mb-2 font-display text-lg">{p.title}</h3>
                  <p className="text-sm opacity-80">{p.description}</p>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* ============ ARTICLES ============ */}
      <section id="articles" className="bg-night py-20 text-cream">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
              <span className="h-0.5 w-6 bg-gold-2" /> البوابة الإخبارية
            </p>
            <h2 className="font-display text-3xl">آخر المقالات والأخبار حول تطوير المحافظات</h2>
          </Reveal>
          <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </Reveal>
          <div className="mt-10 text-center">
            <Link href="/news" className="inline-flex rounded-full border-2 border-cream/70 px-6 py-3 font-utility text-sm font-bold transition hover:bg-gold/10">
              عرض جميع المقالات
            </Link>
          </div>
        </div>
      </section>

      {/* ============ EVENTS ============ */}
      <section id="events" className="bg-sand py-20">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> الفعاليات القادمة
            </p>
            <h2 className="font-display text-3xl">شارك في فعالياتنا وملتقياتنا</h2>
            <p className="mt-3 opacity-85">
              من الملتقيات الوطنية إلى القوافل التنموية والمعسكرات التطوعية، هذه أقرب محطاتنا القادمة.
            </p>
          </Reveal>
          <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} booked={bookedIds.includes(ev.id)} onBook={setBookingEvent} />
            ))}
          </Reveal>
          <div className="mt-10 text-center">
            <Link href="/activities" className="inline-flex rounded-full border-2 border-ink px-6 py-3 font-utility text-sm font-bold transition hover:bg-ink/5">
              عرض كل الفعاليات
            </Link>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section id="testimonials" className="bg-cream py-20">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> قصص نجاح
            </p>
            <h2 className="font-display text-3xl">استمع إلى قصص شباب استفادوا من برامجنا</h2>
          </Reveal>
          <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((s) => (
              <div key={s.id} className="flex flex-col rounded-[18px] border border-gold/25 bg-white p-7 shadow-card">
                <div className="mb-3 flex gap-1 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} className="h-4 w-4" />)}
                </div>
                <p className="flex-1 text-sm italic opacity-85">&quot;{s.quote}&quot;</p>
                <div className="mt-5 border-t border-gold/15 pt-4">
                  <b className="block font-utility text-sm">{s.name}</b>
                  <span className="text-xs opacity-65">{s.role_title}</span>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============ GALLERY ============ */}
      <section id="gallery" className="bg-night py-20 text-cream">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
              <span className="h-0.5 w-6 bg-gold-2" /> معرض الصور
            </p>
            <h2 className="font-display text-3xl">لحظات من فعالياتنا ومشاريعنا وإنجازاتنا</h2>
          </Reveal>
          <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gallery.map((g) => (
              <div key={g.id} className="group relative aspect-square overflow-hidden rounded-2xl">
                {g.image_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getStorageUrl(g.image_path)} alt={g.title} className="h-full w-full object-cover" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center ${ART_BG[g.art_theme]}`}>
                    <CompassIcon className="h-8 w-8 opacity-70" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <b className="block font-utility text-xs">{g.title}</b>
                  {g.caption && <span className="text-[11px] opacity-75">{g.caption}</span>}
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============ GOVERNORATES ============ */}
      <section id="governorates" className="bg-sand py-20">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> المحافظات
            </p>
            <h2 className="font-display text-3xl">نغطي المحافظات المصرية ببرامج ومبادرات متنوعة</h2>
          </Reveal>
          <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {governorates.map((g) => (
              <div key={g.id} className="rounded-[18px] border border-gold/25 bg-white p-6 shadow-card">
                <h3 className="font-display text-lg">{g.name}</h3>
                <p className="mt-1 text-xs opacity-60">{g.tagline}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <b className="block font-utility text-xl text-rust">{g.projects_completed}</b>
                    <span className="text-xs opacity-60">المشاريع المنجزة</span>
                  </div>
                  <div>
                    <b className="block font-utility text-xl text-rust">{g.population}</b>
                    <span className="text-xs opacity-60">السكان</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-rust/15">
                    <div className="h-full rounded-full bg-rust" style={{ width: `${g.completion_percentage}%` }} />
                  </div>
                  <span className="mt-1.5 block font-utility text-[11px] opacity-60">
                    نسبة الإنجاز {g.completion_percentage}٪
                  </span>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="bg-cream py-16">
        <Reveal className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[24px] bg-gradient-to-l from-violet-700 to-indigo-900 p-10 text-white">
            <div>
              <h3 className="max-w-[34ch] font-display text-2xl">عندك فكرة مشروع أو مبادرة في محافظتك؟</h3>
              <p className="mt-2 max-w-[44ch] opacity-90">
                رُوَّاد بيدعم شباب المحافظات بالتدريب والتمويل الأولي والربط بالجهات الشريكة.
              </p>
            </div>
            <a href="#contact" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-utility text-sm font-bold text-violet-700 transition hover:bg-gold-2/40">
              <HandsIcon className="h-4 w-4" /> تواصل مع فريقنا
            </a>
          </div>
        </Reveal>
      </section>

      {/* ============ CONTACT ============ */}
      <section id="contact" className="bg-sand py-20">
        <Reveal className="mx-auto mb-10 max-w-[640px] px-5 sm:px-6">
          <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
            <span className="h-0.5 w-6 bg-rust" /> اتصل بنا
          </p>
          <h2 className="font-display text-3xl">نحن هنا لدعمك والإجابة على جميع استفساراتك</h2>
        </Reveal>
        <ContactSection />
      </section>

      {bookingEvent && (
        <BookingModal
          event={bookingEvent}
          onClose={() => setBookingEvent(null)}
          onBooked={(id) => setBookedIds((prev) => [...prev, id])}
        />
      )}
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <b className="block font-utility text-3xl font-black text-rust sm:text-4xl">{value}</b>
      <span className="text-sm opacity-75">{label}</span>
    </div>
  );
}
