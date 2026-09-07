import ContactSection from '@/components/ContactSection';

export default function ContactPage() {
  return (
    <>
      <section className="bg-night pb-10 pt-16 text-cream">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
            <span className="h-0.5 w-6 bg-gold-2" /> تواصل معنا
          </p>
          <h1 className="max-w-[20ch] font-display text-3xl sm:text-4xl">لنبدأ حكايتك مع رُوَّاد</h1>
          <p className="mt-4 max-w-[56ch] opacity-75">
            سواء عندك فكرة مشروع، أو حابب تتطوع معنا، أو مؤسسة تبحث عن شراكة — فريقنا هيتواصل معك.
          </p>
        </div>
      </section>

      <section className="bg-cream py-16">
        <ContactSection />
      </section>
    </>
  );
}
