const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-2xl',
};

/**
 * دائرة صورة الحساب — تعرض الصورة لو موجودة، وإلا أول حرف من الاسم/البريد.
 * <img> عادية مش next/image عشان مصدر الصورة خارجي (R2 أو صورة بروفايل جوجل)
 * وغير مضاف لـ remotePatterns في next.config.js — نفس الأسلوب المتّبع في
 * GalleryManager لصور R2.
 */
export default function UserAvatar({
  src,
  name,
  size = 'md',
}: {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const initial = (name || '؟').trim().charAt(0).toUpperCase();
  const sizeClass = SIZE_CLASSES[size];

  if (src) {
    return (
      <span className={`block shrink-0 overflow-hidden rounded-full ring-2 ring-gold-2/50 ${sizeClass}`}>
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-violet-100 font-display font-bold text-violet-700 ${sizeClass}`}
    >
      {initial}
    </span>
  );
}
