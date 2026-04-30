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

        $query = JobPosting::where('employer_id', $request->user()->id);

        $sort = $request->query('sort', 'newest');
        match ($sort) {
            'oldest'      => $query->oldest(),
            'active'      => $query->orderByRaw('is_active DESC, created_at DESC'),
            'inactive'    => $query->orderByRaw('is_active ASC, created_at DESC'),
            default       => $query->latest(),
        };

        $perPage = min((int) $request->query('per_page', 10), 50);
        $jobs    = $query->paginate($perPage);

        return response()->json([
            'data'       => $jobs->items(),
            'pagination' => [
                'total'        => $jobs->total(),
                'per_page'     => $jobs->perPage(),
                'current_page' => $jobs->currentPage(),
                'last_page'    => $jobs->lastPage(),
            ],
            'message' => 'Your job postings retrieved successfully',
            'status'  => 200,
        ]);
    }

    // Any authenticated user can view all active job postings (paginated + filtered)
    public function index(Request $request): JsonResponse
    {
        $query = JobPosting::with('employer:id,name,email')
            ->where('is_active', true);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($level = $request->query('experience_level')) {
            $query->where('experience_level', $level);
        }

        if ($min = $request->query('salary_min')) {
            $query->where('salary_max', '>=', (int) $min);
        }

        if ($max = $request->query('salary_max')) {
            $query->where('salary_min', '<=', (int) $max);
        }

        $sort = $request->query('sort', 'newest');
        match ($sort) {
            'oldest'         => $query->oldest(),
            'salary_high'    => $query->orderByRaw('salary_max DESC NULLS LAST'),
            'salary_low'     => $query->orderByRaw('salary_min ASC NULLS LAST'),
            default          => $query->latest(),
        };

        $perPage = min((int) $request->query('per_page', 15), 50);
        $jobs    = $query->paginate($perPage);

        return response()->json([
            'data'       => $jobs->items(),
            'pagination' => [
                'total'        => $jobs->total(),
                'per_page'     => $jobs->perPage(),
                'current_page' => $jobs->currentPage(),
                'last_page'    => $jobs->lastPage(),
            ],
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
            'category'         => ['nullable', 'string', 'max:100'],
            'salary_min'       => ['nullable', 'integer', 'min:0'],
            'salary_max'       => ['nullable', 'integer', 'min:0', 'gte:salary_min'],
        ]);

        $job = JobPosting::create([
            ...$validated,
            'employer_id' => $request->user()->id,
            'is_active'   => true,
        ]);

        activity()->causedBy($request->user())->performedOn($job)
            ->log("Created job posting \"{$job->title}\"");

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
            'category'         => ['sometimes', 'nullable', 'string', 'max:100'],
            'salary_min'       => ['sometimes', 'nullable', 'integer', 'min:0'],
            'salary_max'       => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_active'        => ['sometimes', 'boolean'],
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

        activity()->causedBy($request->user())
            ->log("Deleted job posting \"{$job->title}\"");

        $job->delete();

        return response()->json([
            'data'    => null,
            'message' => 'Job posting deleted successfully',
            'status'  => 200,
        ]);
    }
}
