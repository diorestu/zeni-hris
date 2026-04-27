<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\RoleRedirect;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminAccess
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user && $user->role === 'user') {
            return redirect()->to(RoleRedirect::for($user));
        }

        return $next($request);
    }
}
