<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\CompanySetting;
use App\Models\User;
use App\Services\WhatsAppOtpService;
use App\Support\WhatsAppPhone;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private readonly WhatsAppOtpService $otpService) {}

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $input['phone'] = WhatsAppPhone::normalize($input['phone'] ?? '');

        Validator::make($input, [
            ...$this->profileRules(),
            'company_name' => ['required', 'string', 'max:255'],
            'phone' => [
                'required',
                'string',
                'min:10',
                'max:30',
                'unique:users,phone',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! WhatsAppPhone::isValid((string) $value)) {
                        $fail('Nomor WhatsApp harus menggunakan format seluler Indonesia yang valid.');
                    }
                },
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'company_name' => $input['company_name'],
            'email' => $input['email'],
            'phone' => $input['phone'],
            'password' => $input['password'],
            'role' => 'admin',
        ]);

        CompanySetting::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['name' => $input['company_name']]
        );

        $this->otpService->send($user);

        return $user;
    }
}
