<?php

namespace Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', 'in:student,alumni,employer'],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'data'    => ['user' => $user, 'token' => $token],
            'message' => 'Registration successful',
            'status'  => 201,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->isBanned()) {
            return response()->json([
                'error'   => 'Account banned.',
                'message' => 'Your account has been banned. Reason: ' . ($user->ban_reason ?? 'No reason provided.'),
                'status'  => 403,
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json([
                'error'   => 'Account deactivated.',
                'message' => 'Your account has been deactivated. Please contact support.',
                'status'  => 403,
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        activity()->causedBy($user)->log('User logged in');

        return response()->json([
            'data'    => ['user' => $user, 'token' => $token],
            'message' => 'Login successful',
            'status'  => 200,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data'    => $request->user(),
            'message' => 'Authenticated user retrieved',
            'status'  => 200,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'data'    => null,
            'message' => 'Logged out successfully',
            'status'  => 200,
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::sendResetLink($request->only('email'));

        return response()->json([
            'data'    => null,
            'message' => $status === Password::RESET_LINK_SENT
                ? 'Password reset link sent to your email.'
                : 'If that email exists, a reset link has been sent.',
            'status'  => 200,
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => ['required'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])
                     ->setRememberToken(Str::random(60));
                $user->save();
                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'error'   => 'Invalid or expired reset token.',
                'message' => 'Please request a new password reset link.',
                'status'  => 422,
            ], 422);
        }

        return response()->json([
            'data'    => null,
            'message' => 'Password reset successfully. You can now log in.',
            'status'  => 200,
        ]);
    }
}
