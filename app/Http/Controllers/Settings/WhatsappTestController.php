<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\WahaClient;
use App\Support\WhatsAppPhone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WhatsappTestController extends Controller
{
    public function __construct(private readonly WahaClient $wahaClient) {}

    public function show(Request $request): Response
    {
        return Inertia::render('settings/whatsapp', [
            'defaultPhone' => $request->user()->phone,
            'sessionSnapshot' => $this->wahaClient->sessionSnapshot(),
        ]);
    }

    public function send(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'min:10', 'max:30'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $phone = WhatsAppPhone::normalize($validated['phone']);

        try {
            $this->wahaClient->sendTextToPhone($phone, $validated['message']);
        } catch (\Throwable $exception) {
            throw ValidationException::withMessages([
                'phone' => 'Pesan WhatsApp gagal dikirim. Periksa status session WAHA lalu coba lagi.',
            ]);
        }

        return back()->with('success', 'Pesan WhatsApp berhasil dikirim ke '.$phone.'.');
    }
}
