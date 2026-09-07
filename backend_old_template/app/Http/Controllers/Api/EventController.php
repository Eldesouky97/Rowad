<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    // GET /api/events?status=upcoming|past|all
    public function index(Request $request)
    {
        $query = Event::query()->where('is_published', true);

        $status = $request->query('status', 'all');
        if ($status === 'upcoming') {
            $query->where('starts_at', '>=', now())->orderBy('starts_at', 'asc');
        } elseif ($status === 'past') {
            $query->where('starts_at', '<', now())->orderBy('starts_at', 'desc');
        } else {
            $query->orderBy('starts_at', 'asc');
        }

        return response()->json($query->get());
    }

    // GET /api/events/{event:slug}
    public function show(Event $event)
    {
        abort_unless($event->is_published, 404);

        return response()->json($event);
    }

    // POST /api/admin/events  (محمي بالمصادقة)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'governorate' => ['required', 'string', 'max:100'],
            'location' => ['required', 'string', 'max:255'],
            'starts_at' => ['required', 'date'],
            'description' => ['required', 'string'],
            'seats_total' => ['required', 'integer', 'min:1'],
            'art_theme' => ['nullable', 'string', 'in:art-1,art-2,art-3,art-4'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $event = Event::create($validator->validated());

        return response()->json($event, 201);
    }

    // PUT /api/admin/events/{event}  (محمي بالمصادقة)
    public function update(Request $request, Event $event)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'string', 'max:100'],
            'governorate' => ['sometimes', 'string', 'max:100'],
            'location' => ['sometimes', 'string', 'max:255'],
            'starts_at' => ['sometimes', 'date'],
            'description' => ['sometimes', 'string'],
            'seats_total' => ['sometimes', 'integer', 'min:1'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $event->update($validator->validated());

        return response()->json($event);
    }

    // DELETE /api/admin/events/{event}  (محمي بالمصادقة)
    public function destroy(Event $event)
    {
        $event->delete();

        return response()->json(['message' => 'تم حذف الفعالية']);
    }
}
