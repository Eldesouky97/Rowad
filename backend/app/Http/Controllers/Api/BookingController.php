<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    // POST /api/events/{event:slug}/bookings
    public function store(Request $request, Event $event)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255'],
            'governorate' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من بيانات الحجز', 'errors' => $validator->errors()], 422);
        }

        try {
            $booking = DB::transaction(function () use ($event, $validator) {
                // قفل صف الفعالية أثناء المعاملة لمنع تجاوز عدد المقاعد عند الحجز المتزامن
                $locked = Event::where('id', $event->id)->lockForUpdate()->firstOrFail();

                if ($locked->seats_taken >= $locked->seats_total) {
                    abort(409, 'عذرًا، اكتملت مقاعد هذه الفعالية');
                }

                $locked->increment('seats_taken');

                return Booking::create([
                    ...$validator->validated(),
                    'event_id' => $event->id,
                    'confirmation_code' => 'RWD-'.Str::upper(Str::random(3)).'-'.Str::upper(Str::random(4)),
                ]);
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        return response()->json($booking, 201);
    }

    // GET /api/admin/events/{event}/bookings  (محمي بالمصادقة)
    public function index(Event $event)
    {
        return response()->json($event->bookings()->latest()->get());
    }
}
