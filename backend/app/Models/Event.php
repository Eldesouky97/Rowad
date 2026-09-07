<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'slug', 'category', 'governorate', 'location', 'mode',
        'starts_at', 'ends_at', 'description', 'seats_total', 'seats_taken',
        'price', 'organizer', 'art_theme', 'is_published',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_published' => 'boolean',
    ];

    protected $appends = ['status', 'seats_remaining'];

    protected static function booted(): void
    {
        static::creating(function (Event $event) {
            if (empty($event->slug)) {
                $event->slug = Str::slug($event->title).'-'.Str::random(5);
            }
        });
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    // "upcoming" أو "past" بالمقارنة مع الوقت الحالي
    public function getStatusAttribute(): string
    {
        return $this->starts_at?->isFuture() ? 'upcoming' : 'past';
    }

    public function getSeatsRemainingAttribute(): int
    {
        return max(0, $this->seats_total - $this->seats_taken);
    }
}
