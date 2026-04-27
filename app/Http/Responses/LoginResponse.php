<?php

namespace App\Http\Responses;

use App\Models\User;
use App\Support\RoleRedirect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): JsonResponse|RedirectResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user && ! $user->hasActivatedAccount()) {
            $target = route('activation.notice');
        } elseif ($user && $user->requires_password_change) {
            $target = route('user-password.edit', ['prompt' => 1]);
        } else {
            $target = RoleRedirect::for($user);
        }

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false, 'redirect' => $target])
            : redirect()->to($target);
    }
}
