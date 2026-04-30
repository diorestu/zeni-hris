<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\JobVacancy;
use App\Models\PayrollRun;
use App\Models\Position;
use App\Models\User;
use App\Support\RoleRedirect;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display dashboard with HRIS overview and attendance chart.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role === 'user') {
            return redirect()->to(RoleRedirect::for($user));
        }

        $validated = $request->validate([
            'range' => ['nullable', 'in:today,this_week,this_month'],
        ]);

        $activeRange = $validated['range'] ?? 'this_week';
        $today = Carbon::today();
        $startDate = match ($activeRange) {
            'today' => $today->copy(),
            'this_month' => $today->copy()->startOfMonth(),
            default => $today->copy()->startOfWeek(),
        };

        $totalEmployees = Employee::query()->count();
        $activeEmployees = Employee::query()->where('is_active', true)->count();
        $totalDivisions = Division::query()->count();
        $totalPositions = Position::query()->count();
        $openPositions = (int) JobVacancy::query()
            ->where('status', 'published')
            ->where(function ($query) use ($today): void {
                $query->whereNull('closing_date')
                    ->orWhereDate('closing_date', '>=', $today);
            })
            ->sum('openings');

        $monthlyPayrollBurn = (float) (PayrollRun::query()
            ->where('period', $today->format('Y-m'))
            ->latest('generated_at')
            ->value('total_net_salary') ?? 0);

        $resignedYtd = Employee::query()
            ->where('employment_status', 'resigned')
            ->whereYear('updated_at', $today->year)
            ->count();

        $attritionYtd = ($activeEmployees + $resignedYtd) > 0
            ? round(($resignedYtd / ($activeEmployees + $resignedYtd)) * 100, 1)
            : 0;

        $todayAttendance = EmployeeAttendance::query()
            ->selectRaw('status, COUNT(*) as total')
            ->whereDate('attendance_date', $today)
            ->groupBy('status')
            ->pluck('total', 'status');

        $presentToday = (int) ($todayAttendance['present'] ?? 0);
        $lateToday = (int) ($todayAttendance['late'] ?? 0);
        $onLeaveToday = (int) ($todayAttendance['on_leave'] ?? 0);

        $fallbackAbsent = max($activeEmployees - ($presentToday + $lateToday + $onLeaveToday), 0);
        $absentToday = (int) ($todayAttendance['absent'] ?? $fallbackAbsent);

        $todayRate = $activeEmployees > 0
            ? round((($presentToday + $lateToday) / $activeEmployees) * 100, 1)
            : 0;

        $dailyRaw = EmployeeAttendance::query()
            ->selectRaw('attendance_date, status, COUNT(*) as total')
            ->whereBetween('attendance_date', [$startDate->toDateString(), $today->toDateString()])
            ->groupBy('attendance_date', 'status')
            ->orderBy('attendance_date')
            ->get();

        $dailyGrouped = $dailyRaw->groupBy(
            fn (EmployeeAttendance $attendance) => $attendance->attendance_date->toDateString()
        );

        $dates = collect();
        $cursor = $startDate->copy();

        while ($cursor->lte($today)) {
            $dates->push($cursor->copy());
            $cursor->addDay();
        }

        $attendanceChart = $dates->map(function (Carbon $date) use ($dailyGrouped, $activeEmployees) {
            $dateKey = $date->toDateString();
            $rows = collect($dailyGrouped->get($dateKey, []));
            $counts = $rows->pluck('total', 'status');

            $present = (int) ($counts['present'] ?? 0);
            $late = (int) ($counts['late'] ?? 0);
            $onLeave = (int) ($counts['on_leave'] ?? 0);
            $fallbackAbsent = max($activeEmployees - ($present + $late + $onLeave), 0);
            $absent = (int) ($counts['absent'] ?? $fallbackAbsent);

            $attendanceRate = $activeEmployees > 0
                ? round((($present + $late) / $activeEmployees) * 100, 1)
                : 0;

            return [
                'date' => $dateKey,
                'label' => $date->format('d M'),
                'present' => $present,
                'late' => $late,
                'on_leave' => $onLeave,
                'absent' => $absent,
                'attendance_rate' => $attendanceRate,
            ];
        });

        return Inertia::render('dashboard', [
            'filters' => [
                'range' => $activeRange,
            ],
            'stats' => [
                'total_employees' => $totalEmployees,
                'active_employees' => $activeEmployees,
                'total_divisions' => $totalDivisions,
                'total_positions' => $totalPositions,
                'present_today' => $presentToday,
                'late_today' => $lateToday,
                'on_leave_today' => $onLeaveToday,
                'absent_today' => $absentToday,
                'open_positions' => $openPositions,
                'monthly_payroll_burn' => $monthlyPayrollBurn,
                'attrition_ytd' => $attritionYtd,
                'resigned_ytd' => $resignedYtd,
                'today_attendance_rate' => $todayRate,
            ],
            'attendanceChart' => $attendanceChart,
        ]);
    }
}
