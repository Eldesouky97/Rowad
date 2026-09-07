<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('category');           // مؤتمر / ورشة عمل / معسكر تطوعي / قافلة تنموية / منتدى / برنامج تدريبي
            $table->string('governorate');         // مطروح / الوادي الجديد / شمال سيناء / جنوب سيناء / البحر الأحمر / عام
            $table->string('location');
            $table->dateTime('starts_at');
            $table->text('description');
            $table->unsignedInteger('seats_total');
            $table->unsignedInteger('seats_taken')->default(0);
            $table->string('art_theme')->default('art-1'); // معرّف لون/تصميم البطاقة في الواجهة
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
