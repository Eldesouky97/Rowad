'use client';

import { FormEvent, useState } from 'react';
import type { EventItem } from '@/lib/types';
import { createBooking, ApiException } from '@/lib/api';
import { CloseIcon, CheckIcon } from './icons';
import { useToast } from './Toast';

const GOVS = [
  'شمال سيناء', 'جنوب سيناء', 'أسوان', 'الوادي الجديد', 'مطروح',
  'البحر الأحمر', 'السويس', 'الإسماعيلية', 'القاهرة الكبرى', 'الشرقية', 'أخرى',
];

export default function BookingModal({
  event,
  onClose,
  onBooked,
}: {
  event: EventItem;
  onClose: () => void;
  onBooked: (eventId: number) => void;
}) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmCode, setConfirmCode] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      full_name: String(form.get('full_name') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      email: String(form.get('email') || '').trim(),
      governorate: String(form.get('governorate') || ''),
      notes: String(form.get('notes') || '').trim(),
    };

    const newErrors: Record<string, string> = {};
    if (payload.full_name.length < 2) newErrors.full_name = 'من فضلك أدخل اسمك';
    if (!/^[0-9+\s-]{7,}$/.test(payload.phone)) newErrors.phone = 'من فضلك أدخل رقم هاتف صحيح';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) newErrors.email = 'من فضلك أدخل بريدًا صحيحًا';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setSubmitting(true);
    try {
      const booking = await createBooking(event.slug, payload);
      setConfirmCode(booking.confirmation_code);

      try {
        const raw = localStorage.getItem('rowwad-my-bookings');
        const map = raw ? JSON.parse(raw) : {};
        map[event.id] = booking.confirmation_code;
        localStorage.setItem('rowwad-my-bookings', JSON.stringify(map));
      } catch {
        /* localStorage قد يكون غير متاح — لا نوقف تدفق العملية بسببه */
      }

      onBooked(event.id);
      showToast(`تم تأكيد حجزك في «${event.title}»`);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 409) {
          setErrors({ form: 'عذرًا، اكتملت مقاعد هذه الفعالية للتو' });
        } else if (err.errors) {
          const flat: Record<string, string> = {};
          Object.entries(err.errors).forEach(([k, v]) => (flat[k] = v[0]));
          setErrors(flat);
        } else {
          setErrors({ form: err.message });
        }
      } else {
        setErrors({ form: 'تعذّر إتمام الحجز، برجاء المحاولة مرة أخرى' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-night/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative mt-[4vh] w-full max-w-[560px] rounded-[20px] bg-cream p-8">
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-ink/5"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {confirmCode ? (
          <div className="py-4 text-center">
            <CheckIcon className="mx-auto mb-4 h-12 w-12 text-sea" />
            <h4 className="font-display text-xl">تم تأكيد حجزك بنجاح</h4>
            <p className="mt-2 text-sm opacity-75">هيتواصل معك فريقنا بتفاصيل الفعالية قبل الموعد بيومين.</p>
            <div className="mt-4 inline-block rounded-lg bg-sand-2 px-4 py-2 font-utility font-extrabold tracking-wider">
              {confirmCode}
            </div>
            <button onClick={onClose} className="mt-6 block w-full rounded-full bg-night px-4 py-3 font-utility font-bold text-cream">
              تم
            </button>
          </div>
        ) : (
          <>
            <h3 className="ml-9 font-display text-2xl">حجز مكان في الفعالية</h3>
            <p className="mb-6 mt-1 text-sm opacity-70">{event.title} — {new Date(event.starts_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم بالكامل" name="full_name" error={errors.full_name} />
              <Field label="رقم الهاتف" name="phone" type="tel" error={errors.phone} />
              <Field label="البريد الإلكتروني" name="email" type="email" error={errors.email} />
              <div>
                <label className="mb-1.5 block font-utility text-sm font-bold">محافظتك</label>
                <select name="governorate" className="w-full rounded-lg border border-gold/40 bg-white px-3 py-3 text-sm">
                  {GOVS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block font-utility text-sm font-bold">ملاحظات (اختياري)</label>
                <textarea name="notes" rows={3} className="w-full rounded-lg border border-gold/40 bg-white px-3 py-3 text-sm" />
              </div>

              {errors.form && <p className="sm:col-span-2 text-sm text-[#e08a6b]">{errors.form}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 w-full rounded-full bg-violet-600 px-4 py-3 font-utility font-bold text-white transition hover:bg-violet-700 disabled:opacity-60 sm:col-span-2"
              >
                {submitting ? 'جارٍ التأكيد…' : 'تأكيد الحجز'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  error,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-utility text-sm font-bold">{label}</label>
      <input
        name={name}
        type={type}
        className={`w-full rounded-lg border bg-white px-3 py-3 text-sm ${error ? 'border-[#e08a6b]' : 'border-gold/40'}`}
      />
      {error && <span className="mt-1 block text-xs text-[#e08a6b]">{error}</span>}
    </div>
  );
}
