<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'category', 'description', 'art_theme', 'order', 'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];
}
