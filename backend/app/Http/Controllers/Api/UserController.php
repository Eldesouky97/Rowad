<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    private const ROLES = ['super_admin', 'editor', 'viewer'];

    // GET /api/admin/users  (super_admin فقط)
    public function index()
    {
        return response()->json(User::query()->orderBy('name')->get());
    }

    // POST /api/admin/users  (super_admin فقط)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:'.implode(',', self::ROLES)],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json($user, 201);
    }

    // PUT /api/admin/users/{user}  (super_admin فقط)
    public function update(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:150'],
            'email' => ['sometimes', 'email', 'unique:users,email,'.$user->id],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'string', 'in:'.implode(',', self::ROLES)],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'تحقق من الحقول المطلوبة', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($user->role === 'super_admin' && ($data['role'] ?? 'super_admin') !== 'super_admin'
            && User::where('role', 'super_admin')->count() <= 1) {
            return response()->json(['message' => 'لا يمكن تغيير دور آخر Super Admin متبقٍّ'], 422);
        }

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user);
    }

    // DELETE /api/admin/users/{user}  (super_admin فقط)
    public function destroy(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'لا يمكنك حذف حسابك الخاص'], 422);
        }

        if ($user->role === 'super_admin' && User::where('role', 'super_admin')->count() <= 1) {
            return response()->json(['message' => 'لا يمكن حذف آخر Super Admin متبقٍّ'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'تم حذف المستخدم']);
    }
}
