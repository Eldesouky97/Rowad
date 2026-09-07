<?php

use App\Http\Middleware\EnsureAdminRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['role' => EnsureAdminRole::class]);

        // الباك إند API فقط ومفيش روت اسمه "login"؛ لازم نلغي سلوك Laravel
        // الافتراضي (redirectGuestsTo(route('login'))) اللي بيكسر بـ 500 بدل
        // ما يرجّع 401 JSON لضيوف غير مسجلين دخول.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // الباك إند API فقط (لا صفحات ويب)، فلازم كل الأخطاء (بما فيها 401 لغياب توكن)
        // تترجع JSON بدل ما Laravel يحاول يعمل redirect لروت "login" غير موجود أصلاً.
        $exceptions->shouldRenderJsonWhen(fn () => true);
    })->create();
