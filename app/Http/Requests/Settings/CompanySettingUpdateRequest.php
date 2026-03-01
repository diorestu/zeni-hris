<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CompanySettingUpdateRequest extends FormRequest
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
        $prefix = strtoupper((string) $this->input('employee_code_prefix', 'EMP'));
        $prefix = preg_replace('/[^A-Z0-9_-]/', '', $prefix) ?: 'EMP';

        $this->merge([
            'employee_code_prefix' => $prefix,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'details' => ['nullable', 'string', 'max:3000'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'employee_code_prefix' => ['required', 'string', 'max:12', 'regex:/^[A-Z0-9_-]+$/'],
            'employee_code_digits' => ['required', 'integer', 'min:1', 'max:8'],
            'employee_code_next_number' => ['required', 'integer', 'min:1', 'max:99999999'],
        ];
    }
}
