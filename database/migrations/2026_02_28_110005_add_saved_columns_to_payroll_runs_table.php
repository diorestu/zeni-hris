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
        Schema::table('payroll_runs', function (Blueprint $table) {
            $table->boolean('is_saved')->default(false)->after('generated_by');
            $table->timestamp('saved_at')->nullable()->after('is_saved');
            $table->foreignId('saved_by')->nullable()->after('saved_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_runs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('saved_by');
            $table->dropColumn(['is_saved', 'saved_at']);
        });
    }
};

