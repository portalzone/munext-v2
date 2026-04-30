<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewMessageMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $recipientName,
        public readonly string $senderName,
        public readonly string $jobTitle,
        public readonly string $preview,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->senderName} sent you a message on MUNext",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.new-message',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
