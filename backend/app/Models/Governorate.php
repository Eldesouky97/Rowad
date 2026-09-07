<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Governorate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'tagline', 'population', 'projects_completed',
        'completion_percentage', 'art_theme', 'order', 'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'projects_completed' => 'integer',
        'completion_percentage' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Governorate $governorate) {
            if (empty($governorate->slug)) {
                $governorate->slug = Str::slug($governorate->name).'-'.Str::random(5);
            }
        });
    }
}
