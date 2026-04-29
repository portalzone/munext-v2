<?php

use App\Models\User;

// --- Register ---

it('registers a new user and returns a token', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name'     => 'Victor Muojeke',
        'email'    => 'victor@mun.ca',
        'password' => 'password123',
        'role'     => 'student',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => ['user' => ['id', 'name', 'email', 'role'], 'token'],
            'message',
            'status',
        ]);

    $this->assertDatabaseHas('users', ['email' => 'victor@mun.ca']);
});

it('fails registration when email is already taken', function () {
    User::factory()->create(['email' => 'victor@mun.ca']);

    $response = $this->postJson('/api/v1/auth/register', [
        'name'     => 'Victor Muojeke',
        'email'    => 'victor@mun.ca',
        'password' => 'password123',
        'role'     => 'student',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

it('fails registration when required fields are missing', function () {
    $response = $this->postJson('/api/v1/auth/register', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);
});

// --- Login ---

it('logs in an existing user and returns a token', function () {
    User::factory()->create([
        'email'    => 'victor@mun.ca',
        'password' => bcrypt('password123'),
        'role'     => 'student',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email'    => 'victor@mun.ca',
        'password' => 'password123',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => ['user', 'token'],
        ]);
});

it('fails login with wrong password', function () {
    User::factory()->create([
        'email'    => 'victor@mun.ca',
        'password' => bcrypt('password123'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email'    => 'victor@mun.ca',
        'password' => 'wrongpassword',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

it('fails login when fields are missing', function () {
    $response = $this->postJson('/api/v1/auth/login', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'password']);
});

// --- Logout ---

it('logs out an authenticated user', function () {
    $user = User::factory()->create();
    $token = $user->createToken('auth_token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/auth/logout');

    $response->assertStatus(200)
        ->assertJson(['message' => 'Logged out successfully']);
});

it('rejects logout without a token', function () {
    $response = $this->postJson('/api/v1/auth/logout');

    $response->assertStatus(401);
});
