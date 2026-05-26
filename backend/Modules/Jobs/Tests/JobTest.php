<?php

use App\Models\User;
use Modules\Jobs\Models\JobPosting;

// Helper to create a job posting for an employer
function createJob(User $employer, array $overrides = []): JobPosting
{
    return JobPosting::create(array_merge([
        'employer_id'      => $employer->id,
        'title'            => 'Software Engineer',
        'description'      => 'Build cool things.',
        'skills_required'  => ['PHP', 'Laravel'],
        'experience_level' => 'mid',
    ], $overrides));
}

// --- Index ---

it('allows any authenticated user to view all job postings', function () {
    $student = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    createJob($employer);

    $response = $this->actingAs($student)->getJson('/api/v1/jobs');

    $response->assertStatus(200)
        ->assertJsonStructure(['data', 'message', 'status']);
});

it('allows unauthenticated users to view job postings', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    createJob($employer);

    $response = $this->getJson('/api/v1/jobs');

    $response->assertStatus(200)
        ->assertJsonStructure(['data', 'pagination']);
});

// --- Show ---

it('allows any authenticated user to view a single job posting', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = createJob($employer);

    $response = $this->actingAs($student)->getJson("/api/v1/jobs/{$job->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.id', $job->id);
});

// --- Store ---

it('allows an employer to create a job posting', function () {
    $employer = User::factory()->create(['role' => 'employer', 'employer_approved' => true]);

    $response = $this->actingAs($employer)->postJson('/api/v1/jobs', [
        'title'            => 'Backend Developer',
        'description'      => 'Laravel experience required.',
        'skills_required'  => ['PHP', 'PostgreSQL'],
        'experience_level' => 'entry',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.title', 'Backend Developer');

    $this->assertDatabaseHas('job_postings', ['title' => 'Backend Developer']);
});

it('prevents a student from creating a job posting', function () {
    $student = User::factory()->create(['role' => 'student']);

    $response = $this->actingAs($student)->postJson('/api/v1/jobs', [
        'title'            => 'Backend Developer',
        'description'      => 'Laravel experience required.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'entry',
    ]);

    $response->assertStatus(403);
});

it('prevents an unapproved employer from creating a job posting', function () {
    $employer = User::factory()->create(['role' => 'employer']);

    $response = $this->actingAs($employer)->postJson('/api/v1/jobs', [
        'title'            => 'Backend Developer',
        'description'      => 'Laravel experience required.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'entry',
    ]);

    $response->assertStatus(403);
});

it('fails to create a job posting when required fields are missing', function () {
    $employer = User::factory()->create(['role' => 'employer', 'employer_approved' => true]);

    $response = $this->actingAs($employer)->postJson('/api/v1/jobs', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['title', 'description', 'skills_required', 'experience_level']);
});

// --- Update ---

it('allows an employer to update their own job posting', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = createJob($employer);

    $response = $this->actingAs($employer)->putJson("/api/v1/jobs/{$job->id}", [
        'title' => 'Senior Backend Developer',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.title', 'Senior Backend Developer');
});

it('prevents an employer from updating another employer\'s job posting', function () {
    $employer1 = User::factory()->create(['role' => 'employer']);
    $employer2 = User::factory()->create(['role' => 'employer']);
    $job       = createJob($employer1);

    $response = $this->actingAs($employer2)->putJson("/api/v1/jobs/{$job->id}", [
        'title' => 'Hacked Title',
    ]);

    $response->assertStatus(403);
});

it('prevents a student from updating a job posting', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = createJob($employer);

    $response = $this->actingAs($student)->putJson("/api/v1/jobs/{$job->id}", [
        'title' => 'Hacked Title',
    ]);

    $response->assertStatus(403);
});

// --- Destroy ---

it('allows an employer to delete their own job posting', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = createJob($employer);

    $response = $this->actingAs($employer)->deleteJson("/api/v1/jobs/{$job->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('job_postings', ['id' => $job->id]);
});

it('prevents an employer from deleting another employer\'s job posting', function () {
    $employer1 = User::factory()->create(['role' => 'employer']);
    $employer2 = User::factory()->create(['role' => 'employer']);
    $job       = createJob($employer1);

    $response = $this->actingAs($employer2)->deleteJson("/api/v1/jobs/{$job->id}");

    $response->assertStatus(403);
});

it('prevents a student from deleting a job posting', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = createJob($employer);

    $response = $this->actingAs($student)->deleteJson("/api/v1/jobs/{$job->id}");

    $response->assertStatus(403);
});
