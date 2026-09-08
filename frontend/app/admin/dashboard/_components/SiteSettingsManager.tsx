'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { getSiteSettings, adminUpdateSiteSettings, adminUploadSiteLogo, ApiException } from '@/lib/api';
import type { SiteSettings, SectionsVisibility } from '@/lib/types';
import { PhoneIcon, MailIcon, PinIcon, LinkIcon } from '@/components/icons';
import { inputClass, labelClass, SectionCard, ErrorText, type Notify } from './shared';

const SOCIAL_FIELDS: { key: keyof SiteSettings; label: string; placeholder: string }[] = [
  { key: 'social_facebook', label: 'فيسبوك', placeholder: 'https://facebook.com/...' },
  { key: 'social_instagram', label: 'إنستجرام', placeholder: 'https://instagram.com/...' },
  { key: 'social_twitter', label: 'إكس / تويتر', placeholder: 'https://x.com/...' },
  { key: 'social_youtube', label: 'يوتيوب', placeholder: 'https://youtube.com/@...' },
  { key: 'social_whatsapp', label: 'واتساب', placeholder: 'https://wa.me/20...' },
  { key: 'social_linkedin', label: 'لينكدإن', placeholder: 'https://linkedin.com/company/...' },
  { key: 'social_tiktok', label: 'تيك توك', placeholder: 'https://tiktok.com/@...' },
];

const SECTION_FIELDS: { key: keyof SectionsVisibility; label: string }[] = [
  { key: 'about', label: 'من نحن' },
  { key: 'programs', label: 'برامجنا' },
  { key: 'articles', label: 'البوابة الإخبارية' },
  { key: 'events', label: 'الفعاليات القادمة' },
  { key: 'testimonials', label: 'قصص نجاح' },
  { key: 'gallery', label: 'معرض الصور' },
  { key: 'governorates', label: 'المحافظات' },
  { key: 'contact', label: 'تواصل معنا' },
];

/** قسم "إعدادات الموقع" — سوبر أدمن فقط. هوية الكيان (اسم/شعار/لوجو) + رؤية/رسالة/قيم
 * وإحصائيات "من نحن" + تواصل + سوشيال ميديا + إظهار/إخفاء أقسام الصفحة الرئيسية */
export default function SiteSettingsManager({ showToast }: { showToast: Notify }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [visibility, setVisibility] = useState<SectionsVisibility>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    getSiteSettings().then((s) => {
      setSettings(s);
      setVisibility(s.sections_visibility ?? {});
      setLogoPreview(s.logo_url ?? null);
    }).catch(() => setSettings({}));
  }, []);

  function toggleSection(key: keyof SectionsVisibility) {
    setVisibility((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload: SiteSettings = {
      contact_phone: String(form.get('contact_phone') || '').trim(),
      contact_email: String(form.get('contact_email') || '').trim(),
      contact_address: String(form.get('contact_address') || '').trim(),
      sections_visibility: visibility,
    };
    const raw = payload as Record<string, unknown>;
    for (const { key } of SOCIAL_FIELDS) {
      const value = String(form.get(key) || '').trim();
      raw[key] = value || null;
    }
    const textFields: (keyof SiteSettings)[] = ['site_name', 'site_tagline', 'site_description', 'about_text', 'vision_text', 'mission_text'];
    for (const key of textFields) {
      raw[key] = String(form.get(key) || '').trim() || null;
    }
    const valuesRaw = String(form.get('values') || '').trim();
    raw.values = valuesRaw ? valuesRaw.split(',').map((v) => v.trim()).filter(Boolean) : null;
    const statFields: (keyof SiteSettings)[] = ['stat_beneficiaries', 'stat_projects', 'stat_governorates', 'stat_satisfaction'];
    for (const key of statFields) {
      const value = form.get(key);
      raw[key] = value ? Number(value) : null;
    }

    setSubmitting(true);
    try {
      const logoFile = form.get('logo') as File | null;
      if (logoFile && logoFile.size > 0) {
        const uploaded = await adminUploadSiteLogo(logoFile);
        payload.logo_storage_path = uploaded.storage_path;
        payload.logo_url = uploaded.image_url;
      }
      await adminUpdateSiteSettings(payload);
      showToast('تم حفظ إعدادات الموقع');
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ الإعدادات');
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
  }

  if (!settings) {
    return (
      <SectionCard title="إعدادات الموقع">
        <p className="py-6 text-center text-sm text-ink/50">جارٍ التحميل…</p>
      </SectionCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <SectionCard title="هوية الموقع" description="اسم الكيان وشعاره الفرعي ولوجو الموقع — يظهروا في الهيدر والفوتر وعنوان المتصفح">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>اسم الكيان</label>
            <input name="site_name" defaultValue={settings.site_name ?? ''} placeholder="رُوَّاد" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>الوصف الفرعي (تحت الاسم)</label>
            <input name="site_tagline" defaultValue={settings.site_tagline ?? ''} placeholder="المحافظات الحدودية" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>نبذة مختصرة عن الكيان</label>
            <textarea name="site_description" rows={2} defaultValue={settings.site_description ?? ''} placeholder="كيان شبابي أهلي يعمل على تمكين الشباب وتحقيق التنمية الشاملة في المحافظات المصرية." className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>شعار الموقع (اللوجو)</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="شعار الموقع" className="h-16 w-16 rounded-full border border-ink/10 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-ink/20 text-[10px] text-ink/40">
                  بلا شعار
                </div>
              )}
              <input name="logo" type="file" accept="image/*" onChange={handleLogoChange} className={inputClass} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="من نحن — رؤيتنا ورسالتنا" description="النصوص والأرقام الظاهرة في قسم «من نحن» بالصفحة الرئيسية — اتركها فاضية لعرض النص الافتراضي">
        <div className="grid gap-4">
          <div>
            <label className={labelClass}>نبذة عن الكيان</label>
            <textarea name="about_text" rows={2} defaultValue={settings.about_text ?? ''} className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>رؤيتنا</label>
              <textarea name="vision_text" rows={3} defaultValue={settings.vision_text ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>رسالتنا</label>
              <textarea name="mission_text" rows={3} defaultValue={settings.mission_text ?? ''} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>القيم (افصل بينها بفاصلة)</label>
            <input name="values" defaultValue={settings.values?.join(', ') ?? ''} placeholder="التنمية المستدامة, الابتكار والإبداع, العمل الجماعي" className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className={labelClass}>عدد المستفيدين</label>
              <input name="stat_beneficiaries" type="number" min={0} defaultValue={settings.stat_beneficiaries ?? ''} placeholder="1200" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>المشاريع المنجزة</label>
              <input name="stat_projects" type="number" min={0} defaultValue={settings.stat_projects ?? ''} placeholder="60" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>المحافظات المستهدفة</label>
              <input name="stat_governorates" type="number" min={0} defaultValue={settings.stat_governorates ?? ''} placeholder="10" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>نسبة الرضا (٪)</label>
              <input name="stat_satisfaction" type="number" min={0} max={100} defaultValue={settings.stat_satisfaction ?? ''} placeholder="94" className={inputClass} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="معلومات التواصل" description="بتظهر في الفوتر وصفحة تواصل معنا">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}><PhoneIcon className="ml-1 inline h-3.5 w-3.5" /> رقم الهاتف</label>
            <input name="contact_phone" defaultValue={settings.contact_phone ?? ''} placeholder="٠٢ ١٢٣٤ ٥٦٧٨" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}><MailIcon className="ml-1 inline h-3.5 w-3.5" /> البريد الإلكتروني</label>
            <input name="contact_email" type="email" defaultValue={settings.contact_email ?? ''} placeholder="info@rowwad.org" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}><PinIcon className="ml-1 inline h-3.5 w-3.5" /> العنوان</label>
            <input name="contact_address" defaultValue={settings.contact_address ?? ''} placeholder="القاهرة، مصر" className={inputClass} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="روابط السوشيال ميديا" description="اتركها فاضية لإخفاء أيقونة المنصة من الفوتر">
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={labelClass}><LinkIcon className="ml-1 inline h-3.5 w-3.5" /> {label}</label>
              <input name={key} defaultValue={(settings[key] as string) ?? ''} placeholder={placeholder} className={inputClass} dir="ltr" />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="أقسام الصفحة الرئيسية" description="أخفِ أي قسم مؤقتًا من غير ما تحذف بياناته">
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTION_FIELDS.map(({ key, label }) => {
            const visible = visibility[key] !== false;
            return (
              <label key={key} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink/10 px-4 py-3">
                <span className="text-sm font-bold text-ink/80">{label}</span>
                <span className="relative inline-flex h-6 w-11 items-center">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleSection(key)}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-ink/15 transition peer-checked:bg-emerald-500" />
                  <span className="absolute right-1 h-4 w-4 rounded-full bg-white transition peer-checked:right-6" />
                </span>
              </label>
            );
          })}
        </div>
      </SectionCard>

      <ErrorText message={error} />
      <div className="flex justify-start">
        <button type="submit" disabled={submitting} className="rounded-full bg-violet-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
          {submitting ? 'جارٍ الحفظ…' : 'حفظ إعدادات الموقع'}
        </button>
      </div>
    </form>
  );
}
