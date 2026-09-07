<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            EventSeeder::class,
            ArticleSeeder::class,
            ProgramSeeder::class,
            GovernorateSeeder::class,
            SuccessStorySeeder::class,
            GalleryImageSeeder::class,
        ]);
    }
}
