<?php

use App\Models\User;
use Modules\Analytics\Models\AnalyticsHiringTrends;
use Modules\Analytics\Models\AnalyticsSkillsDemand;
use Modules\Employer\Models\EmployerProfile;
use Modules\Jobs\Models\JobPosting;

// --- Skills Demand ---

it('returns skills demand data', function () {
    AnalyticsSkillsDemand::create([
        'skill'       => 'Python',
        'count'       => 42,
        'trend'       => 'up',
        'computed_at' => now(),
    ]);

    $response = $this->getJson('/api/v1/analytics/skills-demand');

    $response->assertStatus(200)
        ->assertJsonStructure(['data', 'message', 'status'])
        ->assertJsonPath('data.0.skill', 'Python');
});

it('returns empty data when no skills have been computed', function () {
    $response = $this->getJson('/api/v1/analytics/skills-demand');

    $response->assertStatus(200)
        ->assertJsonPath('data', []);
});

// --- Hiring Trends ---

it('returns hiring trends data', function () {
    AnalyticsHiringTrends::create([
        'month'             => '2026-04',
        'job_count'         => 10,
        'application_count' => 25,
        'computed_at'       => now(),
    ]);

    $response = $this->getJson('/api/v1/analytics/hiring-trends');

    $response->assertStatus(200)
        ->assertJsonStructure(['data', 'message', 'status'])
        ->assertJsonPath('data.0.month', '2026-04');
});

it('returns hiring trends ordered by month ascending', function () {
    AnalyticsHiringTrends::create(['month' => '2026-03', 'job_count' => 5,  'application_count' => 10, 'computed_at' => now()]);
    AnalyticsHiringTrends::create(['month' => '2026-04', 'job_count' => 10, 'application_count' => 25, 'computed_at' => now()]);
    AnalyticsHiringTrends::create(['month' => '2026-01', 'job_count' => 2,  'application_count' => 4,  'computed_at' => now()]);

    $response = $this->getJson('/api/v1/analytics/hiring-trends');

    $response->assertStatus(200);
    $months = collect($response->json('data'))->pluck('month')->values()->toArray();
    expect($months)->toBe(['2026-01', '2026-03', '2026-04']);
});

// --- Salary Distribution ---

it('returns salary distribution buckets', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    JobPosting::create([
        'employer_id'      => $employer->id,
        'title'            => 'Junior Dev',
        'description'      => 'Entry level.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'entry',
        'is_active'        => true,
        'salary_min'       => 25000,
        'salary_max'       => 35000,
    ]);

    $response = $this->getJson('/api/v1/analytics/salary-distribution');

    $response->assertStatus(200)
        ->assertJsonStructure(['data', 'message', 'status']);

    $ranges = collect($response->json('data'))->pluck('salary_range')->toArray();
    expect($ranges)->toContain('Under $30k');
});

it('excludes inactive jobs from salary distribution', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    JobPosting::create([
        'employer_id'      => $employer->id,
        'title'            => 'Hidden Job',
        'description'      => 'Not active.',
        'skills_required'  => ['Python'],
        'experience_level' => 'mid',
        'is_active'        => false,
        'salary_min'       => 50000,
        'salary_max'       => 70000,
    ]);

    $response = $this->getJson('/api/v1/analytics/salary-distribution');

    $response->assertStatus(200);
    $total = collect($response->json('data'))->sum('job_count');
    expect($total)->toBe(0);
});

// --- Top Employers ---

it('returns top employers by active job count', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    EmployerProfile::create([
        'user_id'      => $employer->id,
        'company_name' => 'BasePan Ltd',
        'industry'     => 'Technology',
    ]);

    JobPosting::create([
        'employer_id'      => $employer->id,
        'title'            => 'Backend Engineer',
        'description'      => 'PHP job.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'mid',
        'is_active'        => true,
    ]);

    $response = $this->getJson('/api/v1/analytics/top-employers');

    $response->assertStatus(200)
        ->assertJsonStructure(['data', 'message', 'status']);

    $names = collect($response->json('data'))->pluck('company_name')->toArray();
    expect($names)->toContain('BasePan Ltd');
});

it('returns at most 10 employers', function () {
    for ($i = 1; $i <= 12; $i++) {
        $employer = User::factory()->create(['role' => 'employer']);
        EmployerProfile::create([
            'user_id'      => $employer->id,
            'company_name' => "Company {$i}",
        ]);
        JobPosting::create([
            'employer_id'      => $employer->id,
            'title'            => "Job {$i}",
            'description'      => 'Test job.',
            'skills_required'  => ['PHP'],
            'experience_level' => 'mid',
            'is_active'        => true,
        ]);
    }

    $response = $this->getJson('/api/v1/analytics/top-employers');

    $response->assertStatus(200);
    expect(count($response->json('data')))->toBeLessThanOrEqual(10);
});
