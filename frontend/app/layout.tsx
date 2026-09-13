import type { Metadata } from 'next';
import { Noto_Sans_Arabic } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/Toast';
import ProfileCompletionGate from '@/components/ProfileCompletionGate';
import ScrollToTop from '@/components/ScrollToTop';
import { getSiteSettings } from '@/lib/publicApi';
import { SITE_DEFAULTS } from '@/lib/siteDefaults';

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-arabic',
  display: 'swap',
});

// عنوان ووصف المتصفح يعتمدوا على اسم الكيان ونبذته من إعدادات الموقع لو
// السوبر أدمن حدّدهم، وإلا بيرجعوا للنص الافتراضي المدمج بالكود (lib/siteDefaults.ts).
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    const name = settings.site_name && settings.site_tagline
      ? `${settings.site_name} ${settings.site_tagline}`
      : settings.site_name || SITE_DEFAULTS.site_name;
    return {
      title: name,
      description: settings.site_description || SITE_DEFAULTS.site_description,
    };
  } catch {
    return { title: SITE_DEFAULTS.site_name, description: SITE_DEFAULTS.site_description };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={notoSansArabic.variable}>
      <body className="font-body">
        <ToastProvider>
          <a
            href="#main"
            className="fixed -right-[999px] top-0 z-[200] rounded-b-lg bg-violet-600 px-6 py-3 font-utility font-bold text-white focus:right-4"
          >
            تخطي إلى المحتوى
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <ProfileCompletionGate />
          <ScrollToTop />
        </ToastProvider>
      </body>
    </html>
  );
}
