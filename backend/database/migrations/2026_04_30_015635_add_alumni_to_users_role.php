<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'employer', 'admin', 'alumni'))");
        } else {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student','employer','admin','alumni') NOT NULL DEFAULT 'student'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'employer', 'admin'))");
        } else {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student','employer','admin') NOT NULL DEFAULT 'student'");
        }
    }
};
