<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->json('tags')->nullable()->after('content');
            $table->unsignedInteger('read_minutes')->default(5)->after('tags');
            $table->unsignedInteger('views')->default(0)->after('read_minutes');
            $table->unsignedInteger('likes')->default(0)->after('views');
            $table->boolean('is_featured')->default(false)->after('likes');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['tags', 'read_minutes', 'views', 'likes', 'is_featured']);
        });
    }
};
