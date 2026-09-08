/**
 * يستخرج تاريخ الميلاد من الرقم القومي المصري (١٤ رقمًا):
 * الرقم الأول = القرن (٢ = ١٩٠٠، ٣ = ٢٠٠٠)، والأرقام من الثاني للسابع = YYMMDD.
 * يرجّع null لو الرقم مش ١٤ خانة، أو القرن/الشهر/اليوم مش منطقيين، أو التاريخ
 * الناتج في المستقبل.
 */
export function getBirthDateFromNationalId(nationalId: string): Date | null {
  if (!/^\d{14}$/.test(nationalId)) return null;

  const century = nationalId[0] === '2' ? 1900 : nationalId[0] === '3' ? 2000 : null;
  if (century === null) return null;

  const year = century + parseInt(nationalId.slice(1, 3), 10);
  const month = parseInt(nationalId.slice(3, 5), 10);
  const day = parseInt(nationalId.slice(5, 7), 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  // Date تلقائيًا بيلفّ التواريخ الغير موجودة (زي ٣١ فبراير) للشهر اللي بعده —
  // نتأكد إن القيم رجعت زي ما دخلناها بالظبط، وإلا يبقى تاريخ وهمي
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  if (date.getTime() > Date.now()) return null;

  return date;
}

/** يحسب السن الحالي من الرقم القومي، أو null لو الرقم مش صالح */
export function getAgeFromNationalId(nationalId: string): number | null {
  const birthDate = getBirthDateFromNationalId(nationalId);
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hadBirthdayThisYear) age--;

  return age;
}
