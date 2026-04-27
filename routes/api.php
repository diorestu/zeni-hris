<?php

use App\Http\Controllers\Api\Mobile\V1\AttendanceController;
use App\Http\Controllers\Api\Mobile\V1\AuthController;
use App\Http\Controllers\Api\Mobile\V1\DashboardController;
use App\Http\Controllers\Api\Mobile\V1\EmployeeController;
use App\Http\Controllers\Api\Mobile\V1\KasbonController;
use App\Http\Controllers\Api\Mobile\V1\LeaveController;
use App\Http\Controllers\Api\Mobile\V1\MasterController;
use App\Http\Controllers\Api\Mobile\V1\OvertimeController;
use App\Http\Controllers\Api\Mobile\V1\PayrollController;
use App\Http\Controllers\Api\Mobile\V1\PortalController;
use Illuminate\Support\Facades\Route;

Route::prefix('mobile/v1')->name('mobile.v1.')->group(function (): void {
    Route::post('auth/login', [AuthController::class, 'login'])->name('auth.login');

    Route::middleware('auth:sanctum,web')->group(function (): void {
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');

        Route::get('dashboard/summary', [DashboardController::class, 'summary'])->name('dashboard.summary');
        Route::get('portal/summary', [PortalController::class, 'summary'])->name('portal.summary');
        Route::get('master/options', [MasterController::class, 'options'])->name('master.options');

        Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
        Route::get('employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');

        Route::get('attendances', [AttendanceController::class, 'index'])->name('attendances.index');
        Route::post('attendances', [AttendanceController::class, 'store'])->name('attendances.store');
        Route::put('attendances/{employeeAttendance}', [AttendanceController::class, 'update'])->name('attendances.update');
        Route::delete('attendances/{employeeAttendance}', [AttendanceController::class, 'destroy'])->name('attendances.destroy');

        Route::get('leaves', [LeaveController::class, 'index'])->name('leaves.index');
        Route::post('leaves', [LeaveController::class, 'store'])->name('leaves.store');
        Route::put('leaves/{leave}', [LeaveController::class, 'update'])->name('leaves.update');
        Route::delete('leaves/{leave}', [LeaveController::class, 'destroy'])->name('leaves.destroy');

        Route::get('overtimes', [OvertimeController::class, 'index'])->name('overtimes.index');
        Route::post('overtimes', [OvertimeController::class, 'store'])->name('overtimes.store');
        Route::put('overtimes/{overtime}', [OvertimeController::class, 'update'])->name('overtimes.update');
        Route::delete('overtimes/{overtime}', [OvertimeController::class, 'destroy'])->name('overtimes.destroy');

        Route::get('kasbons', [KasbonController::class, 'index'])->name('kasbons.index');
        Route::post('kasbons', [KasbonController::class, 'store'])->name('kasbons.store');
        Route::put('kasbons/{employeeDeduction}', [KasbonController::class, 'update'])->name('kasbons.update');
        Route::delete('kasbons/{employeeDeduction}', [KasbonController::class, 'destroy'])->name('kasbons.destroy');

        Route::get('payrolls/preview', [PayrollController::class, 'preview'])->name('payrolls.preview');
        Route::post('payrolls/generate', [PayrollController::class, 'generate'])->name('payrolls.generate');
        Route::post('payrolls/{payrollRun}/save', [PayrollController::class, 'save'])->name('payrolls.save');
    });
});
