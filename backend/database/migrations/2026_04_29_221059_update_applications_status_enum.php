<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop existing check constraint if present, then re-add with updated values.
        // Using raw SQL because ->change() on enum generates invalid syntax on PostgreSQL.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check");
            DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired'))");
        } else {
            DB::statement("ALTER TABLE applications MODIFY COLUMN status ENUM('pending','reviewed','shortlisted','rejected','hired') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check");
            DB::statement("ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected'))");
        } else {
            DB::statement("ALTER TABLE applications MODIFY COLUMN status ENUM('pending','reviewed','accepted','rejected') NOT NULL DEFAULT 'pending'");
        }
    }
};
