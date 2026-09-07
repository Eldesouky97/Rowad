<?php

namespace Database\Seeders;

use App\Models\SuccessStory;
use Illuminate\Database\Seeder;

class SuccessStorySeeder extends Seeder
{
    public function run(): void
    {
        $stories = [
            ['name' => 'أحمد خالد', 'role_title' => 'رائد أعمال من مطروح', 'governorate' => 'مطروح', 'order' => 1,
                'quote' => 'بفضل دعم رُوَّاد، استطعت إطلاق مشروعي الخاص في مجال السياحة البيئية. التدريب والدعم المتواصل كانا العامل الرئيسي في نجاحي.'],
            ['name' => 'سارة محمود', 'role_title' => 'مصممة من جنوب سيناء', 'governorate' => 'جنوب سيناء', 'order' => 2,
                'quote' => 'البرامج التدريبية والمبادرات التي تقدمها رُوَّاد ساهمت في تطوير مهاراتي وفتحت آفاقًا جديدة لمسيرتي المهنية.'],
            ['name' => 'محمد إبراهيم', 'role_title' => 'مطوّر من الوادي الجديد', 'governorate' => 'الوادي الجديد', 'order' => 3,
                'quote' => 'منصة رائعة تقدّم دعمًا حقيقيًا لشباب المحافظات الحدودية. ساهمت في ربطي بشركاء ومستثمرين محتملين.'],
        ];

        foreach ($stories as $s) {
            SuccessStory::firstOrCreate(['name' => $s['name'], 'role_title' => $s['role_title']], $s);
        }
    }
}
