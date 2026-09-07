<?php

namespace Database\Seeders;

use App\Models\Event;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        // ملاحظة: Str::slug() لا يحوّل الحروف العربية تلقائيًا، لذا نحدد
        // slug إنجليزي صريح لكل فعالية بدل توليده من العنوان العربي.
        $events = [
            ['slug' => 'rowwad-annual-forum-2026', 'title' => 'ملتقى رُوَّاد الحدود السنوي ٢٠٢٦', 'category' => 'مؤتمر', 'governorate' => 'مطروح', 'location' => 'مرسى مطروح', 'starts_at' => '2026-10-15 10:00:00', 'description' => 'الملتقى الأكبر الذي يجمع شباب المحافظات الحدودية الخمس لعرض إنجازات العام وإطلاق برامج جديدة.', 'seats_total' => 300, 'seats_taken' => 206, 'art_theme' => 'art-1'],
            ['slug' => 'idea-to-project-workshop', 'title' => 'ورشة "من الفكرة إلى المشروع"', 'category' => 'ورشة عمل', 'governorate' => 'الوادي الجديد', 'location' => 'مدينة الخارجة', 'starts_at' => '2026-09-20 11:00:00', 'description' => 'ورشة عملية مكثفة لتحويل الأفكار الريادية إلى نماذج عمل قابلة للتنفيذ والتمويل.', 'seats_total' => 60, 'seats_taken' => 41, 'art_theme' => 'art-2'],
            ['slug' => 'saint-catherine-volunteer-camp', 'title' => 'معسكر تطوعي بسانت كاترين', 'category' => 'معسكر تطوعي', 'governorate' => 'جنوب سيناء', 'location' => 'سانت كاترين', 'starts_at' => '2026-11-05 09:00:00', 'description' => 'معسكر تطوعي لدعم القرى السياحية المحيطة بمحمية سانت كاترين وترميم مسارات السياحة البيئية.', 'seats_total' => 80, 'seats_taken' => 52, 'art_theme' => 'art-3'],
            ['slug' => 'arish-development-caravan', 'title' => 'قافلة "رُوَّاد العريش" التنموية', 'category' => 'قافلة تنموية', 'governorate' => 'شمال سيناء', 'location' => 'العريش', 'starts_at' => '2026-12-02 09:00:00', 'description' => 'قافلة طبية وتوعوية وتدريبية تجوب أحياء العريش بالتعاون مع جهات محلية شريكة.', 'seats_total' => 120, 'seats_taken' => 70, 'art_theme' => 'art-4'],
            ['slug' => 'red-sea-youth-forum', 'title' => 'منتدى شباب البحر الأحمر', 'category' => 'منتدى', 'governorate' => 'البحر الأحمر', 'location' => 'الغردقة', 'starts_at' => '2026-06-10 17:00:00', 'description' => 'منتدى حواري ناقش فرص العمل في قطاع السياحة الغوصية والثروة السمكية.', 'seats_total' => 150, 'seats_taken' => 150, 'art_theme' => 'art-1'],
            ['slug' => 'border-leaders-training-program', 'title' => 'برنامج "قادة الحدود" التدريبي', 'category' => 'برنامج تدريبي', 'governorate' => 'عام', 'location' => 'القاهرة (تدريب مركزي)', 'starts_at' => '2026-07-18 09:00:00', 'description' => 'برنامج تدريبي مكثف لمدة أسبوع في القيادة المجتمعية لممثلين من المحافظات الخمس.', 'seats_total' => 40, 'seats_taken' => 40, 'art_theme' => 'art-3'],
        ];

        foreach ($events as $e) {
            Event::firstOrCreate(['slug' => $e['slug']], $e);
        }
    }
}
