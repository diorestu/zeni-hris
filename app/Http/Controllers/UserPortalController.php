<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\RoleRedirect;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserPortalController extends Controller
{
    /**
     * Display the user portal page.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role !== 'user') {
            return redirect()->to(RoleRedirect::for($user));
        }

        return Inertia::render('portal/index');
    }
}
