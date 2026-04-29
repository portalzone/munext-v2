<?php

namespace Modules\Jobs\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Jobs\Models\JobPosting;
use Modules\Students\Models\StudentProfile;

class SkillMatchController extends Controller
{
    public function match(Request $request, JobPosting $job): JsonResponse
    {
        if ($request->user()->role !== 'student') {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'Only students can check skill match',
                'status'  => 403,
            ], 403);
        }

        $profile = StudentProfile::where('user_id', $request->user()->id)->first();

        if (! $profile) {
            return response()->json([
                'error'   => 'Not Found',
                'message' => 'You need to create a profile before checking skill match',
                'status'  => 404,
            ], 404);
        }

        $studentSkills  = array_map('strtolower', $profile->skills);
        $requiredSkills = array_map('strtolower', $job->skills_required);

        $matched = array_values(array_intersect($requiredSkills, $studentSkills));
        $missing = array_values(array_diff($requiredSkills, $studentSkills));

        $total = count($requiredSkills);
        $score = $total > 0 ? round((count($matched) / $total) * 100) : 0;

        return response()->json([
            'data' => [
                'job_id'          => $job->id,
                'job_title'       => $job->title,
                'score'           => $score,
                'matched_skills'  => $matched,
                'missing_skills'  => $missing,
                'total_required'  => $total,
                'total_matched'   => count($matched),
            ],
            'message' => 'Skill match calculated',
            'status'  => 200,
        ]);
    }
}
