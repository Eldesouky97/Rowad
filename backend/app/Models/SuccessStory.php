<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuccessStory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'role_title', 'governorate', 'quote', 'order', 'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];
}
