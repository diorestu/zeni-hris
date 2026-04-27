<?php

namespace App\Http\Requests\Hris;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceScheduleRequest extends FormRequest
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
            'month' => ['required', 'date_format:Y-m'],
            'entries' => ['required', 'array', 'min:1'],
            'entries.*.date' => ['required', 'date'],
            'entries.*.shift_code' => ['required', 'string', Rule::exists('work_shifts', 'code')->where('user_id', $ownerId)],
            'entries.*.start_time' => ['nullable', 'date_format:H:i'],
            'entries.*.end_time' => ['nullable', 'date_format:H:i'],
            'entries.*.is_day_off' => ['sometimes', 'boolean'],
            'entries.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
