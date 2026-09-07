import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0F1B2E] px-5 pb-6 pt-14 text-cream/75 sm:px-6">
      <div className="mx-auto grid max-w-[1180px] gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/brand/logo.jpg"
              alt="شعار رُوَّاد المحافظات الحدودية"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-gold-2/50"
            />
            <span className="font-display">
              <b className="block text-lg font-bold text-gold-2">رُوَّاد</b>
              <span className="font-utility text-[10px] tracking-wider text-cream/70">
                المحافظات الحدودية
              </span>
            </span>
          </div>
          <p className="max-w-[32ch] text-sm text-cream/70">
            كيان شبابي أهلي يعمل على تمكين الشباب وتحقيق التنمية الشاملة في المحافظات المصرية.
          </p>
        </div>

        <div>
          <h5 className="mb-4 font-utility text-sm text-cream">الموقع</h5>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-gold-2">الرئيسية</Link></li>
            <li><Link href="/#about" className="hover:text-gold-2">من نحن</Link></li>
            <li><Link href="/#programs" className="hover:text-gold-2">برامجنا</Link></li>
            <li><Link href="/activities" className="hover:text-gold-2">الفعاليات</Link></li>
            <li><Link href="/news" className="hover:text-gold-2">المقالات</Link></li>
            <li><Link href="/#gallery" className="hover:text-gold-2">معرض الصور</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="mb-4 font-utility text-sm text-cream">المحافظات</h5>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <li>شمال سيناء</li>
            <li>جنوب سيناء</li>
            <li>أسوان</li>
            <li>الوادي الجديد</li>
            <li>مطروح</li>
            <li>البحر الأحمر</li>
            <li>السويس</li>
            <li>الإسماعيلية</li>
            <li>القاهرة الكبرى</li>
            <li>الشرقية</li>
          </ul>
        </div>

        <div>
          <h5 className="mb-4 font-utility text-sm text-cream">تواصل</h5>
          <ul className="space-y-2 text-sm">
            <li>info@rowwad-borders.example</li>
            <li>٠٢ ١٢٣٤ ٥٦٧٨</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-[1180px] flex-wrap justify-between gap-3 border-t border-gold/15 pt-6 text-xs">
        <span>© {new Date().getFullYear()} رُوَّاد المحافظات الحدودية. جميع الحقوق محفوظة.</span>
        <Link href="/admin/login" className="text-cream/50 hover:text-gold-2">
          دخول لوحة التحكم
        </Link>
      </div>
    </footer>
  );
}
