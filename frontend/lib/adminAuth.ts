import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from './firebase';
import type { AdminUser } from './types';

/**
 * يراقب حالة تسجيل الدخول ويستدعي callback بكائن AdminUser (أو null لو غير
 * مسجّل دخول أو الحساب مش موجود في /admins). يحل محل تخزين التوكن اليدوي في
 * localStorage القديم — Firebase Auth يدير الجلسة بنفسه.
 */
export function onAdminAuthChange(callback: (user: AdminUser | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    try {
      const snap = await get(ref(db, `admins/${firebaseUser.uid}`));
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: firebaseUser.uid, ...snap.val() } as AdminUser);
    } catch {
      callback(null);
    }
  });
}
