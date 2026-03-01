<?php

namespace App\Http\Requests\Hris;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
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
        if ($this->has('employee_code')) {
            $this->merge([
                'employee_code' => strtoupper((string) $this->input('employee_code')),
            ]);
        }

        if (($this->input('marital_status') ?? '') === 'single') {
            $this->merge([
                'children_count' => 0,
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
        $ownerId = $this->user()->accountOwnerId();

        return [
            'employee_code' => [
                'nullable',
                'string',
                'max:30',
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => [
                'nullable',
                'email',
                'max:150',
                Rule::unique('employees', 'email')->where('user_id', $ownerId),
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
            'division_id' => ['nullable', 'integer', Rule::exists('divisions', 'id')->where('user_id', $ownerId)],
            'position_id' => [
                'nullable',
                'integer',
                Rule::exists('positions', 'id')->where('user_id', $ownerId),
                Rule::unique('employees', 'position_id')->where('user_id', $ownerId),
            ],
            'manager_id' => ['nullable', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
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
        return [
            'position_id.unique' => 'Jabatan tersebut sudah ditempati karyawan lain. Satu jabatan hanya boleh untuk satu orang.',
        ];
    }
}
