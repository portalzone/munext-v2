<?php

use App\Models\User;
use App\Services\MLService;
use Modules\Jobs\Models\Application;
use Modules\Jobs\Models\JobPosting;
use Modules\Students\Models\StudentProfile;

uses(\Tests\TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->ml       = new MLService();
    $this->student  = User::factory()->create(['role' => 'student']);
    $this->employer = User::factory()->create(['role' => 'employer']);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function strengthProfile(int $userId, array $overrides = []): StudentProfile
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

function strengthJob(int $employerId): JobPosting
{
    return JobPosting::create([
        'employer_id'      => $employerId,
        'title'            => 'Strength Test Job',
        'description'      => 'Used to create application records for activity scoring.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'mid',
        'is_active'        => true,
    ]);
}

function applyN(int $studentId, int $employerId, int $n): void
{
    for ($i = 0; $i < $n; $i++) {
        $job = strengthJob($employerId);
        Application::create(['student_id' => $studentId, 'job_id' => $job->id, 'status' => 'pending']);
    }
}

// ══════════════════════════════════════════════════════
// BOUNDARY VALUE ANALYSIS
// ══════════════════════════════════════════════════════

it('[BVA-ALG2-01] returns score 0 and label Weak when user has no student profile', function () {
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['score'])->toBe(0)
        ->and($result['label'])->toBe('Weak');
});

it('[BVA-ALG2-02] returns score 0 when profile exists but all fields are null and empty', function () {
    strengthProfile($this->student->id);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['score'])->toBe(0)->and($result['label'])->toBe('Weak');
});

it('[BVA-ALG2-03] completeness is 30 when all three profile fields are filled', function () {
    strengthProfile($this->student->id, ['program' => 'CS', 'gpa' => 3.5, 'graduation_year' => 2026]);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['breakdown']['completeness'])->toBe(30);
});

it('[BVA-ALG2-04] completeness treats gpa = 0 as unfilled — !empty(0) is false in PHP', function () {
    // gpa = 0 is falsy; this is a known edge case in the !empty() guard
    strengthProfile($this->student->id, ['program' => 'CS', 'gpa' => 0, 'graduation_year' => 2026]);
    $result = $this->ml->profileStrength($this->student->fresh());
    // only 'program' and 'graduation_year' count — gpa=0 is treated as empty
    expect($result['breakdown']['completeness'])->toBe(20);
});

it('[BVA-ALG2-05] skills score is 25 at exactly 10 skills — upper cap boundary', function () {
    $skills = array_map(fn($i) => "skill-{$i}", range(1, 10));
    strengthProfile($this->student->id, ['skills' => $skills]);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['breakdown']['skills'])->toBe(25);
});

it('[BVA-ALG2-06] skills score is capped at 25 when student has 15 skills — beyond upper bound', function () {
    $skills = array_map(fn($i) => "skill-{$i}", range(1, 15));
    strengthProfile($this->student->id, ['skills' => $skills]);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['breakdown']['skills'])->toBe(25);
});

it('[BVA-ALG2-07] resume score is 20 when resume_path is set', function () {
    strengthProfile($this->student->id, ['resume_path' => '/storage/resumes/cv.pdf']);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['breakdown']['resume'])->toBe(20);
});

it('[BVA-ALG2-08] resume score is 0 when resume_path is null', function () {
    strengthProfile($this->student->id, ['resume_path' => null]);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['breakdown']['resume'])->toBe(0);
});

it('[BVA-ALG2-09] activity score is 25 at exactly 10 applications — upper cap boundary', function () {
    strengthProfile($this->student->id);
    applyN($this->student->id, $this->employer->id, 10);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['breakdown']['activity'])->toBe(25);
});

it('[BVA-ALG2-10] activity score is capped at 25 with 15 applications — beyond upper bound', function () {
    strengthProfile($this->student->id);
    applyN($this->student->id, $this->employer->id, 15);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['breakdown']['activity'])->toBe(25);
});

it('[BVA-ALG2-11] score reaches 100 with perfect profile: all fields, 10 skills, resume, 10 apps', function () {
    // completeness=30 + skills=25 + resume=20 + activity=25 = 100
    $skills = array_map(fn($i) => "skill-{$i}", range(1, 10));
    strengthProfile($this->student->id, [
        'program'         => 'Computer Science',
        'gpa'             => 3.9,
        'graduation_year' => 2026,
        'skills'          => $skills,
        'resume_path'     => '/storage/resumes/cv.pdf',
    ]);
    applyN($this->student->id, $this->employer->id, 10);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['score'])->toBe(100)->and($result['label'])->toBe('Excellent');
});

// ══════════════════════════════════════════════════════
// LABEL BOUNDARY TESTS
// ══════════════════════════════════════════════════════

it('[BVA-Label-01] label is Weak for score below 25', function () {
    // completeness=10 (1 field), skills=0, resume=0, activity=0 = 10 → Weak
    strengthProfile($this->student->id, ['program' => 'CS']);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['score'])->toBe(10)->and($result['label'])->toBe('Weak');
});

it('[BVA-Label-02] label transitions to Fair at exactly score 25', function () {
    // completeness=20 (program+gpa) + skills=5 (2 skills: round(2/10*25)=5) = 25
    strengthProfile($this->student->id, [
        'program' => 'CS',
        'gpa'     => 3.5,
        'skills'  => ['PHP', 'Laravel'],
    ]);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['score'])->toBe(25)->and($result['label'])->toBe('Fair');
});

it('[BVA-Label-03] label transitions to Good at exactly score 45', function () {
    // completeness=30 (3 fields) + skills=5 (2 skills) + activity=10 (4 apps: round(4/10*25)=10) = 45
    strengthProfile($this->student->id, [
        'program'         => 'CS',
        'gpa'             => 3.5,
        'graduation_year' => 2026,
        'skills'          => ['PHP', 'Laravel'],
    ]);
    applyN($this->student->id, $this->employer->id, 4);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['score'])->toBe(45)->and($result['label'])->toBe('Good');
});

it('[BVA-Label-04] label transitions to Strong at exactly score 65', function () {
    // completeness=30 + skills=15 (6 skills: round(6/10*25)=15) + activity=20 (8 apps) = 65
    $skills = array_map(fn($i) => "skill-{$i}", range(1, 6));
    strengthProfile($this->student->id, [
        'program'         => 'CS',
        'gpa'             => 3.5,
        'graduation_year' => 2026,
        'skills'          => $skills,
    ]);
    applyN($this->student->id, $this->employer->id, 8);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['score'])->toBe(65)->and($result['label'])->toBe('Strong');
});

it('[BVA-Label-05] label transitions to Excellent at exactly score 85', function () {
    // completeness=30 + skills=25 (10 skills) + resume=20 + activity=10 (4 apps) = 85
    $skills = array_map(fn($i) => "skill-{$i}", range(1, 10));
    strengthProfile($this->student->id, [
        'program'         => 'CS',
        'gpa'             => 3.5,
        'graduation_year' => 2026,
        'skills'          => $skills,
        'resume_path'     => '/storage/resumes/cv.pdf',
    ]);
    applyN($this->student->id, $this->employer->id, 4);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['score'])->toBe(85)->and($result['label'])->toBe('Excellent');
});

// ══════════════════════════════════════════════════════
// EQUIVALENCE PARTITIONING
// ══════════════════════════════════════════════════════

it('[EP-ALG2-01] valid profile partition: score is always in [0, 100]', function () {
    strengthProfile($this->student->id, ['program' => 'CS', 'skills' => ['PHP']]);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['score'])->toBeGreaterThanOrEqual(0)->toBeLessThanOrEqual(100);
});

it('[EP-ALG2-02] null profile partition: activity is still counted even without a StudentProfile', function () {
    // Design behaviour: $user->applications()->count() is called unconditionally.
    // 5 apps → activityScore = round(5/10 * 25) = 13; all other components = 0.
    applyN($this->student->id, $this->employer->id, 5);
    $result = $this->ml->profileStrength($this->student->fresh());
    expect($result['score'])->toBe(13)->and($result['breakdown']['activity'])->toBe(13);
});

// ══════════════════════════════════════════════════════
// CONTRACT INVARIANTS
// ══════════════════════════════════════════════════════

it('[Contract-ALG2-01] total score equals the arithmetic sum of the four breakdown components', function () {
    $skills = array_map(fn($i) => "skill-{$i}", range(1, 5));
    strengthProfile($this->student->id, [
        'program'         => 'CS',
        'gpa'             => 3.5,
        'graduation_year' => 2026,
        'skills'          => $skills,
        'resume_path'     => '/storage/resumes/cv.pdf',
    ]);
    applyN($this->student->id, $this->employer->id, 3);
    $result = $this->ml->profileStrength($this->student->fresh());
    $b = $result['breakdown'];
    expect($result['score'])->toBe($b['completeness'] + $b['skills'] + $b['resume'] + $b['activity']);
});

it('[Contract-ALG2-02] score is monotonically non-decreasing as profile fields are progressively filled', function () {
    strengthProfile($this->student->id);
    $r0 = $this->ml->profileStrength($this->student->fresh());

    $this->student->studentProfile->update(['program' => 'CS']);
    $r1 = $this->ml->profileStrength($this->student->fresh());

    $this->student->studentProfile->update(['gpa' => 3.5]);
    $r2 = $this->ml->profileStrength($this->student->fresh());

    $this->student->studentProfile->update(['graduation_year' => 2026]);
    $r3 = $this->ml->profileStrength($this->student->fresh());

    expect($r1['score'])->toBeGreaterThanOrEqual($r0['score'])
        ->and($r2['score'])->toBeGreaterThanOrEqual($r1['score'])
        ->and($r3['score'])->toBeGreaterThanOrEqual($r2['score']);
});

it('[Contract-ALG2-03] adding a resume always increases score by exactly 20 points', function () {
    strengthProfile($this->student->id, ['resume_path' => null]);
    $without = $this->ml->profileStrength($this->student->fresh());

    $this->student->studentProfile->update(['resume_path' => '/storage/resumes/cv.pdf']);
    $with = $this->ml->profileStrength($this->student->fresh());

    expect($with['score'] - $without['score'])->toBe(20);
});
