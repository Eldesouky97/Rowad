'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { getSiteSettings, adminUpdateSiteSettings, adminUploadSiteLogo, ApiException } from '@/lib/api';
import type { SiteSettings, SectionsVisibility } from '@/lib/types';
import { PhoneIcon, MailIcon, PinIcon, LinkIcon, PlusIcon, CloseIcon } from '@/components/icons';
import { inputClass, labelClass, SectionCard, ErrorText, ARTICLE_CATEGORIES, type Notify } from './shared';
import { SITE_DEFAULTS } from '@/lib/siteDefaults';

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
    const textFields: (keyof SiteSettings)[] = [
      'site_name', 'site_tagline', 'site_description', 'about_text', 'vision_text', 'mission_text',
      'hero_badge_text', 'hero_title_line1', 'hero_title_line2', 'hero_subtitle', 'hero_cta_primary_label', 'hero_cta_secondary_label',
      'programs_tag', 'programs_title',
      'events_tag', 'events_title', 'events_subtitle',
      'articles_tag', 'articles_title',
      'testimonials_tag', 'testimonials_title',
      'gallery_tag', 'gallery_title',
      'governorates_tag', 'governorates_title',
      'cta_title', 'cta_subtitle', 'cta_button_label',
      'footer_rights_text',
      'about_hero_tag', 'about_hero_title', 'about_hero_subtitle',
      'activities_hero_tag', 'activities_hero_title', 'activities_hero_subtitle',
      'contact_hero_tag', 'contact_hero_title', 'contact_hero_subtitle',
    ];
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
            <input name="site_name" defaultValue={settings.site_name ?? SITE_DEFAULTS.site_name} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>الوصف الفرعي (تحت الاسم)</label>
            <input name="site_tagline" defaultValue={settings.site_tagline ?? SITE_DEFAULTS.site_tagline} placeholder="المحافظات الحدودية" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>نبذة مختصرة عن الكيان</label>
            <textarea name="site_description" rows={2} defaultValue={settings.site_description ?? SITE_DEFAULTS.site_description} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>نص حقوق النشر في الفوتر</label>
            <input name="footer_rights_text" defaultValue={settings.footer_rights_text ?? SITE_DEFAULTS.footer_rights_text} className={inputClass} />
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

      <SectionCard title="قسم البداية (Hero)" description="أول حاجة يشوفها الزائر أعلى الصفحة الرئيسية — العنوان الرئيسي ونص الشعار وأزرار الدعوة لاتخاذ إجراء">
        <div className="grid gap-4">
          <div>
            <label className={labelClass}>نص الشارة العلوية (اتركها فاضية لإخفائها)</label>
            <input name="hero_badge_text" defaultValue={settings.hero_badge_text ?? SITE_DEFAULTS.hero_badge_text} placeholder="مثال: مبادرة أهلية معتمدة" className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>السطر الأول من العنوان</label>
              <input name="hero_title_line1" defaultValue={settings.hero_title_line1 ?? SITE_DEFAULTS.hero_title_line1} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>السطر الثاني (بلون مميّز)</label>
              <input name="hero_title_line2" defaultValue={settings.hero_title_line2 ?? SITE_DEFAULTS.hero_title_line2} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>الوصف تحت العنوان</label>
            <textarea name="hero_subtitle" rows={2} defaultValue={settings.hero_subtitle ?? SITE_DEFAULTS.hero_subtitle} className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>زرار الدعوة الأساسي</label>
              <input name="hero_cta_primary_label" defaultValue={settings.hero_cta_primary_label ?? SITE_DEFAULTS.hero_cta_primary_label} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>زرار الدعوة الثانوي</label>
              <input name="hero_cta_secondary_label" defaultValue={settings.hero_cta_secondary_label ?? SITE_DEFAULTS.hero_cta_secondary_label} className={inputClass} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="من نحن — رؤيتنا ورسالتنا" description="النصوص والأرقام الظاهرة في قسم «من نحن» بالصفحة الرئيسية — القيم الحالية المعروضة فعليًا على الموقع، عدّل أي حقل واحفظ">
        <div className="grid gap-4">
          <div>
            <label className={labelClass}>نبذة عن الكيان</label>
            <textarea name="about_text" rows={2} defaultValue={settings.about_text ?? SITE_DEFAULTS.about_text} className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>رؤيتنا</label>
              <textarea name="vision_text" rows={3} defaultValue={settings.vision_text ?? SITE_DEFAULTS.vision_text} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>رسالتنا</label>
              <textarea name="mission_text" rows={3} defaultValue={settings.mission_text ?? SITE_DEFAULTS.mission_text} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>القيم (افصل بينها بفاصلة)</label>
            <input name="values" defaultValue={settings.values?.length ? settings.values.join(', ') : SITE_DEFAULTS.values.join(', ')} className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className={labelClass}>عدد المستفيدين</label>
              <input name="stat_beneficiaries" type="number" min={0} defaultValue={settings.stat_beneficiaries ?? SITE_DEFAULTS.stat_beneficiaries} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>المشاريع المنجزة</label>
              <input name="stat_projects" type="number" min={0} defaultValue={settings.stat_projects ?? SITE_DEFAULTS.stat_projects} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>المحافظات المستهدفة</label>
              <input name="stat_governorates" type="number" min={0} defaultValue={settings.stat_governorates ?? SITE_DEFAULTS.stat_governorates} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>نسبة الرضا (٪)</label>
              <input name="stat_satisfaction" type="number" min={0} max={100} defaultValue={settings.stat_satisfaction ?? SITE_DEFAULTS.stat_satisfaction} className={inputClass} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="عناوين أقسام الصفحة الرئيسية" description="النص الصغير أعلى كل قسم وعنوانه الرئيسي — بنفس ترتيب ظهورهم في الصفحة">
        <div className="grid gap-6">
          <div className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-2">
            <p className="text-xs font-bold text-ink/50 sm:col-span-2">برامجنا</p>
            <div>
              <label className={labelClass}>النص الصغير</label>
              <input name="programs_tag" defaultValue={settings.programs_tag ?? SITE_DEFAULTS.programs_tag} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>العنوان</label>
              <input name="programs_title" defaultValue={settings.programs_title ?? SITE_DEFAULTS.programs_title} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-2">
            <p className="text-xs font-bold text-ink/50 sm:col-span-2">البوابة الإخبارية</p>
            <div>
              <label className={labelClass}>النص الصغير</label>
              <input name="articles_tag" defaultValue={settings.articles_tag ?? SITE_DEFAULTS.articles_tag} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>العنوان</label>
              <input name="articles_title" defaultValue={settings.articles_title ?? SITE_DEFAULTS.articles_title} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-2">
            <p className="text-xs font-bold text-ink/50 sm:col-span-2">الفعاليات القادمة</p>
            <div>
              <label className={labelClass}>النص الصغير</label>
              <input name="events_tag" defaultValue={settings.events_tag ?? SITE_DEFAULTS.events_tag} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>العنوان</label>
              <input name="events_title" defaultValue={settings.events_title ?? SITE_DEFAULTS.events_title} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>الوصف تحت العنوان</label>
              <textarea name="events_subtitle" rows={2} defaultValue={settings.events_subtitle ?? SITE_DEFAULTS.events_subtitle} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-2">
            <p className="text-xs font-bold text-ink/50 sm:col-span-2">قصص نجاح</p>
            <div>
              <label className={labelClass}>النص الصغير</label>
              <input name="testimonials_tag" defaultValue={settings.testimonials_tag ?? SITE_DEFAULTS.testimonials_tag} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>العنوان</label>
              <input name="testimonials_title" defaultValue={settings.testimonials_title ?? SITE_DEFAULTS.testimonials_title} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-2">
            <p className="text-xs font-bold text-ink/50 sm:col-span-2">معرض الصور</p>
            <div>
              <label className={labelClass}>النص الصغير</label>
              <input name="gallery_tag" defaultValue={settings.gallery_tag ?? SITE_DEFAULTS.gallery_tag} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>العنوان</label>
              <input name="gallery_title" defaultValue={settings.gallery_title ?? SITE_DEFAULTS.gallery_title} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-2">
            <p className="text-xs font-bold text-ink/50 sm:col-span-2">المحافظات</p>
            <div>
              <label className={labelClass}>النص الصغير</label>
              <input name="governorates_tag" defaultValue={settings.governorates_tag ?? SITE_DEFAULTS.governorates_tag} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>العنوان</label>
              <input name="governorates_title" defaultValue={settings.governorates_title ?? SITE_DEFAULTS.governorates_title} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-ink/10 p-4">
            <p className="text-xs font-bold text-ink/50">شريط الدعوة لاتخاذ إجراء (قبل تواصل معنا)</p>
            <div>
              <label className={labelClass}>العنوان</label>
              <input name="cta_title" defaultValue={settings.cta_title ?? SITE_DEFAULTS.cta_title} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>الوصف</label>
              <textarea name="cta_subtitle" rows={2} defaultValue={settings.cta_subtitle ?? SITE_DEFAULTS.cta_subtitle} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>نص الزرار</label>
              <input name="cta_button_label" defaultValue={settings.cta_button_label ?? SITE_DEFAULTS.cta_button_label} className={inputClass} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="هيدر الصفحات المستقلة" description="النص الصغير والعنوان والوصف أعلى صفحات «من نحن» و«الأنشطة» و«تواصل معنا» المستقلة">
        <div className="grid gap-6">
          <div className="grid gap-3 rounded-xl border border-ink/10 p-4">
            <p className="text-xs font-bold text-ink/50">صفحة «من نحن»</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>النص الصغير</label>
                <input name="about_hero_tag" defaultValue={settings.about_hero_tag ?? SITE_DEFAULTS.about_hero_tag} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>العنوان</label>
                <input name="about_hero_title" defaultValue={settings.about_hero_title ?? SITE_DEFAULTS.about_hero_title} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>الوصف</label>
              <textarea name="about_hero_subtitle" rows={2} defaultValue={settings.about_hero_subtitle ?? SITE_DEFAULTS.about_hero_subtitle} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-ink/10 p-4">
            <p className="text-xs font-bold text-ink/50">صفحة «الأنشطة والفعاليات»</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>النص الصغير</label>
                <input name="activities_hero_tag" defaultValue={settings.activities_hero_tag ?? SITE_DEFAULTS.activities_hero_tag} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>العنوان</label>
                <input name="activities_hero_title" defaultValue={settings.activities_hero_title ?? SITE_DEFAULTS.activities_hero_title} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>الوصف</label>
              <textarea name="activities_hero_subtitle" rows={2} defaultValue={settings.activities_hero_subtitle ?? SITE_DEFAULTS.activities_hero_subtitle} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-ink/10 p-4">
            <p className="text-xs font-bold text-ink/50">صفحة «تواصل معنا»</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>النص الصغير</label>
                <input name="contact_hero_tag" defaultValue={settings.contact_hero_tag ?? SITE_DEFAULTS.contact_hero_tag} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>العنوان</label>
                <input name="contact_hero_title" defaultValue={settings.contact_hero_title ?? SITE_DEFAULTS.contact_hero_title} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>الوصف</label>
              <textarea name="contact_hero_subtitle" rows={2} defaultValue={settings.contact_hero_subtitle ?? SITE_DEFAULTS.contact_hero_subtitle} className={inputClass} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="معلومات التواصل" description="بتظهر في الفوتر وصفحة تواصل معنا">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}><PhoneIcon className="ml-1 inline h-3.5 w-3.5" /> رقم الهاتف</label>
            <input name="contact_phone" defaultValue={settings.contact_phone ?? SITE_DEFAULTS.contact_phone} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}><MailIcon className="ml-1 inline h-3.5 w-3.5" /> البريد الإلكتروني</label>
            <input name="contact_email" type="email" defaultValue={settings.contact_email ?? SITE_DEFAULTS.contact_email} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}><PinIcon className="ml-1 inline h-3.5 w-3.5" /> العنوان</label>
            <input name="contact_address" defaultValue={settings.contact_address ?? SITE_DEFAULTS.contact_address} className={inputClass} />
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
