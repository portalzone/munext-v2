<?php

use App\Models\User;
use App\Services\MLService;
use Modules\Jobs\Models\Application;
use Modules\Jobs\Models\JobPosting;

uses(\Tests\TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->ml       = new MLService();
    $this->employer = User::factory()->create(['role' => 'employer']);
    $this->student  = User::factory()->create(['role' => 'student']);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function funnelJob(int $employerId, string $title = 'Funnel Test Job'): JobPosting
{
    return JobPosting::create([
        'employer_id'      => $employerId,
        'title'            => $title,
        'description'      => 'Funnel test.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'mid',
        'is_active'        => true,
    ]);
}

function funnelApp(int $studentId, int $jobId, string $status): Application
{
    return Application::create([
        'student_id' => $studentId,
        'job_id'     => $jobId,
        'status'     => $status,
    ]);
}

function funnelApplyN(int $jobId, int $n, string $status): void
{
    for ($i = 0; $i < $n; $i++) {
        $s = User::factory()->create(['role' => 'student']);
        funnelApp($s->id, $jobId, $status);
    }
}

function funnelFind(array $result, int $jobId): ?array
{
    return collect($result['jobs'])->firstWhere('job_id', $jobId);
}

// ══════════════════════════════════════════════════════
// BOUNDARY VALUE ANALYSIS
// ══════════════════════════════════════════════════════

it('[BVA-ALG3-01] returns empty jobs array when employer has no postings', function () {
    $result = $this->ml->hiringFunnel($this->employer);
    expect($result['jobs'])->toBeEmpty();
});

it('[BVA-ALG3-02] returns all-zero stages and rates when job has zero applications', function () {
    $job    = funnelJob($this->employer->id);
    $result = $this->ml->hiringFunnel($this->employer);
    $data   = funnelFind($result, $job->id);

    expect($data['stages']['applied'])->toBe(0)
        ->and($data['stages']['reviewed'])->toBe(0)
        ->and($data['stages']['shortlisted'])->toBe(0)
        ->and($data['stages']['hired'])->toBe(0)
        ->and($data['conversion_rates']['to_reviewed'])->toBe(0)
        ->and($data['conversion_rates']['to_shortlisted'])->toBe(0)
        ->and($data['conversion_rates']['to_hired'])->toBe(0);
});

it('[BVA-ALG3-03] applied count equals total applications regardless of status', function () {
    $job = funnelJob($this->employer->id);
    funnelApp($this->student->id, $job->id, 'pending');

    $data = funnelFind($this->ml->hiringFunnel($this->employer), $job->id);
    expect($data['stages']['applied'])->toBe(1);
});

it('[BVA-ALG3-04] to_reviewed rate is 50 when 5 of 10 applications are reviewed', function () {
    $job = funnelJob($this->employer->id);
    funnelApplyN($job->id, 5, 'reviewed');
    funnelApplyN($job->id, 5, 'pending');

    $data = funnelFind($this->ml->hiringFunnel($this->employer), $job->id);
    expect($data['conversion_rates']['to_reviewed'])->toBe(50)
        ->and($data['stages']['applied'])->toBe(10);
});

it('[BVA-ALG3-05] to_shortlisted rate is 30 when 3 of 10 applications are shortlisted', function () {
    $job = funnelJob($this->employer->id);
    funnelApplyN($job->id, 3, 'shortlisted');
    funnelApplyN($job->id, 7, 'pending');

    $data = funnelFind($this->ml->hiringFunnel($this->employer), $job->id);
    expect($data['conversion_rates']['to_shortlisted'])->toBe(30);
});

it('[BVA-ALG3-06] to_hired rate is 100 when all 10 applications result in hire', function () {
    $job = funnelJob($this->employer->id);
    funnelApplyN($job->id, 10, 'hired');

    $data = funnelFind($this->ml->hiringFunnel($this->employer), $job->id);
    expect($data['conversion_rates']['to_hired'])->toBe(100)
        ->and($data['stages']['hired'])->toBe(10);
});

it('[BVA-ALG3-07] to_hired rate is 10 when 1 of 10 applications results in hire', function () {
    $job = funnelJob($this->employer->id);
    funnelApplyN($job->id, 1, 'hired');
    funnelApplyN($job->id, 9, 'pending');

    $data = funnelFind($this->ml->hiringFunnel($this->employer), $job->id);
    expect($data['conversion_rates']['to_hired'])->toBe(10);
});

it('[BVA-ALG3-08] all conversion rates are 0 when 1 application exists with non-tracked status', function () {
    $job = funnelJob($this->employer->id);
    funnelApp($this->student->id, $job->id, 'pending');

    $data = funnelFind($this->ml->hiringFunnel($this->employer), $job->id);
    expect($data['conversion_rates']['to_reviewed'])->toBe(0)
        ->and($data['conversion_rates']['to_shortlisted'])->toBe(0)
        ->and($data['conversion_rates']['to_hired'])->toBe(0);
});

// ══════════════════════════════════════════════════════
// EQUIVALENCE PARTITIONING
// ══════════════════════════════════════════════════════

it('[EP-ALG3-01] conversion rates partition: all rates fall in [0, 100]', function () {
    $job = funnelJob($this->employer->id);
    funnelApplyN($job->id, 4, 'shortlisted');
    funnelApplyN($job->id, 6, 'pending');

    $data = funnelFind($this->ml->hiringFunnel($this->employer), $job->id);
    foreach ($data['conversion_rates'] as $rate) {
        expect($rate)->toBeGreaterThanOrEqual(0)->toBeLessThanOrEqual(100);
    }
});

it('[EP-ALG3-02] multiple jobs partition: each job is computed independently', function () {
    $job1 = funnelJob($this->employer->id, 'Job One');
    $job2 = funnelJob($this->employer->id, 'Job Two');

    funnelApplyN($job1->id, 10, 'hired');   // 100% hired
    funnelApplyN($job2->id, 10, 'pending'); // 0% hired

    $result = $this->ml->hiringFunnel($this->employer);
    $d1     = funnelFind($result, $job1->id);
    $d2     = funnelFind($result, $job2->id);

    expect($d1['conversion_rates']['to_hired'])->toBe(100)
        ->and($d2['conversion_rates']['to_hired'])->toBe(0);
});

// ══════════════════════════════════════════════════════
// CONTRACT INVARIANTS
// ══════════════════════════════════════════════════════

it('[Contract-ALG3-01] funnel only returns jobs belonging to the requesting employer', function () {
    $otherEmployer = User::factory()->create(['role' => 'employer']);
    $myJob         = funnelJob($this->employer->id, 'My Job');
    $theirJob      = funnelJob($otherEmployer->id, 'Their Job');

    $result   = $this->ml->hiringFunnel($this->employer);
    $jobIds   = collect($result['jobs'])->pluck('job_id')->toArray();

    expect($jobIds)->toContain($myJob->id)->not->toContain($theirJob->id);
});

it('[Contract-ALG3-02] stages.applied equals sum of all statuses for that job', function () {
    $job = funnelJob($this->employer->id);
    funnelApplyN($job->id, 3, 'reviewed');
    funnelApplyN($job->id, 2, 'shortlisted');
    funnelApplyN($job->id, 1, 'hired');
    funnelApplyN($job->id, 4, 'pending');

    $data = funnelFind($this->ml->hiringFunnel($this->employer), $job->id);
    expect($data['stages']['applied'])->toBe(10);
});

it('[Contract-ALG3-03] conversion rate invariant: to_reviewed = round(reviewed / applied * 100)', function () {
    $job = funnelJob($this->employer->id);
    funnelApplyN($job->id, 7, 'reviewed');
    funnelApplyN($job->id, 3, 'pending');

    $data     = funnelFind($this->ml->hiringFunnel($this->employer), $job->id);
    $expected = (int) round((7 / 10) * 100);

    expect($data['conversion_rates']['to_reviewed'])->toBe($expected);
});
