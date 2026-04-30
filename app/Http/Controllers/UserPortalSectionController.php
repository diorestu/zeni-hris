<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\User;
use App\Services\PayslipPdfService;
use App\Support\RoleRedirect;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserPortalSectionController extends Controller
{
    public function attendance(Request $request): Response|RedirectResponse
    {
        return $this->renderForUser($request, 'portal/attendance', 'Attendance');
    }

    public function leaves(Request $request): Response|RedirectResponse
    {
        return $this->renderForUser($request, 'portal/leaves', 'Leave');
    }

    public function overtimes(Request $request): Response|RedirectResponse
    {
        return $this->renderForUser($request, 'portal/overtimes', 'Overtime');
    }

    public function payroll(Request $request): Response|RedirectResponse
    {
        return $this->renderForUser($request, 'portal/payroll', 'Payroll');
    }

    public function exportPayslip(HttpRequest $request, PayslipPdfService $payslipPdfService): HttpResponse|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role !== 'user') {
            return redirect()->to(RoleRedirect::for($user));
        }

        $validated = $request->validate([
            'period' => ['nullable', 'date_format:Y-m'],
            'birth_date' => ['required', 'date_format:Y-m-d'],
        ]);

        $period = $validated['period'] ?? now()->format('Y-m');
        $employee = $this->resolveSelfServiceEmployee($user);

        abort_unless($employee !== null, 404);

        if (! $employee->birth_date) {
            throw ValidationException::withMessages([
                'birth_date' => 'Tanggal lahir belum tersedia di profil karyawan.',
            ]);
        }

        if ($employee->birth_date->toDateString() !== $validated['birth_date']) {
            throw ValidationException::withMessages([
                'birth_date' => 'Tanggal lahir tidak sesuai dengan data karyawan.',
            ]);
        }

        $run = PayrollRun::query()
            ->with([
                'items' => fn ($query) => $query
                    ->where('employee_id', $employee->id)
                    ->with('employee:id,employee_code,first_name,last_name,division_id,position_id'),
                'items.employee.division:id,name',
                'items.employee.position:id,name',
            ])
            ->where('period', $period)
            ->first();

        abort_unless($run !== null && $run->items->isNotEmpty(), 404);

        $slip = $run->items->first();

        return $payslipPdfService->download($run, $slip, $user->accountOwnerId());
    }

    private function renderForUser(Request $request, string $page, string $title): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role !== 'user') {
            return redirect()->to(RoleRedirect::for($user));
        }

        return Inertia::render($page, [
            'pageTitle' => $title,
        ]);
    }

    private function resolveSelfServiceEmployee(User $user): ?Employee
    {
        if (! $user->email) {
            return null;
        }

        return Employee::query()
            ->where('email', $user->email)
            ->first();
    }
}
