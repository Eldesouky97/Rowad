'use client';

import { FormEvent, useState } from 'react';
import { visitorSignIn, visitorSignInWithGoogle, sendPasswordReset, ApiException } from '@/lib/api';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path fill="#4285F4" d="M23.5 12.3c0-.85-.08-1.66-.22-2.44H12v4.62h6.46c-.28 1.5-1.13 2.78-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1C3.26 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.31A7.2 7.2 0 014.9 12c0-.8.14-1.58.39-2.31v-3.1H1.28A11.98 11.98 0 000 12c0 1.94.46 3.77 1.28 5.41l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.28 6.59l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z" />
    </svg>
  );
}

/**
 * بوابة تسجيل دخول للزوار (مش لوحة التحكم) — تُعرض قبل نماذج تتطلب حساب،
 * مثل حجز فعالية. إنشاء حساب جديد بقى عن طريق جوجل بس؛ البريد الإلكتروني
 * والباسورد متاحين بس لتسجيل دخول حساب موجود بالفعل.
 */
export default function VisitorAuthGate({
  onAuthed,
  showHeading = true,
}: {
  onAuthed: () => void;
  showHeading?: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleResetSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetError(null);
    const email = String(new FormData(e.currentTarget).get('email') || '').trim();
    setResetSubmitting(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      setResetError(err instanceof ApiException ? err.message : 'تعذّر إرسال رابط إعادة التعيين');
    } finally {
      setResetSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await visitorSignInWithGoogle();
      onAuthed();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر تسجيل الدخول بحساب Google');
    } finally {
      setGoogleSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    setSubmitting(true);
    try {
      await visitorSignIn(email, password);
      onAuthed();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر تسجيل الدخول');
    } finally {
      setSubmitting(false);
    }
  }

  if (forgotMode) {
    return (
      <div>
        <h3 className="font-display text-xl">نسيت كلمة المرور؟</h3>
        <p className="mb-6 mt-1 text-sm opacity-70">اكتب بريدك الإلكتروني وهنبعتلك رابط إعادة تعيين كلمة المرور.</p>

        {resetSent ? (
          <p className="text-sm text-emerald-600">تم إرسال رابط إعادة التعيين، تحقّق من بريدك الإلكتروني.</p>
        ) : (
          <form onSubmit={handleResetSubmit} className="grid gap-4">
            <div>
              <label className="mb-1.5 block font-utility text-sm font-bold">البريد الإلكتروني</label>
              <input name="email" type="email" required className="w-full rounded-lg border border-gold/40 bg-white px-3 py-3 text-sm" />
            </div>
            {resetError && <p className="text-sm text-[#e08a6b]">{resetError}</p>}
            <button
              type="submit"
              disabled={resetSubmitting}
              className="w-full rounded-full bg-violet-600 px-4 py-3 font-utility font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {resetSubmitting ? 'جارٍ الإرسال…' : 'إرسال رابط إعادة التعيين'}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => { setForgotMode(false); setResetSent(false); setResetError(null); }}
          className="mt-4 text-sm font-bold text-rust hover:underline"
        >
          العودة لتسجيل الدخول
        </button>
      </div>
    );
  }

  return (
    <div>
      {showHeading && (
        <>
          <h3 className="font-display text-xl">سجّل الدخول للمتابعة</h3>
          <p className="mb-6 mt-1 text-sm opacity-70">لازم يكون عندك حساب عشان تقدر تحجز في الفعاليات.</p>
        </>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleSubmitting || submitting}
        className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-full border border-gold/30 bg-white px-4 py-3 text-sm font-bold transition hover:bg-sand disabled:opacity-60"
      >
        <GoogleIcon /> {googleSubmitting ? 'جارٍ الدخول…' : 'الدخول أو إنشاء حساب بجوجل'}
      </button>

      <div className="mb-5 flex items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-gold/25" /> أو سجّل دخولك بحساب موجود <span className="h-px flex-1 bg-gold/25" />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="mb-1.5 block font-utility text-sm font-bold">البريد الإلكتروني</label>
          <input name="email" type="email" required className="w-full rounded-lg border border-gold/40 bg-white px-3 py-3 text-sm" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block font-utility text-sm font-bold">كلمة المرور</label>
            <button type="button" onClick={() => setForgotMode(true)} className="font-utility text-xs font-bold text-rust hover:underline">
              نسيت كلمة المرور؟
            </button>
          </div>
          <input name="password" type="password" required minLength={8} className="w-full rounded-lg border border-gold/40 bg-white px-3 py-3 text-sm" />
        </div>
        {error && <p className="text-sm text-[#e08a6b]">{error}</p>}
        <button
          type="submit"
          disabled={submitting || googleSubmitting}
          className="w-full rounded-full bg-violet-600 px-4 py-3 font-utility font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {submitting ? 'جارٍ التنفيذ…' : 'تسجيل الدخول'}
        </button>
      </form>
    </div>
  );
}
