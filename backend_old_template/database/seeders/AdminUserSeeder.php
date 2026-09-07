<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // بيانات دخول تجريبية للوحة التحكم — غيّرها فور أول تشغيل
        User::firstOrCreate(
            ['email' => 'admin@rowwad-borders.test'],
            [
                'name' => 'مدير رُوَّاد',
                'password' => Hash::make('ChangeMe123!'),
                'email_verified_at' => now(),
            ]
        );
    }
}
