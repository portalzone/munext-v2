<?php

use App\Models\User;
use App\Services\MLService;
use Modules\Jobs\Models\Application;
use Modules\Jobs\Models\JobPosting;
use Modules\Students\Models\StudentProfile;

uses(\Tests\TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->ml       = new MLService();
    $this->employer = User::factory()->create(['role' => 'employer']);
    $this->student  = User::factory()->create(['role' => 'student']);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function predictJob(int $employerId, array $skills = ['PHP', 'Laravel', 'PostgreSQL']): JobPosting
{
    return JobPosting::create([
        'employer_id'      => $employerId,
        'title'            => 'Predict Test Job',
        'description'      => 'Success predictor test.',
        'skills_required'  => $skills,
        'experience_level' => 'mid',
        'is_active'        => true,
    ]);
}

function predictProfile(int $userId, array $overrides = []): StudentProfile
{
    return StudentProfile::create(array_merge([
        'user_id'         => $userId,
        'program'         => '',
        'gpa'             => 0.0,
        'graduation_year' => 0,
        'skills'          => [],
        'resume_path'     => null,
    ], $overrides));
}

function hireApps(int $studentId, int $jobId, int $hired, int $total): void
{
    for ($i = 0; $i < $hired; $i++) {
        $s = User::factory()->create(['role' => 'student']);
        Application::create(['student_id' => $s->id, 'job_id' => $jobId, 'status' => 'hired']);
    }
    for ($i = 0; $i < ($total - $hired); $i++) {
        $s = User::factory()->create(['role' => 'student']);
        Application::create(['student_id' => $s->id, 'job_id' => $jobId, 'status' => 'pending']);
    }
}

// ══════════════════════════════════════════════════════
// BOUNDARY VALUE ANALYSIS
// ══════════════════════════════════════════════════════

it('[BVA-ALG4-01] returns probability 0 and confidence No data when job does not exist', function () {
    $result = $this->ml->successPredictor($this->student, 99999);
    expect($result['probability'])->toBe(0)
        ->and($result['confidence'])->toBe('No data');
});

it('[BVA-ALG4-02] default selectivity is 50 when employer has no application history', function () {
    // matchScore=0, profileScore=0, hireRate=50 (default) → round(0+0+20) = 20
    predictProfile($this->student->id);
    $job    = predictJob($this->employer->id, ['Rust', 'Go']);
    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);

    expect($result['probability'])->toBe(20)
        ->and($result['factors']['selectivity'])->toBe(50);
});

it('[BVA-ALG4-03] probability is 0 when all three factors are zero', function () {
    // No profile, no skills, employer has 0% hire rate
    predictProfile($this->student->id);
    $job = predictJob($this->employer->id, ['Rust']);
    hireApps($this->student->id, $job->id, 0, 10); // 10 apps, 0 hired

    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    expect($result['probability'])->toBe(0);
});

it('[BVA-ALG4-04] probability is 100 when all three factors are at maximum', function () {
    // Full skill match (100) + perfect profile (100) + 100% hire rate (100)
    // round(100*0.35 + 100*0.25 + 100*0.40) = 100
    $skills = array_map(fn($i) => "skill-{$i}", range(1, 10));
    predictProfile($this->student->id, [
        'program'         => 'CS',
        'gpa'             => 3.9,
        'graduation_year' => 2026,
        'skills'          => $skills,
        'resume_path'     => '/storage/resumes/cv.pdf',
    ]);
    $job = predictJob($this->employer->id, $skills);

    // selectivity: 10/10 hired for main employer's job
    for ($i = 0; $i < 10; $i++) {
        $s = User::factory()->create(['role' => 'student']);
        Application::create(['student_id' => $s->id, 'job_id' => $job->id, 'status' => 'hired']);
    }

    // activity: student's 10 applications go to a DIFFERENT employer so main employer's rate stays 100%
    $activityEmployer = User::factory()->create(['role' => 'employer']);
    for ($i = 0; $i < 10; $i++) {
        $activityJob = predictJob($activityEmployer->id);
        Application::create(['student_id' => $this->student->id, 'job_id' => $activityJob->id, 'status' => 'pending']);
    }

    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    expect($result['probability'])->toBe(100)->and($result['confidence'])->toBe('High');
});

it('[BVA-ALG4-05] employer with 100% hire rate (10/10 hired) produces selectivity of 100', function () {
    predictProfile($this->student->id);
    $job = predictJob($this->employer->id, ['Rust']);
    hireApps($this->student->id, $job->id, 10, 10); // 10/10 hired

    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    expect($result['factors']['selectivity'])->toBe(100);
});

it('[BVA-ALG4-06] employer with 0% hire rate (0/10 hired) produces selectivity of 0', function () {
    predictProfile($this->student->id);
    $job = predictJob($this->employer->id, ['Rust']);
    hireApps($this->student->id, $job->id, 0, 10); // 0/10 hired

    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    expect($result['factors']['selectivity'])->toBe(0);
});

it('[BVA-ALG4-07] confidence is High when probability is exactly 70', function () {
    // matchScore=100 (PHP→PHP), profileScore=3 (1 skill→round(1/10*25)=3), hireRate=85% (17/20)
    // round(100*0.35 + 3*0.25 + 85*0.40) = round(35 + 0.75 + 34) = round(69.75) = 70
    $job = predictJob($this->employer->id, ['PHP']);
    predictProfile($this->student->id, ['skills' => ['PHP']]);
    hireApps($this->student->id, $job->id, 17, 20);

    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    expect($result['probability'])->toBe(70)->and($result['confidence'])->toBe('High');
});

it('[BVA-ALG4-08] confidence is Medium when probability is exactly 40 — lower boundary', function () {
    // matchScore=0, profileScore=0, hireRate=100 → round(0+0+40) = 40
    predictProfile($this->student->id);
    $job = predictJob($this->employer->id, ['Rust']);
    hireApps($this->student->id, $job->id, 10, 10);

    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    expect($result['probability'])->toBe(40)->and($result['confidence'])->toBe('Medium');
});

it('[BVA-ALG4-09] confidence is Low when probability is below 40', function () {
    // matchScore=0, profileScore=0, hireRate=50 (default, no history) → round(0+0+20) = 20
    predictProfile($this->student->id);
    $job    = predictJob($this->employer->id, ['Rust']);
    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);

    expect($result['probability'])->toBe(20)->and($result['confidence'])->toBe('Low');
});

// ══════════════════════════════════════════════════════
// EQUIVALENCE PARTITIONING
// ══════════════════════════════════════════════════════

it('[EP-ALG4-01] probability is always in [0, 100]', function () {
    predictProfile($this->student->id, ['skills' => ['PHP']]);
    $job    = predictJob($this->employer->id, ['PHP', 'Laravel']);
    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    expect($result['probability'])->toBeGreaterThanOrEqual(0)->toBeLessThanOrEqual(100);
});

it('[EP-ALG4-02] student with no profile still returns a valid response with probability >= 0', function () {
    $job    = predictJob($this->employer->id);
    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    expect($result)->toHaveKey('probability')
        ->and($result['probability'])->toBeGreaterThanOrEqual(0);
});

// ══════════════════════════════════════════════════════
// CONTRACT INVARIANTS
// ══════════════════════════════════════════════════════

it('[Contract-ALG4-01] weighted formula is applied: probability = round(match*0.35 + profile*0.25 + selectivity*0.40)', function () {
    // Set up: full match + no profile + 50% selectivity (default)
    // Expected: round(100*0.35 + 0*0.25 + 50*0.40) = round(35+0+20) = 55
    $job = predictJob($this->employer->id, ['PHP', 'Laravel']);
    predictProfile($this->student->id, ['skills' => ['PHP', 'Laravel']]);

    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    $factors = $result['factors'];

    $expected = (int) round($factors['skill_match'] * 0.35 + $factors['profile'] * 0.25 + $factors['selectivity'] * 0.40);
    expect($result['probability'])->toBe($expected);
});

it('[Contract-ALG4-02] skill suggestion generated when match is below 60 and missing skills exist', function () {
    $job = predictJob($this->employer->id, ['PHP', 'Laravel', 'Rust']);
    predictProfile($this->student->id, ['skills' => []]); // no skills → matchScore=0

    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    $skillSuggestion = collect($result['suggestions'])->first(fn($s) => str_contains($s, 'missing skills'));

    expect($skillSuggestion)->not->toBeNull();
});

it('[Contract-ALG4-03] resume suggestion generated when student has no resume', function () {
    $job = predictJob($this->employer->id, ['PHP']);
    predictProfile($this->student->id, [
        'program'     => 'CS',
        'gpa'         => 3.5,
        'resume_path' => null,
    ]);

    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    $resumeSuggestion = collect($result['suggestions'])->first(fn($s) => str_contains($s, 'resume'));

    expect($resumeSuggestion)->not->toBeNull();
});

it('[Contract-ALG4-04] completeness suggestion generated when profile fields are incomplete', function () {
    $job = predictJob($this->employer->id, ['PHP']);
    predictProfile($this->student->id, [
        'program'         => '',
        'gpa'             => 0.0,
        'graduation_year' => 0,
    ]);

    $result = $this->ml->successPredictor($this->student->fresh(), $job->id);
    $completeSuggestion = collect($result['suggestions'])->first(fn($s) => str_contains($s, 'profile'));

    expect($completeSuggestion)->not->toBeNull();
});
