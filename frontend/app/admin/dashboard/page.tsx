'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogout } from '@/lib/api';
import { onAdminAuthChange } from '@/lib/adminAuth';
import { useToast } from '@/components/Toast';
import type { AdminUser } from '@/lib/types';
import {
  GridIcon, CalendarIcon, BookIcon, SeatIcon, MailIcon, HandsIcon, PinIcon, StarIcon,
  ImageIcon, UsersIcon, LogoutIcon, MenuIcon, CloseIcon,
} from '@/components/icons';
import { ROLE_LABELS } from './_components/shared';
import OverviewSection from './_components/OverviewSection';
import EventsManager from './_components/EventsManager';
import ArticlesManager from './_components/ArticlesManager';
import BookingsCard from './_components/BookingsCard';
import ContactMessagesCard from './_components/ContactMessagesCard';
import ProgramsManager from './_components/ProgramsManager';
import GovernoratesManager from './_components/GovernoratesManager';
import SuccessStoriesManager from './_components/SuccessStoriesManager';
import GalleryManager from './_components/GalleryManager';
import UsersManager from './_components/UsersManager';

type SectionKey =
  | 'overview' | 'events' | 'articles' | 'bookings' | 'messages'
  | 'programs' | 'governorates' | 'stories' | 'gallery' | 'users';

interface NavItem {
  key: SectionKey;
  label: string;
  icon: (p: { className?: string }) => JSX.Element;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'نظرة عامة', icon: GridIcon },
  { key: 'events', label: 'الفعاليات', icon: CalendarIcon },
  { key: 'articles', label: 'المقالات', icon: BookIcon },
  { key: 'bookings', label: 'الحجوزات', icon: SeatIcon },
  { key: 'messages', label: 'رسائل التواصل', icon: MailIcon },
  { key: 'programs', label: 'البرامج', icon: HandsIcon },
  { key: 'governorates', label: 'المحافظات', icon: PinIcon },
  { key: 'stories', label: 'قصص النجاح', icon: StarIcon },
  { key: 'gallery', label: 'معرض الصور', icon: ImageIcon },
  { key: 'users', label: 'المستخدمون', icon: UsersIcon, superAdminOnly: true },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [section, setSection] = useState<SectionKey>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const unsub = onAdminAuthChange((u) => {
      setUser(u);
      setChecking(false);
      if (!u) router.replace('/admin/login');
    });
    return unsub;
  }, [router]);

  async function handleLogout() {
    await adminLogout();
    router.replace('/admin/login');
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand">
        <p className="text-sm text-ink/50">جارٍ التحقق من الجلسة…</p>
      </div>
    );
  }
  if (!user) return null;

  const canEdit = user.role !== 'viewer';
  const isSuperAdmin = user.role === 'super_admin';
  const visibleNav = NAV_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin);
  const activeLabel = NAV_ITEMS.find((i) => i.key === section)?.label ?? '';

  function goTo(key: SectionKey) {
    setSection(key);
    setMobileNavOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-sand">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-ink/10 bg-white lg:flex">
        <SidebarContent
          user={user}
          section={section}
          visibleNav={visibleNav}
          onNavigate={goTo}
          onLogout={handleLogout}
        />
      </aside>

      {/* Sidebar (mobile overlay) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-white shadow-xl">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/5"
              aria-label="إغلاق القائمة"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
            <SidebarContent
              user={user}
              section={section}
              visibleNav={visibleNav}
              onNavigate={goTo}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/10 bg-white/90 px-5 py-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/10"
            aria-label="فتح القائمة"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
          <h1 className="font-display text-base font-bold">{activeLabel}</h1>
        </header>

        <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
          <div className="mb-7 hidden lg:block">
            <h1 className="font-display text-2xl font-bold text-ink">{activeLabel}</h1>
          </div>

          {section === 'overview' && <OverviewSection userName={user.name} />}
          {section === 'events' && <EventsManager canEdit={canEdit} showToast={showToast} />}
          {section === 'articles' && <ArticlesManager canEdit={canEdit} showToast={showToast} />}
          {section === 'bookings' && <BookingsCard />}
          {section === 'messages' && <ContactMessagesCard />}
          {section === 'programs' && <ProgramsManager canEdit={canEdit} showToast={showToast} />}
          {section === 'governorates' && <GovernoratesManager canEdit={canEdit} showToast={showToast} />}
          {section === 'stories' && <SuccessStoriesManager canEdit={canEdit} showToast={showToast} />}
          {section === 'gallery' && <GalleryManager canEdit={canEdit} showToast={showToast} />}
          {section === 'users' && isSuperAdmin && <UsersManager currentUserId={user.id} showToast={showToast} />}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  section,
  visibleNav,
  onNavigate,
  onLogout,
}: {
  user: AdminUser;
  section: SectionKey;
  visibleNav: NavItem[];
  onNavigate: (key: SectionKey) => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-ink/10 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 font-display text-sm font-bold text-white">ر</span>
        <div>
          <p className="font-display text-sm font-bold leading-tight">لوحة تحكم رُوَّاد</p>
          <p className="text-[11px] text-ink/45">إدارة المحتوى</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleNav.map((item) => {
          const active = item.key === section;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                active ? 'bg-violet-600 text-white' : 'text-ink/65 hover:bg-sand'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-ink/10 p-4">
        <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-sand/70 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 font-display text-xs font-bold text-violet-700">
            {user.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{user.name}</p>
            <p className="truncate text-[11px] text-ink/45">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/10 py-2.5 text-xs font-bold text-ink/70 transition hover:bg-sand"
        >
          <LogoutIcon className="h-4 w-4" /> تسجيل الخروج
        </button>
      </div>
    </>
  );
}
