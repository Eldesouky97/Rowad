<?php

use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ContactMessageController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\GalleryImageController;
use App\Http\Controllers\Api\GovernorateController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\SuccessStoryController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| مسارات عامة (لا تحتاج تسجيل دخول) — يستهلكها موقع Next.js
|--------------------------------------------------------------------------
*/
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event:slug}', [EventController::class, 'show']);
Route::post('/events/{event:slug}/bookings', [BookingController::class, 'store']);

Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/{article:slug}', [ArticleController::class, 'show']);

Route::post('/contact-messages', [ContactMessageController::class, 'store']);

Route::get('/programs', [ProgramController::class, 'index']);
Route::get('/governorates', [GovernorateController::class, 'index']);
Route::get('/success-stories', [SuccessStoryController::class, 'index']);
Route::get('/gallery', [GalleryImageController::class, 'index']);

Route::post('/admin/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| مسارات لوحة تحكم الأدمن — محمية بتوكن Sanctum (Authorization: Bearer ...)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |----------------------------------------------------------------------
    | قراءة فقط — أي حساب أدمن مسجّل دخول (super_admin/editor/viewer)
    |----------------------------------------------------------------------
    */
    Route::get('/events', [EventController::class, 'adminIndex']);
    Route::get('/events/{event}/bookings', [BookingController::class, 'index']);
    Route::get('/articles', [ArticleController::class, 'adminIndex']);
    Route::get('/contact-messages', [ContactMessageController::class, 'index']);
    Route::get('/programs', [ProgramController::class, 'adminIndex']);
    Route::get('/governorates', [GovernorateController::class, 'adminIndex']);
    Route::get('/success-stories', [SuccessStoryController::class, 'adminIndex']);
    Route::get('/gallery', [GalleryImageController::class, 'adminIndex']);

    /*
    |----------------------------------------------------------------------
    | تعديل المحتوى — super_admin أو editor فقط
    |----------------------------------------------------------------------
    */
    Route::middleware('role:super_admin,editor')->group(function () {
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{event}', [EventController::class, 'update']);
        Route::delete('/events/{event}', [EventController::class, 'destroy']);

        Route::post('/articles', [ArticleController::class, 'store']);
        Route::put('/articles/{article}', [ArticleController::class, 'update']);
        Route::delete('/articles/{article}', [ArticleController::class, 'destroy']);

        Route::post('/programs', [ProgramController::class, 'store']);
        Route::put('/programs/{program}', [ProgramController::class, 'update']);
        Route::delete('/programs/{program}', [ProgramController::class, 'destroy']);

        Route::post('/governorates', [GovernorateController::class, 'store']);
        Route::put('/governorates/{governorate}', [GovernorateController::class, 'update']);
        Route::delete('/governorates/{governorate}', [GovernorateController::class, 'destroy']);

        Route::post('/success-stories', [SuccessStoryController::class, 'store']);
        Route::put('/success-stories/{successStory}', [SuccessStoryController::class, 'update']);
        Route::delete('/success-stories/{successStory}', [SuccessStoryController::class, 'destroy']);

        Route::post('/gallery', [GalleryImageController::class, 'store']);
        Route::put('/gallery/{galleryImage}', [GalleryImageController::class, 'update']);
        Route::delete('/gallery/{galleryImage}', [GalleryImageController::class, 'destroy']);
    });

    /*
    |----------------------------------------------------------------------
    | إدارة حسابات الأدمن — super_admin فقط
    |----------------------------------------------------------------------
    */
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });
});
