<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContactMessageController extends Controller
{
    // POST /api/contact-messages
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'governorate' => ['nullable', 'string', 'max:100'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من بيانات الرسالة', 'errors' => $validator->errors()], 422);
        }

        $msg = ContactMessage::create($validator->validated());

        return response()->json(['message' => 'تم استلام رسالتك بنجاح', 'data' => $msg], 201);
    }

    // GET /api/admin/contact-messages  (محمي بالمصادقة)
    public function index()
    {
        return response()->json(ContactMessage::latest()->get());
    }
}
