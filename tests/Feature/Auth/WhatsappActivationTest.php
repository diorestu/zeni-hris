<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WhatsappActivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_activation_screen_can_be_rendered_for_unactivated_user(): void
    {
        $this->withoutVite();

        $user = User::factory()->unactivated()->create();

        $this->actingAs($user)
            ->get(route('activation.notice'))
            ->assertOk();
    }

    public function test_user_can_activate_account_with_valid_whatsapp_otp(): void
    {
        $user = User::factory()->unactivated()->create([
            'whatsapp_otp_code' => bcrypt('123456'),
            'whatsapp_otp_expires_at' => now()->addMinutes(10),
            'whatsapp_otp_sent_at' => now(),
        ]);

        $this->actingAs($user)
            ->post(route('activation.verify'), [
                'otp' => '123456',
            ])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertNotNull($user->fresh()->phone_verified_at);
        $this->assertNull($user->fresh()->whatsapp_otp_code);
    }

    public function test_user_cannot_activate_account_with_invalid_otp(): void
    {
        $user = User::factory()->unactivated()->create([
            'whatsapp_otp_code' => bcrypt('123456'),
            'whatsapp_otp_expires_at' => now()->addMinutes(10),
            'whatsapp_otp_sent_at' => now(),
        ]);

        $this->actingAs($user)
            ->from(route('activation.notice'))
            ->post(route('activation.verify'), [
                'otp' => '999999',
            ])
            ->assertRedirect(route('activation.notice'))
            ->assertSessionHasErrors(['otp']);

        $this->assertNull($user->fresh()->phone_verified_at);
    }

    public function test_user_can_resend_whatsapp_otp(): void
    {
        $user = User::factory()->unactivated()->create([
            'whatsapp_otp_sent_at' => now()->subMinutes(2),
        ]);

        $this->actingAs($user)
            ->post(route('activation.send'))
            ->assertRedirect();

        $user->refresh();

        $this->assertNotNull($user->whatsapp_otp_code);
        $this->assertNotNull($user->whatsapp_otp_expires_at);
        $this->assertTrue($user->whatsapp_otp_sent_at->isAfter(now()->subMinute()));
    }
}
