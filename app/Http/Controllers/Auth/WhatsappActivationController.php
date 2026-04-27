<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppOtpService;
use App\Support\RoleRedirect;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WhatsappActivationController extends Controller
{
    public function __construct(private readonly WhatsAppOtpService $otpService) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->hasActivatedAccount()) {
            return redirect()->to(RoleRedirect::for($user));
        }

        return Inertia::render('auth/activate-account', [
            'phone' => $user->phone,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function send(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasActivatedAccount()) {
            return redirect()->to(RoleRedirect::for($user));
        }

        if (! $this->otpService->canResend($user)) {
            throw ValidationException::withMessages([
                'otp' => 'OTP baru dapat dikirim ulang setelah 1 menit.',
            ]);
        }

        if (! $this->otpService->send($user, strict: true)) {
            throw ValidationException::withMessages([
                'otp' => 'OTP WhatsApp gagal dikirim. Silakan coba lagi.',
            ]);
        }

        return back()->with('status', 'otp-sent');
    }

    public function verify(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'otp' => ['required', 'digits:6'],
        ]);

        $user = $request->user();

        if ($user->hasActivatedAccount()) {
            return redirect()->to(RoleRedirect::for($user));
        }

        if (! $this->otpService->verify($user, $validated['otp'])) {
            throw ValidationException::withMessages([
                'otp' => 'Kode OTP tidak valid atau sudah kedaluwarsa.',
            ]);
        }

        return redirect()->to(RoleRedirect::for($user));
    }
}
