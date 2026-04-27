<?php

namespace App\Http\Requests\Careers;

use App\Support\WhatsAppPhone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCareerApplicationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare request data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('expected_salary')) {
            return;
        }

        $normalized = preg_replace('/[^\d]/', '', (string) $this->input('expected_salary'));

        $this->merge([
            'expected_salary' => $normalized === '' ? null : $normalized,
        ]);

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
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => ['required', 'string', 'max:30'],
            'birth_date' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:2000'],
            'last_education' => ['nullable', 'string', 'max:100'],
            'years_experience' => ['nullable', 'numeric', 'min:0', 'max:80'],
            'current_company' => ['nullable', 'string', 'max:160'],
            'expected_salary' => ['nullable', 'numeric', 'min:0'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'cover_letter' => ['nullable', 'string', 'max:5000'],
            'resume' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:4096'],
        ];
    }
}
