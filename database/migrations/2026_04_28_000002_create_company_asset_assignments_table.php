<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_asset_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('company_asset_id')->constrained('company_assets')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('issued_at');
            $table->date('returned_at')->nullable();
            $table->string('condition_out', 30)->default('good');
            $table->string('condition_in', 30)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'employee_id']);
            $table->index(['company_asset_id', 'returned_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_asset_assignments');
    }
};
