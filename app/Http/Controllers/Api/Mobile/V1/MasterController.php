<?php

namespace App\Http\Controllers\Api\Mobile\V1;

use App\Http\Controllers\Api\Concerns\InteractsWithMobileApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Employee;
use App\Models\Position;
use Illuminate\Http\JsonResponse;

class MasterController extends Controller
{
    use InteractsWithMobileApiResponse;

    public function options(): JsonResponse
    {
        $divisions = Division::query()
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'is_active'])
            ->map(fn (Division $division) => [
                'id' => $division->id,
                'code' => $division->code,
                'name' => $division->name,
                'is_active' => $division->is_active,
            ])
            ->values();

        $positions = Position::query()
            ->with(['division:id,name'])
            ->withCount('employees')
            ->orderBy('level')
            ->orderBy('name')
            ->get()
            ->map(fn (Position $position) => [
                'id' => $position->id,
                'division_id' => $position->division_id,
                'division_name' => $position->division?->name,
                'parent_position_id' => $position->parent_position_id,
                'code' => $position->code,
                'name' => $position->name,
                'level' => (string) $position->level,
                'level_label' => match ((string) $position->level) {
                    '0' => 'Direktur Utama',
                    '1' => 'Direktur Divisi',
                    '2' => 'Manager',
                    '3' => 'Senior Staff / Supervisor',
                    '4' => 'Staff',
                    '5' => 'Operator / Pelaksana',
                    default => (string) $position->level,
                },
                'is_active' => $position->is_active,
                'employees_count' => $position->employees_count,
                'is_vacant' => (int) $position->employees_count === 0,
            ])
            ->values();

        $employees = Employee::query()
            ->select(['id', 'employee_code', 'first_name', 'last_name', 'division_id', 'position_id', 'is_active'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'label' => $employee->employee_code.' - '.$employee->full_name,
                'employee_code' => $employee->employee_code,
                'full_name' => $employee->full_name,
                'division_id' => $employee->division_id,
                'position_id' => $employee->position_id,
                'is_active' => $employee->is_active,
            ])
            ->values();

        return $this->success([
            'divisions' => $divisions,
            'positions' => $positions,
            'employees' => $employees,
            'options' => [
                'attendance_statuses' => ['present', 'late', 'on_leave', 'absent'],
                'leave_statuses' => ['pending', 'approved', 'rejected', 'cancelled'],
                'leave_types' => ['annual', 'sick', 'unpaid', 'other'],
                'overtime_statuses' => ['pending', 'approved', 'rejected'],
                'employment_statuses' => ['active', 'probation', 'on_leave', 'resigned'],
                'employment_types' => ['permanent', 'contract', 'internship', 'freelance'],
                'marital_statuses' => ['single', 'married', 'divorced', 'widowed'],
            ],
        ]);
    }
}
