<x-mail::message>
# New Message on MUNext

Hi {{ $recipientName }},

**{{ $senderName }}** sent you a message about **{{ $jobTitle }}**:

> {{ $preview }}

<x-mail::button :url="config('app.frontend_url', 'http://localhost:3001')">
View Conversation
</x-mail::button>

You can reply directly from the MUNext platform.

Thanks,
The MUNext Team
</x-mail::message>
