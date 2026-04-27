<?php

namespace App\Http\Requests\Hris;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreScheduleRosterRequest extends FormRequest
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
        $ownerId = $this->user()->accountOwnerId();

        return [
            'employee_id' => ['required', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'pattern' => ['required', 'array', 'min:1'],
            'pattern.*' => [
                'required',
                'string',
                Rule::exists('work_shifts', 'code')->where('user_id', $ownerId),
            ],
        ];
    }
}
