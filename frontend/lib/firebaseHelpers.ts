// ملاحظة: هذا الملف يُستخدم أيضًا من Server Components (عبر lib/publicApi.ts)
// لذا يجب ألا يستورد أي شيء من ./firebase (الذي يهيّئ Firebase SDK فورًا وقت
// التحميل ويفشل في بيئة السيرفر) — القيمة تُقرأ هنا مباشرة من متغير البيئة.
const DATABASE_REST_URL = (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '').replace(/\/$/, '');

/** تحويل كائن RTDB {pushKey: {...}} إلى مصفوفة [{id, ...}] */
export function objectToArray<T extends object>(
  obj: Record<string, T> | null | undefined
): (T & { id: string })[] {
  if (!obj) return [];
  return Object.entries(obj).map(([id, value]) => ({ ...(value as T), id }));
}

/** قراءة REST مباشرة من RTDB (بدون SDK) — تعمل في Server وClient Components */
export async function restGet<T = unknown>(path: string): Promise<T | null> {
  const res = await fetch(`${DATABASE_REST_URL}/${path}.json`, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** كتابة REST (إنشاء صف جديد بمفتاح تلقائي) */
export async function restPost<T = unknown>(path: string, data: unknown): Promise<{ name: string }> {
  const res = await fetch(`${DATABASE_REST_URL}/${path}.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('تعذّر إرسال البيانات، حاول مرة أخرى');
  }
  return (await res.json()) as { name: string };
}

/** توليد slug من عنوان عربي (لا يتم تحويله لحروف لاتينية) + لاحقة عشوائية لضمان التفرّد */
export function makeSlug(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

/** توليد كود تأكيد حجز بصيغة RWD-XXX-XXXX */
export function makeConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `RWD-${rand(3)}-${rand(4)}`;
}

/** حساب الحقول المشتقة لفعالية (status, seats_remaining) بدل تخزينها */
export function computeEventFields<
  T extends { starts_at: string; seats_total: number; seats_taken: number }
>(event: T): T & { status: 'upcoming' | 'past'; seats_remaining: number } {
  return {
    ...event,
    status: new Date(event.starts_at).getTime() > Date.now() ? 'upcoming' : 'past',
    seats_remaining: Math.max(0, event.seats_total - event.seats_taken),
  };
}

export class ApiException extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
