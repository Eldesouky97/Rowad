'use client';

import { Fragment, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  adminListAllAccounts,
  adminCreateUser,
  adminUpdateUser,
  adminPromoteSiteUser,
  adminDeleteUserCompletely,
  sendAdminPasswordReset,
  ApiException,
} from '@/lib/api';
import type { AdminRole, FirebaseAccountRow } from '@/lib/types';
import { PlusIcon, EditIcon, KeyIcon, TrashIcon, ShieldIcon, StarIcon, EyeIcon } from '@/components/icons';
import { ROLES, ROLE_LABELS, ROLE_TONE, inputClass, labelClass, SectionCard, Badge, EmptyState, ErrorText, StatCard, SearchBox, type Notify } from './shared';

const providerLabel: Record<string, string> = { google: 'Google', password: 'بريد إلكتروني' };

/**
 * "المستخدمون" — بيسرد كل حساب موجود فعليًا في Firebase Authentication
 * (عبر /api/admin/list-users بمفتاح Admin SDK)، مش بس اللي سبق وكتب سجل في
 * site_users — فأي حساب اتعمل ولسه ما سجّلش دخول أو ملأش بياناته بيظهر
 * برضه بحالة "غير مكتمل". أي حساب مالوش دور إداري بيتعرض كـ "مشاهد"
 * افتراضيًا — نفس نظام الأدوار التلاتة (مدير عام / محرر / مشاهد) بيغطي
 * الكل من غير تصنيف رابع. تصميم متجاوب: بطاقات على الموبايل، جدول على
 * الشاشات الأوسع.
 */
export default function UsersManager({ currentUserId, showToast }: { currentUserId: string; showToast: Notify }) {
  const [accounts, setAccounts] = useState<FirebaseAccountRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  function refresh() {
    setLoadError(null);
    adminListAllAccounts()
      .then(setAccounts)
      .catch((err) => {
        setAccounts([]);
        setLoadError(err instanceof ApiException ? err.message : 'تعذّر جلب قائمة الحسابات');
      });
  }
  useEffect(refresh, []);

  const loading = accounts === null;

  const filtered = useMemo(
    () => (accounts ?? []).filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(search.trim().toLowerCase())),
    [accounts, search]
  );

  const counts = useMemo(() => {
    const result: Record<AdminRole, number> = { super_admin: 0, editor: 0, viewer: 0 };
    for (const u of accounts ?? []) result[u.role ?? 'viewer']++;
    return result;
  }, [accounts]);

  async function handleRoleChange(u: FirebaseAccountRow, role: AdminRole) {
    if (u.role === role) { setEditingRoleId(null); return; }
    setRoleSubmitting(true);
    try {
      if (u.role) {
        await adminUpdateUser(u.id, { role });
      } else {
        await adminPromoteSiteUser(u.id, { name: u.name, email: u.email, role });
      }
      showToast(`تم تحديث دور ${u.name} إلى ${ROLE_LABELS[role]}`);
      setEditingRoleId(null);
      refresh();
    } catch (err) {
      showToast(err instanceof ApiException ? err.message : 'تعذّر تحديث الدور');
    } finally {
      setRoleSubmitting(false);
    }
  }

  async function handleResetPassword(email: string) {
    try {
      await sendAdminPasswordReset(email);
      showToast('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد المستخدم');
    } catch (err) {
      showToast(err instanceof ApiException ? err.message : 'تعذّر إرسال رابط إعادة التعيين');
    }
  }

  async function handleRemove(u: FirebaseAccountRow) {
    if (
      !confirm(
        `حذف "${u.name}" نهائيًا؟ ده هيمسح حساب دخوله بالكامل من Firebase (مش بس صلاحيات لوحة التحكم) وكل بياناته الشخصية وحجوزاته — إجراء لا يمكن التراجع عنه.`
      )
    ) {
      return;
    }
    try {
      await adminDeleteUserCompletely(u.id);
      showToast('تم حذف الحساب وكل بياناته نهائيًا من Firebase');
      setAccounts((prev) => (prev ?? []).filter((x) => x.id !== u.id));
    } catch (err) {
      showToast(err instanceof ApiException ? err.message : 'تعذّر حذف الحساب');
    }
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') || '').trim(),
      email: String(form.get('email') || '').trim(),
      password: String(form.get('password') || ''),
      role: String(form.get('role') || 'editor') as AdminRole,
    };
    if (!payload.password) {
      setCreateError('كلمة المرور مطلوبة');
      return;
    }
    setCreateSubmitting(true);
    try {
      await adminCreateUser(payload);
      showToast('تم إضافة المستخدم');
      setShowCreateForm(false);
      refresh();
    } catch (err) {
      setCreateError(err instanceof ApiException ? err.message : 'تعذّر إضافة المستخدم');
    } finally {
      setCreateSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="مدراء عامون" value={counts.super_admin} icon={ShieldIcon} tone="from-violet-500 to-violet-700" />
        <StatCard label="محررون" value={counts.editor} icon={StarIcon} tone="from-emerald-500 to-emerald-700" />
        <StatCard label="مشاهدون" value={counts.viewer} icon={EyeIcon} tone="from-sky-500 to-sky-700" />
      </div>

      <SectionCard
        title="المستخدمون"
        description={loading ? undefined : `${(accounts ?? []).length} حساب في Firebase`}
        action={
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <SearchBox value={search} onChange={setSearch} placeholder="ابحث بالاسم أو البريد…" />
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
            >
              <PlusIcon className="h-3.5 w-3.5" /> إضافة مستخدم
            </button>
          </div>
        }
      >
        {showCreateForm && (
          <form onSubmit={handleCreate} className="mb-6 grid gap-4 rounded-xl bg-sand/60 p-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>الاسم</label>
              <input name="name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>البريد الإلكتروني</label>
              <input name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>الدور</label>
              <select name="role" defaultValue="editor" className={inputClass}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>كلمة المرور</label>
              <input name="password" type="password" minLength={8} required className={inputClass} />
            </div>
            <ErrorText message={createError} />
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" disabled={createSubmitting} className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
                {createSubmitting ? 'جارٍ الحفظ…' : 'إضافة مستخدم'}
              </button>
              <button type="button" onClick={() => { setShowCreateForm(false); setCreateError(null); }} className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-bold hover:bg-white">إلغاء</button>
            </div>
          </form>
        )}

        {loadError && <ErrorText message={loadError} />}

        {loading ? (
          <p className="py-6 text-center text-sm text-ink/45">جارٍ التحميل…</p>
        ) : filtered.length === 0 ? (
          <EmptyState message={search ? 'لا توجد نتائج مطابقة.' : 'لا يوجد مستخدمون مسجّلون بعد.'} />
        ) : (
          <>
            {/* بطاقات للموبايل */}
            <div className="grid gap-3 sm:hidden">
              {filtered.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  locked={u.id === currentUserId || u.is_protected}
                  editing={editingRoleId === u.id}
                  submitting={roleSubmitting}
                  onToggleEdit={() => setEditingRoleId(editingRoleId === u.id ? null : u.id)}
                  onConfirmRole={(role) => handleRoleChange(u, role)}
                  onResetPassword={() => handleResetPassword(u.email)}
                  onRemove={() => handleRemove(u)}
                />
              ))}
            </div>

            {/* جدول للشاشات الأوسع */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-right text-xs font-bold text-ink/45">
                    <th className="py-2.5 pl-4">الاسم</th>
                    <th className="py-2.5 pl-4">البريد</th>
                    <th className="py-2.5 pl-4">طريقة الدخول</th>
                    <th className="py-2.5 pl-4">الدور</th>
                    <th className="py-2.5 pl-4">حالة البيانات</th>
                    <th className="py-2.5 pl-4">آخر دخول</th>
                    <th className="py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isSelf = u.id === currentUserId;
                    const locked = isSelf || u.is_protected;
                    return (
                      <Fragment key={u.id}>
                        <tr className="border-b border-ink/5 transition hover:bg-sand/30 last:border-0">
                          <td className="py-3 pl-4 font-bold">{u.name}</td>
                          <td className="py-3 pl-4 text-ink/60">{u.email}</td>
                          <td className="py-3 pl-4">
                            <Badge tone="neutral">{providerLabel[u.provider || ''] || u.provider || '—'}</Badge>
                          </td>
                          <td className="py-3 pl-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge tone={ROLE_TONE[u.role ?? 'viewer']}>{ROLE_LABELS[u.role ?? 'viewer']}</Badge>
                              {u.is_protected && (
                                <Badge tone="violet"><ShieldIcon className="ml-1 inline h-3 w-3" />محمي</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pl-4">
                            <Badge tone={u.profile_completed ? 'success' : 'warning'}>{u.profile_completed ? 'مكتمل' : 'غير مكتمل'}</Badge>
                          </td>
                          <td className="py-3 pl-4 text-ink/60">
                            {u.last_login_at ? new Date(u.last_login_at).toLocaleString('ar-EG') : '—'}
                          </td>
                          <td className="py-3">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingRoleId(editingRoleId === u.id ? null : u.id)}
                                disabled={locked}
                                className="rounded-lg p-2 text-ink/50 hover:bg-sand hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="تعديل الدور"
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                              {u.provider !== 'google' && (
                                <button onClick={() => handleResetPassword(u.email)} className="rounded-lg p-2 text-ink/50 hover:bg-sand hover:text-ink" aria-label="إعادة تعيين كلمة المرور">
                                  <KeyIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleRemove(u)}
                                disabled={locked}
                                className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="حذف نهائي"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {editingRoleId === u.id && (
                          <tr className="border-b border-ink/5 bg-sand/40 last:border-0">
                            <td colSpan={7} className="p-4">
                              <RoleInlineForm
                                user={u}
                                submitting={roleSubmitting}
                                onCancel={() => setEditingRoleId(null)}
                                onConfirm={(role) => handleRoleChange(u, role)}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}

function RoleInlineForm({
  user,
  submitting,
  onCancel,
  onConfirm,
}: {
  user: FirebaseAccountRow;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (role: AdminRole) => void;
}) {
  const [role, setRole] = useState<AdminRole>(user.role ?? 'viewer');

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-bold text-ink/80">دور {user.name}:</span>
      <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className={`${inputClass} w-auto`}>
        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
      <button
        onClick={() => onConfirm(role)}
        disabled={submitting}
        className="rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {submitting ? 'جارٍ الحفظ…' : 'حفظ الدور'}
      </button>
      <button onClick={onCancel} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-bold hover:bg-white">إلغاء</button>
    </div>
  );
}

function UserCard({
  user,
  locked,
  editing,
  submitting,
  onToggleEdit,
  onConfirmRole,
  onResetPassword,
  onRemove,
}: {
  user: FirebaseAccountRow;
  locked: boolean;
  editing: boolean;
  submitting: boolean;
  onToggleEdit: () => void;
  onConfirmRole: (role: AdminRole) => void;
  onResetPassword: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{user.name}</p>
          <p className="truncate text-xs text-ink/55">{user.email}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <Badge tone={ROLE_TONE[user.role ?? 'viewer']}>{ROLE_LABELS[user.role ?? 'viewer']}</Badge>
          {user.is_protected && <Badge tone="violet"><ShieldIcon className="ml-1 inline h-3 w-3" />محمي</Badge>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/50">
        <Badge tone="neutral">{providerLabel[user.provider || ''] || user.provider || '—'}</Badge>
        <Badge tone={user.profile_completed ? 'success' : 'warning'}>{user.profile_completed ? 'مكتمل' : 'غير مكتمل'}</Badge>
        <span>{user.last_login_at ? new Date(user.last_login_at).toLocaleString('ar-EG') : 'لم يسجّل دخول بعد'}</span>
      </div>

      {editing && (
        <div className="mt-3 rounded-lg bg-sand/60 p-3">
          <RoleInlineForm user={user} submitting={submitting} onCancel={onToggleEdit} onConfirm={onConfirmRole} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/10 pt-3">
        <button
          onClick={onToggleEdit}
          disabled={locked}
          className="flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-bold text-ink/70 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <EditIcon className="h-3.5 w-3.5" /> الدور
        </button>
        {user.provider !== 'google' && (
          <button onClick={onResetPassword} className="flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-bold text-ink/70">
            <KeyIcon className="h-3.5 w-3.5" /> كلمة المرور
          </button>
        )}
        <button
          onClick={onRemove}
          disabled={locked}
          className="flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <TrashIcon className="h-3.5 w-3.5" /> حذف نهائي
        </button>
      </div>
    </div>
  );
}
