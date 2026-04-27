<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\LeaveRequest;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Models\Position;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PortalPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_user_can_open_portal_page(): void
    {
        $this->withoutVite();

        $user = User::factory()->create([
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('portal.index'))
            ->assertOk();
    }

    public function test_admin_is_redirected_to_dashboard_when_opening_portal_page(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('portal.index'))
            ->assertRedirect(route('dashboard'));
    }

    public function test_verified_user_can_open_self_service_pages(): void
    {
        $this->withoutVite();

        $user = User::factory()->create([
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user);

        $this->get(route('portal.attendance'))->assertOk();
        $this->get(route('portal.leaves'))->assertOk();
        $this->get(route('portal.overtimes'))->assertOk();
        $this->get(route('portal.payroll'))->assertOk();
    }

    public function test_user_cannot_access_admin_routes(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertRedirect(route('portal.index'));

        $this->actingAs($user)
            ->get(route('settings.users.index'))
            ->assertRedirect(route('portal.index'));

        $this->actingAs($user)
            ->get(route('hris.employees.index'))
            ->assertRedirect(route('portal.index'));
    }

    public function test_portal_summary_api_returns_user_focused_payload(): void
    {
        $user = User::factory()->create([
            'name' => 'Portal User',
            'email' => 'portal@example.com',
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->id,
            'name' => 'Operations',
        ]);

        $position = Position::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'name' => 'Coordinator',
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'division_id' => $division->id,
            'position_id' => $position->id,
            'email' => $user->email,
            'employment_status' => 'active',
            'employment_type' => 'permanent',
        ]);

        EmployeeAttendance::factory()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'attendance_date' => today()->toDateString(),
            'status' => 'present',
        ]);

        LeaveRequest::factory()->create([
            'user_id' => $user->id,
            'employee_id' => $employee->id,
            'leave_type' => 'annual',
            'start_date' => today()->copy()->addDay()->toDateString(),
            'end_date' => today()->copy()->addDays(2)->toDateString(),
            'total_days' => 2,
            'status' => 'approved',
        ]);

        $run = PayrollRun::factory()->create([
            'user_id' => $user->id,
            'period' => now()->format('Y-m'),
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
            'is_saved' => false,
        ]);

        PayrollItem::query()->create([
            'user_id' => $user->id,
            'payroll_run_id' => $run->id,
            'employee_id' => $employee->id,
            'base_salary' => 6000000,
            'allowances_total' => 500000,
            'kasbon_deduction' => 0,
            'denda_deduction' => 0,
            'deductions_total' => 0,
            'net_salary' => 6500000,
            'allowance_breakdown' => ['Transport' => 500000],
        ]);

        $response = $this->actingAs($user)
            ->getJson(route('portal.api.summary'));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'portal@example.com')
            ->assertJsonPath('data.employee.email', 'portal@example.com')
            ->assertJsonPath('data.quick_action.attendance.status', 'present')
            ->assertJsonPath('data.cards.annual_leave_days', 2)
            ->assertJsonPath('data.cards.payroll_preview.period', now()->format('Y-m'));
    }

    public function test_portal_summary_uses_browser_timezone_for_attendance_times(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-23 03:51:00', 'UTC'));

        try {
            $user = User::factory()->create([
                'name' => 'Portal User',
                'email' => 'portal@example.com',
                'email_verified_at' => now(),
            ]);

            $division = Division::factory()->create([
                'user_id' => $user->id,
                'name' => 'Operations',
            ]);

            $position = Position::factory()->create([
                'user_id' => $user->id,
                'division_id' => $division->id,
                'name' => 'Coordinator',
            ]);

            $employee = Employee::factory()->create([
                'user_id' => $user->id,
                'division_id' => $division->id,
                'position_id' => $position->id,
                'email' => $user->email,
                'employment_status' => 'active',
                'employment_type' => 'permanent',
            ]);

            EmployeeAttendance::factory()->create([
                'user_id' => $user->id,
                'employee_id' => $employee->id,
                'attendance_date' => '2026-04-23',
                'status' => 'present',
                'check_in_at' => Carbon::parse('2026-04-23 03:51:00', 'UTC'),
                'check_out_at' => Carbon::parse('2026-04-23 12:00:00', 'UTC'),
            ]);

            $response = $this->actingAs($user)
                ->withHeader('X-Timezone', 'Asia/Makassar')
                ->getJson(route('portal.api.summary'));

            $response
                ->assertOk()
                ->assertJsonPath('data.quick_action.attendance.check_in_at', '2026-04-23T11:51:00+08:00')
                ->assertJsonPath('data.quick_action.attendance.check_out_at', '2026-04-23T20:00:00+08:00');
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_user_can_export_own_payslip_pdf(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'email' => 'portal@example.com',
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'name' => 'Operations',
        ]);

        $position = Position::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'division_id' => $division->id,
            'name' => 'Coordinator',
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'division_id' => $division->id,
            'position_id' => $position->id,
            'email' => $user->email,
            'birth_date' => '1995-05-12',
            'employment_status' => 'active',
        ]);

        $run = PayrollRun::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'period' => now()->format('Y-m'),
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
            'is_saved' => true,
        ]);

        PayrollItem::query()->create([
            'user_id' => $user->accountOwnerId(),
            'payroll_run_id' => $run->id,
            'employee_id' => $employee->id,
            'base_salary' => 6000000,
            'allowances_total' => 500000,
            'kasbon_deduction' => 0,
            'denda_deduction' => 0,
            'deductions_total' => 0,
            'net_salary' => 6500000,
            'allowance_breakdown' => ['Transport' => 500000],
        ]);

        $this->actingAs($user)
            ->get(route('portal.payroll.export', [
                'period' => now()->format('Y-m'),
                'birth_date' => '1995-05-12',
            ]))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_user_cannot_export_payslip_without_birth_date_verification(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'email' => 'portal@example.com',
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'name' => 'Operations',
        ]);

        $position = Position::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'division_id' => $division->id,
            'name' => 'Coordinator',
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'division_id' => $division->id,
            'position_id' => $position->id,
            'email' => $user->email,
            'birth_date' => '1995-05-12',
            'employment_status' => 'active',
        ]);

        $run = PayrollRun::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'period' => now()->format('Y-m'),
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
            'is_saved' => true,
        ]);

        PayrollItem::query()->create([
            'user_id' => $user->accountOwnerId(),
            'payroll_run_id' => $run->id,
            'employee_id' => $employee->id,
            'base_salary' => 6000000,
            'allowances_total' => 500000,
            'kasbon_deduction' => 0,
            'denda_deduction' => 0,
            'deductions_total' => 0,
            'net_salary' => 6500000,
            'allowance_breakdown' => ['Transport' => 500000],
        ]);

        $this->actingAs($user)
            ->getJson(route('portal.payroll.export', ['period' => now()->format('Y-m')]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['birth_date']);
    }

    public function test_user_cannot_export_payslip_with_wrong_birth_date(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'email' => 'portal@example.com',
            'email_verified_at' => now(),
        ]);

        $division = Division::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'name' => 'Operations',
        ]);

        $position = Position::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'division_id' => $division->id,
            'name' => 'Coordinator',
        ]);

        $employee = Employee::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'division_id' => $division->id,
            'position_id' => $position->id,
            'email' => $user->email,
            'birth_date' => '1995-05-12',
            'employment_status' => 'active',
        ]);

        $run = PayrollRun::factory()->create([
            'user_id' => $user->accountOwnerId(),
            'period' => now()->format('Y-m'),
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
            'is_saved' => true,
        ]);

        PayrollItem::query()->create([
            'user_id' => $user->accountOwnerId(),
            'payroll_run_id' => $run->id,
            'employee_id' => $employee->id,
            'base_salary' => 6000000,
            'allowances_total' => 500000,
            'kasbon_deduction' => 0,
            'denda_deduction' => 0,
            'deductions_total' => 0,
            'net_salary' => 6500000,
            'allowance_breakdown' => ['Transport' => 500000],
        ]);

        $this->actingAs($user)
            ->getJson(route('portal.payroll.export', [
                'period' => now()->format('Y-m'),
                'birth_date' => '1990-01-01',
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['birth_date']);
    }
}
