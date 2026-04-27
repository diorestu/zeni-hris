<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Support\RoleRedirect;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    /**
     * Show the user's password settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/password', [
            'promptMode' => $request->boolean('prompt'),
        ]);
    }

    /**
     * Update the user's password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->password,
            'requires_password_change' => false,
            'password_changed_at' => now(),
        ]);

        return back();
    }

    /**
     * Skip password change prompt.
     */
    public function skipPrompt(Request $request): RedirectResponse
    {
        $request->user()->update([
            'requires_password_change' => false,
        ]);

        return redirect()->to(RoleRedirect::for($request->user()));
    }
}
