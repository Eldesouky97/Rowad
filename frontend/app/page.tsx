'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import ArticleCard from '@/components/ArticleCard';
import BookingModal from '@/components/BookingModal';
import ContactSection from '@/components/ContactSection';
import Reveal from '@/components/Reveal';
import Lightbox from '@/components/Lightbox';
import {
  getEvents,
  getArticles,
  getPrograms,
  getGovernorates,
  getSuccessStories,
  getGallery,
  getGalleryAlbums,
  getSiteSettings,
} from '@/lib/api';
import { getMyBookedEventIds } from '@/lib/bookings';
import type { EventItem, Article, Program, Governorate, SuccessStory, GalleryImage, GalleryAlbum, SectionsVisibility } from '@/lib/types';
import Counter from '@/components/Counter';
import {
  CalendarIcon, ArrowIcon, HandsIcon, BookIcon, CompassIcon,
  LeafIcon, MegaphoneIcon, HeartIcon, StarIcon, ImageIcon, LayersIcon, ZoomIcon, UsersIcon, PinIcon, SearchIcon,
  FlagIcon, SparkIcon,
} from '@/components/icons';

const ART_BG: Record<string, string> = {
  'art-1': 'bg-gradient-to-br from-sea to-[#0a4247]',
  'art-2': 'bg-gradient-to-br from-rust to-[#7a3620]',
  'art-3': 'bg-gradient-to-br from-gold to-[#a9782c]',
  'art-4': 'bg-gradient-to-br from-night-3 to-night',
};

function GalleryTile({ g, onOpen }: { g: GalleryImage; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative aspect-square w-full overflow-hidden rounded-2xl text-right outline-none focus-visible:ring-2 focus-visible:ring-gold-2"
    >
      {g.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={g.image_url}
          alt={g.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center transition-transform duration-500 group-hover:scale-110 ${ART_BG[g.art_theme]}`}>
          <CompassIcon className="h-8 w-8 opacity-70" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/0 to-black/0 opacity-70 transition-opacity group-hover:opacity-90" />
      <div className="absolute inset-x-0 bottom-0 translate-y-1 p-3 transition-transform duration-300 group-hover:translate-y-0">
        <b className="block font-utility text-xs">{g.title}</b>
        {g.caption && <span className="text-[11px] opacity-75">{g.caption}</span>}
      </div>
      <span className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
        <ZoomIcon className="h-4 w-4" />
      </span>
    </button>
  );
}

/** كارت غلاف الألبوم — صورة الغلاف (أول صورة فيه) + اسمه وعدد صوره، بيفتح فلترة المعرض على الألبوم ده */
function AlbumCoverCard({
  album,
  cover,
  count,
  active,
  onSelect,
}: {
  album: GalleryAlbum;
  cover: GalleryImage | undefined;
  count: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group relative aspect-[4/3] shrink-0 w-[220px] overflow-hidden rounded-2xl text-right transition sm:w-auto ${
        active ? 'ring-2 ring-gold-2' : 'ring-1 ring-white/10 hover:ring-gold-2/60'
      }`}
    >
      {cover?.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.image_url}
          alt={album.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center ${ART_BG[cover?.art_theme || 'art-1']}`}>
          <LayersIcon className="h-9 w-9 opacity-60" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      {active && (
        <span className="absolute left-3 top-3 rounded-full bg-gold-2 px-2.5 py-1 font-utility text-[10px] font-bold text-night">مُحدَّد</span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <b className="block font-display text-base leading-tight">{album.title}</b>
        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-cream/70">
          <ImageIcon className="h-3.5 w-3.5" /> {count} صورة
        </span>
      </div>
    </button>
  );
}

/** بيلف محتوى الكارت في Link (بدون كسر تخطيط الـ flex/gap الخاص بالأب) لو فيه رابط
 * محافظة مرتبطة، وإلا بيرجّع المحتوى زي ما هو — أساس ترابط قصص النجاح بصفحة المحافظة */
function CardLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="contents">
      {children}
    </Link>
  );
}

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
  const [galleryAlbums, setGalleryAlbums] = useState<GalleryAlbum[]>([]);
  const [bookedIds, setBookedIds] = useState<string[]>([]);
  const [bookingEvent, setBookingEvent] = useState<EventItem | null>(null);
  const [galleryFilter, setGalleryFilter] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [programSearch, setProgramSearch] = useState('');
  const [programCategory, setProgramCategory] = useState<string>('all');
  const [sectionsVisibility, setSectionsVisibility] = useState<SectionsVisibility>({});

  useEffect(() => {
    setBookedIds(getMyBookedEventIds());
    getEvents('upcoming').then((list) => setEvents(list.slice(0, 3))).catch(() => setEvents([]));
    getArticles().then((list) => setArticles(list.slice(0, 3))).catch(() => setArticles([]));
    getPrograms().then(setPrograms).catch(() => setPrograms([]));
    getGovernorates().then(setGovernorates).catch(() => setGovernorates([]));
    getSuccessStories().then(setStories).catch(() => setStories([]));
    getGallery().then(setGallery).catch(() => setGallery([]));
    getGalleryAlbums().then(setGalleryAlbums).catch(() => setGalleryAlbums([]));
    getSiteSettings().then((s) => setSectionsVisibility(s.sections_visibility ?? {})).catch(() => setSectionsVisibility({}));
  }, []);

  // section مخفي بس لو الأدمن عطّله صراحة من إعدادات الموقع (undefined = ظاهر افتراضيًا)
  const isVisible = (key: keyof SectionsVisibility) => sectionsVisibility[key] !== false;

  // خريطة اسم المحافظة → رابط صفحتها — أساس الترابط بين الفعاليات وقصص النجاح وصفحة المحافظة
  const govSlugByName = useMemo(() => {
    const map: Record<string, string> = {};
    governorates.forEach((g) => { map[g.name] = g.slug; });
    return map;
  }, [governorates]);

  const galleryAlbumGroups = galleryAlbums
    .map((album) => ({ album, images: gallery.filter((g) => g.album_id === album.id) }))
    .filter((group) => group.images.length > 0);
  const galleryVisible =
    galleryFilter === 'all' ? gallery : gallery.filter((g) => g.album_id === galleryFilter);

  const programCategories = Array.from(new Set(programs.map((p) => p.category)));
  const programsVisible = programs.filter((p) => {
    const matchesCategory = programCategory === 'all' || p.category === programCategory;
    const q = programSearch.trim();
    const matchesSearch = !q || p.title.includes(q) || p.description.includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_140%_at_15%_-10%,#4338CA_0%,#1E1B4B_55%,#141235_100%)] pt-16 text-cream">
        {/* عناصر زخرفية عائمة — خفيفة وبطيئة عشان متلفتش الانتباه عن النص */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-a absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-violet-500/20 blur-[100px]" />
          <div className="animate-float-b absolute -left-20 top-1/3 h-[320px] w-[320px] rounded-full bg-gold-2/10 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-[1180px] gap-10 px-5 pb-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-gold-2/25 bg-gold-2/10 px-4 py-1.5 font-utility text-xs font-bold tracking-[0.1em] text-gold-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-soft-pulse absolute inline-flex h-full w-full rounded-full bg-gold-2" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-2" />
              </span>
              مبادرة أهلية معتمدة
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              نحو تنمية شاملة ومستدامة
              <br />
              <em className="not-italic bg-gradient-to-l from-gold-2 to-amber-200 bg-clip-text text-transparent">في المحافظات الحدودية المصرية</em>
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg opacity-90">
              تمكين الشباب وبناء المستقبل — &quot;رُوَّاد&quot; كيان شبابي يعمل على تحويل موقع
              محافظات مصر الحدودية من تحدٍ إلى ميزة، ومن حدّ فاصل إلى بوابة تنمية.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/activities"
                className="group inline-flex items-center gap-2 rounded-full bg-violet-600 px-7 py-3.5 font-utility text-sm font-bold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.7)] transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-[0_14px_36px_-8px_rgba(124,58,237,0.85)]"
              >
                <CalendarIcon className="h-4 w-4 transition-transform group-hover:scale-110" /> ابدأ رحلتك
              </Link>
              <Link href="/about" className="inline-flex items-center gap-2 rounded-full border-2 border-cream/70 px-7 py-3.5 font-utility text-sm font-bold transition hover:-translate-y-0.5 hover:bg-gold/10">
                <ArrowIcon className="h-4 w-4" /> تعرف أكثر
              </Link>
            </div>

            {/* شريط إحصائيات مصغّر — لمسة موثوقية سريعة قبل ما الزائر ينزل للصفحة */}
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-cream/10 pt-6">
              <div>
                <b className="font-utility text-2xl font-black text-gold-2"><Counter value={1200} prefix="+" /></b>
                <span className="mr-1.5 text-xs opacity-70">مستفيد</span>
              </div>
              <div>
                <b className="font-utility text-2xl font-black text-gold-2"><Counter value={60} prefix="+" /></b>
                <span className="mr-1.5 text-xs opacity-70">مشروع منجز</span>
              </div>
              <div>
                <b className="font-utility text-2xl font-black text-gold-2"><Counter value={10} /></b>
                <span className="mr-1.5 text-xs opacity-70">محافظات</span>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-gold/30 bg-cream/[0.06] p-7 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center gap-2 font-utility text-sm text-gold-2">
              <FlagIcon className="h-4 w-4" /> لماذا الحدود تحديدًا؟
            </h3>
            <ul className="divide-y divide-gold/15">
              {[
                { icon: PinIcon, title: '٪ كبيرة من مساحة مصر', desc: 'تقع ضمن المحافظات المستهدفة' },
                { icon: SparkIcon, title: 'فرص واعدة', desc: 'سياحة، زراعة صحراوية، ثروة سمكية ومعدنية' },
                { icon: UsersIcon, title: 'شباب بلا منصة', desc: 'طاقات محلية تحتاج تدريبًا وربطًا بالفرص' },
              ].map((item) => (
                <li key={item.title} className="group flex items-start gap-3 py-3.5 text-sm transition-colors first:pt-0 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-2/10 text-gold-2 transition-colors group-hover:bg-gold-2/20">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <b className="block font-utility text-cream">{item.title}</b>
                    <span className="opacity-75">{item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* مؤشر تمرير */}
        <div className="relative hidden justify-center pb-8 sm:flex">
          <a href="#about" aria-label="انزل للمحتوى" className="animate-bounce-y flex flex-col items-center gap-1.5 text-cream/50 transition hover:text-cream/80">
            <span className="font-utility text-[10px] tracking-widest">اكتشف المزيد</span>
            <ArrowIcon className="h-4 w-4 -rotate-90" />
          </a>
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section id="about" className={`bg-sand py-20 ${!isVisible('about') ? 'hidden' : ''}`}>
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

          <Reveal variant="stagger" className="mt-12 grid grid-cols-2 gap-6 border-t border-gold/20 pt-10 md:grid-cols-4">
            <Stat value={1200} prefix="+" label="شاب وشابة مستفيدون" />
            <Stat value={60} prefix="+" label="مشروع منجز" />
            <Stat value={10} label="محافظات مستهدفة" />
            <Stat value={94} suffix="٪" label="نسبة رضا المستفيدين" />
          </Reveal>

          <div className="mt-10">
            <Link href="/about" className="inline-block rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700">
              المزيد عن قصة الكيان
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============ PROGRAMS ============ */}
      <section id="programs" className={`bg-cream py-20 ${!isVisible('programs') ? 'hidden' : ''}`}>
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-8 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> برامجنا
            </p>
            <h2 className="font-display text-3xl">برامج متخصصة لتمكين الشباب ودعم التنمية</h2>
          </Reveal>

          <Reveal className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[280px]">
              <SearchIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" />
              <input
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
                placeholder="ابحث في البرامج…"
                className="w-full rounded-full border border-gold/30 bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition focus:border-rust/50 focus:ring-2 focus:ring-rust/10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setProgramCategory('all')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${programCategory === 'all' ? 'bg-rust text-white' : 'bg-rust/10 text-rust hover:bg-rust/15'}`}
              >
                الكل
              </button>
              {programCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setProgramCategory(c)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${programCategory === c ? 'bg-rust text-white' : 'bg-rust/10 text-rust hover:bg-rust/15'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Reveal>

          {programsVisible.length === 0 ? (
            <p className="py-10 text-center text-sm opacity-50">لا توجد برامج مطابقة لبحثك.</p>
          ) : (
            <Reveal key={`${programCategory}-${programSearch}`} variant="stagger" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {programsVisible.map((p) => {
                const Icon = PROGRAM_ICONS[p.category] ?? BookIcon;
                return (
                  <div
                    key={p.id}
                    className="group flex flex-col rounded-[18px] border border-gold/25 bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                  >
                    <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110 ${ART_BG[p.art_theme]}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="mb-2 block font-utility text-[11px] font-bold text-rust">{p.category}</span>
                    <h3 className="mb-2 font-display text-lg">{p.title}</h3>
                    <p className="flex-1 text-sm opacity-80">{p.description}</p>
                    {p.author && <p className="mt-3 text-[11px] font-bold text-rust/70">بقلم: {p.author}</p>}
                  </div>
                );
              })}
            </Reveal>
          )}
        </div>
      </section>

      {/* ============ ARTICLES ============ */}
      <section id="articles" className={`bg-night py-20 text-cream ${!isVisible('articles') ? 'hidden' : ''}`}>
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
              <span className="h-0.5 w-6 bg-gold-2" /> البوابة الإخبارية
            </p>
            <h2 className="font-display text-3xl">آخر المقالات والأخبار حول تطوير المحافظات</h2>
          </Reveal>
          <Reveal variant="stagger" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      <section id="events" className={`bg-sand py-20 ${!isVisible('events') ? 'hidden' : ''}`}>
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
          <Reveal variant="stagger" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                booked={bookedIds.includes(ev.id)}
                onBook={setBookingEvent}
                governorateHref={govSlugByName[ev.governorate] ? `/governorates/${govSlugByName[ev.governorate]}` : undefined}
              />
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
      <section id="testimonials" className={`bg-cream py-20 ${!isVisible('testimonials') ? 'hidden' : ''}`}>
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> قصص نجاح
            </p>
            <h2 className="font-display text-3xl">استمع إلى قصص شباب استفادوا من برامجنا</h2>
          </Reveal>
          <Reveal variant="stagger" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((s) => {
              const storyHref = s.governorate && govSlugByName[s.governorate] ? `/governorates/${govSlugByName[s.governorate]}` : null;
              return (
              <div
                key={s.id}
                className="group flex flex-col overflow-hidden rounded-[18px] border border-gold/25 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <CardLink href={storyHref}>
                {s.image_url ? (
                  <div className="relative h-40 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image_url}
                      alt={s.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-night/80 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-cream">
                      <b className="block font-utility text-sm">{s.name}</b>
                      <span className="text-xs opacity-80">{s.role_title}</span>
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
                  <p className="flex-1 text-sm italic opacity-85">&quot;{s.quote}&quot;</p>
                  {!s.image_url && (
                    <div className="mt-4 border-t border-gold/15 pt-3">
                      <b className="block font-utility text-sm">{s.name}</b>
                      <span className="text-xs opacity-65">{s.role_title}</span>
                    </div>
                  )}
                  {s.author && (
                    <p className="mt-3 text-[11px] font-bold text-rust/70">بقلم: {s.author}</p>
                  )}
                </div>
                </CardLink>
              </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* ============ GALLERY ============ */}
      <section id="gallery" className={`bg-night py-20 text-cream ${!isVisible('gallery') ? 'hidden' : ''}`}>
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
              <span className="h-0.5 w-6 bg-gold-2" /> معرض الصور
            </p>
            <h2 className="font-display text-3xl">لحظات من فعالياتنا ومشاريعنا وإنجازاتنا</h2>
          </Reveal>

          {/* ألبومات — شريط كروت قابل للسحب على الموبايل، شبكة على الشاشات الأوسع */}
          {galleryAlbumGroups.length > 0 && (
            <Reveal className="mb-8 -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              <button
                onClick={() => setGalleryFilter('all')}
                className={`group relative aspect-[4/3] shrink-0 w-[220px] snap-start overflow-hidden rounded-2xl text-right transition sm:w-auto ${
                  galleryFilter === 'all' ? 'ring-2 ring-gold-2' : 'ring-1 ring-white/10 hover:ring-gold-2/60'
                }`}
              >
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-700 to-night-3">
                  <ImageIcon className="h-9 w-9 opacity-70" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <b className="block font-display text-base">كل الصور</b>
                  <span className="mt-1 flex items-center gap-1.5 text-[11px] text-cream/70">
                    <ImageIcon className="h-3.5 w-3.5" /> {gallery.length} صورة
                  </span>
                </div>
              </button>
              {galleryAlbumGroups.map(({ album, images }) => (
                <div key={album.id} className="shrink-0 snap-start sm:shrink">
                  <AlbumCoverCard
                    album={album}
                    cover={images[0]}
                    count={images.length}
                    active={galleryFilter === album.id}
                    onSelect={() => setGalleryFilter(album.id)}
                  />
                </div>
              ))}
            </Reveal>
          )}

          {/* شبكة الصور المفلترة */}
          {galleryVisible.length === 0 ? (
            <p className="py-10 text-center text-sm text-cream/50">لا توجد صور في هذا الألبوم بعد.</p>
          ) : (
            <Reveal key={galleryFilter} variant="stagger" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {galleryVisible.map((g, i) => (
                <GalleryTile key={g.id} g={g} onOpen={() => setLightboxIndex(i)} />
              ))}
            </Reveal>
          )}
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          images={galleryVisible.map((g) => ({ id: g.id, src: g.image_url || '', title: g.title, caption: g.caption }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* ============ GOVERNORATES ============ */}
      <section id="governorates" className={`bg-sand py-20 ${!isVisible('governorates') ? 'hidden' : ''}`}>
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> المحافظات
            </p>
            <h2 className="font-display text-3xl">نغطي المحافظات المصرية ببرامج ومبادرات متنوعة</h2>
          </Reveal>
          <Reveal variant="stagger" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {governorates.map((g) => (
              <Link
                key={g.id}
                href={`/governorates/${g.slug}`}
                className="group overflow-hidden rounded-[18px] border border-gold/25 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                {g.image_url ? (
                  <div className="relative h-36 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.image_url}
                      alt={g.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-night/85 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-cream">
                      <h3 className="font-display text-lg">{g.name}</h3>
                      <p className="text-xs opacity-75">{g.tagline}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-36 w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-rust/15 to-gold/10 text-rust/60">
                    <PinIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="p-6">
                  {!g.image_url && (
                    <>
                      <h3 className="font-display text-lg">{g.name}</h3>
                      <p className="mt-1 text-xs opacity-60">{g.tagline}</p>
                    </>
                  )}
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
                      <div
                        className="h-full rounded-full bg-rust transition-[width] duration-700"
                        style={{ width: `${g.completion_percentage}%` }}
                      />
                    </div>
                    <span className="mt-1.5 block font-utility text-[11px] opacity-60">
                      نسبة الإنجاز {g.completion_percentage}٪
                    </span>
                  </div>
                  {g.author && (
                    <p className="mt-3 text-[11px] font-bold text-rust/70">بقلم: {g.author}</p>
                  )}
                  <span className="mt-4 flex items-center gap-1.5 font-utility text-xs font-bold text-violet-700">
                    استكشف كل ما يخص المحافظة <ArrowIcon className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="bg-cream py-16">
        <Reveal variant="scale" className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-l from-violet-700 to-indigo-900 p-10 text-white">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="animate-float-a absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-[70px]" />
              <div className="animate-float-b absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-gold-2/20 blur-[80px]" />
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div>
                <h3 className="max-w-[34ch] font-display text-2xl">عندك فكرة مشروع أو مبادرة في محافظتك؟</h3>
                <p className="mt-2 max-w-[44ch] opacity-90">
                  رُوَّاد بيدعم شباب المحافظات بالتدريب والتمويل الأولي والربط بالجهات الشريكة.
                </p>
              </div>
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-utility text-sm font-bold text-violet-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gold-2/40"
              >
                <HandsIcon className="h-4 w-4 transition-transform group-hover:rotate-12" /> تواصل مع فريقنا
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ CONTACT ============ */}
      <section id="contact" className={`bg-sand py-20 ${!isVisible('contact') ? 'hidden' : ''}`}>
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

function Stat({ value, label, prefix = '', suffix = '' }: { value: number; label: string; prefix?: string; suffix?: string }) {
  return (
    <div>
      <b className="block font-utility text-3xl font-black text-rust sm:text-4xl">
        <Counter value={value} prefix={prefix} suffix={suffix} />
      </b>
      <span className="text-sm opacity-75">{label}</span>
    </div>
  );
}
