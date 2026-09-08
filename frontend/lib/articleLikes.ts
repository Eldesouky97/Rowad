// تتبّع المقالات اللي عمل الزائر عليها "إعجاب" من نفس المتصفح — تجربة مستخدم
// بحتة (منع الضغط المتكرر)، مش مصدر الحقيقة الفعلي (ده عداد articles/{id}/likes
// في قاعدة البيانات نفسها).
const KEY = 'rowwad-liked-articles';

function readLiked(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function hasLikedArticle(articleId: string): boolean {
  return readLiked().includes(articleId);
}

export function setArticleLiked(articleId: string, liked: boolean): void {
  if (typeof window === 'undefined') return;
  const current = readLiked();
  const next = liked ? Array.from(new Set([...current, articleId])) : current.filter((id) => id !== articleId);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // تجاهل — تجربة مستخدم بحتة
  }
}
