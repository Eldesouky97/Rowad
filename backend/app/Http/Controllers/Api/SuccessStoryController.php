<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SuccessStory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SuccessStoryController extends Controller
{
    // GET /api/success-stories
    public function index()
    {
        return response()->json(
            SuccessStory::query()->where('is_published', true)->orderBy('order')->orderBy('id')->get()
        );
    }

    // GET /api/admin/success-stories  (محمي بالمصادقة)
    public function adminIndex()
    {
        return response()->json(
            SuccessStory::query()->orderBy('order')->orderBy('id')->get()
        );
    }

    // POST /api/admin/success-stories  (محمي بالمصادقة)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:150'],
            'role_title' => ['required', 'string', 'max:150'],
            'governorate' => ['nullable', 'string', 'max:100'],
            'quote' => ['required', 'string', 'max:1000'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $story = SuccessStory::create($validator->validated());

        return response()->json($story, 201);
    }

    // PUT /api/admin/success-stories/{success_story}  (محمي بالمصادقة)
    public function update(Request $request, SuccessStory $successStory)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:150'],
            'role_title' => ['sometimes', 'string', 'max:150'],
            'governorate' => ['nullable', 'string', 'max:100'],
            'quote' => ['sometimes', 'string', 'max:1000'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $successStory->update($validator->validated());

        return response()->json($successStory);
    }

    // DELETE /api/admin/success-stories/{success_story}  (محمي بالمصادقة)
    public function destroy(SuccessStory $successStory)
    {
        $successStory->delete();

        return response()->json(['message' => 'تم حذف قصة النجاح']);
    }
}
