<?php

namespace Modules\Employer\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Employer\Models\EmployerProfile;

class EmployerProfileController extends Controller
{
    // GET /api/v1/employer/profile
    public function show(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'employer') {
            return response()->json(['error' => 'Employers only.'], 403);
        }

        $profile = EmployerProfile::where('user_id', $request->user()->id)
            ->with('user:id,name,email')
            ->first();

        return response()->json([
            'data'    => $profile,
            'message' => 'Employer profile retrieved',
            'status'  => 200,
        ]);
    }

    // POST /api/v1/employer/profile
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'employer') {
            return response()->json(['error' => 'Employers only.'], 403);
        }

        if (EmployerProfile::where('user_id', $request->user()->id)->exists()) {
            return response()->json(['error' => 'Profile already exists. Use PUT to update.'], 409);
        }

        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'industry'     => ['nullable', 'string', 'max:100'],
            'website'      => ['nullable', 'url', 'max:255'],
            'location'     => ['nullable', 'string', 'max:100'],
            'description'  => ['nullable', 'string', 'max:2000'],
        ]);

        $profile = EmployerProfile::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'data'    => $profile->load('user:id,name,email'),
            'message' => 'Employer profile created',
            'status'  => 201,
        ], 201);
    }

    // PUT /api/v1/employer/profile
    public function update(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'employer') {
            return response()->json(['error' => 'Employers only.'], 403);
        }

        $profile = EmployerProfile::where('user_id', $request->user()->id)->firstOrFail();

        $validated = $request->validate([
            'company_name' => ['sometimes', 'string', 'max:255'],
            'industry'     => ['sometimes', 'nullable', 'string', 'max:100'],
            'website'      => ['sometimes', 'nullable', 'url', 'max:255'],
            'location'     => ['sometimes', 'nullable', 'string', 'max:100'],
            'description'  => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $profile->update($validated);

        return response()->json([
            'data'    => $profile->fresh()->load('user:id,name,email'),
            'message' => 'Employer profile updated',
            'status'  => 200,
        ]);
    }
}
