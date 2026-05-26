<?php

use App\Models\User;
use App\Services\MLService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

uses(\Tests\TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->ml       = new MLService();
    $this->employer = User::factory()->create(['role' => 'employer']);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Insert job_postings directly via DB to control created_at precisely.
 * Bypasses Eloquent's auto-timestamp management.
 */
function trendJob(int $employerId, string $category, Carbon $date, int $count = 1, bool $active = true): void
{
    for ($i = 0; $i < $count; $i++) {
        DB::table('job_postings')->insert([
            'employer_id'      => $employerId,
            'title'            => "Trend-{$category}-{$i}-" . $date->toDateString(),
            'description'      => 'Market trend test.',
            'skills_required'  => json_encode(['PHP']),
            'experience_level' => 'mid',
            'category'         => $category,
            'is_active'        => $active,
            'salary_min'       => 50000,
            'salary_max'       => 80000,
            'created_at'       => $date,
            'updated_at'       => $date,
        ]);
    }
}

// ══════════════════════════════════════════════════════
// BOUNDARY VALUE ANALYSIS
// ══════════════════════════════════════════════════════

it('[BVA-ALG5-01] returns empty collections when no jobs exist in the database', function () {
    $result = $this->ml->marketTrends();
    expect($result['top_skills'])->toBeEmpty()
        ->and($result['category_trends'])->toBeEmpty()
        ->and($result['salary_by_category'])->toBeEmpty();
});

it('[BVA-ALG5-02] top_skills is empty when all jobs are inactive', function () {
    $now = Carbon::now()->startOfWeek(Carbon::MONDAY);
    trendJob($this->employer->id, 'Engineering', $now, 5, false); // is_active = false

    $result = $this->ml->marketTrends();
    expect($result['top_skills'])->toBeEmpty();
});

it('[BVA-ALG5-03] inactive jobs are excluded from top_skills but included in category_trends (EWMA)', function () {
    // EWMA query has no is_active filter — this documents the design behaviour
    $now = Carbon::now()->startOfWeek(Carbon::MONDAY);
    trendJob($this->employer->id, 'Engineering', $now, 3, false);

    $result = $this->ml->marketTrends();
    expect($result['top_skills'])->toBeEmpty()                    // active-only
        ->and($result['category_trends'])->not->toBeEmpty();       // all jobs
});

it('[BVA-ALG5-04] job with null category is excluded from category_trends without crashing', function () {
    DB::table('job_postings')->insert([
        'employer_id'      => $this->employer->id,
        'title'            => 'No Category Job',
        'description'      => 'Test.',
        'skills_required'  => json_encode(['PHP']),
        'experience_level' => 'mid',
        'category'         => null,
        'is_active'        => true,
        'salary_min'       => 50000,
        'salary_max'       => 80000,
        'created_at'       => Carbon::now(),
        'updated_at'       => Carbon::now(),
    ]);

    $result = $this->ml->marketTrends();
    $cats   = collect($result['category_trends'])->pluck('category');
    expect($cats)->not->toContain(null);
});

it('[BVA-ALG5-05] single active job: its skill appears once in top_skills', function () {
    $now = Carbon::now()->startOfWeek(Carbon::MONDAY);
    trendJob($this->employer->id, 'Engineering', $now, 1, true);

    $result = $this->ml->marketTrends();
    expect($result['top_skills'])->toHaveKey('php')
        ->and($result['top_skills']['php'])->toBe(1);
});

it('[BVA-ALG5-06] topN parameter limits the number of returned top skills', function () {
    $now = Carbon::now()->startOfWeek(Carbon::MONDAY);
    // Create jobs with 5 different skills
    foreach (['php', 'go', 'rust', 'python', 'java'] as $skill) {
        DB::table('job_postings')->insert([
            'employer_id'      => $this->employer->id,
            'title'            => "Job-{$skill}",
            'description'      => 'Test.',
            'skills_required'  => json_encode([$skill]),
            'experience_level' => 'mid',
            'category'         => 'Engineering',
            'is_active'        => true,
            'salary_min'       => 50000,
            'salary_max'       => 80000,
            'created_at'       => $now,
            'updated_at'       => $now,
        ]);
    }

    $result = $this->ml->marketTrends(topN: 3);
    expect(count($result['top_skills']))->toBeLessThanOrEqual(3);
});

// ══════════════════════════════════════════════════════
// EWMA FORMULA VERIFICATION
// ══════════════════════════════════════════════════════

it('[EWMA-ALG5-01] single week: EWMA equals the initial observation count', function () {
    $week1 = Carbon::now()->subWeeks(2)->startOfWeek(Carbon::MONDAY);
    trendJob($this->employer->id, 'Engineering', $week1, 10);

    $result      = $this->ml->marketTrends();
    $engineering = collect($result['category_trends'])->firstWhere('category', 'Engineering');

    // First observation — no smoothing applied, EWMA = (float) count = 10.0
    expect($engineering['ewma'])->toBe(10.0);
});

it('[EWMA-ALG5-02] two weeks: EWMA_2 = round(0.3 × X2 + 0.7 × EWMA_1, 2)', function () {
    // Week 1 (earlier): 10 jobs → EWMA_1 = 10.0
    // Week 2 (later):    5 jobs → EWMA_2 = round(0.3×5 + 0.7×10, 2) = round(1.5+7.0, 2) = 8.5
    $week1 = Carbon::now()->subWeeks(2)->startOfWeek(Carbon::MONDAY);
    $week2 = Carbon::now()->subWeeks(1)->startOfWeek(Carbon::MONDAY);

    trendJob($this->employer->id, 'Engineering', $week1, 10);
    trendJob($this->employer->id, 'Engineering', $week2, 5);

    $result      = $this->ml->marketTrends();
    $engineering = collect($result['category_trends'])->firstWhere('category', 'Engineering');

    expect($engineering['ewma'])->toBe(8.5);
});

it('[EWMA-ALG5-03] three weeks: EWMA is applied iteratively across all weeks', function () {
    // Week 1: 10 → EWMA_1 = 10.0
    // Week 2:  5 → EWMA_2 = round(0.3×5  + 0.7×10.0, 2) = round(8.5,  2) = 8.5
    // Week 3: 20 → EWMA_3 = round(0.3×20 + 0.7×8.5,  2) = round(6+5.95, 2) = round(11.95, 2) = 11.95
    $week1 = Carbon::now()->subWeeks(3)->startOfWeek(Carbon::MONDAY);
    $week2 = Carbon::now()->subWeeks(2)->startOfWeek(Carbon::MONDAY);
    $week3 = Carbon::now()->subWeeks(1)->startOfWeek(Carbon::MONDAY);

    trendJob($this->employer->id, 'Engineering', $week1, 10);
    trendJob($this->employer->id, 'Engineering', $week2, 5);
    trendJob($this->employer->id, 'Engineering', $week3, 20);

    $result      = $this->ml->marketTrends();
    $engineering = collect($result['category_trends'])->firstWhere('category', 'Engineering');

    expect($engineering['ewma'])->toBe(11.95);
});

it('[EWMA-ALG5-04] weeks array records every week in ascending order with correct counts', function () {
    $week1 = Carbon::now()->subWeeks(2)->startOfWeek(Carbon::MONDAY);
    $week2 = Carbon::now()->subWeeks(1)->startOfWeek(Carbon::MONDAY);

    trendJob($this->employer->id, 'Engineering', $week1, 10);
    trendJob($this->employer->id, 'Engineering', $week2, 5);

    $result      = $this->ml->marketTrends();
    $engineering = collect($result['category_trends'])->firstWhere('category', 'Engineering');

    expect($engineering['weeks'])->toHaveCount(2)
        ->and($engineering['weeks'][0]['count'])->toBe(10)
        ->and($engineering['weeks'][1]['count'])->toBe(5);
});

// ══════════════════════════════════════════════════════
// CONTRACT INVARIANTS
// ══════════════════════════════════════════════════════

it('[Contract-ALG5-01] all EWMA values are non-negative for non-negative inputs', function () {
    $week1 = Carbon::now()->subWeeks(2)->startOfWeek(Carbon::MONDAY);
    $week2 = Carbon::now()->subWeeks(1)->startOfWeek(Carbon::MONDAY);
    trendJob($this->employer->id, 'Engineering', $week1, 5);
    trendJob($this->employer->id, 'Design',      $week2, 3);

    $result = $this->ml->marketTrends();
    foreach ($result['category_trends'] as $trend) {
        expect($trend['ewma'])->toBeGreaterThanOrEqual(0);
    }
});

it('[Contract-ALG5-02] category_trends are sorted by EWMA descending', function () {
    $week1 = Carbon::now()->subWeeks(1)->startOfWeek(Carbon::MONDAY);
    trendJob($this->employer->id, 'Engineering', $week1, 10); // ewma=10
    trendJob($this->employer->id, 'Design',      $week1, 3);  // ewma=3
    trendJob($this->employer->id, 'Marketing',   $week1, 7);  // ewma=7

    $result = $this->ml->marketTrends();
    $ewmas  = collect($result['category_trends'])->pluck('ewma')->values()->toArray();

    for ($i = 0; $i < count($ewmas) - 1; $i++) {
        expect($ewmas[$i])->toBeGreaterThanOrEqual($ewmas[$i + 1]);
    }
});

it('[Contract-ALG5-03] salary_by_category averages are computed only from active jobs with non-null category', function () {
    $now = Carbon::now()->startOfWeek(Carbon::MONDAY);

    // Active job with category → should appear
    DB::table('job_postings')->insert([
        'employer_id' => $this->employer->id, 'title' => 'Active',
        'description' => 'Test.', 'skills_required' => json_encode(['PHP']),
        'experience_level' => 'mid', 'category' => 'Engineering',
        'is_active' => true, 'salary_min' => 60000, 'salary_max' => 90000,
        'created_at' => $now, 'updated_at' => $now,
    ]);
    // Inactive job → should NOT appear in salary_by_category
    DB::table('job_postings')->insert([
        'employer_id' => $this->employer->id, 'title' => 'Inactive',
        'description' => 'Test.', 'skills_required' => json_encode(['PHP']),
        'experience_level' => 'mid', 'category' => 'Engineering',
        'is_active' => false, 'salary_min' => 10000, 'salary_max' => 20000,
        'created_at' => $now, 'updated_at' => $now,
    ]);

    $result      = $this->ml->marketTrends();
    $engineering = collect($result['salary_by_category'])->firstWhere('category', 'Engineering');

    // Only the active job is counted — avg_min=60000, avg_max=90000
    expect($engineering['avg_min'])->toBe(60000)
        ->and($engineering['avg_max'])->toBe(90000)
        ->and($engineering['job_count'])->toBe(1);
});
