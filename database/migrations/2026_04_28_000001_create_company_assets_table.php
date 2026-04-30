<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('asset_code', 50);
            $table->string('name', 150);
            $table->string('category', 80)->nullable();
            $table->string('brand', 80)->nullable();
            $table->string('model', 100)->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->string('purchase_proof_path')->nullable();
            $table->string('purchase_proof_original_name')->nullable();
            $table->string('condition', 30)->default('good');
            $table->string('status', 30)->default('available');
            $table->unsignedSmallInteger('useful_life_months')->default(36);
            $table->decimal('salvage_value', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'asset_code']);
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_assets');
    }
};
