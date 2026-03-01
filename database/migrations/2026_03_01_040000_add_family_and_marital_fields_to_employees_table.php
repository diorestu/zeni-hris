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
            $table->string('last_education', 100)->nullable()->after('birth_date');
            $table->string('marital_status', 30)->nullable()->after('last_education');
            $table->unsignedSmallInteger('children_count')->nullable()->after('marital_status');
            $table->string('family_card_number', 32)->nullable()->after('address');
            $table->string('biological_mother_name', 100)->nullable()->after('family_card_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'last_education',
                'marital_status',
                'children_count',
                'family_card_number',
                'biological_mother_name',
            ]);
        });
    }
};
