<?php

use App\Models\User;
use Modules\Jobs\Models\Application;
use Modules\Jobs\Models\JobPosting;
use Modules\Notifications\Models\Notification;

function createJobAndApplication(): array
{
    $employer = User::factory()->create(['role' => 'employer']);
    $student  = User::factory()->create(['role' => 'student']);
    $job      = JobPosting::create([
        'employer_id'      => $employer->id,
        'title'            => 'Notification Test Job',
        'description'      => 'Test.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'entry',
        'is_active'        => true,
    ]);
    $application = Application::create([
        'student_id'   => $student->id,
        'job_id'       => $job->id,
        'status'       => 'pending',
        'cover_letter' => 'I am applying for this position because I have the required skills.',
    ]);

    return compact('employer', 'student', 'job', 'application');
}

// ── Status change triggers notification ───────────────────────────────────────

it('creates a notification when application status is updated', function () {
    ['employer' => $employer, 'student' => $student, 'job' => $job, 'application' => $application] = createJobAndApplication();

    $this->actingAs($employer)
        ->putJson("/api/v1/jobs/{$job->id}/applicants/{$application->id}", ['status' => 'shortlisted'])
        ->assertStatus(200);

    $this->assertDatabaseHas('notifications', [
        'user_id' => $student->id,
        'type'    => 'application_status_changed',
    ]);
});

// ── List ──────────────────────────────────────────────────────────────────────

it('returns notifications for the authenticated user', function () {
    $user = User::factory()->create(['role' => 'student']);
    Notification::create(['user_id' => $user->id, 'type' => 'test', 'message' => 'Hello']);

    $response = $this->actingAs($user)->getJson('/api/v1/notifications');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('unread_count'))->toBe(1);
});

it('returns empty list when user has no notifications', function () {
    $user = User::factory()->create(['role' => 'student']);

    $response = $this->actingAs($user)->getJson('/api/v1/notifications');

    $response->assertStatus(200);
    expect($response->json('data'))->toBeEmpty();
    expect($response->json('unread_count'))->toBe(0);
});

it('rejects unauthenticated request to list notifications', function () {
    $this->getJson('/api/v1/notifications')->assertStatus(401);
});

it('does not return notifications belonging to other users', function () {
    $user1 = User::factory()->create(['role' => 'student']);
    $user2 = User::factory()->create(['role' => 'student']);
    Notification::create(['user_id' => $user2->id, 'type' => 'test', 'message' => 'Not yours']);

    $response = $this->actingAs($user1)->getJson('/api/v1/notifications');

    expect($response->json('data'))->toBeEmpty();
});

// ── Mark one read ─────────────────────────────────────────────────────────────

it('marks a notification as read', function () {
    $user         = User::factory()->create(['role' => 'student']);
    $notification = Notification::create(['user_id' => $user->id, 'type' => 'test', 'message' => 'Hello']);

    $response = $this->actingAs($user)->putJson("/api/v1/notifications/{$notification->id}/read");

    $response->assertStatus(200);
    expect($notification->fresh()->read_at)->not->toBeNull();
});

it('rejects marking another user\'s notification as read', function () {
    $user1        = User::factory()->create(['role' => 'student']);
    $user2        = User::factory()->create(['role' => 'student']);
    $notification = Notification::create(['user_id' => $user2->id, 'type' => 'test', 'message' => 'Not yours']);

    $this->actingAs($user1)
        ->putJson("/api/v1/notifications/{$notification->id}/read")
        ->assertStatus(404);
});

// ── Mark all read ─────────────────────────────────────────────────────────────

it('marks all notifications as read', function () {
    $user = User::factory()->create(['role' => 'student']);
    Notification::create(['user_id' => $user->id, 'type' => 'test', 'message' => 'One']);
    Notification::create(['user_id' => $user->id, 'type' => 'test', 'message' => 'Two']);

    $this->actingAs($user)->putJson('/api/v1/notifications/read-all')->assertStatus(200);

    $unread = Notification::where('user_id', $user->id)->whereNull('read_at')->count();
    expect($unread)->toBe(0);
});
