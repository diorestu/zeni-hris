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
        Schema::table('employees', function (Blueprint $table): void {
            $table->string('pph21_method', 30)->default('gross')->after('employment_type');
            $table->decimal('pph21_rate', 5, 2)->default(0)->after('pph21_method');
        });

        Schema::table('payroll_items', function (Blueprint $table): void {
            $table->string('pph21_method', 30)->nullable()->after('allowances_total');
            $table->decimal('pph21_rate', 5, 2)->default(0)->after('pph21_method');
            $table->decimal('pph21_allowance', 15, 2)->default(0)->after('pph21_rate');
            $table->decimal('pph21_deduction', 15, 2)->default(0)->after('pph21_allowance');
            $table->decimal('pph21_company_borne', 15, 2)->default(0)->after('pph21_deduction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table): void {
            $table->dropColumn([
                'pph21_method',
                'pph21_rate',
                'pph21_allowance',
                'pph21_deduction',
                'pph21_company_borne',
            ]);
        });

        Schema::table('employees', function (Blueprint $table): void {
            $table->dropColumn([
                'pph21_method',
                'pph21_rate',
            ]);
        });
    }
};
