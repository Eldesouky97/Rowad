<?php

namespace Database\Seeders;

use App\Models\Governorate;
use Illuminate\Database\Seeder;

class GovernorateSeeder extends Seeder
{
    public function run(): void
    {
        // ملاحظة: أرقام توضيحية تقريبية (بيانات تجريبية) وليست إحصائية رسمية.
        $governorates = [
            ['slug' => 'north-sinai', 'name' => 'شمال سيناء', 'tagline' => 'شبه جزيرة سيناء الشمالية', 'population' => '450,000', 'projects_completed' => 41, 'completion_percentage' => 68, 'order' => 1, 'art_theme' => 'art-1'],
            ['slug' => 'south-sinai', 'name' => 'جنوب سيناء', 'tagline' => 'شبه جزيرة سيناء الجنوبية', 'population' => '150,000', 'projects_completed' => 36, 'completion_percentage' => 74, 'order' => 2, 'art_theme' => 'art-2'],
            ['slug' => 'aswan', 'name' => 'أسوان', 'tagline' => 'جنوب صعيد مصر', 'population' => '1.5 مليون', 'projects_completed' => 44, 'completion_percentage' => 71, 'order' => 3, 'art_theme' => 'art-3'],
            ['slug' => 'new-valley', 'name' => 'الوادي الجديد', 'tagline' => 'صعيد مصر الغربي', 'population' => '220,000', 'projects_completed' => 38, 'completion_percentage' => 65, 'order' => 4, 'art_theme' => 'art-4'],
            ['slug' => 'matrouh', 'name' => 'مطروح', 'tagline' => 'ساحل البحر المتوسط الشمالي', 'population' => '450,000', 'projects_completed' => 45, 'completion_percentage' => 70, 'order' => 5, 'art_theme' => 'art-1'],
            ['slug' => 'red-sea', 'name' => 'البحر الأحمر', 'tagline' => 'ساحل البحر الأحمر', 'population' => '350,000', 'projects_completed' => 52, 'completion_percentage' => 77, 'order' => 6, 'art_theme' => 'art-2'],
            ['slug' => 'suez', 'name' => 'السويس', 'tagline' => 'بوابة قناة السويس', 'population' => '750,000', 'projects_completed' => 30, 'completion_percentage' => 60, 'order' => 7, 'art_theme' => 'art-3'],
            ['slug' => 'ismailia', 'name' => 'الإسماعيلية', 'tagline' => 'قلب منطقة القناة', 'population' => '1.4 مليون', 'projects_completed' => 33, 'completion_percentage' => 62, 'order' => 8, 'art_theme' => 'art-4'],
            ['slug' => 'greater-cairo', 'name' => 'القاهرة الكبرى', 'tagline' => 'العاصمة ومركز الثقل السكاني', 'population' => '10 مليون', 'projects_completed' => 60, 'completion_percentage' => 55, 'order' => 9, 'art_theme' => 'art-1'],
            ['slug' => 'sharqia', 'name' => 'الشرقية', 'tagline' => 'شرق الدلتا الزراعي', 'population' => '7.5 مليون', 'projects_completed' => 48, 'completion_percentage' => 58, 'order' => 10, 'art_theme' => 'art-2'],
        ];

        foreach ($governorates as $g) {
            Governorate::firstOrCreate(['slug' => $g['slug']], $g);
        }
    }
}
