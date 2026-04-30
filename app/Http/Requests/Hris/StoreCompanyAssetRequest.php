<?php

namespace App\Http\Requests\Hris;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompanyAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $ownerId = $this->user()?->accountOwnerId();

        return [
            'asset_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('company_assets', 'asset_code')->where('user_id', $ownerId),
            ],
            'name' => ['required', 'string', 'max:150'],
            'category' => ['nullable', 'string', 'max:80'],
            'brand' => ['nullable', 'string', 'max:80'],
            'model' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'purchase_proof' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:4096'],
            'condition' => ['required', Rule::in(['new', 'good', 'fair', 'damaged'])],
            'status' => ['required', Rule::in(['available', 'assigned', 'maintenance', 'retired', 'lost'])],
            'useful_life_months' => ['required', 'integer', 'min:1', 'max:600'],
            'salvage_value' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'employee_id' => [
                'nullable',
                'integer',
                Rule::exists('employees', 'id')->where('user_id', $ownerId),
            ],
            'issued_at' => ['nullable', 'required_with:employee_id', 'date'],
            'returned_at' => ['nullable', 'date', 'after_or_equal:issued_at'],
            'condition_out' => ['nullable', Rule::in(['new', 'good', 'fair', 'damaged'])],
            'condition_in' => ['nullable', Rule::in(['new', 'good', 'fair', 'damaged'])],
            'assignment_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
