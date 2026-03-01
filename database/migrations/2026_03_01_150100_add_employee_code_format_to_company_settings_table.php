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
        Schema::table('company_settings', function (Blueprint $table) {
            $table->string('employee_code_prefix', 12)->default('EMP')->after('details');
            $table->unsignedTinyInteger('employee_code_digits')->default(4)->after('employee_code_prefix');
            $table->unsignedInteger('employee_code_next_number')->default(1)->after('employee_code_digits');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn([
                'employee_code_prefix',
                'employee_code_digits',
                'employee_code_next_number',
            ]);
        });
    }
};
