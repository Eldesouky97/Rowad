<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('mode')->default('حضوري')->after('location'); // حضوري / أونلاين / هجين
            $table->string('price')->nullable()->after('seats_taken');   // نص حر: "مجاني" أو "٥٠ جنيه"
            $table->string('organizer')->nullable()->after('price');
            $table->dateTime('ends_at')->nullable()->after('starts_at');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['mode', 'price', 'organizer', 'ends_at']);
        });
    }
};
