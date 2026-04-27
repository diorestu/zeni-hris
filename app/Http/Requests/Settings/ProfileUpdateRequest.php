<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use App\Support\WhatsAppPhone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $this->merge([
                'phone' => WhatsAppPhone::normalize((string) $this->input('phone')),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->profileRules($this->user()->id),
            'phone' => [
                'required',
                'string',
                'min:10',
                'max:30',
                Rule::unique('users', 'phone')->ignore($this->user()->id),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! WhatsAppPhone::isValid((string) $value)) {
                        $fail('Nomor WhatsApp harus menggunakan format seluler Indonesia yang valid.');
                    }
                },
            ],
        ];
    }
}
