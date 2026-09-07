<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdminRole
{
    // الاستخدام: ->middleware('role:super_admin,editor')
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        if (! in_array($request->user()?->role, $roles, true)) {
            return response()->json(['message' => 'ليس لديك صلاحية للقيام بهذا الإجراء'], 403);
        }

        return $next($request);
    }
}
