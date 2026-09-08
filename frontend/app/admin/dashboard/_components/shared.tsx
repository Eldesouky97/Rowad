import type { AdminUser, Publishable } from '@/lib/types';
import { GOVERNORATES, COMMITTEES } from '@/lib/constants';
import { SearchIcon, UsersIcon } from '@/components/icons';

export const ARTICLE_CATEGORIES = ['أخبار الكيان', 'تنمية مجتمعية', 'مقالات رأي'];
export const GOVS = [...GOVERNORATES, 'عام'];
export const PROGRAM_CATEGORIES = COMMITTEES;
export const ART_THEMES = ['art-1', 'art-2', 'art-3', 'art-4'];
export const EVENT_MODES = ['حضوري', 'أونلاين', 'هجين'];
export const ROLES: AdminUser['role'][] = ['super_admin', 'editor', 'viewer'];
export const ROLE_LABELS: Record<AdminUser['role'], string> = {
  super_admin: 'مدير عام',
  editor: 'محرر',
  viewer: 'مشاهد',
};
export const ROLE_TONE: Record<AdminUser['role'], 'violet' | 'success' | 'neutral'> = {
  super_admin: 'violet',
  editor: 'success',
  viewer: 'neutral',
};

export const inputClass =
  'w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100';
export const labelClass = 'mb-1.5 block font-utility text-xs font-bold text-ink/70';

export function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type Notify = (message: string) => void;

/** بطاقة القسم الموحّدة: عنوان + وصف اختياري + محتوى */
export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-6 py-5">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-ink/55">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/** شارة حالة صغيرة (منشور/غير منشور، دور المستخدم، إلخ) */
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'violet';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-ink/5 text-ink/60',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-ink/15 py-10 text-center text-sm text-ink/45">
      {message}
    </div>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-600 sm:col-span-2">{message}</p>
  );
}

/** بطاقة إحصائية بأيقونة متدرجة اللون — لصفوف الملخص أعلى الأقسام */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: (p: { className?: string }) => JSX.Element;
  tone: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-ink/50">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink">{value}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

/**
 * سطر "نُشر بواسطة" — يظهر بلوحة التحكم بس (مش للجمهور إطلاقًا) لأي محتوى
 * فيه created_by_name، عشان الأدمن يعرف مين نشر إيه.
 */
export function PublisherNote({ item, className = '' }: { item: Publishable; className?: string }) {
  if (!item.created_by_name) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-ink/40 ${className}`}>
      <UsersIcon className="h-3 w-3" /> نُشر بواسطة {item.created_by_name}
    </span>
  );
}

/** تنبيه ثابت للمحرر يوضّح إن أي إضافة/تعديل هيتحفظ بانتظار مراجعة سوبر أدمن */
export function EditorReviewNotice({ isSuperAdmin, canEdit }: { isSuperAdmin: boolean; canEdit: boolean }) {
  if (isSuperAdmin || !canEdit) return null;
  return (
    <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
      بصفتك محرر، أي حاجة تضيفها أو تعدّلها هتتحفظ "بانتظار المراجعة" لحد ما سوبر أدمن يوافق عليها.
    </p>
  );
}

/** شارة "بانتظار المراجعة" — تظهر بس على العناصر اللي محرر أنشأها/عدّلها ولسه مش موافَق عليها */
export function PendingBadge({ item }: { item: Publishable }) {
  if (!item.pending_review) return null;
  return <Badge tone="warning">بانتظار المراجعة</Badge>;
}

/** رسالة نجاح موحّدة تراعي إن المحرر بيبعت للمراجعة مش بينشر مباشرة */
export function publishToast(isSuperAdmin: boolean, action: 'إضافة' | 'تحديث', noun: string): string {
  return isSuperAdmin ? `تم ${action} ${noun}` : `تم إرسال ${noun} لانتظار المراجعة`;
}

/** صندوق بحث دائري موحّد لأقسام الجداول */
export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:w-64">
      <SearchIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-ink/10 bg-sand/50 py-2 pl-3 pr-9 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />
    </div>
  );
}
