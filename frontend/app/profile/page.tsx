'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  visitorSignOut,
  updateVisitorProfile,
  updateVisitorEmail,
  updateVisitorPassword,
  addPasswordToAccount,
  ApiException,
} from '@/lib/api';
import { useVisitorProfile } from '@/lib/useVisitorProfile';
import { GOVERNORATES, EDUCATION_LEVELS, COMMITTEES } from '@/lib/constants';
import { getAgeFromNationalId } from '@/lib/nationalId';
import type { SiteUser } from '@/lib/types';
import { useToast } from '@/components/Toast';
import UserAvatar from '@/components/UserAvatar';
import { CameraIcon, CompassIcon, LogoutIcon, MailIcon, KeyIcon, PinIcon } from '@/components/icons';

const inputClass =
  'w-full rounded-lg border border-gold/40 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100';
const labelClass = 'mb-1.5 block font-utility text-sm font-bold';
const cardClass = 'rounded-[20px] border border-gold/20 bg-white p-6 sm:p-7';

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { authUser, profile, profileLoaded, loading, displayName, photoUrl } = useVisitorProfile();
  // بعد ربط كلمة مرور بحساب جوجل بنجاح، authUser.providerData بيتحدّث فورًا
  // (نفس الـ object في الذاكرة) لكن مش دايمًا كافي وحده لإجبار رندر جديد —
  // الفلاج ده بيضمن التبديل الفوري لقسم البريد/كلمة المرور من غير أي تأخير
  const [justLinkedPassword, setJustLinkedPassword] = useState(false);

  useEffect(() => {
    if (!loading && !authUser) router.replace('/login?next=/profile');
  }, [loading, authUser, router]);

  // نستنى profileLoaded (مش بس loading) قبل ما نعرض النماذج — الحقول defaultValue
  // (uncontrolled) بتاخد قيمتها الأولى وقت أول رندر بس، فلو عرضناها قبل ما بيانات
  // /site_users توصل من Firebase، هتفضل فاضية حتى بعد ما البيانات توصل فعلًا.
  if (loading || !authUser || !profileLoaded) {
    return <p className="py-24 text-center text-sm opacity-60">جارٍ التحقق…</p>;
  }

  const hasPasswordProvider = justLinkedPassword || authUser.providerData.some((p) => p.providerId === 'password');
  const memberSince = authUser.metadata.creationTime
    ? new Date(authUser.metadata.creationTime).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <section className="bg-sand px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto grid max-w-[720px] gap-6">
        <div className="mb-1 flex items-center gap-2.5">
          <CompassIcon className="h-7 w-7 text-rust" />
          <h1 className="font-display text-2xl sm:text-3xl">إعدادات الحساب</h1>
        </div>

        <AvatarCard name={displayName} photoUrl={photoUrl} onUploaded={() => showToast('تم تحديث صورة الحساب')} />

        <BasicInfoCard
          currentName={displayName}
          currentPhone={profile?.phone || ''}
          onSaved={() => showToast('تم حفظ بياناتك')}
        />

        <PersonalInfoCard
          profile={profile}
          onSaved={() => showToast('تم تحديث بياناتك الشخصية')}
        />

        {hasPasswordProvider ? (
          <>
            <EmailCard currentEmail={authUser.email || ''} onSaved={() => showToast('تم تحديث البريد الإلكتروني')} />
            <PasswordCard onSaved={() => showToast('تم تغيير كلمة المرور')} />
          </>
        ) : (
          <AddPasswordCard
            email={authUser.email || ''}
            onLinked={() => {
              setJustLinkedPassword(true);
              showToast('تم إضافة كلمة مرور لحسابك — تقدر تدخل بيها بدل جوجل من دلوقتي');
            }}
          />
        )}

        <div className={cardClass}>
          <h2 className="mb-4 font-display text-lg">معلومات الحساب</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide opacity-50">البريد الإلكتروني</dt>
              <dd className="mt-1 font-bold">{authUser.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide opacity-50">طريقة الدخول</dt>
              <dd className="mt-1 font-bold">
                {authUser.providerData.some((p) => p.providerId === 'password') && authUser.providerData.some((p) => p.providerId === 'google.com')
                  ? 'Google + بريد إلكتروني وكلمة مرور'
                  : hasPasswordProvider
                    ? 'بريد إلكتروني وكلمة مرور'
                    : 'حساب Google'}
              </dd>
            </div>
            {memberSince && (
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide opacity-50">عضو منذ</dt>
                <dd className="mt-1 font-bold">{memberSince}</dd>
              </div>
            )}
          </dl>

          <button
            onClick={async () => {
              await visitorSignOut();
              router.push('/');
            }}
            className="mt-6 flex items-center gap-2 rounded-full border border-rose-200 px-5 py-2.5 text-sm font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <LogoutIcon className="h-4 w-4" /> تسجيل الخروج
          </button>
        </div>
      </div>
    </section>
  );
}

function AvatarCard({
  name,
  photoUrl,
  onUploaded,
}: {
  name: string;
  photoUrl: string | null;
  onUploaded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await updateVisitorProfile({ photoFile: file });
      onUploaded();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر رفع الصورة');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`${cardClass} flex items-center gap-5`}>
      <div className="relative shrink-0">
        <UserAvatar src={photoUrl} name={name} size="lg" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="تغيير صورة الحساب"
          className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-md transition hover:bg-violet-700 disabled:opacity-60"
        >
          <CameraIcon className="h-4 w-4" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold">{name}</p>
        <p className="mt-1 text-xs opacity-60">
          {uploading ? 'جارٍ رفع الصورة…' : 'اضغط على أيقونة الكاميرا لتغيير صورة حسابك (حتى 4 ميجابايت)'}
        </p>
        {error && <p className="mt-1 text-xs text-[#e08a6b]">{error}</p>}
      </div>
    </div>
  );
}

function BasicInfoCard({
  currentName,
  currentPhone,
  onSaved,
}: {
  currentName: string;
  currentPhone: string;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    const phone = String(form.get('phone') || '').trim();
    if (name.length < 2) {
      setError('من فضلك أدخل اسمًا صحيحًا');
      return;
    }
    setSubmitting(true);
    try {
      await updateVisitorProfile({ name, phone });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ البيانات');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <h2 className="mb-4 font-display text-lg">البيانات الأساسية</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>الاسم بالكامل</label>
          <input name="name" defaultValue={currentName} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>رقم الهاتف</label>
          <input name="phone" type="tel" defaultValue={currentPhone} className={inputClass} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-[#e08a6b]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {submitting ? 'جارٍ الحفظ…' : 'حفظ البيانات'}
      </button>
    </form>
  );
}

function PersonalInfoCard({ profile, onSaved }: { profile: SiteUser | null; onSaved: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nationalId, setNationalId] = useState(profile?.national_id || '');

  const computedAge = useMemo(() => getAgeFromNationalId(nationalId), [nationalId]);
  const nationalIdComplete = nationalId.length === 14;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const governorate = String(form.get('governorate') || '');
    const address = String(form.get('address') || '').trim();
    const education = String(form.get('education') || '');
    const committee = String(form.get('committee') || '');

    if (nationalId && !/^\d{14}$/.test(nationalId)) {
      setError('الرقم القومي يجب أن يتكوّن من ١٤ رقمًا');
      return;
    }
    if (nationalIdComplete && computedAge === null) {
      setError('الرقم القومي غير صحيح — تعذّر استخراج تاريخ الميلاد منه');
      return;
    }

    setSubmitting(true);
    try {
      await updateVisitorProfile({
        national_id: nationalId,
        governorate,
        address,
        ...(computedAge !== null ? { age: computedAge } : {}),
        education,
        committee,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر حفظ البيانات');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg"><PinIcon className="h-5 w-5 opacity-60" /> البيانات الشخصية</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>الرقم القومي</label>
          <input
            name="national_id"
            inputMode="numeric"
            maxLength={14}
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 14))}
            className={inputClass}
          />
          {nationalIdComplete && computedAge === null && (
            <p className="mt-1 text-xs text-[#e08a6b]">الرقم القومي غير صحيح</p>
          )}
        </div>
        <div>
          <label className={labelClass}>السن (يُحسب تلقائيًا من الرقم القومي)</label>
          <input
            readOnly
            disabled
            value={computedAge !== null ? `${computedAge} سنة` : profile?.age ? `${profile.age} سنة` : ''}
            placeholder="أدخل رقمًا قوميًا صحيحًا"
            className={`${inputClass} cursor-not-allowed bg-sand/60 text-ink/60`}
          />
        </div>
        <div>
          <label className={labelClass}>المحافظة</label>
          <select name="governorate" defaultValue={profile?.governorate || ''} className={inputClass}>
            <option value="">— اختر —</option>
            {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>المؤهل التعليمي</label>
          <select name="education" defaultValue={profile?.education || ''} className={inputClass}>
            <option value="">— اختر —</option>
            {EDUCATION_LEVELS.map((ed) => <option key={ed} value={ed}>{ed}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>العنوان</label>
          <input name="address" defaultValue={profile?.address || ''} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>اللجنة داخل الكيان</label>
          <select name="committee" defaultValue={profile?.committee || ''} className={inputClass}>
            <option value="">مش عضو في لجنة حاليًا</option>
            {COMMITTEES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-[#e08a6b]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {submitting ? 'جارٍ الحفظ…' : 'حفظ البيانات الشخصية'}
      </button>
    </form>
  );
}

function AddPasswordCard({ email, onLinked }: { email: string; onLinked: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') || '');
    const confirmPassword = String(form.get('confirm_password') || '');

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون ٨ أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقين');
      return;
    }

    setSubmitting(true);
    try {
      await addPasswordToAccount(password);
      onLinked();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر إضافة كلمة المرور');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <h2 className="mb-1 flex items-center gap-2 font-display text-lg"><KeyIcon className="h-5 w-5 opacity-60" /> إضافة كلمة مرور</h2>
      <p className="mb-4 text-xs opacity-55">
        حسابك مسجّل دخوله بجوجل بالبريد <b>{email}</b> — أضف كلمة مرور عشان تقدر كمان تدخل بنفس البريد ده وكلمة المرور، من غير ما تحتاج جوجل في كل مرة.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>كلمة المرور</label>
          <input name="password" type="password" minLength={8} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>تأكيد كلمة المرور</label>
          <input name="confirm_password" type="password" minLength={8} required className={inputClass} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-[#e08a6b]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {submitting ? 'جارٍ الإضافة…' : 'إضافة كلمة مرور'}
      </button>
    </form>
  );
}

function EmailCard({ currentEmail, onSaved }: { currentEmail: string; onSaved: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const currentPassword = String(form.get('current_password') || '');
    if (email === currentEmail) {
      setError('هذا هو بريدك الحالي بالفعل');
      return;
    }
    setSubmitting(true);
    try {
      await updateVisitorEmail(email, currentPassword);
      onSaved();
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر تحديث البريد الإلكتروني');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <h2 className="mb-1 flex items-center gap-2 font-display text-lg"><MailIcon className="h-5 w-5 opacity-60" /> البريد الإلكتروني</h2>
      <p className="mb-4 text-xs opacity-55">بريدك الحالي: {currentEmail}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>البريد الإلكتروني الجديد</label>
          <input name="email" type="email" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>كلمة المرور الحالية</label>
          <input name="current_password" type="password" required className={inputClass} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-[#e08a6b]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {submitting ? 'جارٍ التحديث…' : 'تحديث البريد الإلكتروني'}
      </button>
    </form>
  );
}

function PasswordCard({ onSaved }: { onSaved: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get('current_password') || '');
    const newPassword = String(form.get('new_password') || '');
    const confirmPassword = String(form.get('confirm_password') || '');
    if (newPassword.length < 8) {
      setError('كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }
    setSubmitting(true);
    try {
      await updateVisitorPassword(newPassword, currentPassword);
      onSaved();
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'تعذّر تغيير كلمة المرور');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg"><KeyIcon className="h-5 w-5 opacity-60" /> كلمة المرور</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>كلمة المرور الحالية</label>
          <input name="current_password" type="password" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>كلمة المرور الجديدة</label>
          <input name="new_password" type="password" minLength={8} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>تأكيد كلمة المرور</label>
          <input name="confirm_password" type="password" minLength={8} required className={inputClass} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-[#e08a6b]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {submitting ? 'جارٍ التغيير…' : 'تغيير كلمة المرور'}
      </button>
    </form>
  );
}
