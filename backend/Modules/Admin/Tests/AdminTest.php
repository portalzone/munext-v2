<?php

use App\Models\User;
use Modules\Jobs\Models\JobPosting;

function adminJob(User $employer, array $overrides = []): JobPosting
{
    return JobPosting::create(array_merge([
        'employer_id'      => $employer->id,
        'title'            => 'Admin Test Job',
        'description'      => 'A job for admin tests.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'entry',
        'is_active'        => true,
    ], $overrides));
}

// ── Stats ─────────────────────────────────────────────────────────────────────

it('returns platform stats for admin', function () {
    $admin    = User::factory()->create(['role' => 'admin']);
    $employer = User::factory()->create(['role' => 'employer']);
    adminJob($employer);

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/stats');

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => [
            'total_users', 'total_students', 'total_employers',
            'active_jobs', 'total_jobs', 'total_applications', 'total_categories',
        ]]);

    expect($response->json('data.total_users'))->toBeGreaterThanOrEqual(2)
        ->and($response->json('data.total_jobs'))->toBeGreaterThanOrEqual(1);
});

it('rejects non-admin from stats', function () {
    $student = User::factory()->create(['role' => 'student']);
    $this->actingAs($student)->getJson('/api/v1/admin/stats')->assertStatus(403);
});

it('rejects unauthenticated request to stats', function () {
    $this->getJson('/api/v1/admin/stats')->assertStatus(401);
});

// ── Users ─────────────────────────────────────────────────────────────────────

it('returns paginated user list for admin', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->count(3)->create(['role' => 'student']);

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/users');

    $response->assertStatus(200)
        ->assertJsonStructure(['data', 'pagination' => [
            'total', 'per_page', 'current_page', 'last_page',
        ]]);
});

it('filters users by role', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->count(2)->create(['role' => 'student']);
    User::factory()->create(['role' => 'employer']);

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/users?role=student');

    $response->assertStatus(200);
    $roles = collect($response->json('data'))->pluck('role')->unique()->values()->toArray();
    expect($roles)->toBe(['student']);
});

it('allows admin to toggle user active status', function () {
    $admin  = User::factory()->create(['role' => 'admin']);
    $target = User::factory()->create(['role' => 'student', 'is_active' => true]);

    $response = $this->actingAs($admin)->putJson("/api/v1/admin/users/{$target->id}/toggle");

    $response->assertStatus(200);
    expect($target->fresh()->is_active)->toBeFalse();
});

it('prevents admin from deactivating their own account', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->putJson("/api/v1/admin/users/{$admin->id}/toggle")
        ->assertStatus(422);
});

it('returns 404 when toggling a non-existent user', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->putJson('/api/v1/admin/users/99999/toggle')->assertStatus(404);
});

it('rejects non-admin from user list', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $this->actingAs($employer)->getJson('/api/v1/admin/users')->assertStatus(403);
});

// ── Jobs ──────────────────────────────────────────────────────────────────────

it('returns all jobs for admin including inactive', function () {
    $admin    = User::factory()->create(['role' => 'admin']);
    $employer = User::factory()->create(['role' => 'employer']);
    adminJob($employer, ['is_active' => true]);
    adminJob($employer, ['is_active' => false]);

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/jobs');

    $response->assertStatus(200);
    expect($response->json('pagination.total'))->toBe(2);
});

it('filters admin jobs by status', function () {
    $admin    = User::factory()->create(['role' => 'admin']);
    $employer = User::factory()->create(['role' => 'employer']);
    adminJob($employer, ['is_active' => true]);
    adminJob($employer, ['is_active' => false]);

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/jobs?status=inactive');

    $response->assertStatus(200);
    expect($response->json('pagination.total'))->toBe(1);
});

it('allows admin to toggle job status', function () {
    $admin    = User::factory()->create(['role' => 'admin']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = adminJob($employer, ['is_active' => true]);

    $response = $this->actingAs($admin)->putJson("/api/v1/admin/jobs/{$job->id}/toggle");

    $response->assertStatus(200);
    expect($job->fresh()->is_active)->toBeFalse();
});

it('allows admin to delete a job', function () {
    $admin    = User::factory()->create(['role' => 'admin']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = adminJob($employer);

    $this->actingAs($admin)->deleteJson("/api/v1/admin/jobs/{$job->id}")
        ->assertStatus(200);

    $this->assertDatabaseMissing('job_postings', ['id' => $job->id]);
});

it('rejects non-admin from admin jobs endpoint', function () {
    $student = User::factory()->create(['role' => 'student']);
    $this->actingAs($student)->getJson('/api/v1/admin/jobs')->assertStatus(403);
});

it('rejects unauthenticated request to admin jobs', function () {
    $this->getJson('/api/v1/admin/jobs')->assertStatus(401);
});
