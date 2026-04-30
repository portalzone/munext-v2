# MUNext v2

A professional job board platform connecting Memorial University students with employers.
Students browse jobs, check skill match scores, apply with cover letters, and track application status.
Employers post jobs and manage applicants through a hiring pipeline. Admins moderate the platform and view ML analytics.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13, PHP 8.3, Sanctum, Spatie Activity Log |
| Frontend | Next.js 16, TypeScript, TanStack Query, Recharts |
| Database | PostgreSQL 16 |
| Queue | Laravel database queue + Docker worker service |
| Testing | Pest |
| DevOps | Docker, Docker Compose, Nginx |

## Project Structure

```
munext-v2/
  backend/
    Modules/
      Auth/           ← Register, login, logout
      Jobs/           ← Job postings, applications, bookmarks, skill match
      Students/       ← Student profiles
      ML/             ← 5 pure-PHP ML algorithms
      Admin/          ← User & job moderation, platform stats
      Notifications/  ← In-app notifications
    app/
      Services/
        MLService.php ← All 5 ML algorithms (pure PHP, no external library)
    database/migrations/
  frontend/
    app/
      (auth)/         ← Login, register
      (dashboard)/
        jobs/         ← Job listing with filters, pagination, bookmarks
        jobs/[id]/    ← Job detail, skill match chart, success predictor
        jobs/bookmarks/  ← Saved jobs
        profile/      ← Student profile + strength score
        employer/     ← Employer dashboard
        employer/applicants/[jobId]/ ← Applicant management
        employer/messages/    ← Employer message inbox
        messages/[applicationId]/ ← Per-application chat thread
        admin/        ← Admin dashboard + ML analytics
        notifications/ ← In-app notifications
      about/          ← About Us page
      contact/        ← Contact Us (functional form)
      privacy/        ← Privacy Policy
      terms/          ← Terms of Use
    lib/
      api.ts          ← All API calls
      types.ts        ← All TypeScript interfaces
  docker/
  docker-compose.yml
```

## Prerequisites

- Docker Desktop
- Git

## Running Locally

**1. Clone the repo**

```bash
git clone https://github.com/portalzone/munext-v2.git
cd munext-v2
```

**2. Set up environment files**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

`backend/.env` database block:

```env
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=munext
DB_USERNAME=munext
DB_PASSWORD=secret
```

`frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**3. Configure mail (optional — for email delivery)**

In `backend/.env`, set your SMTP credentials. Example for Hostinger:

```env
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=yourpassword
MAIL_FROM_ADDRESS="your@email.com"
MAIL_FROM_NAME="MUNext"
```

If mail is not configured, emails log to `backend/storage/logs/laravel.log`.

**4. Start the full stack**

```bash
docker compose up --build
```

This starts 5 containers: `app` (PHP-FPM), `nginx`, `postgres`, `frontend`, and `worker` (queue processor).

**5. Run migrations**

```bash
docker compose exec app php artisan migrate
```

**6. (Optional) Seed an admin user**

```bash
docker compose exec app php artisan tinker
```

```php
\App\Models\User::create([
    'name'     => 'Admin',
    'email'    => 'admin@example.com',
    'password' => bcrypt('password'),
    'role'     => 'admin',
]);
```

**7. Access the app**

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Laravel API | http://localhost:8000/api/v1 |
| PostgreSQL | localhost:5433 (user: `munext`, db: `munext`) |

## Running Tests

```bash
docker compose exec app php artisan test
```

All Pest tests must pass before any feature is considered done. Each endpoint has at minimum: happy path, unauthenticated access, and invalid input tests.

## API Endpoints

All routes prefixed `/api/v1/`. Sanctum token in `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | /auth/register | Public |
| POST | /auth/login | Public |
| GET  | /auth/me | Authenticated |
| POST | /auth/logout | Authenticated |

### Jobs
| Method | Endpoint | Access |
|---|---|---|
| GET  | /jobs | Authenticated |
| POST | /jobs | Employer |
| GET  | /jobs/{id} | Authenticated |
| PUT  | /jobs/{id} | Job owner |
| DELETE | /jobs/{id} | Job owner |
| GET  | /jobs/my-jobs | Employer |
| GET  | /jobs/bookmarks | Student |
| GET  | /jobs/{id}/bookmark | Student |
| POST | /jobs/{id}/bookmark | Student (toggle) |
| POST | /jobs/{id}/apply | Student (throttle: 5/min) |
| GET  | /jobs/{id}/applicants | Job owner |
| PUT  | /jobs/{id}/applicants/{id} | Job owner |
| GET  | /my-applications | Student |

### Students
| Method | Endpoint | Access |
|---|---|---|
| GET  | /students | Authenticated |
| POST | /students | Student |
| GET  | /students/my-profile | Student |
| GET  | /students/{id} | Authenticated |
| PUT  | /students/{id} | Profile owner |

### ML Algorithms (pure PHP)
| Method | Endpoint | Access | Algorithm |
|---|---|---|---|
| GET | /ml/match/{jobId} | Student | Jaccard skill match |
| GET | /ml/profile-strength | Student | Weighted profile score |
| GET | /ml/predict/{jobId} | Student | Application success predictor |
| GET | /ml/funnel | Employer | Hiring funnel analytics |
| GET | /ml/trends | Admin | EWMA market trend analysis |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | /admin/stats | Platform statistics |
| GET | /admin/users | List all users (search, role filter) |
| PUT | /admin/users/{id}/toggle | Activate / deactivate account |
| PUT | /admin/users/{id}/promote | Promote user to admin |
| PUT | /admin/users/{id}/ban | Ban user with reason |
| PUT | /admin/users/{id}/unban | Remove ban |
| PUT | /admin/users/{id}/approve-employer | Approve employer to post jobs |
| GET | /admin/jobs | List all jobs (search, status filter) |
| PUT | /admin/jobs/{id}/toggle | Activate / deactivate job |
| DELETE | /admin/jobs/{id} | Delete job |
| GET | /admin/audit-log | Paginated Spatie activity log |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| GET | /messages/{applicationId} | Fetch thread for an application |
| POST | /messages/{applicationId} | Send message (supports file attachment) |
| GET | /messages/unread-count | Total unread messages count |
| POST | /messages/broadcast/{jobId} | Employer: message all applicants for a job |

### Notifications
| Method | Endpoint | Access |
|---|---|---|
| GET | /notifications | Authenticated |
| PUT | /notifications/{id}/read | Authenticated |
| PUT | /notifications/read-all | Authenticated |

### Contact
| Method | Endpoint | Access |
|---|---|---|
| POST | /contact | Public |

## Features

### Student
- Job listing with search, category/salary/level filters, and sort
- Bookmark jobs and view a saved jobs list
- Apply with a cover letter (min 50 chars, rate limited)
- Track application status (pending → reviewed → shortlisted → hired/rejected)
- Profile with skills tagging
- Profile strength score (Algorithm 2)
- Skill match chart on job detail (Algorithm 1)
- Application success predictor (Algorithm 4)
- In-app notifications for status changes

### Employer
- Post, edit, deactivate job listings with salary range and category
- Must be approved by an admin before posting jobs
- View applicants per job with cover letter
- Move applicants through hiring pipeline (pending → reviewed → shortlisted → hired/rejected)
- Hiring funnel analytics chart (Algorithm 3)
- Message inbox: view active conversations per job
- Broadcast a message to all applicants on a job

### Admin
- Platform stats (total users, jobs, applications, categories)
- User management: activate/deactivate, ban/unban with reason, promote to admin
- Employer approval: approve or revoke posting rights
- Job moderation: toggle active status, delete
- ML analytics dashboard with all 5 algorithm outputs (Recharts charts)
- Audit trail: paginated Spatie activity log for all sensitive actions

### Messaging
- Per-application chat thread between student and employer
- File attachment support (PDF, Word, images)
- Unread message badge in navbar and message list
- Email notification to recipient on new message (queued)

### Platform
- Activity log (Spatie) on all sensitive actions: login, apply, status change, job create/delete, ban, promote
- Rate limiting on apply endpoint (5 requests/minute)
- Role-based access control on every endpoint
- Email queue via Laravel database driver + Docker worker container
- In-app notifications for status changes and new job matches
- Contact Us form (public, no login required)
- Static pages: About Us, Privacy Policy, Terms of Use

## Five ML Algorithms (Pure PHP)

All algorithms live in `backend/app/Services/MLService.php`. No Python, no external ML library.

| # | Algorithm | Endpoint | Used by |
|---|---|---|---|
| 1 | Jaccard skill match score | `GET /ml/match/{jobId}` | Job detail page, applicant list |
| 2 | Weighted profile strength score | `GET /ml/profile-strength` | Student profile page |
| 3 | Hiring funnel analytics | `GET /ml/funnel` | Employer dashboard |
| 4 | Application success predictor | `GET /ml/predict/{jobId}` | Job detail page |
| 5 | EWMA market trend analysis | `GET /ml/trends` | Admin ML dashboard |

## Troubleshooting

**Emails not sending**
The queue worker container (`munext_worker`) must be running. Check with:
```bash
docker compose ps
```
If stopped, restart with `docker compose up worker`. Confirm your SMTP credentials in `backend/.env`, then clear config cache:
```bash
docker compose exec app php artisan config:clear
```

**Migrations fail / DB connection refused**
Wait ~10 seconds after `docker compose up` for PostgreSQL to be ready, then run:
```bash
docker compose exec app php artisan migrate
```

**Frontend can't reach the API**
Ensure `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` is set in `frontend/.env.local` and that the `nginx` container is running on port 8000.

**Employer can't post jobs**
An admin must approve the employer account first. Log in as admin, go to the Users tab in the admin panel, and click "Approve" next to the employer.

## Contact

Support: support@basepan.com  
Website: munext.basepan.com
