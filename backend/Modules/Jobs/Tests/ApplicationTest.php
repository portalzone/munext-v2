<?php

use App\Models\User;
use Modules\Jobs\Models\Application;
use Modules\Jobs\Models\JobPosting;

function makeJob(User $employer): JobPosting
{
    return JobPosting::create([
        'employer_id'      => $employer->id,
        'title'            => 'Developer',
        'description'      => 'Build things.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'entry',
    ]);
}

// --- Apply ---

it('allows a student to apply to a job', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = makeJob($employer);

    $response = $this->actingAs($student)->postJson("/api/v1/jobs/{$job->id}/apply");

    $response->assertStatus(201)
        ->assertJsonPath('data.status', 'pending');

    $this->assertDatabaseHas('applications', [
        'student_id' => $student->id,
        'job_id'     => $job->id,
    ]);
});

it('prevents an employer from applying to a job', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = makeJob($employer);

    $response = $this->actingAs($employer)->postJson("/api/v1/jobs/{$job->id}/apply");

    $response->assertStatus(403);
});

it('prevents a student from applying to the same job twice', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = makeJob($employer);

    Application::create(['student_id' => $student->id, 'job_id' => $job->id, 'status' => 'pending']);

    $response = $this->actingAs($student)->postJson("/api/v1/jobs/{$job->id}/apply");

    $response->assertStatus(409);
});

// --- View Applicants ---

it('allows the job owner to view applicants', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = makeJob($employer);

    Application::create(['student_id' => $student->id, 'job_id' => $job->id, 'status' => 'pending']);

    $response = $this->actingAs($employer)->getJson("/api/v1/jobs/{$job->id}/applicants");

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('prevents a student from viewing applicants', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = makeJob($employer);

    $response = $this->actingAs($student)->getJson("/api/v1/jobs/{$job->id}/applicants");

    $response->assertStatus(403);
});

// --- Update Status ---

it('allows the job owner to update application status', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = makeJob($employer);
    $app      = Application::create(['student_id' => $student->id, 'job_id' => $job->id, 'status' => 'pending']);

    $response = $this->actingAs($employer)->putJson("/api/v1/jobs/{$job->id}/applicants/{$app->id}", [
        'status' => 'shortlisted',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'shortlisted');
});

it('prevents invalid status values', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = makeJob($employer);
    $app      = Application::create(['student_id' => $student->id, 'job_id' => $job->id, 'status' => 'pending']);

    $response = $this->actingAs($employer)->putJson("/api/v1/jobs/{$job->id}/applicants/{$app->id}", [
        'status' => 'promoted',
    ]);

    $response->assertStatus(422);
});

// --- My Applications ---

it('allows a student to view their own applications', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = makeJob($employer);

    Application::create(['student_id' => $student->id, 'job_id' => $job->id, 'status' => 'pending']);

    $response = $this->actingAs($student)->getJson('/api/v1/my-applications');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});
