<?php

use App\Models\User;
use Modules\Jobs\Models\Application;
use Modules\Jobs\Models\JobPosting;
use Modules\Messages\Models\Message;

// ── helpers ──────────────────────────────────────────────────────────────────

function makeApplicationWithStatus(string $status): array
{
    $employer = User::factory()->create(['role' => 'employer']);
    $student  = User::factory()->create(['role' => 'student']);
    $job      = JobPosting::create([
        'employer_id'      => $employer->id,
        'title'            => 'Software Engineer',
        'description'      => 'Build cool things.',
        'skills_required'  => ['PHP', 'Laravel'],
        'experience_level' => 'mid',
        'is_active'        => true,
    ]);
    $app = Application::create([
        'student_id'   => $student->id,
        'job_id'       => $job->id,
        'status'       => $status,
        'cover_letter' => 'I am very interested.',
    ]);
    return compact('employer', 'student', 'job', 'app');
}

// ── thread (GET) ──────────────────────────────────────────────────────────────

it('student can fetch an empty thread once application is reviewed', function () {
    ['student' => $student, 'app' => $app] = makeApplicationWithStatus('reviewed');

    $response = $this->actingAs($student)->getJson("/api/v1/messages/{$app->id}");

    $response->assertStatus(200);
    expect($response->json('data'))->toBeArray()->toBeEmpty();
});

it('employer can fetch the thread for their job applicant', function () {
    ['employer' => $employer, 'app' => $app] = makeApplicationWithStatus('shortlisted');

    $response = $this->actingAs($employer)->getJson("/api/v1/messages/{$app->id}");

    $response->assertStatus(200);
});

it('blocks messaging when application is still pending', function () {
    ['student' => $student, 'app' => $app] = makeApplicationWithStatus('pending');

    $this->actingAs($student)->getJson("/api/v1/messages/{$app->id}")->assertStatus(403);
});

it('blocks a third party from accessing the thread', function () {
    ['app' => $app] = makeApplicationWithStatus('reviewed');
    $stranger = User::factory()->create(['role' => 'student']);

    $this->actingAs($stranger)->getJson("/api/v1/messages/{$app->id}")->assertStatus(403);
});

// ── send (POST) ───────────────────────────────────────────────────────────────

it('student can send a message once reviewed', function () {
    ['student' => $student, 'app' => $app] = makeApplicationWithStatus('reviewed');

    $response = $this->actingAs($student)
        ->postJson("/api/v1/messages/{$app->id}", ['body' => 'Hello, I am very excited about this role.']);

    $response->assertStatus(201);
    expect($response->json('data.body'))->toBe('Hello, I am very excited about this role.');
    $this->assertDatabaseHas('messages', ['application_id' => $app->id, 'sender_id' => $student->id]);
});

it('employer can reply to a message', function () {
    ['employer' => $employer, 'app' => $app] = makeApplicationWithStatus('shortlisted');

    $response = $this->actingAs($employer)
        ->postJson("/api/v1/messages/{$app->id}", ['body' => 'We would like to schedule an interview.']);

    $response->assertStatus(201);
    $this->assertDatabaseHas('messages', ['application_id' => $app->id, 'sender_id' => $employer->id]);
});

it('rejects an empty message body', function () {
    ['student' => $student, 'app' => $app] = makeApplicationWithStatus('reviewed');

    $this->actingAs($student)
        ->postJson("/api/v1/messages/{$app->id}", ['body' => ''])
        ->assertStatus(422);
});

it('blocks sending when application is pending', function () {
    ['student' => $student, 'app' => $app] = makeApplicationWithStatus('pending');

    $this->actingAs($student)
        ->postJson("/api/v1/messages/{$app->id}", ['body' => 'Can I message you?'])
        ->assertStatus(403);
});

// ── broadcast (POST) ──────────────────────────────────────────────────────────

it('employer can broadcast a message to all eligible applicants', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    $job      = JobPosting::create([
        'employer_id'      => $employer->id,
        'title'            => 'Developer',
        'description'      => 'Build things.',
        'skills_required'  => ['PHP'],
        'experience_level' => 'mid',
        'is_active'        => true,
    ]);

    $s1 = User::factory()->create(['role' => 'student']);
    $s2 = User::factory()->create(['role' => 'student']);
    $s3 = User::factory()->create(['role' => 'student']);

    Application::create(['student_id' => $s1->id, 'job_id' => $job->id, 'status' => 'reviewed',    'cover_letter' => 'Hi']);
    Application::create(['student_id' => $s2->id, 'job_id' => $job->id, 'status' => 'shortlisted', 'cover_letter' => 'Hi']);
    Application::create(['student_id' => $s3->id, 'job_id' => $job->id, 'status' => 'pending',     'cover_letter' => 'Hi']);

    $response = $this->actingAs($employer)
        ->postJson("/api/v1/messages/broadcast/{$job->id}", ['body' => 'Interviews start next week.']);

    $response->assertStatus(200);
    expect($response->json('data.sent_to'))->toBe(2); // s3 is pending — excluded
});

it('student cannot broadcast', function () {
    $student = User::factory()->create(['role' => 'student']);
    $this->actingAs($student)->postJson('/api/v1/messages/broadcast/1', ['body' => 'Hi'])->assertStatus(403);
});

// ── unread count ──────────────────────────────────────────────────────────────

it('returns correct unread count for student', function () {
    ['employer' => $employer, 'student' => $student, 'app' => $app] = makeApplicationWithStatus('reviewed');

    Message::create(['application_id' => $app->id, 'sender_id' => $employer->id, 'body' => 'Hi there']);
    Message::create(['application_id' => $app->id, 'sender_id' => $employer->id, 'body' => 'Are you available?']);

    $response = $this->actingAs($student)->getJson('/api/v1/messages/unread-count');

    $response->assertStatus(200);
    expect($response->json('data.unread_count'))->toBe(2);
});

it('rejects unauthenticated request to thread', function () {
    $this->getJson('/api/v1/messages/1')->assertStatus(401);
});
