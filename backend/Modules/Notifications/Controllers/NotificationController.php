<?php

namespace Modules\Notifications\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Notifications\Models\Notification;

class NotificationController extends Controller
{
    // GET /api/v1/notifications
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'data'        => $notifications,
            'unread_count' => $notifications->whereNull('read_at')->count(),
            'message'     => 'Notifications retrieved successfully',
            'status'      => 200,
        ]);
    }

    // PUT /api/v1/notifications/{id}/read
    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->markRead();

        return response()->json([
            'data'    => $notification,
            'message' => 'Notification marked as read',
            'status'  => 200,
        ]);
    }

    // PUT /api/v1/notifications/read-all
    public function markAllRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'data'    => null,
            'message' => 'All notifications marked as read',
            'status'  => 200,
        ]);
    }
}
