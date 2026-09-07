<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ArticleController extends Controller
{
    // GET /api/articles?category=...&q=...
    public function index(Request $request)
    {
        $query = Article::query()->where('is_published', true);

        if ($category = $request->query('category')) {
            if ($category !== 'الكل') {
                $query->where('category', $category);
            }
        }

        if ($q = $request->query('q')) {
            $query->where(function ($w) use ($q) {
                $w->where('title', 'like', "%{$q}%")
                  ->orWhere('excerpt', 'like', "%{$q}%")
                  ->orWhere('author', 'like', "%{$q}%");
            });
        }

        return response()->json(
            $query->orderByDesc('published_at')->get()
        );
    }

    // GET /api/articles/{article:slug}
    public function show(Article $article)
    {
        abort_unless($article->is_published, 404);

        return response()->json($article);
    }

    // GET /api/admin/articles  (محمي بالمصادقة، يشمل غير المنشورة)
    public function adminIndex()
    {
        return response()->json(
            Article::query()->orderByDesc('published_at')->get()
        );
    }

    // POST /api/admin/articles  (محمي بالمصادقة)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'governorate' => ['nullable', 'string', 'max:100'],
            'author' => ['required', 'string', 'max:150'],
            'excerpt' => ['required', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'read_minutes' => ['nullable', 'integer', 'min:1'],
            'is_featured' => ['nullable', 'boolean'],
            'art_theme' => ['nullable', 'string', 'in:art-1,art-2,art-3,art-4'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $article = Article::create($validator->validated());

        return response()->json($article, 201);
    }

    // PUT /api/admin/articles/{article}  (محمي بالمصادقة)
    public function update(Request $request, Article $article)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'string', 'max:100'],
            'governorate' => ['sometimes', 'string', 'max:100'],
            'author' => ['sometimes', 'string', 'max:150'],
            'excerpt' => ['sometimes', 'string', 'max:500'],
            'content' => ['sometimes', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'read_minutes' => ['nullable', 'integer', 'min:1'],
            'is_featured' => ['nullable', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $article->update($validator->validated());

        return response()->json($article);
    }

    // DELETE /api/admin/articles/{article}  (محمي بالمصادقة)
    public function destroy(Article $article)
    {
        $article->delete();

        return response()->json(['message' => 'تم حذف المقال']);
    }
}
