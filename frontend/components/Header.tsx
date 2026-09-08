'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { visitorSignOut } from '@/lib/api';
import { useVisitorProfile } from '@/lib/useVisitorProfile';
import AccountMenu from './AccountMenu';
import UserAvatar from './UserAvatar';
import { MenuIcon, CloseIcon, HandsIcon, GridIcon, LogoutIcon, SettingsIcon } from './icons';

// ملاحظة: الصور داخل مجلد public تُستدعى برابط نصي مباشر، وليس عبر import،
// لأن Next.js يقدّم محتوى public كملفات ثابتة كما هي دون تمريرها لنظام الحزم.
const LOGO_SRC = '/brand/logo.jpg';

const LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/#about', label: 'من نحن' },
  { href: '/#programs', label: 'برامجنا' },
  { href: '/news', label: 'المقالات' },
  { href: '/activities', label: 'الفعاليات' },
  { href: '/#gallery', label: 'معرض الصور' },
  { href: '/#governorates', label: 'المحافظات' },
  { href: '/#testimonials', label: 'قصص نجاح' },
  { href: '/contact', label: 'تواصل معنا' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { authUser, isAdmin, loading, displayName, photoUrl } = useVisitorProfile();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await visitorSignOut();
    setOpen(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-[100] border-b border-gold/20 bg-night/95 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between px-5 sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-cream" onClick={() => setOpen(false)}>
          <Image
            src={LOGO_SRC}
            alt="شعار رُوَّاد المحافظات الحدودية"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-gold-2/60"
            priority
          />
          <span className="font-display leading-tight">
            <b className="block text-xl font-bold text-gold-2">رُوَّاد</b>
            <span className="font-utility text-[11px] tracking-wider text-cream/70">
              المحافظات الحدودية
            </span>
          </span>
        </Link>

        <nav
          className={`fixed inset-x-0 top-[76px] z-[100] flex h-[calc(100vh-76px)] flex-col items-stretch gap-0 overflow-y-auto bg-night px-5 py-4 transition-transform duration-300 xl:static xl:h-auto xl:flex-row xl:items-center xl:gap-0.5 xl:bg-transparent xl:p-0 xl:transition-none ${
            open ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'
          }`}
        >
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`relative shrink-0 whitespace-nowrap rounded-lg px-4 py-4 font-utility text-[15px] font-semibold border-b border-gold/10 transition-colors xl:border-none xl:px-3 xl:py-2.5 xl:text-[13px] ${
                  active ? 'text-gold-2' : 'text-cream/75 hover:text-cream'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[1px] hidden h-0.5 rounded bg-gold-2 xl:block" />
                )}
              </Link>
            );
          })}

          {/* زرار "انضم كمتطوع" لغير المسجّلين بس — عضو مسجّل دخوله بالفعل عضو، مش محتاج دعوة انضمام */}
          {!loading && !authUser && (
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700 xl:mt-0 xl:mr-2 xl:px-5 xl:py-2"
            >
              <HandsIcon className="h-4 w-4" />
              انضم كمتطوع
            </Link>
          )}

          {!loading && (
            authUser ? (
              <>
                {/* سطح المكتب: قائمة منسدلة مدمجة */}
                <div className="mt-4 hidden shrink-0 xl:mt-0 xl:mr-1 xl:block">
                  <AccountMenu
                    name={displayName}
                    email={authUser.email}
                    photoUrl={photoUrl}
                    isAdmin={isAdmin}
                    onSignOut={handleSignOut}
                  />
                </div>

                {/* الموبايل: بطاقة حساب موسّعة داخل القائمة المنسدلة كاملة الشاشة */}
                <div className="mt-4 rounded-2xl border border-gold/15 bg-white/5 p-4 xl:hidden">
                  <div className="flex items-center gap-3 border-b border-gold/10 pb-3.5">
                    <UserAvatar src={photoUrl} name={displayName} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-cream">{displayName}</p>
                      {authUser.email && <p className="truncate text-xs text-cream/50">{authUser.email}</p>}
                    </div>
                  </div>
                  <div className="grid gap-1 pt-3">
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 font-utility text-sm font-bold text-cream/85 transition hover:bg-white/5"
                    >
                      <SettingsIcon className="h-4 w-4" /> إعدادات الحساب
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 font-utility text-sm font-bold text-cream/85 transition hover:bg-white/5"
                      >
                        <GridIcon className="h-4 w-4" /> لوحة التحكم
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 font-utility text-sm font-bold text-rose-300 transition hover:bg-white/5"
                    >
                      <LogoutIcon className="h-4 w-4" /> تسجيل الخروج
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-gold/30 px-6 py-3 font-utility text-sm font-bold text-cream/75 transition hover:text-cream xl:mt-0 xl:mr-1 xl:border-none xl:px-3"
              >
                تسجيل الدخول
              </Link>
            )
          )}
        </nav>

        <button
          aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center rounded-lg border border-gold/40 p-2 text-cream xl:hidden"
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
