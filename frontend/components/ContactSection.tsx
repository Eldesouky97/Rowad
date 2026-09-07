'use client';

import { FormEvent, useState } from 'react';
import { sendContactMessage, ApiException } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { MailIcon, PhoneIcon, PinIcon } from '@/components/icons';

const GOVS = [
  'شمال سيناء', 'جنوب سيناء', 'أسوان', 'الوادي الجديد', 'مطروح',
  'البحر الأحمر', 'السويس', 'الإسماعيلية', 'القاهرة الكبرى', 'الشرقية', 'أخرى',
];

export default function ContactSection() {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') || '').trim(),
      email: String(form.get('email') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      governorate: String(form.get('governorate') || ''),
      message: String(form.get('message') || '').trim(),
    };

    const newErrors: Record<string, string> = {};
    if (payload.name.length < 2) newErrors.name = 'من فضلك أدخل اسمك';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) newErrors.email = 'من فضلك أدخل بريدًا صحيحًا';
    if (payload.message.length < 4) newErrors.message = 'من فضلك اكتب رسالتك';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setSubmitting(true);
    try {
      await sendContactMessage(payload);
      (e.target as HTMLFormElement).reset();
      showToast('تم استلام رسالتك، سنتواصل معك قريبًا');
    } catch (err) {
      if (err instanceof ApiException && err.errors) {
        const flat: Record<string, string> = {};
        Object.entries(err.errors).forEach(([k, v]) => (flat[k] = v[0]));
        setErrors(flat);
      } else {
        setErrors({ form: 'تعذّر إرسال رسالتك، برجاء المحاولة مرة أخرى' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1180px] gap-8 px-5 sm:px-6 md:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-[20px] bg-night p-8 text-cream">
        <h3 className="mb-5 font-utility text-lg text-gold-2">بيانات التواصل</h3>
        <div className="flex items-center gap-3 py-3 text-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-2/15 text-gold-2"><MailIcon className="h-4 w-4" /></span>
          info@rowwad-borders.example
        </div>
        <div className="flex items-center gap-3 border-t border-gold/15 py-3 text-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-2/15 text-gold-2"><PhoneIcon className="h-4 w-4" /></span>
          ٠٢ ١٢٣٤ ٥٦٧٨
        </div>
        <div className="flex items-center gap-3 border-t border-gold/15 py-3 text-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-2/15 text-gold-2"><PinIcon className="h-4 w-4" /></span>
          مقر رئيسي بالقاهرة، ومكاتب تنسيق في المحافظات
        </div>
        <div className="mt-6 flex gap-2.5">
          {['f', 'IG', 'X', 'YT'].map((s) => (
            <a key={s} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/35 font-utility text-xs font-extrabold text-gold-2 transition hover:bg-gold/15">
              {s}
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-[20px] border border-gold/25 bg-white p-8">
        <h3 className="mb-5 font-display text-xl">أرسل رسالتك</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <TextField label="الاسم بالكامل" name="name" error={errors.name} />
          <div>
            <label className="mb-1.5 block font-utility text-sm font-bold">المحافظة</label>
            <select name="governorate" className="w-full rounded-lg border border-gold/40 px-3 py-3 text-sm">
              {GOVS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <TextField label="البريد الإلكتروني" name="email" type="email" error={errors.email} />
          <TextField label="رقم الهاتف" name="phone" type="tel" />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block font-utility text-sm font-bold">رسالتك</label>
            <textarea name="message" rows={4} className={`w-full rounded-lg border px-3 py-3 text-sm ${errors.message ? 'border-[#e08a6b]' : 'border-gold/40'}`} />
            {errors.message && <span className="mt-1 block text-xs text-[#e08a6b]">{errors.message}</span>}
          </div>

          {errors.form && <p className="text-sm text-[#e08a6b] sm:col-span-2">{errors.form}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-fit rounded-full bg-violet-600 px-7 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60 sm:col-span-2"
          >
            {submitting ? 'جارٍ الإرسال…' : 'إرسال الرسالة'}
          </button>
        </form>
      </div>
    </div>
  );
}

function TextField({ label, name, type = 'text', error }: { label: string; name: string; type?: string; error?: string }) {
  return (
    <div>
      <label className="mb-1.5 block font-utility text-sm font-bold">{label}</label>
      <input name={name} type={type} className={`w-full rounded-lg border px-3 py-3 text-sm ${error ? 'border-[#e08a6b]' : 'border-gold/40'}`} />
      {error && <span className="mt-1 block text-xs text-[#e08a6b]">{error}</span>}
    </div>
  );
}
