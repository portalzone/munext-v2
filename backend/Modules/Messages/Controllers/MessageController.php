<?php

namespace Modules\Messages\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Modules\Jobs\Models\Application;
use Modules\Messages\Models\Message;
use App\Mail\NewMessageMail;
use App\Models\User;
use Modules\Notifications\Models\Notification;
use Illuminate\Support\Facades\Mail;

class MessageController extends Controller
{
    private const ALLOWED_STATUSES = ['reviewed', 'shortlisted', 'hired'];

    // Resolve application and verify the caller is either the applicant or the job's employer
    private function resolveApplication(Request $request, int $applicationId): Application|JsonResponse
    {
        $application = Application::with('job')->find($applicationId);

        if (! $application) {
            return response()->json(['error' => 'Application not found.'], 404);
        }

        $user = $request->user();
        $isApplicant = $application->student_id === $user->id;
        $isEmployer  = $application->job?->employer_id === $user->id;

        if (! $isApplicant && ! $isEmployer) {
            return response()->json(['error' => 'You do not have access to this conversation.'], 403);
        }

        if (! in_array($application->status, self::ALLOWED_STATUSES)) {
            return response()->json([
                'error'   => 'Messaging is not available yet.',
                'message' => 'Messaging unlocks once the employer has reviewed the application.',
            ], 403);
        }

        return $application;
    }

    // GET /api/v1/messages/{applicationId}
    public function thread(Request $request, int $applicationId): JsonResponse
    {
        $application = $this->resolveApplication($request, $applicationId);

        if ($application instanceof JsonResponse) {
            return $application;
        }

        $messages = Message::where('application_id', $applicationId)
            ->with('sender:id,name,role')
            ->orderBy('created_at')
            ->get()
            ->each(function (Message $msg) {
                if ($msg->attachment_path) {
                    $msg->setAttribute('attachment_url', Storage::disk('public')->url($msg->attachment_path));
                }
            });

        // Mark all messages not sent by the caller as read
        Message::where('application_id', $applicationId)
            ->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'data'        => $messages,
            'application' => $application->only(['id', 'status', 'student_id', 'job_id']),
            'message'     => 'Thread retrieved successfully',
            'status'      => 200,
        ]);
    }

    // POST /api/v1/messages/{applicationId}
    public function send(Request $request, int $applicationId): JsonResponse
    {
        $application = $this->resolveApplication($request, $applicationId);

        if ($application instanceof JsonResponse) {
            return $application;
        }

        $validated = $request->validate([
            'body'       => ['nullable', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png,gif', 'max:10240'],
        ]);

        if (empty(trim($validated['body'] ?? '')) && ! $request->hasFile('attachment')) {
            return response()->json(['error' => 'A message body or attachment is required.'], 422);
        }

        $attachmentPath = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file           = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('message-attachments', 'public');
        }

        $message = Message::create([
            'application_id'  => $applicationId,
            'sender_id'       => $request->user()->id,
            'body'            => $validated['body'] ?? '',
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
        ]);

        $message->load('sender:id,name,role');

        if ($message->attachment_path) {
            $message->setAttribute('attachment_url', Storage::disk('public')->url($message->attachment_path));
        }

        // Notify the other party
        $user       = $request->user();
        $isApplicant = $application->student_id === $user->id;
        $recipientId = $isApplicant
            ? $application->job->employer_id
            : $application->student_id;

        Notification::create([
            'user_id' => $recipientId,
            'type'    => 'new_message',
            'message' => "{$user->name} sent you a message about your application.",
        ]);

        $recipient = User::find($recipientId);
        if ($recipient) {
            $preview  = mb_strimwidth($message->body ?? '(attachment)', 0, 120, '…');
            $jobTitle = $application->job->title ?? 'your application';
            Mail::to($recipient->email)->queue(
                new NewMessageMail($recipient->name, $user->name, $jobTitle, $preview)
            );
        }

        return response()->json([
            'data'    => $message,
            'message' => 'Message sent',
            'status'  => 201,
        ], 201);
    }

    // GET /api/v1/messages/unread-count
    public function unreadCount(Request $request): JsonResponse
    {
        // Find all applications the user is party to
        $user = $request->user();

        if ($user->isJobSeeker()) {
            $applicationIds = Application::where('student_id', $user->id)->pluck('id');
        } else {
            $applicationIds = Application::whereHas('job', fn($q) => $q->where('employer_id', $user->id))
                ->pluck('id');
        }

        $count = Message::whereIn('application_id', $applicationIds)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'data'   => ['unread_count' => $count],
            'status' => 200,
        ]);
    }

    // POST /api/v1/messages/broadcast/{jobId}  — employer only
    // Sends the same message to all eligible applicants for a job
    public function broadcast(Request $request, int $jobId): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'employer') {
            return response()->json(['error' => 'Employers only.'], 403);
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $applications = Application::where('job_id', $jobId)
            ->whereHas('job', fn($q) => $q->where('employer_id', $user->id))
            ->whereIn('status', self::ALLOWED_STATUSES)
            ->get();

        if ($applications->isEmpty()) {
            return response()->json([
                'error'   => 'No eligible applicants.',
                'message' => 'There are no reviewed, shortlisted, or hired applicants for this job.',
            ], 422);
        }

        $count = 0;
        foreach ($applications as $application) {
            Message::create([
                'application_id' => $application->id,
                'sender_id'      => $user->id,
                'body'           => $validated['body'],
            ]);

            Notification::create([
                'user_id' => $application->student_id,
                'type'    => 'new_message',
                'message' => "{$user->name} sent you a message about your application.",
            ]);

            $count++;
        }

        return response()->json([
            'data'    => ['sent_to' => $count],
            'message' => "Message sent to {$count} applicant(s).",
            'status'  => 200,
        ]);
    }
}
