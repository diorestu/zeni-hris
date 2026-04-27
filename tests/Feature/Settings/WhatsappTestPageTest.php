<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhatsappTestPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_whatsapp_test_page_can_be_rendered(): void
    {
        $this->withoutVite();

        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('settings.whatsapp.show'))
            ->assertOk();
    }

    public function test_admin_can_send_whatsapp_test_message(): void
    {
        config()->set('services.waha.enabled', true);
        config()->set('services.waha.base_url', 'https://waha.example.test');
        config()->set('services.waha.api_key', 'secret');

        Http::fake([
            'https://waha.example.test/api/sendText' => Http::response([
                'key' => ['id' => 'abc123'],
                'status' => 'PENDING',
            ], 200),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('settings.whatsapp.send'), [
                'phone' => '081234567890',
                'message' => 'Halo dari halaman admin.',
            ])
            ->assertRedirect();

        Http::assertSent(function ($request) {
            return $request->url() === 'https://waha.example.test/api/sendText'
                && $request['chatId'] === '6281234567890@c.us'
                && $request['session'] === 'ZeniConsulting'
                && $request['text'] === 'Halo dari halaman admin.';
        });
    }
}
