import type { SiteSettings } from './types';

export interface ShareArticleInput {
  title: string;
  excerpt: string;
  slug: string;
  category?: string;
  governorate?: string;
}

export interface SharePlatformLink {
  key: 'facebook' | 'twitter' | 'whatsapp' | 'linkedin';
  label: string;
  url: string;
}

function toHashtag(text?: string): string | null {
  if (!text) return null;
  const clean = text.trim().replace(/\s+/g, '_');
  return clean ? `#${clean}` : null;
}

/** نص منشور جاهز للمشاركة — عنوان + نبذة + رابط + وسوم مبنية من التصنيف والمحافظة */
export function buildArticleShareCaption(article: ShareArticleInput, pageUrl: string): string {
  const hashtags = ['#رواد_المحافظات_الحدودية', toHashtag(article.governorate), toHashtag(article.category)]
    .filter(Boolean)
    .join(' ');
  return `${article.title}\n\n${article.excerpt}\n\n🔗 ${pageUrl}\n\n${hashtags}`;
}

/** روابط مشاركة المقال لكل منصة سوشيال ميديا ليها رابط مضبوط فعليًا في إعدادات الموقع */
export function getArticleSharePlatforms(
  article: ShareArticleInput,
  settings: SiteSettings,
  pageUrl: string
): SharePlatformLink[] {
  const caption = buildArticleShareCaption(article, pageUrl);
  const hashtags = ['#رواد_المحافظات_الحدودية', toHashtag(article.governorate), toHashtag(article.category)]
    .filter(Boolean)
    .join(' ');
  const platforms: SharePlatformLink[] = [];
  if (settings.social_facebook) {
    platforms.push({ key: 'facebook', label: 'فيسبوك', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}` });
  }
  if (settings.social_twitter) {
    platforms.push({
      key: 'twitter',
      label: 'إكس (تويتر)',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${article.title}\n\n${hashtags}`)}&url=${encodeURIComponent(pageUrl)}`,
    });
  }
  if (settings.social_whatsapp) {
    platforms.push({ key: 'whatsapp', label: 'واتساب', url: `https://wa.me/?text=${encodeURIComponent(caption)}` });
  }
  if (settings.social_linkedin) {
    platforms.push({ key: 'linkedin', label: 'لينكدإن', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}` });
  }
  return platforms;
}

export function openSharePopup(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=520');
}

// ملاحظة مهمة: المتصفحات (خصوصًا Safari/Firefox) بتسمح بنافذة منبثقة واحدة
// موثوقة لكل ضغطة زر فعلية من المستخدم، وممكن تمنع أي نوافذ إضافية تتفتح في
// نفس اللحظة برمجيًا حتى لو جوه نفس معالج الحدث — فـ"التلقائي" هنا أفضل مجهود
// (best-effort) مش ضمان 100%، ولذلك بنسيب نافذة المشاركة اليدوية موجودة دايمًا
// كبديل أكيد لو المتصفح منع الفتح التلقائي.
export function autoOpenSharePopups(platforms: SharePlatformLink[]): void {
  for (const platform of platforms) {
    openSharePopup(platform.url);
  }
}
