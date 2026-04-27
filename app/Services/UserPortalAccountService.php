<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use App\Support\UserPassword;
use App\Support\WhatsAppPhone;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserPortalAccountService
{
    public function __construct(private readonly WahaClient $wahaClient) {}

    public function createOrSyncFromEmployee(Employee $employee): ?User
    {
        return $this->upsertFromEmployee($employee, resetPasswordToDefault: false, sendCredentialMessage: false);
    }

    public function activateFromEmployee(Employee $employee): ?User
    {
        return $this->upsertFromEmployee($employee, resetPasswordToDefault: true, sendCredentialMessage: true);
    }

    private function upsertFromEmployee(
        Employee $employee,
        bool $resetPasswordToDefault,
        bool $sendCredentialMessage,
    ): ?User {
        if (! $employee->email || ! $employee->phone) {
            return null;
        }

        $normalizedPhone = WhatsAppPhone::normalize($employee->phone);

        if ($normalizedPhone === '') {
            return null;
        }

        $ownerId = (int) $employee->user_id;

        $user = User::query()
            ->where('parent_user_id', $ownerId)
            ->where(function ($query) use ($employee, $normalizedPhone): void {
                $query
                    ->where('email', $employee->email)
                    ->orWhere('phone', $normalizedPhone);
            })
            ->first();

        $defaultPassword = UserPassword::defaultFromPhone($normalizedPhone);

        if (! $user) {

            $user = User::query()->create([
                'name' => $employee->full_name,
                'email' => $employee->email,
                'phone' => $normalizedPhone,
                'password' => Hash::make($defaultPassword),
                'role' => 'user',
                'parent_user_id' => $ownerId,
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'requires_password_change' => true,
                'password_changed_at' => null,
            ]);

            if ($sendCredentialMessage) {
                $this->sendCredentialMessage($user, $defaultPassword);
            }

            return $user;
        }

        $user->fill([
            'name' => $employee->full_name,
            'email' => $employee->email,
            'phone' => $normalizedPhone,
            'role' => 'user',
            'parent_user_id' => $ownerId,
        ]);

        if ($resetPasswordToDefault) {
            $user->forceFill([
                'password' => Hash::make($defaultPassword),
                'requires_password_change' => true,
                'password_changed_at' => null,
            ]);
        }

        if ($user->isDirty()) {
            $user->save();
        }

        if ($sendCredentialMessage) {
            $this->sendCredentialMessage($user, $defaultPassword);
        }

        return $user;
    }

    private function sendCredentialMessage(User $user, string $defaultPassword): void
    {
        if (! config('services.waha.enabled')) {
            return;
        }

        $message = implode("\n", [
            'Akun Portal User Anda sudah dibuat.',
            'Email: '.$user->email,
            'Password awal: '.$defaultPassword,
            'Setelah login, Anda dapat mengubah password (opsional).',
        ]);

        try {
            $this->wahaClient->sendTextToPhone((string) $user->phone, $message);
        } catch (\Throwable $exception) {
            report($exception);

            Log::warning('user.portal_account.whatsapp_failed', [
                'user_id' => $user->id,
                'phone' => $user->phone,
            ]);
        }
    }
}
