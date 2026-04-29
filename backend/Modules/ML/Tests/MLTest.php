<?php

use App\Models\User;
use Modules\Jobs\Models\Application;
use Modules\Jobs\Models\JobPosting;
use Modules\Students\Models\StudentProfile;

// ── Helpers ──────────────────────────────────────────────────────────────────

function mlJob(User $employer, array $overrides = []): JobPosting
{
    return JobPosting::create(array_merge([
        'employer_id'      => $employer->id,
        'title'            => 'ML Test Job',
        'description'      => 'A job for ML tests.',
        'skills_required'  => ['PHP', 'Laravel', 'PostgreSQL'],
        'experience_level' => 'mid',
        'category'         => 'Engineering',
        'salary_min'       => 50000,
        'salary_max'       => 80000,
        'is_active'        => true,
    ], $overrides));
}

function mlProfile(User $student, array $overrides = []): StudentProfile
{
    return StudentProfile::create(array_merge([
        'user_id'         => $student->id,
        'program'         => 'Computer Science',
        'gpa'             => 3.8,
        'graduation_year' => 2026,
        'skills'          => ['PHP', 'Laravel'],
    ], $overrides));
}

// ── Algorithm 1 — Skill Match ─────────────────────────────────────────────────

it('returns skill match score for a student against a job', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    mlProfile($student, ['skills' => ['PHP', 'Laravel']]);
    $job = mlJob($employer);

    $response = $this->actingAs($student)->getJson("/api/v1/ml/match/{$job->id}");

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => ['score', 'matched_skills', 'missing_skills', 'extra_skills']]);

    // PHP + Laravel matched, PostgreSQL missing → Jaccard = 2/3 = 67
    expect($response->json('data.score'))->toBe(67)
        ->and($response->json('data.matched_skills'))->toContain('php')
        ->and($response->json('data.missing_skills'))->toContain('postgresql');
});

it('returns score of 0 when student has no skills', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    mlProfile($student, ['skills' => []]);
    $job = mlJob($employer);

    $response = $this->actingAs($student)->getJson("/api/v1/ml/match/{$job->id}");

    $response->assertStatus(200);
    expect($response->json('data.score'))->toBe(0);
});

it('rejects unauthenticated request to skill match', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = mlJob($employer);

    $this->getJson("/api/v1/ml/match/{$job->id}")->assertStatus(401);
});

it('rejects employer from accessing skill match', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = mlJob($employer);

    $this->actingAs($employer)->getJson("/api/v1/ml/match/{$job->id}")->assertStatus(403);
});

it('returns 404 when job does not exist for skill match', function () {
    $student = User::factory()->create(['role' => 'student']);

    $this->actingAs($student)->getJson('/api/v1/ml/match/99999')->assertStatus(404);
});

// ── Algorithm 2 — Profile Strength ───────────────────────────────────────────

it('returns profile strength score for a student', function () {
    $student = User::factory()->create(['role' => 'student']);
    mlProfile($student, ['skills' => ['PHP', 'Laravel', 'Vue', 'MySQL', 'Git']]);

    $response = $this->actingAs($student)->getJson('/api/v1/ml/profile-strength');

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => ['score', 'label', 'breakdown' => [
            'completeness', 'skills', 'resume', 'activity',
        ]]]);

    expect($response->json('data.score'))->toBeGreaterThan(0);
});

it('returns weak score when student has no profile', function () {
    $student = User::factory()->create(['role' => 'student']);

    $response = $this->actingAs($student)->getJson('/api/v1/ml/profile-strength');

    $response->assertStatus(200);
    expect($response->json('data.score'))->toBe(0)
        ->and($response->json('data.label'))->toBe('Weak');
});

it('rejects unauthenticated request to profile strength', function () {
    $this->getJson('/api/v1/ml/profile-strength')->assertStatus(401);
});

it('rejects employer from accessing profile strength', function () {
    $employer = User::factory()->create(['role' => 'employer']);

    $this->actingAs($employer)->getJson('/api/v1/ml/profile-strength')->assertStatus(403);
});

// ── Algorithm 3 — Hiring Funnel ───────────────────────────────────────────────

it('returns hiring funnel data for an employer', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $student  = User::factory()->create(['role' => 'student']);
    $job      = mlJob($employer);

    Application::create([
        'student_id' => $student->id,
        'job_id'     => $job->id,
        'status'     => 'shortlisted',
    ]);

    $response = $this->actingAs($employer)->getJson('/api/v1/ml/funnel');

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => ['jobs']]);

    $funnel = collect($response->json('data.jobs'))->firstWhere('job_id', $job->id);
    expect($funnel)->not->toBeNull()
        ->and($funnel['stages']['applied'])->toBe(1)
        ->and($funnel['stages']['shortlisted'])->toBe(1);
});

it('returns empty jobs array when employer has no postings', function () {
    $employer = User::factory()->create(['role' => 'employer']);

    $response = $this->actingAs($employer)->getJson('/api/v1/ml/funnel');

    $response->assertStatus(200);
    expect($response->json('data.jobs'))->toBeEmpty();
});

it('rejects unauthenticated request to hiring funnel', function () {
    $this->getJson('/api/v1/ml/funnel')->assertStatus(401);
});

it('rejects student from accessing hiring funnel', function () {
    $student = User::factory()->create(['role' => 'student']);

    $this->actingAs($student)->getJson('/api/v1/ml/funnel')->assertStatus(403);
});

// ── Algorithm 4 — Success Predictor ──────────────────────────────────────────

it('returns success prediction for a student against a job', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    mlProfile($student, ['skills' => ['PHP', 'Laravel']]);
    $job = mlJob($employer);

    $response = $this->actingAs($student)->getJson("/api/v1/ml/predict/{$job->id}");

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => [
            'probability', 'confidence', 'factors', 'suggestions',
        ]]);

    expect($response->json('data.probability'))->toBeGreaterThanOrEqual(0)
        ->and($response->json('data.probability'))->toBeLessThanOrEqual(100);
});

it('returns zero probability when job does not exist for predictor', function () {
    $student = User::factory()->create(['role' => 'student']);

    $response = $this->actingAs($student)->getJson('/api/v1/ml/predict/99999');

    $response->assertStatus(200);
    expect($response->json('data.probability'))->toBe(0);
});

it('rejects unauthenticated request to success predictor', function () {
    $this->getJson('/api/v1/ml/predict/1')->assertStatus(401);
});

it('rejects employer from accessing success predictor', function () {
    $employer = User::factory()->create(['role' => 'employer']);

    $this->actingAs($employer)->getJson('/api/v1/ml/predict/1')->assertStatus(403);
});

// ── Algorithm 5 — Market Trends ───────────────────────────────────────────────

it('returns market trend data for an admin', function () {
    $admin    = User::factory()->create(['role' => 'admin']);
    $employer = User::factory()->create(['role' => 'employer']);
    mlJob($employer);

    $response = $this->actingAs($admin)->getJson('/api/v1/ml/trends');

    $response->assertStatus(200)
        ->assertJsonStructure(['data' => [
            'top_skills', 'salary_by_category', 'category_trends',
        ]]);
});

it('returns empty collections when no jobs exist for trends', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->getJson('/api/v1/ml/trends');

    $response->assertStatus(200);
    expect($response->json('data.top_skills'))->toBeEmpty()
        ->and($response->json('data.category_trends'))->toBeEmpty();
});

it('rejects unauthenticated request to market trends', function () {
    $this->getJson('/api/v1/ml/trends')->assertStatus(401);
});

it('rejects student from accessing market trends', function () {
    $student = User::factory()->create(['role' => 'student']);

    $this->actingAs($student)->getJson('/api/v1/ml/trends')->assertStatus(403);
});
