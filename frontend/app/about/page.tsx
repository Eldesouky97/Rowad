import Reveal from '@/components/Reveal';
import { SparkIcon, HandsIcon, FlagIcon, BookIcon, LinkIcon, UsersIcon, CompassIcon, StarIcon, PinIcon } from '@/components/icons';

const GOALS = [
  { Icon: SparkIcon, title: 'بناء القدرات', desc: 'برامج تدريبية في القيادة وريادة الأعمال ومهارات المستقبل لشباب المحافظات التي نعمل بها.' },
  { Icon: HandsIcon, title: 'دعم المبادرات المحلية', desc: 'تمويل أولي واحتضان لمشروعات شبابية تنبع من احتياجات كل محافظة.' },
  { Icon: FlagIcon, title: 'تعزيز الانتماء الوطني', desc: 'برامج تبرز الدور الوطني للمحافظات الحدودية وتقرّبها من باقي محافظات مصر.' },
  { Icon: BookIcon, title: 'توثيق قصص النجاح', desc: 'رصد ونشر تجارب شباب الحدود عبر البوابة الإخبارية ووسائل التواصل.' },
  { Icon: LinkIcon, title: 'الربط بصنّاع القرار', desc: 'جسر بين شباب الحدود والجهات الحكومية والمانحين وشركاء التنمية.' },
  { Icon: UsersIcon, title: 'بناء مجتمع متطوعين', desc: 'شبكة متطوعين نشطة في كل محافظة تقود الأنشطة وتستدام محليًا.' },
];

const GOVS = [
  { name: 'مطروح', Icon: PinIcon, color: '#0E5C63', desc: 'من سيدي براني إلى السلوم، تجمع مطروح بين شواطئ متوسطية بكر وواحة سيوة التاريخية، وتُعد من أبرز مقاصد السياحة البيئية في مصر.', focus: ['سياحة بيئية', 'زراعة صحراوية', 'حرف يدوية'] },
  { name: 'الوادي الجديد', Icon: CompassIcon, color: '#9C4A2E', desc: 'تمتد على نحو ربع مساحة مصر، وتضم واحات الخارجة والداخلة والفرافرة، وتُعوّل عليها الدولة في مشروعات الاستصلاح الزراعي الكبرى.', focus: ['استصلاح زراعي', 'سياحة صحراوية', 'طاقة شمسية'] },
  { name: 'شمال سيناء', Icon: FlagIcon, color: '#2A3F62', desc: 'تشهد نقلة تنموية وعمرانية كبرى، ويعمل رُوَّاد فيها على برامج التمكين الاقتصادي للشباب ودعم الأسر المتضررة من سنوات سابقة.', focus: ['تمكين اقتصادي', 'إعادة إعمار', 'زراعة'] },
  { name: 'جنوب سيناء', Icon: StarIcon, color: '#C79A45', desc: 'موطن محمية سانت كاترين وشرم الشيخ، وتجمع بين السياحة العالمية والتراث البدوي، وتُعد نموذجًا للتنمية السياحية المستدامة.', focus: ['سياحة مستدامة', 'تراث بدوي', 'غوص وبيئة بحرية'] },
  { name: 'البحر الأحمر', Icon: UsersIcon, color: '#0a4b52', desc: 'من الغردقة إلى مرسى علم، شريط ساحلي يجمع بين السياحة الدولية والثروة السمكية، ويحتضن عددًا من أنشط فرق رُوَّاد التطوعية.', focus: ['سياحة غوص', 'ثروة سمكية', 'ريادة أعمال سياحية'] },
];

const TIMELINE = [
  { year: '٢٠٢١', title: 'الانطلاقة', text: 'مجموعة من شباب المحافظات الحدودية يبدأون مبادرة تطوعية صغيرة لدعم أقرانهم في التقديم للجامعات والمنح.' },
  { year: '٢٠٢٣', title: 'التوسع إلى خمس محافظات', text: 'انضمام فرق تطوعية من جنوب سيناء والبحر الأحمر، وتأسيس أول برنامج تدريبي موحّد لريادة الأعمال.' },
  { year: '٢٠٢٤', title: 'شراكات مؤسسية', text: 'توقيع بروتوكولات تعاون مع جهات حكومية وأهلية لدعم مبادرات الشباب الممولة محليًا.' },
  { year: '٢٠٢٦', title: 'إطلاق المنصة الرقمية', text: 'إطلاق هذه المنصة كبوابة موحّدة للتعريف بالكيان، وحجز الفعاليات، ونشر أخبار ومقالات شباب الحدود.' },
];

export const metadata = { title: 'من نحن — رُوَّاد المحافظات الحدودية' };

export default function AboutPage() {
  return (
    <>
      <section className="bg-night pb-14 pt-16 text-cream">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-gold-2">
            <span className="h-0.5 w-6 bg-gold-2" /> من نحن
          </p>
          <h1 className="max-w-[20ch] font-display text-3xl sm:text-4xl">
            كيان شبابي أهلي وُلد من رحم الحدود
          </h1>
          <p className="mt-5 max-w-[62ch] text-lg opacity-80">
            &quot;رُوَّاد المحافظات الحدودية&quot; مبادرة شبابية مستقلة تجمع شباب المحافظات المصرية
            تحت مظلة واحدة تعمل على تنمية القدرات، ودعم المشروعات الصغيرة، وتوثيق الحكاية
            الحقيقية لهذه المحافظات بعيدًا عن الصورة النمطية.
          </p>
        </div>
      </section>

      <section className="bg-sand py-16">
        <Reveal className="mx-auto grid max-w-[1180px] gap-6 px-5 sm:px-6 md:grid-cols-2">
          <div className="rounded-[20px] bg-sea p-8 text-white">
            <h3 className="mb-3 font-utility text-lg">رسالتنا</h3>
            <p className="opacity-90">
              تمكين شباب المحافظات المصرية من خلال برامج تدريبية وتطوعية وريادية،
              ودمجهم في مسار صناعة القرار المحلي والوطني.
            </p>
          </div>
          <div className="rounded-[20px] bg-night p-8 text-cream">
            <h3 className="mb-3 font-utility text-lg text-gold-2">رؤيتنا</h3>
            <p className="opacity-90">
              أن تكون المحافظات الحدودية نموذجًا وطنيًا رائدًا في التنمية بقيادة شبابها، وأن يتحوّل
              مفهوم &quot;الحدود&quot; من عزلة إلى بوابة.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> أهدافنا
            </p>
            <h2 className="font-display text-3xl">محاور نعمل عليها</h2>
          </Reveal>
          <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GOALS.map((g) => (
              <div key={g.title} className="flex gap-4 rounded-2xl border border-gold/25 bg-white p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand-2 text-rust">
                  <g.Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="mb-1 font-display text-base">{g.title}</h4>
                  <p className="text-sm opacity-78">{g.desc}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="bg-sand py-16">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-8">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> قيمنا
            </p>
            <h2 className="font-display text-3xl">ما الذي يوجّه عملنا</h2>
          </Reveal>
          <Reveal className="flex flex-wrap gap-3">
            {['الانتماء', 'الشراكة لا الوصاية', 'الشفافية', 'الاستدامة', 'الإنصات لأهل الأرض'].map((v) => (
              <span key={v} className="rounded-full bg-sand-2 px-5 py-2.5 font-utility text-sm font-bold">
                {v}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> خط الحدود
            </p>
            <h2 className="font-display text-3xl">أبرز المحافظات التي نعمل بها</h2>
            <p className="mt-3 opacity-85">
              من ساحل البحر المتوسط غربًا إلى شبه جزيرة سيناء شرقًا، مرورًا بواحات الوادي الجديد
              وسواحل البحر الأحمر — وتتوسع مظلة عملنا تباعًا لتشمل محافظات مصرية أخرى (راجع
              قسم المحافظات في الصفحة الرئيسية للقائمة الكاملة).
            </p>
          </Reveal>
          <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GOVS.map((g) => (
              <div key={g.name} className="overflow-hidden rounded-[18px] border border-gold/25 bg-white">
                <div className="flex items-center gap-2.5 px-6 py-5 text-white" style={{ background: g.color }}>
                  <g.Icon className="h-5 w-5" />
                  <h4 className="font-display text-base text-white">{g.name}</h4>
                </div>
                <div className="p-6">
                  <p className="text-sm opacity-82">{g.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.focus.map((f) => (
                      <span key={f} className="rounded-full bg-sand-2 px-2.5 py-1 font-utility text-[11px]">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="bg-sand py-20">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <Reveal className="mb-10 max-w-[640px]">
            <p className="mb-3 flex items-center gap-2 font-utility text-sm font-bold text-rust">
              <span className="h-0.5 w-6 bg-rust" /> مسيرتنا
            </p>
            <h2 className="font-display text-3xl">محطات في طريق رُوَّاد</h2>
          </Reveal>
          <Reveal className="flex flex-col gap-8 border-r-2 border-dashed border-gold/30 pr-7">
            {TIMELINE.map((t) => (
              <div key={t.year} className="relative">
                <span className="absolute -right-[2.35rem] top-1.5 h-3.5 w-3.5 rounded-full border-[3px] border-cream bg-gold shadow-[0_0_0_2px_#C4B5FD]" />
                <span className="font-utility text-sm font-extrabold text-rust">{t.year}</span>
                <h4 className="mb-1.5 mt-1 font-display text-lg">{t.title}</h4>
                <p className="max-w-[52ch] text-sm opacity-78">{t.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
