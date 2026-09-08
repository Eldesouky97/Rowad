/**
 * حقول مشتركة لكل محتوى قابل للنشر: مين الأدمن اللي نشره فعليًا (created_by_*
 * — يتسجّل تلقائيًا، بيظهر بلوحة التحكم بس وليس للجمهور)، "اسم الكاتب" (author
 * — اختياري، الأدمن بيكتبه بنفسه ليظهر للجمهور، مش بالضرورة نفس اسم الأدمن)،
 * و pending_review — true لو المحرر (editor) هو اللي أنشأ/عدّل العنصر: بيتحفظ
 * تلقائيًا is_published=false لحد ما سوبر أدمن يراجعه وينشره من قسم "بانتظار
 * المراجعة" (القيد ده مفروض على مستوى database.rules.json نفسها، مش بس الواجهة).
 */
export interface Publishable {
  created_by_uid?: string;
  created_by_name?: string;
  author?: string;
  pending_review?: boolean;
}

export interface EventItem extends Publishable {
  id: string;
  title: string;
  slug: string;
  category: string;
  governorate: string;
  location: string;
  mode: 'حضوري' | 'أونلاين' | 'هجين';
  starts_at: string;
  ends_at: string | null;
  description: string;
  seats_total: number;
  seats_taken: number;
  seats_remaining: number;
  price: string | null;
  organizer: string | null;
  status: 'upcoming' | 'past';
  art_theme: 'art-1' | 'art-2' | 'art-3' | 'art-4';
  storage_path?: string | null;
  image_url?: string | null;
  is_published: boolean;
}

export interface EventItemPayload {
  title: string;
  category: string;
  governorate: string;
  location: string;
  mode?: EventItem['mode'];
  starts_at: string;
  ends_at?: string;
  description: string;
  seats_total: number;
  price?: string;
  organizer?: string;
  art_theme?: EventItem['art_theme'];
  is_published?: boolean;
}

export interface Booking {
  id: string;
  event_id: string;
  confirmation_code: string;
  full_name: string;
  phone: string;
  email: string;
  governorate: string | null;
  notes: string | null;
  user_id: string;
  created_at: string;
}

export interface Article extends Publishable {
  id: string;
  title: string;
  slug: string;
  category: string;
  governorate: string;
  author: string;
  excerpt: string;
  content: string;
  tags: string[] | null;
  read_minutes: number;
  views: number;
  likes: number;
  is_featured: boolean;
  art_theme: 'art-1' | 'art-2' | 'art-3' | 'art-4';
  storage_path?: string | null;
  image_url?: string | null;
  published_at: string;
  is_published: boolean;
}

export interface Program extends Publishable {
  id: string;
  title: string;
  category: 'التعليم' | 'السياحة' | 'التضامن' | 'الزراعة' | 'الإعلام' | 'الصحة';
  description: string;
  art_theme: 'art-1' | 'art-2' | 'art-3' | 'art-4';
  order: number;
  is_published: boolean;
}

export interface Governorate extends Publishable {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  population: string;
  projects_completed: number;
  completion_percentage: number;
  art_theme: 'art-1' | 'art-2' | 'art-3' | 'art-4';
  storage_path?: string | null;
  image_url?: string | null;
  order: number;
  is_published: boolean;
}

export interface SuccessStory extends Publishable {
  id: string;
  slug: string;
  name: string;
  role_title: string;
  governorate: string | null;
  /** اقتباس قصير يظهر في الكارت */
  quote: string;
  /** القصة كاملة (HTML من محرر التنسيق الغني) — تظهر في صفحة القصة المستقلة، اختياري */
  full_story?: string | null;
  storage_path: string | null;
  image_url: string | null;
  order: number;
  is_published: boolean;
}

export interface GalleryAlbum extends Publishable {
  id: string;
  title: string;
  description: string | null;
  order: number;
  is_published: boolean;
  created_at: string;
}

export interface GalleryImage extends Publishable {
  id: string;
  title: string;
  caption: string | null;
  album_id: string | null;
  art_theme: 'art-1' | 'art-2' | 'art-3' | 'art-4';
  storage_path: string | null;
  image_url: string | null;
  order: number;
  is_published: boolean;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  governorate?: string;
  message: string;
}

export type AdminRole = 'super_admin' | 'editor' | 'viewer';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

/** صف حساب واحد زي ما بيرجعه /api/admin/list-users — كل حساب موجود فعليًا في
 * Firebase Authentication (مش بس اللي كتب سجل site_users). */
export interface FirebaseAccountRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole | null;
  provider: string | null;
  /** true لو الزائر ملأ نموذج إكمال البيانات الإجباري — وإلا الحساب "غير مكتمل" */
  profile_completed: boolean;
  has_site_user_record: boolean;
  created_at: string | null;
  last_login_at: string | null;
  is_protected: boolean;
}

export interface AdminUserPayload {
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
}

export interface SiteUser {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  photo_url?: string;
  national_id?: string;
  governorate?: string;
  address?: string;
  age?: number;
  education?: string;
  /** اللجنة داخل الكيان — نفس تصنيفات البرامج */
  committee?: string;
  /** true بعد ما يملأ الزائر نموذج إكمال البيانات الإجباري أول مرة */
  profile_completed?: boolean;
  provider?: string;
  created_at?: string;
  last_login_at?: string;
}

export interface VisitorProfilePayload {
  name?: string;
  phone?: string;
  national_id?: string;
  governorate?: string;
  address?: string;
  age?: number;
  education?: string;
  committee?: string;
}

/** أقسام الصفحة الرئيسية اللي ممكن السوبر أدمن يخفيها/يظهرها من إعدادات الموقع */
export interface SectionsVisibility {
  about?: boolean;
  programs?: boolean;
  articles?: boolean;
  events?: boolean;
  testimonials?: boolean;
  gallery?: boolean;
  governorates?: boolean;
  contact?: boolean;
}

/**
 * إعدادات الموقع العامة — سجل واحد (singleton) تحت site_settings/ في قاعدة
 * البيانات، مش مجموعة. يقرأه أي زائر (الفوتر وصفحة التواصل ونظهار/إخفاء
 * أقسام الصفحة الرئيسية)، ويعدّله السوبر أدمن بس من قسم "إعدادات الموقع".
 */
export interface SiteSettings {
  /** اسم الكيان — يظهر بجانب الشعار في الهيدر والفوتر وعنوان المتصفح */
  site_name?: string;
  /** الوصف الفرعي تحت الاسم (مثال: "المحافظات الحدودية") */
  site_tagline?: string;
  /** نبذة مختصرة عن الكيان — تظهر في الفوتر وعنوان المتصفح الوصفي */
  site_description?: string;
  logo_storage_path?: string | null;
  logo_url?: string | null;
  /** نصوص قسم "من نحن" في الصفحة الرئيسية — فراغ = يظهر النص الافتراضي المدمج بالكود */
  about_text?: string;
  vision_text?: string;
  mission_text?: string;
  /** القيم/الشعارات القصيرة المعروضة كوسوم أسفل قسم "من نحن" */
  values?: string[];
  /** الأرقام الإحصائية في قسم "من نحن" بالصفحة الرئيسية */
  stat_beneficiaries?: number;
  stat_projects?: number;
  stat_governorates?: number;
  stat_satisfaction?: number;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_twitter?: string;
  social_youtube?: string;
  social_whatsapp?: string;
  social_linkedin?: string;
  social_tiktok?: string;
  sections_visibility?: SectionsVisibility;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
