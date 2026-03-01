<?php

namespace App\Http\Requests\Hris;

use App\Models\Employee;
use App\Models\EmployeeBankAccount;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeBankAccountRequest extends FormRequest
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
        if ($this->has('currency')) {
            $this->merge([
                'currency' => strtoupper((string) $this->input('currency')),
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
        /** @var Employee $employee */
        $employee = $this->route('employee');

        /** @var EmployeeBankAccount $employeeBankAccount */
        $employeeBankAccount = $this->route('employeeBankAccount');

        return [
            'bank_name' => ['required', 'string', 'max:100'],
            'account_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('employee_bank_accounts', 'account_number')
                    ->where(fn ($query) => $query->where('employee_id', $employee->id))
                    ->ignore($employeeBankAccount->id),
            ],
            'account_holder_name' => ['required', 'string', 'max:100'],
            'branch' => ['nullable', 'string', 'max:100'],
            'currency' => ['required', 'string', 'size:3'],
            'is_primary' => ['sometimes', 'boolean'],
        ];
    }
}
