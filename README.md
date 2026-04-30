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
| Testing | Pest (99 tests, 246 assertions) |
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
        admin/        ← Admin dashboard + ML analytics
        notifications/ ← In-app notifications
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

**3. Start the full stack**

```bash
docker compose up --build
```

**4. Run migrations**

```bash
docker compose exec app php artisan migrate
```

**5. Access the app**

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Laravel API | http://localhost:8000 |

## Running Tests

```bash
docker compose exec app php artisan test
```

99 tests · 246 assertions · all passing

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
| Method | Endpoint | Access |
|---|---|---|
| GET | /admin/stats | Admin |
| GET | /admin/users | Admin |
| PUT | /admin/users/{id}/toggle | Admin |
| GET | /admin/jobs | Admin |
| PUT | /admin/jobs/{id}/toggle | Admin |
| DELETE | /admin/jobs/{id} | Admin |

### Notifications
| Method | Endpoint | Access |
|---|---|---|
| GET | /notifications | Authenticated |
| PUT | /notifications/{id}/read | Authenticated |
| PUT | /notifications/read-all | Authenticated |

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
- View applicants per job with cover letter
- Move applicants through hiring pipeline
- Hiring funnel analytics chart (Algorithm 3)

### Admin
- Platform stats (users, jobs, applications)
- User management with deactivate/activate
- Job moderation (toggle, delete)
- ML analytics dashboard with all 5 algorithm outputs (Recharts charts)

### Platform
- Activity log (Spatie) on login, apply, status change, job create/delete
- Rate limiting on apply endpoint
- Role-based access control on every endpoint
