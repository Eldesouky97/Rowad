// ملاحظة: هذا الملف يُستخدم من Server Components (صفحات المقال وقصة النجاح)
// اللي بتُنفَّذ على السيرفر — sanitize-html بديل خفيف (بدون jsdom) لـ
// isomorphic-dompurify، أوثق وأخف جوه بيئات serverless.
import sanitizeHtml from 'sanitize-html';

// محتوى جديد بيتكتب بمحرر تنسيق غني (HTML)، ومحتوى قديم كان نص خام بفواصل
// سطرين بين الفقرات — بنفرّق بينهم بوجود أي وسم HTML من عدمه، عشان المحتوى
// القديم يفضل يتعرض صح من غير ما يحتاج ترحيل بيانات.
const HTML_TAG_RE = /<([a-z][\w-]*)\b[^>]*>/i;
export function isHtmlContent(content: string): boolean {
  return HTML_TAG_RE.test(content);
}

// محدودة صراحة بنفس الوسوم اللي محرر التنسيق (RichTextEditor) بيقدر ينتجها —
// أي وسم/سمة تانية بتتشال تلقائيًا، منعًا لحقن HTML/سكريبت.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'h2', 'h3', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'a', 'br', 'hr'],
  allowedAttributes: { a: ['href', 'rel', 'target'] },
  allowedSchemes: ['http', 'https', 'mailto'],
};

export function sanitizeRichContent(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}
