<x-mail::message>
# Application Update — {{ $jobTitle }}

Hi {{ $studentName }},

Your application for **{{ $jobTitle }}** has been updated.

**New status: {{ $statusLabel }}**

@if ($status === 'reviewed')
The employer has reviewed your application and it is moving forward.
@elseif ($status === 'shortlisted')
Congratulations — you have been shortlisted for this role. The employer may be in touch soon.
@elseif ($status === 'hired')
Congratulations! You have been hired for this role.
@elseif ($status === 'rejected')
Thank you for applying. Unfortunately this application was not successful. Keep applying — the right opportunity is out there.
@endif

<x-mail::button :url="config('app.frontend_url', 'http://localhost:3001') . '/jobs/applications'">
View My Applications
</x-mail::button>

— The MUNext Team
</x-mail::message>
