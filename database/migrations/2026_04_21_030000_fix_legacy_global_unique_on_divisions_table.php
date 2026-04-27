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
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS divisions_name_unique');
            DB::statement('DROP INDEX IF EXISTS divisions_code_unique');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS divisions_user_id_name_unique ON divisions (user_id, name)');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS divisions_user_id_code_unique ON divisions (user_id, code)');

            return;
        }

        if ($driver === 'mysql') {
            try {
                DB::statement('ALTER TABLE divisions DROP INDEX divisions_name_unique');
            } catch (\Throwable $e) {
            }

            try {
                DB::statement('ALTER TABLE divisions DROP INDEX divisions_code_unique');
            } catch (\Throwable $e) {
            }

            try {
                DB::statement('ALTER TABLE divisions DROP INDEX divisions_user_id_name_unique');
            } catch (\Throwable $e) {
            }

            try {
                DB::statement('ALTER TABLE divisions DROP INDEX divisions_user_id_code_unique');
            } catch (\Throwable $e) {
            }

            try {
                DB::statement('ALTER TABLE divisions ADD UNIQUE INDEX divisions_user_id_name_unique (user_id, name)');
            } catch (\Throwable $e) {
            }

            try {
                DB::statement('ALTER TABLE divisions ADD UNIQUE INDEX divisions_user_id_code_unique (user_id, code)');
            } catch (\Throwable $e) {
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS divisions_user_id_name_unique');
            DB::statement('DROP INDEX IF EXISTS divisions_user_id_code_unique');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS divisions_name_unique ON divisions (name)');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS divisions_code_unique ON divisions (code)');

            return;
        }

        if ($driver === 'mysql') {
            try {
                DB::statement('ALTER TABLE divisions DROP INDEX divisions_user_id_name_unique');
            } catch (\Throwable $e) {
            }

            try {
                DB::statement('ALTER TABLE divisions DROP INDEX divisions_user_id_code_unique');
            } catch (\Throwable $e) {
            }

            try {
                DB::statement('ALTER TABLE divisions ADD UNIQUE INDEX divisions_name_unique (name)');
            } catch (\Throwable $e) {
            }

            try {
                DB::statement('ALTER TABLE divisions ADD UNIQUE INDEX divisions_code_unique (code)');
            } catch (\Throwable $e) {
            }
        }
    }
};
