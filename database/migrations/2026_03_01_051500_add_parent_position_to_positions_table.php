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
        Schema::table('positions', function (Blueprint $table) {
            $table->foreignId('parent_position_id')
                ->nullable()
                ->after('division_id')
                ->constrained('positions')
                ->nullOnDelete();

            $table->index(['division_id', 'parent_position_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            $table->dropIndex(['division_id', 'parent_position_id', 'name']);
            $table->dropConstrainedForeignId('parent_position_id');
        });
    }
};
