<?php

use App\Http\Controllers\Api\Mobile\V1\AttendanceController;
use App\Http\Controllers\Api\Mobile\V1\LeaveController;
use App\Http\Controllers\Api\Mobile\V1\OvertimeController;
use App\Http\Controllers\Api\Mobile\V1\PayrollController;
use App\Http\Controllers\Api\Mobile\V1\PortalController;
use App\Http\Controllers\Auth\WhatsappActivationController;
use App\Http\Controllers\CareerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserPortalController;
use App\Http\Controllers\UserPortalSectionController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('careers', [CareerController::class, 'index'])->name('careers.index');
Route::get('careers/{slug}', [CareerController::class, 'show'])->name('careers.show');
Route::post('careers/{slug}/apply', [CareerController::class, 'storeApplication'])->name('careers.apply');

Route::middleware('auth')->group(function () {
    Route::get('activate-account', [WhatsappActivationController::class, 'show'])->name('activation.notice');
    Route::post('activate-account/send', [WhatsappActivationController::class, 'send'])->name('activation.send');
    Route::post('activate-account/verify', [WhatsappActivationController::class, 'verify'])->name('activation.verify');
});

Route::middleware(['auth', 'account.activated', 'admin.access'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

Route::middleware(['auth', 'account.activated'])->group(function () {
    Route::get('portal', UserPortalController::class)->name('portal.index');
    Route::get('portal/api/summary', [PortalController::class, 'summary'])->name('portal.api.summary');
    Route::get('portal/api/attendances', [AttendanceController::class, 'index'])->name('portal.api.attendances.index');
    Route::post('portal/api/attendances', [AttendanceController::class, 'store'])->name('portal.api.attendances.store');
    Route::put('portal/api/attendances/{employeeAttendance}', [AttendanceController::class, 'update'])->name('portal.api.attendances.update');
    Route::delete('portal/api/attendances/{employeeAttendance}', [AttendanceController::class, 'destroy'])->name('portal.api.attendances.destroy');
    Route::get('portal/api/leaves', [LeaveController::class, 'index'])->name('portal.api.leaves.index');
    Route::post('portal/api/leaves', [LeaveController::class, 'store'])->name('portal.api.leaves.store');
    Route::put('portal/api/leaves/{leave}', [LeaveController::class, 'update'])->name('portal.api.leaves.update');
    Route::delete('portal/api/leaves/{leave}', [LeaveController::class, 'destroy'])->name('portal.api.leaves.destroy');
    Route::get('portal/api/overtimes', [OvertimeController::class, 'index'])->name('portal.api.overtimes.index');
    Route::post('portal/api/overtimes', [OvertimeController::class, 'store'])->name('portal.api.overtimes.store');
    Route::put('portal/api/overtimes/{overtime}', [OvertimeController::class, 'update'])->name('portal.api.overtimes.update');
    Route::delete('portal/api/overtimes/{overtime}', [OvertimeController::class, 'destroy'])->name('portal.api.overtimes.destroy');
    Route::get('portal/api/payrolls/preview', [PayrollController::class, 'preview'])->name('portal.api.payrolls.preview');
    Route::get('portal/attendance', [UserPortalSectionController::class, 'attendance'])->name('portal.attendance');
    Route::get('portal/leaves', [UserPortalSectionController::class, 'leaves'])->name('portal.leaves');
    Route::get('portal/overtimes', [UserPortalSectionController::class, 'overtimes'])->name('portal.overtimes');
    Route::get('portal/payroll', [UserPortalSectionController::class, 'payroll'])->name('portal.payroll');
    Route::get('portal/payroll/export', [UserPortalSectionController::class, 'exportPayslip'])->name('portal.payroll.export');
});

require __DIR__.'/hris.php';
require __DIR__.'/settings.php';
