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
        Schema::table('job_postings', function (Blueprint $table) {
            $table->string('category')->nullable()->after('experience_level');
            $table->unsignedInteger('salary_min')->nullable()->after('category');
            $table->unsignedInteger('salary_max')->nullable()->after('salary_min');
            $table->boolean('is_active')->default(true)->after('salary_max');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropColumn(['category', 'salary_min', 'salary_max', 'is_active']);
        });
    }
};
