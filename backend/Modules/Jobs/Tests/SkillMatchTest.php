<?php

use App\Models\User;
use Modules\Jobs\Models\JobPosting;
use Modules\Students\Models\StudentProfile;

function matchJob(User $employer, array $skills): JobPosting
{
    return JobPosting::create([
        'employer_id'      => $employer->id,
        'title'            => 'Developer',
        'description'      => 'Build things.',
        'skills_required'  => $skills,
        'experience_level' => 'mid',
    ]);
}

function matchProfile(User $student, array $skills): StudentProfile
{
    return StudentProfile::create([
        'user_id'         => $student->id,
        'program'         => 'Computer Science',
        'gpa'             => 3.5,
        'graduation_year' => 2026,
        'skills'          => $skills,
    ]);
}

it('returns a 100% match when student has all required skills', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = matchJob($employer, ['PHP', 'Laravel', 'PostgreSQL']);
    matchProfile($student, ['PHP', 'Laravel', 'PostgreSQL']);

    $response = $this->actingAs($student)->getJson("/api/v1/jobs/{$job->id}/match");

    $response->assertStatus(200)
        ->assertJsonPath('data.score', 100)
        ->assertJsonPath('data.total_matched', 3)
        ->assertJsonCount(0, 'data.missing_skills');
});

it('returns a partial match score when student has some skills', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = matchJob($employer, ['PHP', 'Laravel', 'Vue.js', 'Docker']);
    matchProfile($student, ['PHP', 'Laravel']);

    $response = $this->actingAs($student)->getJson("/api/v1/jobs/{$job->id}/match");

    $response->assertStatus(200)
        ->assertJsonPath('data.score', 50)
        ->assertJsonPath('data.total_matched', 2)
        ->assertJsonCount(2, 'data.missing_skills');
});

it('returns 0% match when student has none of the required skills', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = matchJob($employer, ['Rust', 'Go', 'Kubernetes']);
    matchProfile($student, ['PHP', 'Laravel']);

    $response = $this->actingAs($student)->getJson("/api/v1/jobs/{$job->id}/match");

    $response->assertStatus(200)
        ->assertJsonPath('data.score', 0)
        ->assertJsonPath('data.total_matched', 0);
});

it('is case-insensitive when matching skills', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = matchJob($employer, ['PHP', 'LARAVEL']);
    matchProfile($student, ['php', 'laravel']);

    $response = $this->actingAs($student)->getJson("/api/v1/jobs/{$job->id}/match");

    $response->assertStatus(200)
        ->assertJsonPath('data.score', 100);
});

it('returns 404 when student has no profile', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = matchJob($employer, ['PHP']);

    $response = $this->actingAs($student)->getJson("/api/v1/jobs/{$job->id}/match");

    $response->assertStatus(404);
});

it('prevents employers from checking skill match', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = matchJob($employer, ['PHP']);

    $response = $this->actingAs($employer)->getJson("/api/v1/jobs/{$job->id}/match");

    $response->assertStatus(403);
});
