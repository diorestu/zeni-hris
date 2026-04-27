<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'company_name' => 'PT Test Company',
            'email' => 'test@example.com',
            'phone' => '081234567890',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('activation.notice'));

        $user = User::query()->firstOrFail();

        $this->assertSame('admin', $user->role);
        $this->assertSame('PT Test Company', $user->company_name);
        $this->assertSame('6281234567890', $user->phone);
        $this->assertNull($user->phone_verified_at);
        $this->assertNotNull($user->whatsapp_otp_code);

        $this->assertDatabaseHas('company_settings', [
            'user_id' => $user->id,
            'name' => 'PT Test Company',
        ]);
    }

    public function test_registration_rejects_invalid_whatsapp_number_format(): void
    {
        $response = $this->from(route('register'))->post(route('register.store'), [
            'name' => 'Test User',
            'company_name' => 'PT Test Company',
            'email' => 'test@example.com',
            'phone' => '015981415513',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('register'));
        $response->assertSessionHasErrors(['phone']);
        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
    }
}
