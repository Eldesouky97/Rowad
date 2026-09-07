<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class GalleryImageController extends Controller
{
    // GET /api/gallery
    public function index()
    {
        return response()->json(
            GalleryImage::query()->where('is_published', true)->orderBy('order')->orderBy('id')->get()
        );
    }

    // GET /api/admin/gallery  (محمي بالمصادقة)
    public function adminIndex()
    {
        return response()->json(
            GalleryImage::query()->orderBy('order')->orderBy('id')->get()
        );
    }

    // POST /api/admin/gallery  (محمي بالمصادقة، يقبل multipart/form-data)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:500'],
            'art_theme' => ['nullable', 'string', 'in:art-1,art-2,art-3,art-4'],
            'order' => ['nullable', 'integer', 'min:0'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        unset($data['image']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('gallery', 'public');
        }

        $image = GalleryImage::create($data);

        return response()->json($image, 201);
    }

    // POST /api/admin/gallery/{gallery_image}  (محمي بالمصادقة، PUT عبر _method spoofing لدعم رفع الملفات)
    public function update(Request $request, GalleryImage $galleryImage)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['sometimes', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:500'],
            'art_theme' => ['nullable', 'string', 'in:art-1,art-2,art-3,art-4'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_published' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        unset($data['image']);

        if ($request->hasFile('image')) {
            if ($galleryImage->image_path) {
                Storage::disk('public')->delete($galleryImage->image_path);
            }
            $data['image_path'] = $request->file('image')->store('gallery', 'public');
        }

        $galleryImage->update($data);

        return response()->json($galleryImage);
    }

    // DELETE /api/admin/gallery/{gallery_image}  (محمي بالمصادقة)
    public function destroy(GalleryImage $galleryImage)
    {
        if ($galleryImage->image_path) {
            Storage::disk('public')->delete($galleryImage->image_path);
        }
        $galleryImage->delete();

        return response()->json(['message' => 'تم حذف الصورة']);
    }
}
