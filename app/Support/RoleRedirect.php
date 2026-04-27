<?php

namespace App\Support;

use App\Models\User;

class RoleRedirect
{
    public static function for(?User $user): string
    {
        if (! $user) {
            return route('login');
        }

        return $user->role === 'user'
            ? route('portal.index')
            : route('dashboard');
    }
}
