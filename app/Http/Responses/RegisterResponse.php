<?php

namespace App\Http\Responses;

use App\Models\User;
use App\Support\RoleRedirect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): JsonResponse|RedirectResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        $target = $user && ! $user->hasActivatedAccount()
            ? route('activation.notice')
            : RoleRedirect::for($user);

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false, 'redirect' => $target], 201)
            : redirect()->to($target);
    }
}
