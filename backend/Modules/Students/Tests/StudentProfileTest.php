<?php

use App\Models\User;
use Modules\Students\Models\StudentProfile;

function createProfile(User $student, array $overrides = []): StudentProfile
{
    return StudentProfile::create(array_merge([
        'user_id'         => $student->id,
        'program'         => 'Computer Science',
        'gpa'             => 3.8,
        'graduation_year' => 2026,
        'skills'          => ['PHP', 'Python'],
    ], $overrides));
}

// --- Index ---

it('allows any authenticated user to view all student profiles', function () {
    $user = User::factory()->create(['role' => 'employer']);

    $response = $this->actingAs($user)->getJson('/api/v1/students');

    $response->assertStatus(200)
        ->assertJsonStructure(['data', 'message', 'status']);
});

it('rejects unauthenticated request to view student profiles', function () {
    $response = $this->getJson('/api/v1/students');

    $response->assertStatus(401);
});

// --- Show ---

it('allows any authenticated user to view a single student profile', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $profile  = createProfile($student);

    $response = $this->actingAs($employer)->getJson("/api/v1/students/{$profile->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.id', $profile->id);
});

// --- Store ---

it('allows a student to create their profile', function () {
    $student = User::factory()->create(['role' => 'student']);

    $response = $this->actingAs($student)->postJson('/api/v1/students', [
        'program'         => 'Computer Science',
        'gpa'             => 3.9,
        'graduation_year' => 2026,
        'skills'          => ['PHP', 'Laravel'],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.program', 'Computer Science');

    $this->assertDatabaseHas('student_profiles', ['user_id' => $student->id]);
});

it('prevents an employer from creating a student profile', function () {
    $employer = User::factory()->create(['role' => 'employer']);

    $response = $this->actingAs($employer)->postJson('/api/v1/students', [
        'program'         => 'Computer Science',
        'gpa'             => 3.9,
        'graduation_year' => 2026,
        'skills'          => ['PHP'],
    ]);

    $response->assertStatus(403);
});

it('prevents a student from creating a second profile', function () {
    $student = User::factory()->create(['role' => 'student']);
    createProfile($student);

    $response = $this->actingAs($student)->postJson('/api/v1/students', [
        'program'         => 'Engineering',
        'graduation_year' => 2027,
        'skills'          => ['C++'],
    ]);

    $response->assertStatus(409);
});

it('fails to create a profile when required fields are missing', function () {
    $student = User::factory()->create(['role' => 'student']);

    $response = $this->actingAs($student)->postJson('/api/v1/students', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['program', 'graduation_year', 'skills']);
});

// --- Update ---

it('allows a student to update their own profile', function () {
    $student = User::factory()->create(['role' => 'student']);
    $profile = createProfile($student);

    $response = $this->actingAs($student)->putJson("/api/v1/students/{$profile->id}", [
        'program' => 'Software Engineering',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.program', 'Software Engineering');
});

it('prevents a student from updating another student\'s profile', function () {
    $student1 = User::factory()->create(['role' => 'student']);
    $student2 = User::factory()->create(['role' => 'student']);
    $profile  = createProfile($student1);

    $response = $this->actingAs($student2)->putJson("/api/v1/students/{$profile->id}", [
        'program' => 'Hacked Program',
    ]);

    $response->assertStatus(403);
});

it('prevents an employer from updating a student profile', function () {
    $student  = User::factory()->create(['role' => 'student']);
    $employer = User::factory()->create(['role' => 'employer']);
    $profile  = createProfile($student);

    $response = $this->actingAs($employer)->putJson("/api/v1/students/{$profile->id}", [
        'program' => 'Hacked Program',
    ]);

    $response->assertStatus(403);
});
