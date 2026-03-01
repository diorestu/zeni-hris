<?php

namespace App\Http\Requests\Hris;

use App\Models\EmployeeAttendance;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceRequest extends FormRequest
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
        /** @var EmployeeAttendance $attendance */
        $attendance = $this->route('employeeAttendance');
        $ownerId = $this->user()->accountOwnerId();

        return [
            'employee_id' => ['required', 'integer', Rule::exists('employees', 'id')->where('user_id', $ownerId)],
            'attendance_date' => [
                'required',
                'date',
                Rule::unique('employee_attendances', 'attendance_date')
                    ->where(fn ($query) => $query
                        ->where('employee_id', $this->integer('employee_id'))
                        ->where('user_id', $ownerId))
                    ->ignore($attendance->id),
            ],
            'status' => ['required', Rule::in(['present', 'late', 'on_leave', 'absent'])],
            'check_in_at' => ['nullable', 'date'],
            'check_out_at' => ['nullable', 'date', 'after_or_equal:check_in_at'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
