<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('analytics_skills_demand')) {
            Schema::create('analytics_skills_demand', function (Blueprint $table) {
                $table->id();
                $table->string('skill');
                $table->unsignedInteger('count')->default(0);
                $table->enum('trend', ['up', 'down', 'stable'])->default('stable');
                $table->timestamp('computed_at')->nullable();
            });
        }

        if (!Schema::hasTable('analytics_hiring_trends')) {
            Schema::create('analytics_hiring_trends', function (Blueprint $table) {
                $table->id();
                $table->string('month', 7);
                $table->unsignedInteger('job_count')->default(0);
                $table->unsignedInteger('application_count')->default(0);
                $table->timestamp('computed_at')->nullable();
            });
        }

        if (!Schema::hasTable('analytics_jobs_summary')) {
            Schema::create('analytics_jobs_summary', function (Blueprint $table) {
                $table->id();
                $table->string('category')->nullable();
                $table->string('job_type')->nullable();
                $table->string('experience_level')->nullable();
                $table->unsignedInteger('job_count')->default(0);
                $table->unsignedInteger('avg_salary_min')->default(0);
                $table->unsignedInteger('avg_salary_max')->default(0);
                $table->timestamp('computed_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_jobs_summary');
        Schema::dropIfExists('analytics_hiring_trends');
        Schema::dropIfExists('analytics_skills_demand');
    }
};
