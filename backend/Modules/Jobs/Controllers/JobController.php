<?php

namespace Modules\Jobs\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Jobs\Models\JobPosting;

class JobController extends Controller
{
    // Returns only the authenticated employer's job postings
    public function myJobs(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'employer') {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'Only employers can access this endpoint',
                'status'  => 403,
            ], 403);
        }

        $jobs = JobPosting::where('employer_id', $request->user()->id)->latest()->get();

        return response()->json([
            'data'    => $jobs,
            'message' => 'Your job postings retrieved successfully',
            'status'  => 200,
        ]);
    }

    // Any authenticated user can view all job postings
    public function index(): JsonResponse
    {
        $jobs = JobPosting::with('employer:id,name,email')->latest()->get();

        return response()->json([
            'data'    => $jobs,
            'message' => 'Job postings retrieved successfully',
            'status'  => 200,
        ]);
    }

    // Any authenticated user can view a single job posting
    public function show(JobPosting $job): JsonResponse
    {
        $job->load('employer:id,name,email');

        return response()->json([
            'data'    => $job,
            'message' => 'Job posting retrieved successfully',
            'status'  => 200,
        ]);
    }

    // Only employers can create job postings
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'employer') {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'Only employers can post jobs',
                'status'  => 403,
            ], 403);
        }

        $validated = $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'description'      => ['required', 'string'],
            'skills_required'  => ['required', 'array', 'min:1'],
            'skills_required.*'=> ['string'],
            'experience_level' => ['required', 'in:entry,mid,senior'],
        ]);

        $job = JobPosting::create([
            ...$validated,
            'employer_id' => $request->user()->id,
        ]);

        return response()->json([
            'data'    => $job,
            'message' => 'Job posting created successfully',
            'status'  => 201,
        ], 201);
    }

    // Only the employer who owns the job can update it
    public function update(Request $request, JobPosting $job): JsonResponse
    {
        if ($request->user()->role !== 'employer' || $request->user()->id !== $job->employer_id) {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'You do not have permission to update this job posting',
                'status'  => 403,
            ], 403);
        }

        $validated = $request->validate([
            'title'            => ['sometimes', 'string', 'max:255'],
            'description'      => ['sometimes', 'string'],
            'skills_required'  => ['sometimes', 'array', 'min:1'],
            'skills_required.*'=> ['string'],
            'experience_level' => ['sometimes', 'in:entry,mid,senior'],
        ]);

        $job->update($validated);

        return response()->json([
            'data'    => $job->fresh(),
            'message' => 'Job posting updated successfully',
            'status'  => 200,
        ]);
    }

    // Only the employer who owns the job can delete it
    public function destroy(Request $request, JobPosting $job): JsonResponse
    {
        if ($request->user()->role !== 'employer' || $request->user()->id !== $job->employer_id) {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'You do not have permission to delete this job posting',
                'status'  => 403,
            ], 403);
        }

        $job->delete();

        return response()->json([
            'data'    => null,
            'message' => 'Job posting deleted successfully',
            'status'  => 200,
        ]);
    }
}
