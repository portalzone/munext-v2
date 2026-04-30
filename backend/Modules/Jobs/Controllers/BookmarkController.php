<?php

namespace Modules\Jobs\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Jobs\Models\Bookmark;
use Modules\Jobs\Models\JobPosting;

class BookmarkController extends Controller
{
    // GET /api/v1/jobs/bookmarks — student's saved jobs
    public function index(Request $request): JsonResponse
    {
        if (! $request->user()->isJobSeeker()) {
            return response()->json(['error' => 'Students only.'], 403);
        }

        $bookmarks = Bookmark::where('student_id', $request->user()->id)
            ->with(['job' => fn($q) => $q->with('employer:id,name,email')])
            ->latest()
            ->get()
            ->pluck('job')
            ->filter();

        return response()->json([
            'data'    => $bookmarks->values(),
            'message' => 'Bookmarks retrieved successfully',
            'status'  => 200,
        ]);
    }

    // POST /api/v1/jobs/{job}/bookmark — toggle bookmark on/off
    public function toggle(Request $request, JobPosting $job): JsonResponse
    {
        if (! $request->user()->isJobSeeker()) {
            return response()->json(['error' => 'Students only.'], 403);
        }

        $existing = Bookmark::where('student_id', $request->user()->id)
            ->where('job_id', $job->id)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json([
                'data'       => ['bookmarked' => false],
                'message'    => 'Bookmark removed',
                'status'     => 200,
            ]);
        }

        Bookmark::create([
            'student_id' => $request->user()->id,
            'job_id'     => $job->id,
        ]);

        return response()->json([
            'data'    => ['bookmarked' => true],
            'message' => 'Job bookmarked',
            'status'  => 201,
        ], 201);
    }

    // GET /api/v1/jobs/{job}/bookmark — check if a job is bookmarked
    public function status(Request $request, JobPosting $job): JsonResponse
    {
        if (! $request->user()->isJobSeeker()) {
            return response()->json(['error' => 'Students only.'], 403);
        }

        $bookmarked = Bookmark::where('student_id', $request->user()->id)
            ->where('job_id', $job->id)
            ->exists();

        return response()->json([
            'data'   => ['bookmarked' => $bookmarked],
            'status' => 200,
        ]);
    }
}
