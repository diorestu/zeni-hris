<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\CompanySetting;
use App\Services\WhatsAppOtpService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $ownerId = $request->user()->accountOwnerId();

        $companySetting = CompanySetting::query()->firstOrCreate(
            ['user_id' => $ownerId],
            [
                'name' => 'Perusahaan',
                'details' => null,
                'employee_code_prefix' => 'EMP',
                'employee_code_digits' => 4,
                'employee_code_next_number' => 1,
            ],
        );

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'company' => [
                'name' => $companySetting->name,
                'details' => $companySetting->details,
                'logo_url' => $companySetting->logo_path
                    ? Storage::disk('public')->url($companySetting->logo_path)
                    : null,
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request, WhatsAppOtpService $otpService): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $phoneChanged = $request->user()->isDirty('phone');

        if ($phoneChanged) {
            $request->user()->phone_verified_at = null;
            $request->user()->whatsapp_otp_code = null;
            $request->user()->whatsapp_otp_sent_at = null;
            $request->user()->whatsapp_otp_expires_at = null;
        }

        $request->user()->save();

        if ($phoneChanged) {
            $otpService->send($request->user());

            return redirect()
                ->route('activation.notice')
                ->with('status', 'otp-sent');
        }

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
