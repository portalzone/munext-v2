<?php

namespace Modules\Analytics\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Modules\Analytics\Models\AnalyticsHiringTrends;
use Modules\Analytics\Models\AnalyticsSkillsDemand;

class AnalyticsController extends Controller
{
    /**
     * Top skills by demand — written by Spark pipeline, read directly here.
     * GET /api/v1/analytics/skills-demand
     */
    public function skillsDemand(): JsonResponse
    {
        $skills = AnalyticsSkillsDemand::orderBy('count', 'desc')
            ->limit(20)
            ->get(['skill', 'count', 'trend', 'computed_at']);

        return response()->json([
            'data'    => $skills,
            'message' => 'Skills demand retrieved successfully',
            'status'  => 200,
        ]);
    }

    /**
     * Monthly jobs posted vs applications submitted — written by Spark pipeline.
     * GET /api/v1/analytics/hiring-trends
     */
    public function hiringTrends(): JsonResponse
    {
        $trends = AnalyticsHiringTrends::orderBy('month', 'asc')
            ->get(['month', 'job_count', 'application_count', 'computed_at']);

        return response()->json([
            'data'    => $trends,
            'message' => 'Hiring trends retrieved successfully',
            'status'  => 200,
        ]);
    }

    /**
     * Salary distribution — bucketed directly from job_postings (no Spark needed).
     * Buckets: <30k, 30–60k, 60–100k, 100–150k, 150k+
     * GET /api/v1/analytics/salary-distribution
     */
    public function salaryDistribution(): JsonResponse
    {
        // Wrap in subquery so PostgreSQL can GROUP BY the computed alias.
        // Use CASE ordering (works in both MySQL and PostgreSQL; FIELD() is MySQL-only).
        $rows = DB::table(function ($query) {
            $query->from('job_postings')
                ->selectRaw("
                    CASE
                        WHEN salary_min < 30000                            THEN 'Under \$30k'
                        WHEN salary_min >= 30000  AND salary_min < 60000  THEN '\$30k – \$60k'
                        WHEN salary_min >= 60000  AND salary_min < 100000 THEN '\$60k – \$100k'
                        WHEN salary_min >= 100000 AND salary_min < 150000 THEN '\$100k – \$150k'
                        ELSE 'Over \$150k'
                    END AS salary_range
                ")
                ->where('is_active', true)
                ->whereNotNull('salary_min');
        }, 'bucketed')
            ->select('salary_range', DB::raw('COUNT(*) AS job_count'))
            ->groupBy('salary_range')
            ->orderByRaw("
                CASE salary_range
                    WHEN 'Under \$30k'    THEN 1
                    WHEN '\$30k – \$60k'  THEN 2
                    WHEN '\$60k – \$100k' THEN 3
                    WHEN '\$100k – \$150k' THEN 4
                    ELSE 5
                END
            ")
            ->get();

        return response()->json([
            'data'    => $rows,
            'message' => 'Salary distribution retrieved successfully',
            'status'  => 200,
        ]);
    }

    /**
     * Top employers by active job count — computed directly from job_postings.
     * GET /api/v1/analytics/top-employers
     */
    public function topEmployers(): JsonResponse
    {
        $employers = DB::table('job_postings')
            ->join('employer_profiles', 'job_postings.employer_id', '=', 'employer_profiles.user_id')
            ->select(
                'employer_profiles.company_name',
                'employer_profiles.industry',
                DB::raw('COUNT(job_postings.id) AS job_count')
            )
            ->where('job_postings.is_active', true)
            ->groupBy('employer_profiles.user_id', 'employer_profiles.company_name', 'employer_profiles.industry')
            ->orderBy('job_count', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'data'    => $employers,
            'message' => 'Top employers retrieved successfully',
            'status'  => 200,
        ]);
    }
}
