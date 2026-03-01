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
        Schema::table('employees', function (Blueprint $table) {
            $table->string('bpjs_kesehatan_number', 32)->nullable()->after('family_card_number');
            $table->string('bpjs_ketenagakerjaan_number', 32)->nullable()->after('bpjs_kesehatan_number');
            $table->string('sim_a_number', 32)->nullable()->after('bpjs_ketenagakerjaan_number');
            $table->string('sim_b_number', 32)->nullable()->after('sim_a_number');
            $table->string('sim_c_number', 32)->nullable()->after('sim_b_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'bpjs_kesehatan_number',
                'bpjs_ketenagakerjaan_number',
                'sim_a_number',
                'sim_b_number',
                'sim_c_number',
            ]);
        });
    }
};
