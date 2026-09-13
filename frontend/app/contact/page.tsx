import ContactSection from '@/components/ContactSection';
import { getSiteSettings } from '@/lib/publicApi';
import { SITE_DEFAULTS } from '@/lib/siteDefaults';
import type { SiteSettings } from '@/lib/types';

export default async function ContactPage() {
  const settings = await getSiteSettings().catch((): SiteSettings => ({}));
  return (
    <>
      <section className="bg-night pb-10 pt-16 text-cream">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
            <span className="h-0.5 w-6 bg-gold-2" /> {settings.contact_hero_tag || SITE_DEFAULTS.contact_hero_tag}
          </p>
          <h1 className="max-w-[20ch] font-display text-3xl sm:text-4xl">{settings.contact_hero_title || SITE_DEFAULTS.contact_hero_title}</h1>
          <p className="mt-4 max-w-[56ch] opacity-75">
            {settings.contact_hero_subtitle || SITE_DEFAULTS.contact_hero_subtitle}
          </p>
        </div>
      </section>

      <section className="bg-cream py-16">
        <ContactSection />
      </section>
    </>
  );
}
