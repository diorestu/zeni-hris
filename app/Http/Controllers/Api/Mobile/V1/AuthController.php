<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\Api\Concerns\InteractsWithMobileApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Mobile\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use InteractsWithMobileApiResponse;

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::query()->where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password tidak valid.',
                'errors' => [
                    'email' => ['Email atau password tidak valid.'],
                ],
            ], 422);
        }

        if ($request->boolean('revoke_other_tokens', true)) {
            $user->tokens()->delete();
        }

        $deviceName = trim((string) ($validated['device_name'] ?? $request->userAgent() ?? 'mobile-app'));
        $deviceName = $deviceName !== '' ? $deviceName : 'mobile-app';

        $token = $user->createToken($deviceName, ['mobile'])->plainTextToken;

        return $this->success([
            'token_type' => 'Bearer',
            'access_token' => $token,
            'user' => $this->userPayload($user),
        ], 'Login berhasil.');
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->success($this->userPayload($user));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->success(null, 'Logout berhasil.');
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'parent_user_id' => $user->parent_user_id,
            'account_owner_id' => $user->accountOwnerId(),
            'email_verified_at' => $user->email_verified_at?->toDateTimeString(),
            'created_at' => $user->created_at?->toDateTimeString(),
        ];
    }
}
