'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, ApiException } from '@/lib/api';
import { setAdminToken } from '@/lib/adminAuth';
import { CompassIcon } from '@/components/icons';

export default function AdminLoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    setSubmitting(true);
    try {
      const { token } = await adminLogin(email, password);
      setAdminToken(token);
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر تسجيل الدخول');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-sand px-5 py-16">
      <div className="w-full max-w-[420px] rounded-[20px] border border-gold/25 bg-white p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <CompassIcon className="mb-3 h-10 w-10 text-rust" />
          <h1 className="font-display text-2xl">دخول لوحة التحكم</h1>
          <p className="mt-1 text-sm opacity-70">للفريق الإداري لرُوَّاد المحافظات الحدودية فقط</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="mb-1.5 block font-utility text-sm font-bold">البريد الإلكتروني</label>
            <input name="email" type="email" required className="w-full rounded-lg border border-gold/40 px-3 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block font-utility text-sm font-bold">كلمة المرور</label>
            <input name="password" type="password" required className="w-full rounded-lg border border-gold/40 px-3 py-3 text-sm" />
          </div>
          {error && <p className="text-sm text-[#e08a6b]">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-full bg-night px-4 py-3 font-utility text-sm font-bold text-cream transition hover:bg-night-2 disabled:opacity-60"
          >
            {submitting ? 'جارٍ الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </section>
  );
}
