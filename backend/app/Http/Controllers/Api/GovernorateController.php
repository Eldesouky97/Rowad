<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Governorate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GovernorateController extends Controller
{
    // GET /api/governorates
    public function index()
    {
        return response()->json(
            Governorate::query()->where('is_published', true)->orderBy('order')->orderBy('id')->get()
        );
    }

    // GET /api/admin/governorates  (محمي بالمصادقة)
    public function adminIndex()
    {
        return response()->json(
            Governorate::query()->orderBy('order')->orderBy('id')->get()
        );
    }

    // POST /api/admin/governorates  (محمي بالمصادقة)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:100'],
            'tagline' => ['required', 'string', 'max:255'],
            'population' => ['required', 'string', 'max:50'],
            'projects_completed' => ['required', 'integer', 'min:0'],
            'completion_percentage' => ['required', 'integer', 'min:0', 'max:100'],
            'art_theme' => ['nullable', 'string', 'in:art-1,art-2,art-3,art-4'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $governorate = Governorate::create($validator->validated());

        return response()->json($governorate, 201);
    }

    // PUT /api/admin/governorates/{governorate}  (محمي بالمصادقة)
    public function update(Request $request, Governorate $governorate)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:100'],
            'tagline' => ['sometimes', 'string', 'max:255'],
            'population' => ['sometimes', 'string', 'max:50'],
            'projects_completed' => ['sometimes', 'integer', 'min:0'],
            'completion_percentage' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'art_theme' => ['nullable', 'string', 'in:art-1,art-2,art-3,art-4'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $governorate->update($validator->validated());

        return response()->json($governorate);
    }

    // DELETE /api/admin/governorates/{governorate}  (محمي بالمصادقة)
    public function destroy(Governorate $governorate)
    {
        $governorate->delete();

        return response()->json(['message' => 'تم حذف المحافظة']);
    }
}
