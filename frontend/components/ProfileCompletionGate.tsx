'use client';

import { FormEvent, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { updateVisitorProfile, visitorSignOut, ApiException } from '@/lib/api';
import { useVisitorProfile } from '@/lib/useVisitorProfile';
import { GOVERNORATES, EDUCATION_LEVELS, COMMITTEES } from '@/lib/constants';
import { getAgeFromNationalId } from '@/lib/nationalId';
import { CompassIcon, LogoutIcon } from './icons';

const inputClass =
  'w-full rounded-lg border border-gold/40 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100';
const labelClass = 'mb-1.5 block font-utility text-sm font-bold';

/**
 * نموذج إكمال البيانات الإجباري — بيظهر فوق كل الموقع (Overlay كامل الشاشة)
 * لأي زائر مسجّل دخوله (بجوجل أو بالبريد) لسه ملّاش بياناته الشخصية
 * (الرقم القومي، المحافظة، العنوان، السن، المؤهل التعليمي)، لأن جوجل نفسه
 * مش بيوفّر البيانات دي — لازم الزائر يدخلها بنفسه مرة واحدة. مستثنى من
 * لوحة التحكم (/admin) حتى يقدر الأدمن يدخلها بحرية دايمًا.
 */
export default function ProfileCompletionGate() {
  const pathname = usePathname();
  const { authUser, profile, profileLoaded, loading } = useVisitorProfile();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nationalId, setNationalId] = useState('');

  const computedAge = useMemo(() => getAgeFromNationalId(nationalId), [nationalId]);
  const nationalIdComplete = nationalId.length === 14;

  const isAdminRoute = pathname?.startsWith('/admin');
  const shouldShow = !loading && !!authUser && profileLoaded && !profile?.profile_completed && !isAdminRoute;

  if (!shouldShow) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    const governorate = String(form.get('governorate') || '');
    const address = String(form.get('address') || '').trim();
    const education = String(form.get('education') || '');
    const committee = String(form.get('committee') || '');

    if (name.length < 2) return setError('من فضلك أدخل اسمًا صحيحًا');
    if (!/^\d{14}$/.test(nationalId)) return setError('الرقم القومي يجب أن يتكوّن من ١٤ رقمًا');
    if (computedAge === null) return setError('الرقم القومي غير صحيح — تعذّر استخراج تاريخ الميلاد منه');
    if (!governorate) return setError('من فضلك اختر المحافظة');
    if (address.length < 3) return setError('من فضلك أدخل عنوانًا صحيحًا');
    if (!education) return setError('من فضلك اختر المؤهل التعليمي');
    const age = computedAge;

    setSubmitting(true);
    try {
      await updateVisitorProfile({
        name,
        national_id: nationalId,
        governorate,
        address,
        age,
        education,
        committee,
        markCompleted: true,
      });
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ البيانات، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-start justify-center overflow-y-auto bg-night/80 p-4 backdrop-blur-sm sm:items-center">
      <div className="my-8 w-full max-w-[560px] rounded-[20px] bg-cream p-7 sm:p-8">
        <div className="mb-5 flex flex-col items-center text-center">
          <CompassIcon className="mb-3 h-9 w-9 text-rust" />
          <h1 className="font-display text-xl sm:text-2xl">استكمل بياناتك</h1>
          <p className="mt-1.5 text-sm opacity-70">
            خطوة أخيرة قبل ما تبدأ — محتاجين بياناتك دي عشان نقدر نتواصل معاك ونسجّلك صح في فعالياتنا.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>الاسم بالكامل</label>
            <input name="name" required defaultValue={authUser?.displayName || ''} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>الرقم القومي</label>
            <input
              name="national_id"
              inputMode="numeric"
              maxLength={14}
              required
              placeholder="١٤ رقمًا"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 14))}
              className={inputClass}
            />
            {nationalIdComplete && computedAge === null && (
              <p className="mt-1 text-xs text-[#e08a6b]">الرقم القومي غير صحيح</p>
            )}
          </div>
          <div>
            <label className={labelClass}>السن (يُحسب تلقائيًا)</label>
            <input
              readOnly
              disabled
              value={computedAge !== null ? `${computedAge} سنة` : ''}
              placeholder="هيظهر بعد إدخال الرقم القومي"
              className={`${inputClass} cursor-not-allowed bg-sand/60 text-ink/60`}
            />
          </div>
          <div>
            <label className={labelClass}>المحافظة</label>
            <select name="governorate" required defaultValue="" className={inputClass}>
              <option value="" disabled>اختر محافظتك</option>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>المؤهل التعليمي</label>
            <select name="education" required defaultValue="" className={inputClass}>
              <option value="" disabled>اختر المؤهل</option>
              {EDUCATION_LEVELS.map((ed) => <option key={ed} value={ed}>{ed}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>العنوان</label>
            <input name="address" required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>اللجنة داخل الكيان (اختياري)</label>
            <select name="committee" defaultValue="" className={inputClass}>
              <option value="">مش عضو في لجنة حاليًا</option>
              {COMMITTEES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-[#e08a6b] sm:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-full bg-violet-600 px-4 py-3 font-utility font-bold text-white transition hover:bg-violet-700 disabled:opacity-60 sm:col-span-2"
          >
            {submitting ? 'جارٍ الحفظ…' : 'حفظ ومتابعة'}
          </button>
        </form>

        <button
          onClick={() => visitorSignOut()}
          className="mx-auto mt-5 flex items-center gap-1.5 text-xs font-bold text-ink/50 transition hover:text-ink/80"
        >
          <LogoutIcon className="h-3.5 w-3.5" /> تسجيل الخروج بدل إكمال البيانات الآن
        </button>
      </div>
    </div>
  );
}
