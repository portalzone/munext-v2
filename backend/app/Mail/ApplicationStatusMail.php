<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationStatusMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $studentName,
        public readonly string $jobTitle,
        public readonly string $status,
        public readonly string $statusLabel,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your application for {$this->jobTitle} has been updated",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.application-status',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
