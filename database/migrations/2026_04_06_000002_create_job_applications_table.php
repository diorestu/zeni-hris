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
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('job_vacancy_id')->constrained('job_vacancies')->cascadeOnDelete();
            $table->string('full_name');
            $table->string('email');
            $table->string('phone', 30);
            $table->date('birth_date')->nullable();
            $table->text('address')->nullable();
            $table->string('last_education', 100)->nullable();
            $table->decimal('years_experience', 5, 1)->nullable();
            $table->string('current_company')->nullable();
            $table->decimal('expected_salary', 15, 2)->nullable();
            $table->string('portfolio_url')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->text('cover_letter')->nullable();
            $table->string('resume_path')->nullable();
            $table->string('resume_original_name')->nullable();
            $table->string('stage', 30)->default('applied');
            $table->timestamp('interview_scheduled_at')->nullable();
            $table->timestamp('interviewed_at')->nullable();
            $table->text('interview_notes')->nullable();
            $table->text('recruiter_notes')->nullable();
            $table->decimal('offered_salary', 15, 2)->nullable();
            $table->date('proposed_start_date')->nullable();
            $table->string('employment_type', 30)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'stage']);
            $table->index(['job_vacancy_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
