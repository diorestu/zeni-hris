<?php

namespace App\Http\Requests\Hris;

use App\Models\Employee;
use App\Models\Position;
use App\Support\WhatsAppPhone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
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
        $normalizedPayload = [];

        if ($this->has('full_name')) {
            $fullName = trim((string) $this->input('full_name'));
            $normalizedPayload['full_name'] = $fullName;
            $normalizedPayload['first_name'] = $fullName;
            $normalizedPayload['last_name'] = null;
        }

        if ($this->has('employee_code')) {
            $normalizedPayload['employee_code'] = strtoupper((string) $this->input('employee_code'));
        }

        if (($this->input('marital_status') ?? '') === 'single') {
            $normalizedPayload['children_count'] = 0;
        }

        if ($this->has('base_salary')) {
            $normalizedPayload['base_salary'] = $this->normalizeCurrencyInput(
                $this->input('base_salary')
            );
        }

        if ($this->filled('phone')) {
            $normalizedPayload['phone'] = WhatsAppPhone::normalize((string) $this->input('phone'));
        }

        if ($this->filled('emergency_contact_phone')) {
            $normalizedPayload['emergency_contact_phone'] = WhatsAppPhone::normalize((string) $this->input('emergency_contact_phone'));
        }

        if ($normalizedPayload !== []) {
            $this->merge($normalizedPayload);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Employee $employee */
        $employee = $this->route('employee');
        $ownerId = $this->user()->accountOwnerId();

        return [
            'full_name' => ['required', 'string', 'max:150'],
            'employee_code' => [
                'required',
                'string',
                'max:30',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('employees', 'employee_code')
                    ->where('user_id', $ownerId)
                    ->ignore($employee->id),
            ],
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => [
                'nullable',
                'email',
                'max:150',
                Rule::unique('employees', 'email')
                    ->where('user_id', $ownerId)
                    ->ignore($employee->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'birth_date' => ['nullable', 'date'],
            'last_education' => ['nullable', 'string', 'max:100'],
            'marital_status' => ['nullable', Rule::in(['single', 'married', 'divorced', 'widowed'])],
            'children_count' => ['nullable', 'integer', 'min:0'],
            'hire_date' => ['required', 'date'],
            'employment_status' => ['required', Rule::in(['active', 'probation', 'on_leave', 'resigned'])],
            'employment_type' => ['required', Rule::in(['permanent', 'contract', 'internship', 'freelance'])],
            'pph21_method' => ['required', Rule::in(['ter_harian', 'gross', 'net', 'gross_up'])],
            'pph21_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'ptkp_category' => ['nullable', Rule::in(['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'])],
            'division_id' => ['required', 'integer', Rule::exists('divisions', 'id')->where('user_id', $ownerId)],
            'position_id' => [
                'required',
                'integer',
                Rule::exists('positions', 'id')->where('user_id', $ownerId),
                function (string $attribute, mixed $value, \Closure $fail) use ($employee, $ownerId): void {
                    $positionLevel = Position::query()->whereKey($value)->value('level');

                    if (! in_array((string) $positionLevel, ['0', '1', '2'], true)) {
                        return;
                    }

                    $isOccupied = Employee::query()
                        ->where('user_id', $ownerId)
                        ->where('position_id', $value)
                        ->whereKeyNot($employee->id)
                        ->exists();

                    if ($isOccupied) {
                        $fail('Jabatan level 0-2 hanya boleh diisi oleh satu orang.');
                    }
                },
            ],
            'manager_id' => [
                'nullable',
                'integer',
                Rule::exists('employees', 'id')->where('user_id', $ownerId),
                Rule::notIn([$employee->id]),
            ],
            'base_salary' => ['nullable', 'numeric', 'min:0'],
            'address' => ['nullable', 'string', 'max:500'],
            'family_card_number' => ['nullable', 'string', 'max:32'],
            'bpjs_kesehatan_number' => ['nullable', 'string', 'max:32'],
            'bpjs_ketenagakerjaan_number' => ['nullable', 'string', 'max:32'],
            'sim_a_number' => ['nullable', 'string', 'max:32'],
            'sim_b_number' => ['nullable', 'string', 'max:32'],
            'sim_c_number' => ['nullable', 'string', 'max:32'],
            'biological_mother_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [];
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
