<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'divisions',
            'positions',
            'employees',
            'employee_bank_accounts',
            'employee_attendances',
            'employee_schedules',
            'leave_requests',
            'overtime_requests',
            'employee_allowances',
            'employee_deductions',
            'payroll_runs',
            'payroll_items',
            'company_settings',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            });
        }

        $ownerId = DB::table('users')->orderBy('id')->value('id');

        if ($ownerId !== null) {
            foreach ($tables as $tableName) {
                DB::table($tableName)
                    ->whereNull('user_id')
                    ->update(['user_id' => $ownerId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'divisions',
            'positions',
            'employees',
            'employee_bank_accounts',
            'employee_attendances',
            'employee_schedules',
            'leave_requests',
            'overtime_requests',
            'employee_allowances',
            'employee_deductions',
            'payroll_runs',
            'payroll_items',
            'company_settings',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('user_id');
            });
        }
    }
};
