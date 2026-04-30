<?php

namespace Modules\Jobs\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Jobs\Models\Application;
use Modules\Jobs\Models\JobPosting;
use Modules\Notifications\Models\Notification;

class ApplicationController extends Controller
{
    // Student applies to a job
    public function store(Request $request, JobPosting $job): JsonResponse
    {
        if ($request->user()->role !== 'student') {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'Only students can apply to jobs',
                'status'  => 403,
            ], 403);
        }

        $alreadyApplied = Application::where('student_id', $request->user()->id)
            ->where('job_id', $job->id)
            ->exists();

        if ($alreadyApplied) {
            return response()->json([
                'error'   => 'Conflict',
                'message' => 'You have already applied to this job',
                'status'  => 409,
            ], 409);
        }

        $validated = $request->validate([
            'cover_letter' => ['required', 'string', 'min:50', 'max:5000'],
        ]);

        $application = Application::create([
            'student_id'   => $request->user()->id,
            'job_id'       => $job->id,
            'status'       => 'pending',
            'cover_letter' => $validated['cover_letter'],
        ]);

        activity()->causedBy($request->user())->performedOn($application)
            ->log("Applied to job \"{$job->title}\"");

        return response()->json([
            'data'    => $application,
            'message' => 'Application submitted successfully',
            'status'  => 201,
        ], 201);
    }

    // Employer views all applicants for their job
    public function index(Request $request, JobPosting $job): JsonResponse
    {
        if ($request->user()->role !== 'employer' || $request->user()->id !== $job->employer_id) {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'Only the job owner can view applicants',
                'status'  => 403,
            ], 403);
        }

        $applications = Application::where('job_id', $job->id)
            ->with('student:id,name,email')
            ->get();

        return response()->json([
            'data'    => $applications,
            'message' => 'Applications retrieved successfully',
            'status'  => 200,
        ]);
    }

    // Employer updates application status
    public function update(Request $request, JobPosting $job, Application $application): JsonResponse
    {
        if ($request->user()->role !== 'employer' || $request->user()->id !== $job->employer_id) {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'Only the job owner can update application status',
                'status'  => 403,
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:pending,reviewed,shortlisted,rejected,hired'],
        ]);

        $application->update($validated);

        $statusLabels = [
            'pending'     => 'is under review',
            'reviewed'    => 'has been reviewed',
            'shortlisted' => 'has been shortlisted',
            'rejected'    => 'was not selected',
            'hired'       => 'has been accepted — congratulations!',
        ];

        Notification::create([
            'user_id' => $application->student_id,
            'type'    => 'application_status_changed',
            'message' => "Your application for \"{$job->title}\" {$statusLabels[$validated['status']]}.",
        ]);

        activity()->causedBy($request->user())->performedOn($application)
            ->log("Set application status to \"{$validated['status']}\" for job \"{$job->title}\"");

        return response()->json([
            'data'    => $application->fresh(),
            'message' => 'Application status updated',
            'status'  => 200,
        ]);
    }

    // Student views their own applications
    public function myApplications(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'student') {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'Only students can view their applications',
                'status'  => 403,
            ], 403);
        }

        $applications = Application::where('student_id', $request->user()->id)
            ->with('job:id,title,description,experience_level,employer_id')
            ->get();

        return response()->json([
            'data'    => $applications,
            'message' => 'Your applications retrieved successfully',
            'status'  => 200,
        ]);
    }
}
