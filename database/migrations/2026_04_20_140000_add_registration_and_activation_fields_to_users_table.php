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
        Schema::table('users', function (Blueprint $table): void {
            $table->string('company_name')->nullable()->after('name');
            $table->string('phone', 30)->nullable()->after('email');
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            $table->string('whatsapp_otp_code')->nullable()->after('phone_verified_at');
            $table->timestamp('whatsapp_otp_sent_at')->nullable()->after('whatsapp_otp_code');
            $table->timestamp('whatsapp_otp_expires_at')->nullable()->after('whatsapp_otp_sent_at');

            $table->unique('phone');
        });

        DB::table('users')
            ->whereNull('phone_verified_at')
            ->update([
                'company_name' => DB::raw('COALESCE(company_name, name)'),
                'phone_verified_at' => DB::raw('COALESCE(email_verified_at, created_at)'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique('users_phone_unique');
            $table->dropColumn([
                'company_name',
                'phone',
                'phone_verified_at',
                'whatsapp_otp_code',
                'whatsapp_otp_sent_at',
                'whatsapp_otp_expires_at',
            ]);
        });
    }
};
