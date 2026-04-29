# MUNext v2

A platform connecting Memorial University students with employers. Students can browse job postings, check their skill match score, and apply. Employers can post jobs and manage applicants.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13, PHP 8.3, Sanctum |
| Frontend | Next.js 16, TypeScript, TanStack Query, Recharts |
| Database | PostgreSQL 16 |
| Testing | Pest (46 tests, 110 assertions) |
| DevOps | Docker, Docker Compose, Nginx |

## Project Structure

```
munext-v2/
  backend/               ← Laravel 13 API
    Modules/
      Auth/              ← Register, login, logout
      Jobs/              ← Job postings, applications, skill matcher
      Students/          ← Student profiles
  frontend/              ← Next.js 16 frontend
    app/
      (auth)/            ← Login, register pages
      (dashboard)/       ← Jobs, profile, employer dashboard
    lib/
      api.ts             ← All API calls
      types.ts           ← All TypeScript interfaces
  docker/
    app/                 ← PHP Dockerfile
    nginx/               ← Nginx config
    frontend/            ← Next.js Dockerfile
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

Update `backend/.env` with:

```
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=munext
DB_USERNAME=munext
DB_PASSWORD=secret
```

**3. Start the full stack**

```bash
docker compose up --build
```

**4. Run database migrations**

```bash
docker compose exec app php artisan migrate
```

**5. Access the app**

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Laravel API | http://localhost:8000 |

## API Endpoints

All routes prefixed with `/api/v1/`. Auth routes use Sanctum token in `Authorization: Bearer <token>` header.

| Method | Endpoint | Access |
|---|---|---|
| POST | /auth/register | Public |
| POST | /auth/login | Public |
| GET | /auth/me | Authenticated |
| POST | /auth/logout | Authenticated |
| GET | /jobs | Authenticated |
| POST | /jobs | Employer only |
| GET | /jobs/{id} | Authenticated |
| PUT | /jobs/{id} | Job owner only |
| DELETE | /jobs/{id} | Job owner only |
| GET | /jobs/my-jobs | Employer only |
| GET | /jobs/{id}/match | Student only |
| POST | /jobs/{id}/apply | Student only |
| GET | /jobs/{id}/applicants | Job owner only |
| PUT | /jobs/{id}/applicants/{id} | Job owner only |
| GET | /my-applications | Student only |
| GET | /students | Authenticated |
| POST | /students | Student only |
| GET | /students/{id} | Authenticated |
| PUT | /students/{id} | Profile owner only |

## Running Tests

```bash
docker compose exec app php artisan test
```

46 tests · 110 assertions · all passing

## Key Features

- **Modular Laravel architecture** — Auth, Jobs, Students modules each self-contained
- **Role-based access control** — student and employer roles enforced on every endpoint
- **Skill matcher** — compares student skills against job requirements, returns match score and Recharts chart
- **Full Pest test coverage** — happy path, unauthenticated, invalid input, and permission tests for every endpoint
