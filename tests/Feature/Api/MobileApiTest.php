<?php

namespace Tests\Feature\Api;

use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Models\Position;
use App\Models\User;
use App\Models\WorkShift;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MobileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_login_returns_token_and_authenticated_user_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'mobile@example.com',
            'password' => 'password',
            'email_verified_at' => now(),
        ]);

        $loginResponse = $this->postJson('/api/mobile/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'device_name' => 'android-test',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'token_type',
                    'access_token',
                    'user' => ['id', 'name', 'email', 'role', 'account_owner_id'],
                ],
            ]);

        $token = $loginResponse->json('data.access_token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/mobile/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_mobile_api_requires_sanctum_token_for_protected_endpoints(): void
    {
        $this->getJson('/api/mobile/v1/employees')
            ->assertUnauthorized();
    }

    public function test_mobile_employee_list_is_scoped_to_account_owner(): void
    {
        $owner = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $subUser = User::factory()->create([
            'parent_user_id' => $owner->id,
            'role' => 'staff',
            'email_verified_at' => now(),
        ]);

        $otherOwner = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $ownerDivision = Division::factory()->create([
            'user_id' => $owner->id,
            'name' => 'Owner Division',
        ]);

        $ownerPosition = Position::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $ownerDivision->id,
            'name' => 'Owner Position',
            'level' => '2',
        ]);

        $ownerEmployee = Employee::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $ownerDivision->id,
            'position_id' => $ownerPosition->id,
            'employee_code' => 'EMP-OWN1',
            'first_name' => 'Owner',
            'last_name' => 'Employee',
        ]);

        $otherDivision = Division::factory()->create([
            'user_id' => $otherOwner->id,
            'name' => 'Other Division',
        ]);

        $otherPosition = Position::factory()->create([
            'user_id' => $otherOwner->id,
            'division_id' => $otherDivision->id,
            'name' => 'Other Position',
            'level' => '2',
        ]);

        Employee::factory()->create([
            'user_id' => $otherOwner->id,
            'division_id' => $otherDivision->id,
            'position_id' => $otherPosition->id,
            'employee_code' => 'EMP-OTH1',
            'first_name' => 'Other',
            'last_name' => 'Employee',
        ]);

        Sanctum::actingAs($subUser, ['mobile']);

        $response = $this->getJson('/api/mobile/v1/employees');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.id', $ownerEmployee->id)
            ->assertJsonPath('data.items.0.employee_code', 'EMP-OWN1');
    }

    public function test_self_service_payroll_preview_only_returns_the_logged_in_employee_item(): void
    {
        $owner = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $subUser = User::factory()->create([
            'email' => 'staff@example.com',
            'parent_user_id' => $owner->id,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $owner->id,
        ]);

        $position = Position::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $division->id,
            'level' => '2',
        ]);

        $selfEmployee = Employee::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'email' => 'staff@example.com',
        ]);

        $otherEmployee = Employee::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'email' => 'other@example.com',
        ]);

        $run = PayrollRun::factory()->create([
            'user_id' => $owner->id,
            'period' => now()->format('Y-m'),
        ]);

        PayrollItem::query()->create([
            'user_id' => $owner->id,
            'payroll_run_id' => $run->id,
            'employee_id' => $selfEmployee->id,
            'base_salary' => 5000000,
            'allowances_total' => 250000,
            'kasbon_deduction' => 0,
            'denda_deduction' => 0,
            'deductions_total' => 0,
            'net_salary' => 5250000,
            'allowance_breakdown' => [],
        ]);

        PayrollItem::query()->create([
            'user_id' => $owner->id,
            'payroll_run_id' => $run->id,
            'employee_id' => $otherEmployee->id,
            'base_salary' => 8000000,
            'allowances_total' => 500000,
            'kasbon_deduction' => 0,
            'denda_deduction' => 0,
            'deductions_total' => 0,
            'net_salary' => 8500000,
            'allowance_breakdown' => [],
        ]);

        Sanctum::actingAs($subUser, ['mobile']);

        $this->getJson('/api/mobile/v1/payrolls/preview?period='.now()->format('Y-m'))
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.employee_id', $selfEmployee->id);
    }

    public function test_portal_summary_exposes_shift_options_and_open_attendance(): void
    {
        $owner = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $subUser = User::factory()->create([
            'email' => 'staff@example.com',
            'parent_user_id' => $owner->id,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $owner->id,
        ]);

        $position = Position::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $division->id,
            'level' => '2',
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'email' => 'staff@example.com',
        ]);

        $shift = WorkShift::query()->create([
            'user_id' => $owner->id,
            'code' => 'SHIFT-1',
            'name' => 'Pagi',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'is_day_off' => false,
        ]);

        EmployeeAttendance::query()->create([
            'user_id' => $owner->id,
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'attendance_date' => today()->subDay()->toDateString(),
            'status' => 'present',
            'check_in_at' => today()->subDay()->setTime(8, 5),
            'check_in_latitude' => -6.2,
            'check_in_longitude' => 106.8,
        ]);

        Sanctum::actingAs($subUser, ['mobile']);

        $response = $this->getJson('/api/mobile/v1/portal/summary');

        $response
            ->assertOk()
            ->assertJsonPath('data.shift_options.0.id', $shift->id)
            ->assertJsonPath('data.quick_action.can_clock_out', true)
            ->assertJsonPath('data.quick_action.open_attendance.id', EmployeeAttendance::query()->first()->id);
    }

    public function test_self_service_attendance_flow_stores_location_and_updates_open_record(): void
    {
        $owner = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $subUser = User::factory()->create([
            'email' => 'staff@example.com',
            'parent_user_id' => $owner->id,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $owner->id,
        ]);

        $position = Position::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $division->id,
            'level' => '2',
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'email' => 'staff@example.com',
        ]);

        $shift = WorkShift::query()->create([
            'user_id' => $owner->id,
            'code' => 'SHIFT-1',
            'name' => 'Pagi',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'is_day_off' => false,
        ]);

        Sanctum::actingAs($subUser, ['mobile']);

        $storeResponse = $this->postJson('/api/mobile/v1/attendances', [
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'attendance_date' => today()->toDateString(),
            'status' => 'present',
            'check_in_at' => today()->setTime(8, 0)->toIso8601String(),
            'check_in_latitude' => -6.20001,
            'check_in_longitude' => 106.81667,
        ]);

        $storeResponse
            ->assertCreated()
            ->assertJsonPath('data.check_in_latitude', '-6.2000100');

        $attendance = EmployeeAttendance::query()->firstOrFail();

        $this->putJson('/api/mobile/v1/attendances/'.$attendance->id, [
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'attendance_date' => today()->toDateString(),
            'status' => 'present',
            'check_in_at' => today()->setTime(8, 0)->toIso8601String(),
            'check_out_at' => today()->setTime(17, 0)->toIso8601String(),
            'check_out_latitude' => -6.20002,
            'check_out_longitude' => 106.81668,
        ])
            ->assertOk()
            ->assertJsonPath('data.check_out_latitude', '-6.2000200');

        $this->assertDatabaseCount('employee_attendances', 1);
        $this->assertDatabaseHas('employee_attendances', [
            'id' => $attendance->id,
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
        ]);
    }

    public function test_clock_out_is_blocked_after_three_days(): void
    {
        $owner = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $subUser = User::factory()->create([
            'email' => 'staff@example.com',
            'parent_user_id' => $owner->id,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $owner->id,
        ]);

        $position = Position::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $division->id,
            'level' => '2',
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $owner->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'email' => 'staff@example.com',
        ]);

        $shift = WorkShift::query()->create([
            'user_id' => $owner->id,
            'code' => 'SHIFT-1',
            'name' => 'Pagi',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'is_day_off' => false,
        ]);

        $attendance = EmployeeAttendance::query()->create([
            'user_id' => $owner->id,
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'attendance_date' => Carbon::today()->subDays(4)->toDateString(),
            'status' => 'present',
            'check_in_at' => Carbon::today()->subDays(4)->setTime(8, 0),
            'check_in_latitude' => -6.2,
            'check_in_longitude' => 106.8,
        ]);

        Sanctum::actingAs($subUser, ['mobile']);

        $this->putJson('/api/mobile/v1/attendances/'.$attendance->id, [
            'employee_id' => $employee->id,
            'shift_id' => $shift->id,
            'attendance_date' => Carbon::today()->subDays(4)->toDateString(),
            'status' => 'present',
            'check_in_at' => Carbon::today()->subDays(4)->setTime(8, 0)->toIso8601String(),
            'check_out_at' => Carbon::today()->toIso8601String(),
            'check_out_latitude' => -6.20002,
            'check_out_longitude' => 106.81668,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false);
    }
}
