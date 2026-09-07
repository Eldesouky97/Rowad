'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuIcon, CloseIcon, HandsIcon } from './icons';

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
  const pathname = usePathname();

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
          className={`fixed inset-x-0 top-[76px] z-[100] flex h-[calc(100vh-76px)] flex-col items-stretch gap-0 overflow-y-auto bg-night px-5 py-4 transition-transform duration-300 lg:static lg:h-auto lg:flex-row lg:items-center lg:gap-1 lg:bg-transparent lg:p-0 lg:transition-none ${
            open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`relative rounded-lg px-4 py-4 font-utility text-[15px] font-semibold border-b border-gold/10 transition-colors lg:border-none lg:py-2.5 lg:text-sm ${
                  active ? 'text-gold-2' : 'text-cream/75 hover:text-cream'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-[1px] hidden h-0.5 rounded bg-gold-2 lg:block" />
                )}
              </Link>
            );
          })}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700 lg:mt-0 lg:mr-2"
          >
            <HandsIcon className="h-4 w-4" />
            انضم كمتطوع
          </Link>
          <Link
            href="/admin/login"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center rounded-full border border-gold/30 px-6 py-3 font-utility text-sm font-bold text-cream/75 transition hover:text-cream lg:mt-0 lg:mr-2 lg:border-none lg:px-3"
          >
            تسجيل الدخول
          </Link>
        </nav>

        <button
          aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center rounded-lg border border-gold/40 p-2 text-cream lg:hidden"
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
