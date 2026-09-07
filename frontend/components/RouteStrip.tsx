import { CompassIcon, FlagIcon, StarIcon, UsersIcon, PinIcon } from './icons';

const GOVS = [
  { name: 'مطروح', tag: 'الساحل الشمالي الغربي', Icon: PinIcon, note: 'ساحل متوسطي وواحة سيوة، سياحة وزراعة زيتون.' },
  { name: 'الوادي الجديد', tag: 'أكبر المحافظات مساحة', Icon: CompassIcon, note: 'الخارجة والداخلة، زراعة صحراوية وآثار.' },
  { name: 'شمال سيناء', tag: 'العريش ورفح والشيخ زويد', Icon: FlagIcon, note: 'إعادة إعمار وتنمية عمرانية متسارعة.' },
  { name: 'جنوب سيناء', tag: 'شرم الشيخ وسانت كاترين', Icon: StarIcon, note: 'سياحة عالمية وتراث جبلي وبدوي أصيل.' },
  { name: 'البحر الأحمر', tag: 'الغردقة والقصير ومرسى علم', Icon: UsersIcon, note: 'واجهة سياحية وثروة سمكية ومعدنية.' },
];

export default function RouteStrip() {
  return (
    <div className="route-inner flex flex-col items-stretch gap-6 md:flex-row md:items-start md:gap-0">
      {GOVS.map((g) => (
        <div key={g.name} className="route-node relative flex flex-1 items-center gap-4 text-right md:flex-col md:items-center md:gap-0 md:px-2 md:text-center" tabIndex={0}>
          <div className="z-[2] flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-2 border-gold-2 bg-night text-gold-2 transition-transform hover:scale-110 hover:bg-gold-2 hover:text-night">
            <g.Icon className="h-[17px] w-[17px]" />
          </div>
          <div className="md:mt-3">
            <div className="font-utility text-sm font-bold text-cream">{g.name}</div>
            <div className="mt-1 text-xs text-cream/60">{g.tag}</div>
            <div className="rn-note mt-1.5 text-xs leading-relaxed text-cream/75 md:mt-1.5">{g.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
