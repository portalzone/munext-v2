<?php

use App\Models\User;
use Modules\Jobs\Models\Bookmark;
use Modules\Jobs\Models\JobPosting;

function bookmarkJob(User $employer, array $overrides = []): JobPosting
{
    return JobPosting::create(array_merge([
        'employer_id'      => $employer->id,
        'title'            => 'Bookmark Test Job',
        'description'      => 'A job for bookmark tests.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'entry',
        'is_active'        => true,
    ], $overrides));
}

// ── Toggle ────────────────────────────────────────────────────────────────────

it('allows a student to bookmark a job', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = bookmarkJob($employer);

    $response = $this->actingAs($student)->postJson("/api/v1/jobs/{$job->id}/bookmark");

    $response->assertStatus(201);
    expect($response->json('data.bookmarked'))->toBeTrue();
    $this->assertDatabaseHas('bookmarks', ['student_id' => $student->id, 'job_id' => $job->id]);
});

it('removes bookmark when toggled a second time', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = bookmarkJob($employer);
    Bookmark::create(['student_id' => $student->id, 'job_id' => $job->id]);

    $response = $this->actingAs($student)->postJson("/api/v1/jobs/{$job->id}/bookmark");

    $response->assertStatus(200);
    expect($response->json('data.bookmarked'))->toBeFalse();
    $this->assertDatabaseMissing('bookmarks', ['student_id' => $student->id, 'job_id' => $job->id]);
});

it('rejects employer from bookmarking a job', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = bookmarkJob($employer);

    $this->actingAs($employer)->postJson("/api/v1/jobs/{$job->id}/bookmark")->assertStatus(403);
});

it('rejects unauthenticated request to bookmark', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = bookmarkJob($employer);

    $this->postJson("/api/v1/jobs/{$job->id}/bookmark")->assertStatus(401);
});

// ── Status ────────────────────────────────────────────────────────────────────

it('returns bookmark status for a job', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = bookmarkJob($employer);
    Bookmark::create(['student_id' => $student->id, 'job_id' => $job->id]);

    $response = $this->actingAs($student)->getJson("/api/v1/jobs/{$job->id}/bookmark");

    $response->assertStatus(200);
    expect($response->json('data.bookmarked'))->toBeTrue();
});

it('returns false when job is not bookmarked', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = bookmarkJob($employer);

    $response = $this->actingAs($student)->getJson("/api/v1/jobs/{$job->id}/bookmark");

    $response->assertStatus(200);
    expect($response->json('data.bookmarked'))->toBeFalse();
});

// ── List ──────────────────────────────────────────────────────────────────────

it('returns a list of bookmarked jobs for a student', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = bookmarkJob($employer);
    Bookmark::create(['student_id' => $student->id, 'job_id' => $job->id]);

    $response = $this->actingAs($student)->getJson('/api/v1/jobs/bookmarks');

    $response->assertStatus(200)
        ->assertJsonStructure(['data']);

    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.id'))->toBe($job->id);
});

it('returns empty list when student has no bookmarks', function () {
    $student = User::factory()->create(['role' => 'student']);

    $response = $this->actingAs($student)->getJson('/api/v1/jobs/bookmarks');

    $response->assertStatus(200);
    expect($response->json('data'))->toBeEmpty();
});

it('rejects employer from viewing bookmarks', function () {
    $employer = User::factory()->create(['role' => 'employer']);

    $this->actingAs($employer)->getJson('/api/v1/jobs/bookmarks')->assertStatus(403);
});
