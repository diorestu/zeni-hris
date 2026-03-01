<?php

namespace Tests\Feature\Hris;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkforceModulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_users_can_open_attendance_schedule_leave_and_overtime_pages()
    {
        $this->withoutVite();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)->get(route('hris.attendances.index'))->assertOk();
        $this->actingAs($user)->get(route('hris.schedules.index'))->assertOk();
        $this->actingAs($user)->get(route('hris.leaves.index'))->assertOk();
        $this->actingAs($user)->get(route('hris.overtimes.index'))->assertOk();
    }

    public function test_monthly_schedule_can_be_saved_per_employee()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create();

        $response = $this->actingAs($user)->post(route('hris.attendances.schedules.store'), [
            'employee_id' => $employee->id,
            'month' => '2026-02',
            'entries' => [
                [
                    'date' => '2026-02-02',
                    'shift_code' => 'SHIFT_A',
                    'start_time' => '08:00',
                    'end_time' => '17:00',
                    'is_day_off' => false,
                    'notes' => null,
                ],
                [
                    'date' => '2026-02-03',
                    'shift_code' => 'OFF',
                    'start_time' => null,
                    'end_time' => null,
                    'is_day_off' => true,
                    'notes' => 'Libur mingguan',
                ],
            ],
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('employee_schedules', [
            'employee_id' => $employee->id,
            'work_date' => '2026-02-02',
            'shift_code' => 'SHIFT_A',
            'is_day_off' => false,
        ]);

        $this->assertDatabaseHas('employee_schedules', [
            'employee_id' => $employee->id,
            'work_date' => '2026-02-03',
            'shift_code' => 'OFF',
            'is_day_off' => true,
        ]);
    }

    public function test_leave_and_overtime_records_can_be_created()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create();

        $this->actingAs($user)->post(route('hris.leaves.store'), [
            'employee_id' => $employee->id,
            'leave_type' => 'annual',
            'start_date' => '2026-02-10',
            'end_date' => '2026-02-12',
            'reason' => 'Family event',
            'status' => 'approved',
            'rejection_reason' => null,
        ])->assertRedirect();

        $this->assertDatabaseHas('leave_requests', [
            'employee_id' => $employee->id,
            'leave_type' => 'annual',
            'total_days' => 3,
            'status' => 'approved',
        ]);

        $this->actingAs($user)->post(route('hris.overtimes.store'), [
            'employee_id' => $employee->id,
            'work_date' => '2026-02-15',
            'start_time' => '18:00',
            'end_time' => '21:00',
            'break_minutes' => 30,
            'reason' => 'Production release',
            'status' => 'approved',
            'notes' => null,
        ])->assertRedirect();

        $this->assertDatabaseHas('overtime_requests', [
            'employee_id' => $employee->id,
            'total_hours' => 2.5,
            'status' => 'approved',
        ]);
    }

    public function test_roster_shift_can_be_generated_for_date_range()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $employee = Employee::factory()->create();

        $this->actingAs($user)->post(route('hris.schedules.roster'), [
            'employee_id' => $employee->id,
            'start_date' => '2026-02-01',
            'end_date' => '2026-02-04',
            'pattern' => ['SHIFT_A', 'SHIFT_B', 'OFF'],
        ])->assertRedirect();

        $this->assertDatabaseHas('employee_schedules', [
            'employee_id' => $employee->id,
            'work_date' => '2026-02-01',
            'shift_code' => 'SHIFT_A',
            'is_day_off' => false,
        ]);

        $this->assertDatabaseHas('employee_schedules', [
            'employee_id' => $employee->id,
            'work_date' => '2026-02-02',
            'shift_code' => 'SHIFT_B',
            'is_day_off' => false,
        ]);

        $this->assertDatabaseHas('employee_schedules', [
            'employee_id' => $employee->id,
            'work_date' => '2026-02-03',
            'shift_code' => 'OFF',
            'is_day_off' => true,
        ]);

        $this->assertDatabaseHas('employee_schedules', [
            'employee_id' => $employee->id,
            'work_date' => '2026-02-04',
            'shift_code' => 'SHIFT_A',
            'is_day_off' => false,
        ]);
    }
}
