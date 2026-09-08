'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import UserAvatar from './UserAvatar';
import { ChevronDownIcon, GridIcon, LogoutIcon, SettingsIcon } from './icons';

/**
 * قائمة الحساب المنسدلة في الهيدر (سطح المكتب فقط — النسخة المصغّرة للموبايل
 * مبنية inline جوه Header نفسه لأنها أصلًا جوه قائمة منسدلة كاملة الشاشة).
 */
export default function AccountMenu({
  name,
  email,
  photoUrl,
  isAdmin,
  onSignOut,
}: {
  name: string;
  email?: string | null;
  photoUrl: string | null;
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-gold/25 py-1 pl-3 pr-1.5 transition hover:border-gold/45"
      >
        <UserAvatar src={photoUrl} name={name} size="sm" />
        <span className="max-w-[110px] truncate font-utility text-sm font-bold text-cream/85">{name}</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-cream/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+10px)] z-[110] w-64 overflow-hidden rounded-2xl border border-ink/10 bg-white text-ink shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-ink/10 bg-sand/50 px-4 py-3.5">
            <UserAvatar src={photoUrl} name={name} size="md" />
            <div className="min-w-0">
              <p className="truncate font-bold">{name}</p>
              {email && <p className="truncate text-xs text-ink/50">{email}</p>}
            </div>
          </div>
          <nav className="p-2">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink/75 transition hover:bg-sand"
              role="menuitem"
            >
              <SettingsIcon className="h-4 w-4" /> إعدادات الحساب
            </Link>
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-ink/75 transition hover:bg-sand"
                role="menuitem"
              >
                <GridIcon className="h-4 w-4" /> لوحة التحكم
              </Link>
            )}
            <button
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
              role="menuitem"
            >
              <LogoutIcon className="h-4 w-4" /> تسجيل الخروج
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
