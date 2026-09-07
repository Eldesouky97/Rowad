<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    public function run(): void
    {
        $programs = [
            ['title' => 'تمكين تعليمي', 'category' => 'التعليم', 'order' => 1, 'art_theme' => 'art-1',
                'description' => 'برامج تدريبية ومنح تعليمية لرفع مهارات طلاب وشباب المحافظات الحدودية في التعليم التقني والرقمي.'],
            ['title' => 'السياحة المسؤولة', 'category' => 'السياحة', 'order' => 2, 'art_theme' => 'art-2',
                'description' => 'مبادرات لتطوير قطاع السياحة البيئية والمجتمعية بشكل يحافظ على البيئة ويدعم الاقتصاد المحلي.'],
            ['title' => 'التضامن المجتمعي', 'category' => 'التضامن', 'order' => 3, 'art_theme' => 'art-3',
                'description' => 'شبكات دعم اجتماعي وقوافل تضامنية تصل لأكثر الفئات احتياجًا في المناطق النائية.'],
            ['title' => 'الزراعة المستدامة', 'category' => 'الزراعة', 'order' => 4, 'art_theme' => 'art-4',
                'description' => 'دعم صغار المزارعين بتقنيات الزراعة الصحراوية والعضوية وربطهم بأسواق تصريف عادلة.'],
            ['title' => 'الإعلام المجتمعي', 'category' => 'الإعلام', 'order' => 5, 'art_theme' => 'art-1',
                'description' => 'تدريب شباب المحافظات على الإعلام الرقمي وسرد قصص مجتمعاتهم للرأي العام والمؤسسات.'],
            ['title' => 'الرعاية الصحية', 'category' => 'الصحة', 'order' => 6, 'art_theme' => 'art-2',
                'description' => 'قوافل طبية وبرامج توعية صحية بالتعاون مع جهات شريكة لخدمة المناطق الأقل تغطية.'],
        ];

        foreach ($programs as $p) {
            Program::firstOrCreate(['title' => $p['title']], $p);
        }
    }
}
