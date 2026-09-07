<?php

namespace Database\Seeders;

use App\Models\GalleryImage;
use Illuminate\Database\Seeder;

class GalleryImageSeeder extends Seeder
{
    public function run(): void
    {
        // بدون صور حقيقية مبدئيًا: تُعرض بنمط art_theme التجريدي، ويمكن للأدمن رفع صور حقيقية لاحقًا.
        $images = [
            ['title' => 'ملتقى رُوَّاد الحدود السنوي', 'caption' => 'لقطة من ملتقانا السنوي للتنمية', 'art_theme' => 'art-1', 'order' => 1],
            ['title' => 'ورشة ريادة الأعمال', 'caption' => 'تدريب الشباب على ريادة الأعمال', 'art_theme' => 'art-2', 'order' => 2],
            ['title' => 'مشروع سياحي بالبحر الأحمر', 'caption' => 'أحد المشاريع السياحية المدعومة', 'art_theme' => 'art-3', 'order' => 3],
            ['title' => 'مبادرة تمكين المرأة', 'caption' => 'برامج تمكين المرأة في سيناء', 'art_theme' => 'art-4', 'order' => 4],
            ['title' => 'تطوير البنية التحتية', 'caption' => 'مشروعات تطوير الطرق في مطروح', 'art_theme' => 'art-1', 'order' => 5],
            ['title' => 'ملتقى الشباب المبدع', 'caption' => 'تجمّع الشباب المبدعين من المحافظات الحدودية', 'art_theme' => 'art-2', 'order' => 6],
            ['title' => 'مشروعات زراعية مستدامة', 'caption' => 'دعم المزارعين في الوادي الجديد', 'art_theme' => 'art-3', 'order' => 7],
            ['title' => 'حفل تخرج المتدربين', 'caption' => 'احتفال بتخريج دفعة جديدة من المتدربين', 'art_theme' => 'art-4', 'order' => 8],
        ];

        foreach ($images as $i) {
            GalleryImage::firstOrCreate(['title' => $i['title']], $i);
        }
    }
}
