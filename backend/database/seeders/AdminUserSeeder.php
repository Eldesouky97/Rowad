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
        $accounts = [
            ['email' => 'admin@rowwad-borders.test', 'name' => 'مدير رُوَّاد', 'password' => 'ChangeMe123!', 'role' => 'super_admin'],
            ['email' => 'editor@rowwad-borders.test', 'name' => 'محرر رُوَّاد', 'password' => 'ChangeMe123!', 'role' => 'editor'],
            ['email' => 'viewer@rowwad-borders.test', 'name' => 'مشاهد رُوَّاد', 'password' => 'ChangeMe123!', 'role' => 'viewer'],
        ];

        foreach ($accounts as $a) {
            User::updateOrCreate(
                ['email' => $a['email']],
                [
                    'name' => $a['name'],
                    'password' => Hash::make($a['password']),
                    'role' => $a['role'],
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
