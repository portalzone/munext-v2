<?php

namespace Modules\ML\Controllers;

use App\Http\Controllers\Controller;
use App\Services\MLService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Jobs\Models\JobPosting;

class MLController extends Controller
{
    public function __construct(private MLService $ml) {}

    // GET /api/v1/ml/match/{jobId}  — student only
    public function skillMatch(Request $request, int $jobId): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'student') {
            return response()->json(['error' => 'Students only.'], 403);
        }

        $job = JobPosting::find($jobId);
        if (!$job) {
            return response()->json(['error' => 'Job not found.'], 404);
        }

        $studentSkills = $user->studentProfile?->skills ?? [];
        $result = $this->ml->skillMatch($studentSkills, $job->skills_required ?? []);

        return response()->json(['data' => $result]);
    }

    // GET /api/v1/ml/profile-strength  — student only
    public function profileStrength(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'student') {
            return response()->json(['error' => 'Students only.'], 403);
        }

        $result = $this->ml->profileStrength($user);

        return response()->json(['data' => $result]);
    }

    // GET /api/v1/ml/predict/{jobId}  — student only
    public function successPredictor(Request $request, int $jobId): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'student') {
            return response()->json(['error' => 'Students only.'], 403);
        }

        $result = $this->ml->successPredictor($user, $jobId);

        return response()->json(['data' => $result]);
    }

    // GET /api/v1/ml/funnel  — employer only
    public function hiringFunnel(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'employer') {
            return response()->json(['error' => 'Employers only.'], 403);
        }

        $result = $this->ml->hiringFunnel($user);

        return response()->json(['data' => $result]);
    }

    // GET /api/v1/ml/trends  — admin only
    public function marketTrends(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Admins only.'], 403);
        }

        $topN   = (int) $request->query('top', 10);
        $result = $this->ml->marketTrends($topN);

        return response()->json(['data' => $result]);
    }
}
