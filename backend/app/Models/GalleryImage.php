<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GalleryImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'caption', 'art_theme', 'image_path', 'order', 'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];
}
