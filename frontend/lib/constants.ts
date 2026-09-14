/** المحافظات العشر المستهدفة — مصدر موحّد يستخدمه نموذج الحجز، لوحة التحكم، وبروفايل الزائر */
export const GOVERNORATES = [
  'شمال سيناء',
  'جنوب سيناء',
  'أسوان',
  'الوادي الجديد',
  'مطروح',
  'البحر الأحمر',
  'السويس',
  'الإسماعيلية',
  'القاهرة الكبرى',
  'الشرقية',
];

export const EDUCATION_LEVELS = [
  'أقل من الثانوية',
  'ثانوية عامة / أزهرية',
  'دبلوم فني',
  'بكالوريوس / ليسانس',
  'دراسات عليا',
];

/** لجان الكيان الداخلية — نفس تصنيفات البرامج (لوحة التحكم وصفحة البرامج) */
export const COMMITTEES = ['التعليم', 'السياحة', 'التضامن', 'الزراعة', 'الإعلام', 'الصحة'];

/**
 * مناصب الهيكل الإداري — قائمة ثابتة بالكود (مش قابلة للتعديل من لوحة
 * التحكم زي تصنيفات الأخبار) لأن كل منصب له نطاق مختلف (بعضها مالوش محافظة
 * ولا لجنة، وبعضها لازم الاتنين) وده بيحدد منطق العرض في صفحة "الهيكل
 * الإداري" وفورم تعيين المنصب — تغييرها محتاج تعديل الكود مش الإعدادات.
 */
export const POSITION_ROLES = [
  { value: 'president', label: 'رئيس الكيان', scope: 'none' },
  { value: 'vice_president', label: 'نائب رئيس الكيان', scope: 'none' },
  { value: 'governorate_coordinator', label: 'منسق عام المحافظة', scope: 'governorate' },
  { value: 'committee_head', label: 'رئيس لجنة', scope: 'governorate_committee' },
  { value: 'committee_deputy', label: 'نائب لجنة', scope: 'governorate_committee' },
  { value: 'committee_member', label: 'عضو لجنة', scope: 'governorate_committee' },
] as const;

export type PositionRoleValue = (typeof POSITION_ROLES)[number]['value'];
export type PositionScope = (typeof POSITION_ROLES)[number]['scope'];

export const POSITION_ROLE_LABELS: Record<PositionRoleValue, string> = Object.fromEntries(
  POSITION_ROLES.map((r) => [r.value, r.label])
) as Record<PositionRoleValue, string>;

export const POSITION_ROLE_SCOPE: Record<PositionRoleValue, PositionScope> = Object.fromEntries(
  POSITION_ROLES.map((r) => [r.value, r.scope])
) as Record<PositionRoleValue, PositionScope>;
