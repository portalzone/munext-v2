<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Modules\Jobs\Models\JobPosting;

class MLService
{
    // ─────────────────────────────────────────────
    // Algorithm 1 — Job-Student Skill Match (Jaccard)
    // Jaccard = |intersection| / |union| × 100
    // ─────────────────────────────────────────────
    public function skillMatch(array $studentSkills, array $jobSkills): array
    {
        $a = array_map('strtolower', array_map('trim', $studentSkills));
        $b = array_map('strtolower', array_map('trim', $jobSkills));

        $intersection = array_values(array_intersect($a, $b));
        $union        = array_values(array_unique(array_merge($a, $b)));
        $missing      = array_values(array_diff($b, $a));
        $extra        = array_values(array_diff($a, $b));

        $score = count($union) > 0
            ? round((count($intersection) / count($union)) * 100)
            : 0;

        return [
            'score'          => $score,
            'matched_skills' => $intersection,
            'missing_skills' => $missing,
            'extra_skills'   => $extra,
        ];
    }

    // ─────────────────────────────────────────────
    // Algorithm 2 — Student Profile Strength Score
    // Weighted composite: completeness 30, skills 25, resume 20, activity 25
    // ─────────────────────────────────────────────
    public function profileStrength(User $user): array
    {
        $profile = $user->studentProfile;

        // Component 1 — profile completeness (30 pts)
        $fields      = ['program', 'gpa', 'graduation_year'];
        $filled      = $profile ? count(array_filter($fields, fn($f) => !empty($profile->$f))) : 0;
        $completeness = $profile ? round(($filled / count($fields)) * 30) : 0;

        // Component 2 — skills count (25 pts, capped at 10 skills)
        $skillCount = $profile ? count($profile->skills ?? []) : 0;
        $skillScore = min(25, (int) round(($skillCount / 10) * 25));

        // Component 3 — resume uploaded (20 pts)
        $resumeScore = ($profile && !empty($profile->resume_path)) ? 20 : 0;

        // Component 4 — activity (25 pts, capped at 10 applications)
        $appCount     = $user->applications()->count();
        $activityScore = min(25, (int) round(($appCount / 10) * 25));

        $total = $completeness + $skillScore + $resumeScore + $activityScore;

        $label = match (true) {
            $total >= 85 => 'Excellent',
            $total >= 65 => 'Strong',
            $total >= 45 => 'Good',
            $total >= 25 => 'Fair',
            default      => 'Weak',
        };

        return [
            'score'     => $total,
            'label'     => $label,
            'breakdown' => [
                'completeness' => $completeness,
                'skills'       => $skillScore,
                'resume'       => $resumeScore,
                'activity'     => $activityScore,
            ],
        ];
    }

    // ─────────────────────────────────────────────
    // Algorithm 3 — Employer Hiring Funnel Analytics
    // Conversion rate per stage = (count_at_stage / total_applied) × 100
    // ─────────────────────────────────────────────
    public function hiringFunnel(User $employer): array
    {
        $jobs = DB::table('job_postings')
            ->where('employer_id', $employer->id)
            ->get(['id', 'title']);

        $result = [];

        foreach ($jobs as $job) {
            $counts = DB::table('applications')
                ->where('job_id', $job->id)
                ->selectRaw("
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'reviewed'    THEN 1 ELSE 0 END) as reviewed,
                    SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
                    SUM(CASE WHEN status = 'hired'       THEN 1 ELSE 0 END) as hired
                ")
                ->first();

            $total = (int) $counts->total;

            $result[] = [
                'job_id'    => $job->id,
                'job_title' => $job->title,
                'stages'    => [
                    'applied'     => $total,
                    'reviewed'    => (int) $counts->reviewed,
                    'shortlisted' => (int) $counts->shortlisted,
                    'hired'       => (int) $counts->hired,
                ],
                'conversion_rates' => [
                    'to_reviewed'    => $total > 0 ? round(($counts->reviewed    / $total) * 100) : 0,
                    'to_shortlisted' => $total > 0 ? round(($counts->shortlisted / $total) * 100) : 0,
                    'to_hired'       => $total > 0 ? round(($counts->hired       / $total) * 100) : 0,
                ],
            ];
        }

        return ['jobs' => $result];
    }

    // ─────────────────────────────────────────────
    // Algorithm 4 — Application Success Predictor
    // Weighted probability: skill match 35%, profile 25%, employer selectivity 40%
    // ─────────────────────────────────────────────
    public function successPredictor(User $student, int $jobId): array
    {
        $job = DB::table('job_postings')->where('id', $jobId)->first();
        if (!$job) {
            return ['probability' => 0, 'confidence' => 'No data', 'suggestions' => []];
        }

        $profile   = $student->studentProfile;
        $jobSkills = $job->skills_required ?? '[]';
        $jobSkills = is_string($jobSkills) ? json_decode($jobSkills, true) : (array) $jobSkills;

        // Factor 1 — skill match score (35%)
        $studentSkills = $profile ? ($profile->skills ?? []) : [];
        $matchData     = $this->skillMatch($studentSkills, $jobSkills);
        $matchScore    = $matchData['score'];

        // Factor 2 — profile strength (25%)
        $profileData  = $this->profileStrength($student);
        $profileScore = $profileData['score'];

        // Factor 3 — employer selectivity (40%)
        // hire rate = hired applications / total applications for this employer's jobs
        $employerStats = DB::table('applications')
            ->join('job_postings', 'applications.job_id', '=', 'job_postings.id')
            ->where('job_postings.employer_id', $job->employer_id)
            ->selectRaw("COUNT(*) as total, SUM(CASE WHEN applications.status = 'hired' THEN 1 ELSE 0 END) as hired")
            ->first();

        $hireRate = ($employerStats->total > 0)
            ? ($employerStats->hired / $employerStats->total) * 100
            : 50; // default 50% when employer has no history

        $probability = round(
            ($matchScore * 0.35) + ($profileScore * 0.25) + ($hireRate * 0.40)
        );

        $confidence = match (true) {
            $probability >= 70 => 'High',
            $probability >= 40 => 'Medium',
            default            => 'Low',
        };

        // Build improvement suggestions based on what's weakest
        $suggestions = [];
        if ($matchScore < 60) {
            $missing = array_slice($matchData['missing_skills'], 0, 3);
            if ($missing) {
                $suggestions[] = 'Add missing skills to your profile: ' . implode(', ', $missing);
            }
        }
        if ($profileData['breakdown']['resume'] === 0) {
            $suggestions[] = 'Upload your resume to boost your profile score by 20 points.';
        }
        if ($profileData['breakdown']['completeness'] < 30) {
            $suggestions[] = 'Complete your profile (program, GPA, graduation year).';
        }

        return [
            'probability' => $probability,
            'confidence'  => $confidence,
            'factors'     => [
                'skill_match'   => $matchScore,
                'profile'       => $profileScore,
                'selectivity'   => round($hireRate),
            ],
            'suggestions' => array_slice($suggestions, 0, 3),
        ];
    }

    // ─────────────────────────────────────────────
    // Algorithm 5 — Job Market Trend Analysis (EWMA)
    // α = 0.3 applied over weekly job posting counts per category
    // ─────────────────────────────────────────────
    public function marketTrends(int $topN = 10): array
    {
        // Skill frequency across all active jobs
        $jobs = DB::table('job_postings')
            ->where('is_active', true)
            ->get(['skills_required', 'category', 'salary_min', 'salary_max', 'created_at']);

        $skillFrequency = [];
        foreach ($jobs as $job) {
            $skills = is_string($job->skills_required)
                ? json_decode($job->skills_required, true)
                : (array) $job->skills_required;

            foreach ($skills as $skill) {
                $key = strtolower(trim($skill));
                $skillFrequency[$key] = ($skillFrequency[$key] ?? 0) + 1;
            }
        }
        arsort($skillFrequency);
        $topSkills = array_slice($skillFrequency, 0, $topN, true);

        // Salary range by category
        $salaryByCategory = DB::table('job_postings')
            ->where('is_active', true)
            ->whereNotNull('category')
            ->groupBy('category')
            ->selectRaw('category, AVG(salary_min) as avg_min, AVG(salary_max) as avg_max, COUNT(*) as job_count')
            ->get()
            ->map(fn($r) => [
                'category'  => $r->category,
                'avg_min'   => (int) round($r->avg_min),
                'avg_max'   => (int) round($r->avg_max),
                'job_count' => (int) $r->job_count,
            ])
            ->toArray();

        // EWMA trend: weekly job counts per category
        // Group postings by category + ISO week, then smooth with α = 0.3
        $weeklyRaw = DB::table('job_postings')
            ->whereNotNull('category')
            ->selectRaw("category, DATE_TRUNC('week', created_at) as week, COUNT(*) as count")
            ->groupBy('category', 'week')
            ->orderBy('category')
            ->orderBy('week')
            ->get();

        $ewmaByCategory = [];
        foreach ($weeklyRaw as $row) {
            $cat = $row->category;
            if (!isset($ewmaByCategory[$cat])) {
                $ewmaByCategory[$cat] = ['ewma' => (float) $row->count, 'weeks' => []];
            } else {
                $prev = $ewmaByCategory[$cat]['ewma'];
                $ewmaByCategory[$cat]['ewma'] = round(0.3 * $row->count + 0.7 * $prev, 2);
            }
            $ewmaByCategory[$cat]['weeks'][] = [
                'week'  => substr($row->week, 0, 10),
                'count' => (int) $row->count,
            ];
        }

        $trends = array_map(fn($cat, $data) => [
            'category' => $cat,
            'ewma'     => $data['ewma'],
            'weeks'    => $data['weeks'],
        ], array_keys($ewmaByCategory), $ewmaByCategory);

        usort($trends, fn($a, $b) => $b['ewma'] <=> $a['ewma']);

        return [
            'top_skills'         => $topSkills,
            'salary_by_category' => $salaryByCategory,
            'category_trends'    => $trends,
        ];
    }

    // ─────────────────────────────────────────────
    // Job Recommendations — reuses Algorithm 1
    // Scores all active jobs against student skills, returns top N sorted by score
    // Only returns jobs the student has NOT already applied to
    // ─────────────────────────────────────────────
    public function jobRecommendations(User $user, int $topN = 6): array
    {
        $studentSkills = array_map('strtolower', array_map('trim',
            $user->studentProfile?->skills ?? []
        ));

        if (empty($studentSkills)) {
            return [];
        }

        $appliedJobIds = \Modules\Jobs\Models\Application::where('student_id', $user->id)
            ->pluck('job_id')
            ->toArray();

        $jobs = JobPosting::where('is_active', true)
            ->whereNotIn('id', $appliedJobIds)
            ->get();

        $scored = $jobs->map(function (JobPosting $job) use ($studentSkills) {
            $match = $this->skillMatch($studentSkills, $job->skills_required ?? []);
            return [
                'job'   => $job,
                'score' => $match['score'],
            ];
        })
        ->filter(fn($item) => $item['score'] > 0)
        ->sortByDesc('score')
        ->take($topN)
        ->values();

        return $scored->map(fn($item) => [
            'score' => $item['score'],
            'job'   => $item['job'],
        ])->toArray();
    }
}
