<?php

namespace App\Http\Requests\Hris;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePayrollKasbonRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $ownerId = $this->user()?->accountOwnerId();

        return [
            'employee_id' => [
                'required',
                'integer',
                Rule::exists('employees', 'id')->where('user_id', $ownerId),
            ],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'deduction_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:255'],
            'period' => ['nullable', 'date_format:Y-m'],
        ];
    }
}
