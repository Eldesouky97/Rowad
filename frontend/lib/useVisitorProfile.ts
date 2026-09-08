'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { onVisitorAuthChange } from './api';
import type { SiteUser } from './types';

export interface VisitorProfileState {
  /** كائن Firebase Auth الخام (null لو مفيش تسجيل دخول) */
  authUser: User | null;
  /** بروفايل الزائر من /site_users (بيتحدّث لحظيًا مع أي تعديل، هنا أو من تبويب تاني) */
  profile: SiteUser | null;
  /** هل نفس المستخدم موجود في /admins */
  isAdmin: boolean;
  /** أول تحميل لحالة تسجيل الدخول لسه شغّال */
  loading: boolean;
  /** وصل أول رد من /site_users بالفعل (فرّق بين "لسه بيتحمّل" و"وصل ومفيش بيانات") */
  profileLoaded: boolean;
  /** أفضل اسم متاح للعرض: بروفايل الموقع، وإلا اسم Firebase، وإلا البريد */
  displayName: string;
  /** أفضل صورة متاحة: صورة مرفوعة يدويًا، وإلا صورة مزوّد الدخول (جوجل مثلًا) */
  photoUrl: string | null;
}

/**
 * Hook موحّد لحالة تسجيل دخول الزائر + بروفايله — يُستخدم في Header وFooter
 * وصفحة البروفايل حتى تتزامن الثلاثة لحظيًا (تغيير الاسم/الصورة في صفحة
 * البروفايل ينعكس فورًا في الهيدر من غير إعادة تحميل) بدل ما كل مكوّن يعمل
 * اشتراكه الخاص المنفصل بنفس البيانات.
 */
export function useVisitorProfile(): VisitorProfileState {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SiteUser | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onVisitorAuthChange((user) => {
      setAuthUser(user);
      setLoading(false);
      if (!user) {
        setProfile(null);
        setProfileLoaded(false);
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const unsubProfile = onValue(ref(db, `site_users/${authUser.uid}`), (snap) => {
      setProfile(snap.exists() ? ({ id: authUser.uid, ...snap.val() } as SiteUser) : null);
      setProfileLoaded(true);
    });
    const unsubAdmin = onValue(ref(db, `admins/${authUser.uid}`), (snap) => {
      setIsAdmin(snap.exists());
    });
    return () => {
      unsubProfile();
      unsubAdmin();
    };
  }, [authUser]);

  const displayName = profile?.name || authUser?.displayName || authUser?.email || 'حسابي';
  const photoUrl = profile?.photo_url || authUser?.photoURL || null;

  return { authUser, profile, profileLoaded, isAdmin, loading, displayName, photoUrl };
}
