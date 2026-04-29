<?php

namespace Modules\Students\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Students\Models\StudentProfile;

class StudentProfileController extends Controller
{
    // Any authenticated user can view all student profiles
    public function index(): JsonResponse
    {
        $profiles = StudentProfile::with('user:id,name,email')->get();

        return response()->json([
            'data'    => $profiles,
            'message' => 'Student profiles retrieved successfully',
            'status'  => 200,
        ]);
    }

    // Any authenticated user can view a single student profile
    public function show(StudentProfile $profile): JsonResponse
    {
        $profile->load('user:id,name,email');

        return response()->json([
            'data'    => $profile,
            'message' => 'Student profile retrieved successfully',
            'status'  => 200,
        ]);
    }

    // Only students can create a profile, and only one per student
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'student') {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'Only students can create a profile',
                'status'  => 403,
            ], 403);
        }

        if (StudentProfile::where('user_id', $request->user()->id)->exists()) {
            return response()->json([
                'error'   => 'Conflict',
                'message' => 'You already have a profile',
                'status'  => 409,
            ], 409);
        }

        $validated = $request->validate([
            'program'         => ['required', 'string', 'max:255'],
            'gpa'             => ['nullable', 'numeric', 'min:0', 'max:4'],
            'graduation_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'skills'          => ['required', 'array', 'min:1'],
            'skills.*'        => ['string'],
        ]);

        $profile = StudentProfile::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'data'    => $profile,
            'message' => 'Student profile created successfully',
            'status'  => 201,
        ], 201);
    }

    // Only the student who owns the profile can update it
    public function update(Request $request, StudentProfile $profile): JsonResponse
    {
        if ($request->user()->id !== $profile->user_id) {
            return response()->json([
                'error'   => 'Forbidden',
                'message' => 'You can only update your own profile',
                'status'  => 403,
            ], 403);
        }

        $validated = $request->validate([
            'program'         => ['sometimes', 'string', 'max:255'],
            'gpa'             => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:4'],
            'graduation_year' => ['sometimes', 'integer', 'min:2000', 'max:2100'],
            'skills'          => ['sometimes', 'array', 'min:1'],
            'skills.*'        => ['string'],
        ]);

        $profile->update($validated);

        return response()->json([
            'data'    => $profile->fresh(),
            'message' => 'Student profile updated successfully',
            'status'  => 200,
        ]);
    }
}
