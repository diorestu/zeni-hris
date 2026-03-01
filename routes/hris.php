<?php

use App\Http\Controllers\Hris\AttendanceController;
use App\Http\Controllers\Hris\AttendanceScheduleController;
use App\Http\Controllers\Hris\DivisionController;
use App\Http\Controllers\Hris\EmployeeAllowanceController;
use App\Http\Controllers\Hris\EmployeeBankAccountController;
use App\Http\Controllers\Hris\EmployeeController;
use App\Http\Controllers\Hris\KasbonController;
use App\Http\Controllers\Hris\LeaveController;
use App\Http\Controllers\Hris\OrganizationChartController;
use App\Http\Controllers\Hris\OvertimeController;
use App\Http\Controllers\Hris\PayrollController;
use App\Http\Controllers\Hris\PositionController;
use App\Http\Controllers\Hris\ScheduleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('hris')->name('hris.')->group(function () {
    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::get('employees/export', [EmployeeController::class, 'export'])->name('employees.export');
    Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::get('organization-chart', [OrganizationChartController::class, 'index'])->name('organization-chart.index');

    Route::post('divisions', [DivisionController::class, 'store'])->name('divisions.store');
    Route::put('divisions/{division}', [DivisionController::class, 'update'])->name('divisions.update');
    Route::delete('divisions/{division}', [DivisionController::class, 'destroy'])->name('divisions.destroy');

    Route::post('positions', [PositionController::class, 'store'])->name('positions.store');
    Route::put('positions/{position}', [PositionController::class, 'update'])->name('positions.update');
    Route::delete('positions/{position}', [PositionController::class, 'destroy'])->name('positions.destroy');

    Route::post('employees/{employee}/bank-accounts', [EmployeeBankAccountController::class, 'store'])
        ->name('employees.bank-accounts.store');
    Route::put('employees/{employee}/bank-accounts/{employeeBankAccount}', [EmployeeBankAccountController::class, 'update'])
        ->name('employees.bank-accounts.update');
    Route::delete('employees/{employee}/bank-accounts/{employeeBankAccount}', [EmployeeBankAccountController::class, 'destroy'])
        ->name('employees.bank-accounts.destroy');
    Route::post('employees/{employee}/allowances', [EmployeeAllowanceController::class, 'store'])
        ->name('employees.allowances.store');
    Route::put('employees/{employee}/allowances/{employeeAllowance}', [EmployeeAllowanceController::class, 'update'])
        ->name('employees.allowances.update');

    Route::get('attendances', [AttendanceController::class, 'index'])->name('attendances.index');
    Route::get('attendances/export', [AttendanceController::class, 'export'])->name('attendances.export');
    Route::post('attendances', [AttendanceController::class, 'store'])->name('attendances.store');
    Route::put('attendances/{employeeAttendance}', [AttendanceController::class, 'update'])->name('attendances.update');
    Route::delete('attendances/{employeeAttendance}', [AttendanceController::class, 'destroy'])->name('attendances.destroy');
    Route::post('attendances/schedules', [AttendanceScheduleController::class, 'store'])->name('attendances.schedules.store');

    Route::get('schedules', [ScheduleController::class, 'index'])->name('schedules.index');
    Route::post('schedules', [ScheduleController::class, 'store'])->name('schedules.store');
    Route::post('schedules/roster', [ScheduleController::class, 'roster'])->name('schedules.roster');

    Route::get('payrolls', [PayrollController::class, 'index'])->name('payrolls.index');
    Route::post('payrolls/generate', [PayrollController::class, 'generate'])->name('payrolls.generate');
    Route::post('payrolls/{payrollRun}/save', [PayrollController::class, 'save'])->name('payrolls.save');
    Route::get('kasbons', [KasbonController::class, 'index'])->name('kasbons.index');
    Route::post('kasbons', [KasbonController::class, 'store'])->name('kasbons.store');
    Route::put('kasbons/{employeeDeduction}', [KasbonController::class, 'update'])->name('kasbons.update');
    Route::delete('kasbons/{employeeDeduction}', [KasbonController::class, 'destroy'])->name('kasbons.destroy');

    Route::get('leaves', [LeaveController::class, 'index'])->name('leaves.index');
    Route::get('leaves/export', [LeaveController::class, 'export'])->name('leaves.export');
    Route::post('leaves', [LeaveController::class, 'store'])->name('leaves.store');
    Route::put('leaves/{leave}', [LeaveController::class, 'update'])->name('leaves.update');
    Route::delete('leaves/{leave}', [LeaveController::class, 'destroy'])->name('leaves.destroy');

    Route::get('overtimes', [OvertimeController::class, 'index'])->name('overtimes.index');
    Route::get('overtimes/export', [OvertimeController::class, 'export'])->name('overtimes.export');
    Route::post('overtimes', [OvertimeController::class, 'store'])->name('overtimes.store');
    Route::put('overtimes/{overtime}', [OvertimeController::class, 'update'])->name('overtimes.update');
    Route::delete('overtimes/{overtime}', [OvertimeController::class, 'destroy'])->name('overtimes.destroy');
});
