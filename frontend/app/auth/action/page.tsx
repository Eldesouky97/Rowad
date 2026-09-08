'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  verifyPasswordResetLink,
  confirmPasswordResetLink,
  confirmEmailVerificationLink,
  ApiException,
} from '@/lib/api';
import { CompassIcon, CheckIcon } from '@/components/icons';

type Status = 'checking' | 'reset-form' | 'reset-done' | 'verify-done' | 'error';

/** صفحة الموقع اللي بتستقبل روابط "إعادة تعيين كلمة المرور" و"تفعيل البريد
 * الإلكتروني" مباشرة من الإيميل — بدل ما Firebase يوجّه الزائر لصفحته
 * المُستضافة على *.firebaseapp.com. الرابط بيوصل هنا بمعامِلين: mode
 * (resetPassword / verifyEmail) و oobCode (كود التحقق لمرة واحدة). */
function AuthActionContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [status, setStatus] = useState<Status>('checking');
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('هذا الرابط غير صالح.');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!oobCode || !mode) {
      setStatus('error');
      return;
    }
    if (mode === 'resetPassword') {
      verifyPasswordResetLink(oobCode)
        .then((mail) => {
          setEmail(mail);
          setStatus('reset-form');
        })
        .catch((err) => {
          setErrorMessage(err instanceof ApiException ? err.message : 'هذا الرابط غير صالح.');
          setStatus('error');
        });
      return;
    }
    if (mode === 'verifyEmail') {
      confirmEmailVerificationLink(oobCode)
        .then(() => setStatus('verify-done'))
        .catch((err) => {
          setErrorMessage(err instanceof ApiException ? err.message : 'هذا الرابط غير صالح.');
          setStatus('error');
        });
      return;
    }
    setErrorMessage('نوع هذا الرابط غير مدعوم.');
    setStatus('error');
  }, [mode, oobCode]);

  async function handleResetSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') || '');
    const confirm = String(form.get('confirm') || '');
    if (password !== confirm) {
      setFormError('كلمتا المرور غير متطابقتين');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordResetLink(oobCode!, password);
      setStatus('reset-done');
    } catch (err) {
      setFormError(err instanceof ApiException ? err.message : 'تعذّر تحديث كلمة المرور');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-sand px-5 py-16">
      <div className="w-full max-w-[420px] rounded-[20px] border border-gold/25 bg-white p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <CompassIcon className="mb-3 h-10 w-10 text-rust" />
          <h1 className="font-display text-2xl">رُوَّاد المحافظات الحدودية</h1>
        </div>

        {status === 'checking' && <p className="text-center text-sm opacity-60">جارٍ التحقق من الرابط…</p>}

        {status === 'error' && (
          <div className="text-center">
            <p className="text-sm text-[#e08a6b]">{errorMessage}</p>
            <Link href="/login" className="mt-5 inline-block rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700">
              العودة لتسجيل الدخول
            </Link>
          </div>
        )}

        {status === 'reset-form' && (
          <form onSubmit={handleResetSubmit} className="grid gap-4">
            <p className="text-sm opacity-70">عيّن كلمة مرور جديدة لحساب {email}</p>
            <div>
              <label className="mb-1.5 block font-utility text-sm font-bold">كلمة المرور الجديدة</label>
              <input name="password" type="password" required minLength={8} className="w-full rounded-lg border border-gold/40 bg-white px-3 py-3 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block font-utility text-sm font-bold">تأكيد كلمة المرور</label>
              <input name="confirm" type="password" required minLength={8} className="w-full rounded-lg border border-gold/40 bg-white px-3 py-3 text-sm" />
            </div>
            {formError && <p className="text-sm text-[#e08a6b]">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-violet-600 px-4 py-3 font-utility font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {submitting ? 'جارٍ الحفظ…' : 'حفظ كلمة المرور الجديدة'}
            </button>
          </form>
        )}

        {status === 'reset-done' && (
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckIcon className="h-6 w-6" />
            </span>
            <p className="text-sm opacity-75">تم تحديث كلمة المرور بنجاح. تقدر دلوقتي تسجّل الدخول بيها.</p>
            <Link href="/login" className="mt-5 inline-block rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700">
              تسجيل الدخول
            </Link>
          </div>
        )}

        {status === 'verify-done' && (
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckIcon className="h-6 w-6" />
            </span>
            <p className="text-sm opacity-75">تم تفعيل بريدك الإلكتروني بنجاح.</p>
            <Link href="/" className="mt-5 inline-block rounded-full bg-violet-600 px-6 py-3 font-utility text-sm font-bold text-white transition hover:bg-violet-700">
              العودة للموقع
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center opacity-60">جارٍ التحميل…</p>}>
      <AuthActionContent />
    </Suspense>
  );
}
