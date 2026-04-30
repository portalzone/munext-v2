<?php

use App\Models\User;
use Modules\Employer\Models\EmployerProfile;

$profileData = [
    'company_name' => 'Acme Corp',
    'industry'     => 'Technology',
    'website'      => 'https://acme.example.com',
    'location'     => 'St. John\'s, NL',
    'description'  => 'A leading technology company in Newfoundland.',
];

it('allows an employer to create their profile', function () use ($profileData) {
    $employer = User::factory()->create(['role' => 'employer']);

    $response = $this->actingAs($employer)->postJson('/api/v1/employer/profile', $profileData);

    $response->assertStatus(201);
    expect($response->json('data.company_name'))->toBe('Acme Corp');
    $this->assertDatabaseHas('employer_profiles', ['user_id' => $employer->id, 'company_name' => 'Acme Corp']);
});

it('prevents creating a second profile', function () use ($profileData) {
    $employer = User::factory()->create(['role' => 'employer']);
    EmployerProfile::create(['user_id' => $employer->id, 'company_name' => 'Existing Corp']);

    $this->actingAs($employer)->postJson('/api/v1/employer/profile', $profileData)->assertStatus(409);
});

it('allows an employer to retrieve their profile', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    EmployerProfile::create(['user_id' => $employer->id, 'company_name' => 'Tech Co']);

    $response = $this->actingAs($employer)->getJson('/api/v1/employer/profile');

    $response->assertStatus(200);
    expect($response->json('data.company_name'))->toBe('Tech Co');
});

it('returns null data when employer has no profile', function () {
    $employer = User::factory()->create(['role' => 'employer']);

    $response = $this->actingAs($employer)->getJson('/api/v1/employer/profile');

    $response->assertStatus(200);
    expect($response->json('data'))->toBeNull();
});

it('allows an employer to update their profile', function () {
    $employer = User::factory()->create(['role' => 'employer']);
    EmployerProfile::create(['user_id' => $employer->id, 'company_name' => 'Old Name']);

    $response = $this->actingAs($employer)
        ->putJson('/api/v1/employer/profile', ['company_name' => 'New Name']);

    $response->assertStatus(200);
    expect($response->json('data.company_name'))->toBe('New Name');
});

it('rejects student from creating an employer profile', function () use ($profileData) {
    $student = User::factory()->create(['role' => 'student']);

    $this->actingAs($student)->postJson('/api/v1/employer/profile', $profileData)->assertStatus(403);
});

it('rejects unauthenticated request', function () {
    $this->getJson('/api/v1/employer/profile')->assertStatus(401);
});
