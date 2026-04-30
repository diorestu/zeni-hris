<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\JobVacancy;
use App\Models\PayrollRun;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_sub_user_is_redirected_to_portal_when_opening_dashboard(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertRedirect(route('portal.index'));
    }

    public function test_dashboard_widgets_use_dynamic_hris_metrics(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $firstEmployee = Employee::factory()->create([
            'user_id' => $user->id,
            'is_active' => true,
            'employment_status' => 'active',
        ]);
        $secondEmployee = Employee::factory()->create([
            'user_id' => $user->id,
            'is_active' => true,
            'employment_status' => 'active',
        ]);
        Employee::factory()->create([
            'user_id' => $user->id,
            'is_active' => false,
            'employment_status' => 'resigned',
            'updated_at' => now(),
        ]);

        EmployeeAttendance::factory()->create([
            'user_id' => $user->id,
            'employee_id' => $firstEmployee->id,
            'attendance_date' => now()->toDateString(),
            'status' => 'present',
        ]);
        EmployeeAttendance::factory()->create([
            'user_id' => $user->id,
            'employee_id' => $secondEmployee->id,
            'attendance_date' => now()->toDateString(),
            'status' => 'on_leave',
        ]);

        JobVacancy::query()->create([
            'user_id' => $user->id,
            'title' => 'Backend Engineer',
            'slug' => 'backend-engineer-dashboard-test',
            'status' => 'published',
            'openings' => 6,
            'closing_date' => now()->addWeek()->toDateString(),
        ]);
        JobVacancy::query()->create([
            'user_id' => $user->id,
            'title' => 'Closed Role',
            'slug' => 'closed-role-dashboard-test',
            'status' => 'closed',
            'openings' => 4,
            'closing_date' => now()->addWeek()->toDateString(),
        ]);

        PayrollRun::factory()->create([
            'user_id' => $user->id,
            'period' => now()->format('Y-m'),
            'total_net_salary' => 612_000_000,
            'generated_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('dashboard')
                ->where('stats.total_employees', 3)
                ->where('stats.present_today', 1)
                ->where('stats.on_leave_today', 1)
                ->where('stats.open_positions', 6)
                ->where('stats.monthly_payroll_burn', 612000000)
                ->where('stats.attrition_ytd', 33.3)
                ->where('stats.resigned_ytd', 1)
            );
    }
}
