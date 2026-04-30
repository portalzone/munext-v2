<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    // POST /api/v1/contact  — public, no auth required
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:100'],
            'email'   => ['required', 'email', 'max:150'],
            'subject' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:3000'],
        ]);

        $body = implode("\n\n", [
            "From: {$validated['name']} <{$validated['email']}>",
            "Subject: {$validated['subject']}",
            "---",
            $validated['message'],
        ]);

        Mail::raw($body, function ($mail) use ($validated) {
            $mail->to('support@basepan.com')
                 ->replyTo($validated['email'], $validated['name'])
                 ->subject("[MUNext Contact] {$validated['subject']}");
        });

        return response()->json([
            'message' => 'Your message has been sent. We will get back to you within one business day.',
            'status'  => 200,
        ]);
    }
}
