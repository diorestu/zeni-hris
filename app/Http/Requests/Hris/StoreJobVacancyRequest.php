<?php

namespace App\Http\Requests\Hris;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobVacancyRequest extends FormRequest
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
        $normalized = [];

        if ($this->has('min_salary')) {
            $normalized['min_salary'] = $this->normalizeCurrencyInput($this->input('min_salary'));
        }

        if ($this->has('max_salary')) {
            $normalized['max_salary'] = $this->normalizeCurrencyInput($this->input('max_salary'));
        }

        if ($normalized !== []) {
            $this->merge($normalized);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $ownerId = $this->user()->accountOwnerId();

        return [
            'title' => ['required', 'string', 'max:160'],
            'division_id' => ['nullable', 'integer', Rule::exists('divisions', 'id')->where('user_id', $ownerId)],
            'position_id' => ['nullable', 'integer', Rule::exists('positions', 'id')->where('user_id', $ownerId)],
            'employment_type' => ['nullable', Rule::in(['permanent', 'contract', 'internship', 'freelance'])],
            'workplace_type' => ['nullable', Rule::in(['onsite', 'hybrid', 'remote'])],
            'location' => ['nullable', 'string', 'max:160'],
            'openings' => ['required', 'integer', 'min:1', 'max:999'],
            'min_salary' => ['nullable', 'numeric', 'min:0'],
            'max_salary' => ['nullable', 'numeric', 'gte:min_salary'],
            'description' => ['nullable', 'string', 'max:5000'],
            'requirements' => ['nullable', 'string', 'max:5000'],
            'benefits' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', Rule::in(['draft', 'published', 'closed'])],
            'closing_date' => ['nullable', 'date'],
        ];
    }

    private function normalizeCurrencyInput(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = preg_replace('/[^\d]/', '', (string) $value);

        return $normalized === '' ? null : $normalized;
    }
}
