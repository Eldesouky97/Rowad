<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProgramController extends Controller
{
    private const CATEGORIES = ['التعليم', 'السياحة', 'التضامن', 'الزراعة', 'الإعلام', 'الصحة'];

    // GET /api/programs
    public function index()
    {
        return response()->json(
            Program::query()->where('is_published', true)->orderBy('order')->orderBy('id')->get()
        );
    }

    // GET /api/admin/programs  (محمي بالمصادقة)
    public function adminIndex()
    {
        return response()->json(
            Program::query()->orderBy('order')->orderBy('id')->get()
        );
    }

    // POST /api/admin/programs  (محمي بالمصادقة)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:'.implode(',', self::CATEGORIES)],
            'description' => ['required', 'string'],
            'art_theme' => ['nullable', 'string', 'in:art-1,art-2,art-3,art-4'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $program = Program::create($validator->validated());

        return response()->json($program, 201);
    }

    // PUT /api/admin/programs/{program}  (محمي بالمصادقة)
    public function update(Request $request, Program $program)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'string', 'in:'.implode(',', self::CATEGORIES)],
            'description' => ['sometimes', 'string'],
            'art_theme' => ['nullable', 'string', 'in:art-1,art-2,art-3,art-4'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $program->update($validator->validated());

        return response()->json($program);
    }

    // DELETE /api/admin/programs/{program}  (محمي بالمصادقة)
    public function destroy(Program $program)
    {
        $program->delete();

        return response()->json(['message' => 'تم حذف البرنامج']);
    }
}
