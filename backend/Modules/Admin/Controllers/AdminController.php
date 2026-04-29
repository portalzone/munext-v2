<?php

namespace Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Jobs\Models\JobPosting;

class AdminController extends Controller
{
    private function guardAdmin(Request $request): ?JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Admins only.'], 403);
        }
        return null;
    }

    // GET /api/v1/admin/stats
    public function stats(Request $request): JsonResponse
    {
        if ($guard = $this->guardAdmin($request)) return $guard;

        return response()->json([
            'data' => [
                'total_users'        => User::count(),
                'total_students'     => User::where('role', 'student')->count(),
                'total_employers'    => User::where('role', 'employer')->count(),
                'active_jobs'        => JobPosting::where('is_active', true)->count(),
                'total_jobs'         => JobPosting::count(),
                'total_applications' => DB::table('applications')->count(),
                'total_categories'   => JobPosting::whereNotNull('category')
                                            ->distinct('category')
                                            ->count('category'),
            ],
            'message' => 'Platform stats retrieved',
            'status'  => 200,
        ]);
    }

    // GET /api/v1/admin/users
    public function users(Request $request): JsonResponse
    {
        if ($guard = $this->guardAdmin($request)) return $guard;

        $query = User::query();

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $perPage = min((int) $request->query('per_page', 15), 50);
        $users   = $query->latest()->paginate($perPage);

        return response()->json([
            'data'       => $users->items(),
            'pagination' => [
                'total'        => $users->total(),
                'per_page'     => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
            'message' => 'Users retrieved',
            'status'  => 200,
        ]);
    }

    // PUT /api/v1/admin/users/{id}/toggle
    public function toggleUser(Request $request, int $id): JsonResponse
    {
        if ($guard = $this->guardAdmin($request)) return $guard;

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'You cannot deactivate your own account.'], 422);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'data'    => $user->fresh(),
            'message' => $user->is_active ? 'User activated' : 'User deactivated',
            'status'  => 200,
        ]);
    }

    // GET /api/v1/admin/jobs
    public function jobs(Request $request): JsonResponse
    {
        if ($guard = $this->guardAdmin($request)) return $guard;

        $query = JobPosting::with('employer:id,name,email')->latest();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('is_active', $status === 'active');
        }

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
            'message' => 'Jobs retrieved',
            'status'  => 200,
        ]);
    }

    // PUT /api/v1/admin/jobs/{id}/toggle
    public function toggleJob(Request $request, JobPosting $job): JsonResponse
    {
        if ($guard = $this->guardAdmin($request)) return $guard;

        $job->update(['is_active' => !$job->is_active]);

        return response()->json([
            'data'    => $job->fresh(),
            'message' => 'Job status updated',
            'status'  => 200,
        ]);
    }

    // DELETE /api/v1/admin/jobs/{id}
    public function deleteJob(Request $request, JobPosting $job): JsonResponse
    {
        if ($guard = $this->guardAdmin($request)) return $guard;

        $job->delete();

        return response()->json(['data' => null, 'message' => 'Job deleted', 'status' => 200]);
    }
}
