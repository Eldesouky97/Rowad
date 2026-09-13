'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { getSiteSettings, adminUpdateSiteSettings, adminUploadSiteLogo, ApiException } from '@/lib/api';
import type { SiteSettings, SectionsVisibility } from '@/lib/types';
import { PhoneIcon, MailIcon, PinIcon, LinkIcon, PlusIcon, CloseIcon } from '@/components/icons';
import { inputClass, labelClass, SectionCard, ErrorText, ARTICLE_CATEGORIES, type Notify } from './shared';

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
  const [categories, setCategories] = useState<string[]>(ARTICLE_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [autoShare, setAutoShare] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    getSiteSettings().then((s) => {
      setSettings(s);
      setVisibility(s.sections_visibility ?? {});
      setLogoPreview(s.logo_url ?? null);
      setCategories(s.article_categories?.length ? s.article_categories : ARTICLE_CATEGORIES);
      setAutoShare(!!s.auto_share_on_publish);
    }).catch(() => setSettings({}));
  }, []);

  function toggleSection(key: keyof SectionsVisibility) {
    setVisibility((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }));
  }

  function addCategory() {
    const value = newCategory.trim();
    if (!value || categories.includes(value)) return;
    setCategories((prev) => [...prev, value]);
    setNewCategory('');
  }

  function removeCategory(category: string) {
    setCategories((prev) => prev.filter((c) => c !== category));
  }

  function handleCategoryKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCategory();
    }
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
      article_categories: categories.length ? categories : ARTICLE_CATEGORIES,
      auto_share_on_publish: autoShare,
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

      <SectionCard title="تصنيفات الأخبار والمقالات" description="التصنيفات المتاحة عند إضافة/تعديل مقال، وفي فلتر البوابة الإخبارية">
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category} className="flex items-center gap-1.5 rounded-full bg-sand-2 py-1.5 pl-2 pr-3 text-xs font-bold text-ink/70">
              {category}
              <button
                type="button"
                onClick={() => removeCategory(category)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-ink/40 hover:bg-ink/10 hover:text-rose-500"
                aria-label={`حذف تصنيف ${category}`}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          {categories.length === 0 && <p className="text-xs text-ink/45">مفيش تصنيفات مضبوطة — هيتم استخدام التصنيفات الافتراضية.</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={handleCategoryKeyDown}
            placeholder="اسم تصنيف جديد"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addCategory}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
          >
            <PlusIcon className="h-3.5 w-3.5" /> إضافة
          </button>
        </div>
      </SectionCard>

      <SectionCard title="النشر التلقائي على السوشيال ميديا" description="بمجرد ما مقال يبقى منشورًا فعليًا للعامة، نوافذ المشاركة الجاهزة على المنصات المضبوطة أعلاه بتتفتح تلقائيًا بدل ما تنتظر ضغط الزرار">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink/10 px-4 py-3">
          <span>
            <span className="block text-sm font-bold text-ink/80">تفعيل الفتح التلقائي لنوافذ المشاركة</span>
            <span className="mt-0.5 block text-xs text-ink/45">
              لسه هيحتاج ضغطة نشر/موافقة من سوبر أدمن — ده مش نشر آلي عبر API المنصات (محتاج مفاتيح رسمية مش متاحة حاليًا)، لكنه بيفتح نوافذ المشاركة الجاهزة تلقائيًا بدل الضغط يدويًا على كل زرار.
            </span>
          </span>
          <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
            <input type="checkbox" checked={autoShare} onChange={() => setAutoShare((v) => !v)} className="peer sr-only" />
            <span className="absolute inset-0 rounded-full bg-ink/15 transition peer-checked:bg-emerald-500" />
            <span className="absolute right-1 h-4 w-4 rounded-full bg-white transition peer-checked:right-6" />
          </span>
        </label>
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
