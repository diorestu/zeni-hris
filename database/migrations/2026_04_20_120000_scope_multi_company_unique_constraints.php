<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('divisions', function (Blueprint $table): void {
            $table->unique(['user_id', 'code'], 'divisions_user_id_code_unique');
            $table->unique(['user_id', 'name'], 'divisions_user_id_name_unique');
        });

        Schema::table('positions', function (Blueprint $table): void {
            $table->dropUnique('positions_code_unique');
            $table->unique(['user_id', 'code'], 'positions_user_id_code_unique');
        });

        Schema::table('employees', function (Blueprint $table): void {
            $table->dropUnique('employees_employee_code_unique');
            $table->dropUnique('employees_email_unique');
            $table->unique(['user_id', 'employee_code'], 'employees_user_id_employee_code_unique');
            $table->unique(['user_id', 'email'], 'employees_user_id_email_unique');
        });

        Schema::table('payroll_runs', function (Blueprint $table): void {
            $table->dropUnique('payroll_runs_period_unique');
            $table->unique(['user_id', 'period'], 'payroll_runs_user_id_period_unique');
        });

        Schema::table('company_settings', function (Blueprint $table): void {
            $table->unique(['user_id'], 'company_settings_user_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table): void {
            $table->dropUnique('company_settings_user_id_unique');
        });

        Schema::table('payroll_runs', function (Blueprint $table): void {
            $table->dropUnique('payroll_runs_user_id_period_unique');
            $table->unique('period', 'payroll_runs_period_unique');
        });

        Schema::table('employees', function (Blueprint $table): void {
            $table->dropUnique('employees_user_id_employee_code_unique');
            $table->dropUnique('employees_user_id_email_unique');
            $table->unique('employee_code', 'employees_employee_code_unique');
            $table->unique('email', 'employees_email_unique');
        });

        Schema::table('positions', function (Blueprint $table): void {
            $table->dropUnique('positions_user_id_code_unique');
            $table->unique('code', 'positions_code_unique');
        });

        Schema::table('divisions', function (Blueprint $table): void {
            $table->dropUnique('divisions_user_id_code_unique');
            $table->dropUnique('divisions_user_id_name_unique');
        });
    }
};
