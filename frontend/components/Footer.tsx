'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { visitorSignOut, getSiteSettings } from '@/lib/api';
import { useVisitorProfile } from '@/lib/useVisitorProfile';
import UserAvatar from './UserAvatar';
import { GridIcon, LogoutIcon, LinkIcon, PhoneIcon, MailIcon, PinIcon } from './icons';
import type { SiteSettings } from '@/lib/types';

const SOCIAL_LABELS: Record<string, string> = {
  social_facebook: 'فيسبوك',
  social_instagram: 'إنستجرام',
  social_twitter: 'إكس',
  social_youtube: 'يوتيوب',
  social_whatsapp: 'واتساب',
  social_linkedin: 'لينكدإن',
  social_tiktok: 'تيك توك',
};

export default function Footer() {
  const { authUser, isAdmin, loading, displayName, photoUrl } = useVisitorProfile();
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    getSiteSettings().then(setSettings).catch(() => setSettings({}));
  }, []);

  const socialLinks = Object.entries(SOCIAL_LABELS)
    .map(([key, label]) => ({ key, label, url: settings[key as keyof SiteSettings] as string | undefined }))
    .filter((s) => s.url);
  const siteName = settings.site_name || 'رُوَّاد';
  const siteTagline = settings.site_tagline || 'المحافظات الحدودية';

  return (
    <footer className="bg-[#0F1B2E] px-5 pb-6 pt-14 text-cream/75 sm:px-6">
      <div className="mx-auto grid max-w-[1180px] gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-3">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt={`شعار ${siteName}`}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-gold-2/50"
              />
            ) : (
              <Image
                src="/brand/logo.jpg"
                alt={`شعار ${siteName}`}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-gold-2/50"
              />
            )}
            <span className="font-display">
              <b className="block text-lg font-bold text-gold-2">{siteName}</b>
              <span className="font-utility text-[10px] tracking-wider text-cream/70">
                {siteTagline}
              </span>
            </span>
          </div>
          <p className="max-w-[32ch] text-sm text-cream/70">
            {settings.site_description ||
              'كيان شبابي أهلي يعمل على تمكين الشباب وتحقيق التنمية الشاملة في المحافظات المصرية.'}
          </p>
        </div>

        <div>
          <h5 className="mb-4 font-utility text-sm text-cream">الموقع</h5>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-gold-2">الرئيسية</Link></li>
            <li><Link href="/#about" className="hover:text-gold-2">من نحن</Link></li>
            <li><Link href="/#programs" className="hover:text-gold-2">برامجنا</Link></li>
            <li><Link href="/activities" className="hover:text-gold-2">الفعاليات</Link></li>
            <li><Link href="/news" className="hover:text-gold-2">المقالات</Link></li>
            <li><Link href="/#gallery" className="hover:text-gold-2">معرض الصور</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="mb-4 font-utility text-sm text-cream">المحافظات</h5>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <li>شمال سيناء</li>
            <li>جنوب سيناء</li>
            <li>أسوان</li>
            <li>الوادي الجديد</li>
            <li>مطروح</li>
            <li>البحر الأحمر</li>
            <li>السويس</li>
            <li>الإسماعيلية</li>
            <li>القاهرة الكبرى</li>
            <li>الشرقية</li>
          </ul>
        </div>

        <div>
          <h5 className="mb-4 font-utility text-sm text-cream">تواصل</h5>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><MailIcon className="h-3.5 w-3.5 shrink-0 opacity-60" /> {settings.contact_email || 'info@rowwad-borders.example'}</li>
            <li className="flex items-center gap-2"><PhoneIcon className="h-3.5 w-3.5 shrink-0 opacity-60" /> {settings.contact_phone || '٠٢ ١٢٣٤ ٥٦٧٨'}</li>
            {settings.contact_address && (
              <li className="flex items-center gap-2"><PinIcon className="h-3.5 w-3.5 shrink-0 opacity-60" /> {settings.contact_address}</li>
            )}
          </ul>

          {socialLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.key}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 text-cream/70 transition hover:border-gold-2 hover:text-gold-2"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          )}

          {/* حالة الحساب — نفس بيانات الهيدر، حتى تكون التجربة متسقة بعد تسجيل الدخول */}
          {!loading && (
            <div className="mt-5 border-t border-gold/10 pt-5">
              {authUser ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/profile" className="flex min-w-0 items-center gap-2.5">
                    <UserAvatar src={photoUrl} name={displayName} size="sm" />
                    <span className="truncate text-sm font-bold text-cream/85 hover:text-gold-2">{displayName}</span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-1.5 rounded-full border border-gold/20 px-3 py-1.5 text-xs font-bold text-cream/75 transition hover:text-cream"
                      >
                        <GridIcon className="h-3.5 w-3.5" /> لوحة التحكم
                      </Link>
                    )}
                    <button
                      onClick={() => visitorSignOut()}
                      className="flex items-center gap-1.5 rounded-full border border-gold/20 px-3 py-1.5 text-xs font-bold text-cream/75 transition hover:text-cream"
                    >
                      <LogoutIcon className="h-3.5 w-3.5" /> خروج
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="text-sm font-bold text-gold-2 hover:underline">
                  تسجيل الدخول / إنشاء حساب
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-[1180px] flex-wrap items-center justify-between gap-3 border-t border-gold/15 pt-6 text-xs">
        <span>© {new Date().getFullYear()} {siteName} {siteTagline}. جميع الحقوق محفوظة.</span>
        {!isAdmin && (
          <Link href="/admin/login" className="text-cream/50 hover:text-gold-2">
            دخول لوحة التحكم
          </Link>
        )}
      </div>
    </footer>
  );
}
