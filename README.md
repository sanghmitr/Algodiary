# AlgoDiary

AlgoDiary is a full-stack interview prep tracker for engineers preparing for FAANG-style interviews. It combines a structured prep plan, Kanban task tracking, task-linked notes, code snippets, a searchable Knowledge Base, weak-area tracking, reminders, and a polished landing/auth experience.

The app is built as a production-oriented monorepo with an async FastAPI backend and a React/Vite frontend.

## Highlights

- Multi-user JWT authentication with refresh tokens, Redis token storage, and logout blacklisting
- Default prep task seeding for every new user
- Kanban board for DSA, HLD, and LLD tasks
- Full-page notes editor with markdown, image upload/paste support, preview mode, tags, and task linking
- Full-page snippets editor with task search, tags, favorites, and language support for Python, Java, JavaScript, TypeScript, SQL, Go, C, and C++
- Unified Knowledge Base across notes and snippets with category, type, tag, revision-ready, and full-text search filters
- Dashboard with task progress, upcoming tasks, Knowledge Base shortcuts, and progress charts
- Weak-area tracker for focused revision
- WebSocket updates and Redis pub/sub plumbing
- Celery tasks for reminders, streak checks, weekly reports, and achievements
- Web Push and Cloudflare R2-ready upload configuration
- Landing page and auth screens using the AlgoDiary brand identity

## Tech Stack

### Backend

- Python 3.11+
- FastAPI + Uvicorn
- SQLAlchemy 2.0 async ORM + asyncpg
- PostgreSQL 15
- Alembic migrations
- Redis 7
- Celery + Celery Beat
- python-jose JWT auth
- passlib/bcrypt password hashing
- Pydantic v2
- slowapi rate limiting
- pywebpush
- boto3 for Cloudflare R2-compatible storage

### Frontend

- Vite
- React 18
- TypeScript strict mode
- Tailwind CSS
- React Query v5
- Zustand
- CodeMirror 6
- React Beautiful DnD
- Recharts
- React Hook Form + Zod
- Fuse.js
- react-hotkeys-hook
- react-intersection-observer

## Repository Structure

```text
prep-tracker/
+-- backend/
|   +-- app/
|   |   +-- models/
|   |   +-- routers/
|   |   +-- schemas/
|   |   +-- services/
|   |   +-- websocket/
|   |   +-- workers/
|   +-- alembic/
|   +-- requirements.txt
|   +-- Dockerfile
|   +-- fly.toml
|   +-- .env.example
+-- frontend/
|   +-- public/
|   +-- src/
|   |   +-- api/
|   |   +-- components/
|   |   +-- hooks/
|   |   +-- pages/
|   |   +-- store/
|   |   +-- types/
|   +-- package.json
+-- docker-compose.yml
+-- README.md
```

## Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer
- PostgreSQL 15 or a hosted PostgreSQL database such as Neon
- Redis 7 or a hosted Redis instance such as Upstash
- Docker or Docker Compose is optional

## Quick Start

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd prep-tracker
```

### 2. Start PostgreSQL and Redis

With Docker:

```bash
docker compose up -d
```

If Docker is unavailable, use any local or hosted PostgreSQL and Redis instance, then update `backend/.env` with those URLs.

Default local database URL:

```text
postgresql+asyncpg://user:pass@localhost/preptracker
```

Default local Redis URL:

```text
redis://localhost:6379/0
```

### 3. Configure the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and set at least:

```text
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/preptracker
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=<random-32-character-string>
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

Run migrations:

```bash
alembic upgrade head
```

Start the API:

```bash
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/health
```

### 4. Start the frontend

In a new terminal:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

The frontend uses `http://localhost:8000` by default. To override it:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Useful Commands

### Backend

```bash
cd backend
source .venv/bin/activate

# Compile check
python -m compileall app

# Run migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload

# Start Celery worker
celery -A app.workers.celery_app.celery_app worker --loglevel=info

# Start Celery Beat scheduler
celery -A app.workers.celery_app.celery_app beat --loglevel=info

# Worker and Beat together for local development
celery -A app.workers.celery_app.celery_app worker -B --loglevel=info
```

### Frontend

```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Backend variables live in `backend/.env`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Async SQLAlchemy PostgreSQL URL |
| `REDIS_URL` | Redis URL for cache, sessions, pub/sub, rate limits, and Celery |
| `SECRET_KEY` | JWT signing secret |
| `ALGORITHM` | JWT algorithm, defaults to `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime |
| `VAPID_PRIVATE_KEY` | Web Push private key |
| `VAPID_PUBLIC_KEY` | Web Push public key |
| `VAPID_CLAIM_EMAIL` | Web Push contact email |
| `BREVO_SMTP_KEY` | Brevo SMTP key for weekly email reports |
| `R2_BUCKET` | Cloudflare R2 bucket name |
| `R2_ENDPOINT` | Cloudflare R2 endpoint URL |
| `R2_PUBLIC_URL` | Optional public/custom R2 URL |
| `R2_ACCESS_KEY` | R2 access key |
| `R2_SECRET_KEY` | R2 secret key |
| `UPLOAD_DIR` | Local upload directory fallback |
| `MAX_UPLOAD_MB` | Maximum upload size |
| `FRONTEND_URL` | Allowed CORS frontend origin |
| `ENVIRONMENT` | Runtime environment |

Frontend variables:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API origin, defaults to `http://localhost:8000` |
| `VITE_VAPID_PUBLIC_KEY` | Optional Web Push public key for browser subscription |

## Main Routes

### Public

- `/` - AlgoDiary landing page
- `/login` - login
- `/register` - account creation

### App

- `/dashboard` - progress summary, upcoming tasks, Knowledge Base shortcuts
- `/tasks` - Kanban board with filters and custom task creation
- `/notes` - full-page notes editor
- `/snippets` - full-page snippet editor
- `/kb` - searchable Knowledge Base
- `/progress` - weak-area tracking and progress chart
- `/settings` - profile, goals, notification, and account settings

## API Overview

The backend exposes versioned routes under `/api/v1`.

| Area | Prefix | Notes |
| --- | --- | --- |
| Auth | `/api/v1/auth` | register, login, refresh, logout, current user |
| Users | `/api/v1/users` | profile, push subscriptions, stats |
| Tasks | `/api/v1/tasks` | list, update, reorder, default seed support |
| Notes | `/api/v1/notes` | CRUD, tags, image upload/delete support |
| Snippets | `/api/v1/snippets` | CRUD and tags |
| Knowledge Base | `/api/v1/kb` | search, tags, stats |
| Progress | `/api/v1/progress` | weak areas and progress summaries |
| Notifications | `/api/v1/notifications` | list, read, delete |
| WebSocket | `/ws?token=<jwt>` | authenticated real-time events |

## Knowledge Base

The Knowledge Base is the revision layer across notes and snippets.

- Notes and snippets are categorized as `DSA`, `HLD`, `LLD`, or `General`.
- Notes can be marked revision-ready.
- Tags work like Jira labels: reusable, searchable, and suggested while editing.
- PostgreSQL full-text search is used on note and snippet content.
- Redis caches Knowledge Base search results for fast repeat queries.
- Note and snippet writes invalidate the user's Knowledge Base cache.

Keyboard shortcuts:

- `/` focuses Knowledge Base search when on the Knowledge Base page
- `Escape` clears search and closes editors
- `Cmd+K` or `Ctrl+K` opens the Knowledge Base from anywhere in the app

## Notes and Images

Notes support image upload and paste. Uploaded images can be embedded directly in the markdown preview. If an image is no longer needed, use the delete control on the image so the stored file is removed as well as the markdown reference.

Local development stores uploads under `backend/uploads` unless R2 is configured. Production can use Cloudflare R2 through the R2 environment variables.

## Default Prep Data

Every new user gets the seeded prep tasks automatically. The seeded data is split into specific task-level notes so DSA, HLD, and LLD content stay separate and searchable by the correct category.

## Testing and Verification

Run backend checks:

```bash
cd backend
source .venv/bin/activate
python -m compileall app
```

Run frontend checks:

```bash
cd frontend
npm run build
```

Manual smoke path:

1. Start PostgreSQL and Redis.
2. Run `alembic upgrade head`.
3. Start the backend with Uvicorn.
4. Start the frontend with Vite.
5. Register a new account.
6. Confirm tasks are created automatically.
7. Move tasks through Kanban.
8. Create a note and snippet linked to a task.
9. Search both from the Knowledge Base.
10. Upload/paste an image into a note and verify preview rendering.

## Free Deployment

This app can run on free tiers with:

| Layer | Provider | Use |
| --- | --- | --- |
| Frontend | Vercel Hobby | Vite static app |
| Backend | Render Free Web Service | FastAPI API |
| PostgreSQL | Neon Free | App database |
| Object storage | Cloudflare R2 Free | Note image uploads |
| Redis | Upstash Redis Free | Rate limits, token/session data, WebSocket pub/sub, optional Celery broker |

Free-tier caveats:

- Render free web services can sleep after inactivity, so the first request after idle time can be slow.
- Celery workers and Celery Beat are not included in this free web-service setup. The main app works, but scheduled reminders and weekly reports need a separate worker service or another scheduler.
- R2 only works for public note image URLs when `R2_PUBLIC_URL` is configured.
- Keep upload volume small on free tiers. The default `MAX_UPLOAD_MB=8` is fine for occasional note images.

### 1. Create Neon PostgreSQL

1. Create a Neon project and database.
2. Copy the connection string.
3. Convert it for this async SQLAlchemy app:

```text
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

to:

```text
postgresql+asyncpg://USER:PASSWORD@HOST/DB?ssl=require
```

Use the converted value as `DATABASE_URL`.

### 2. Create Upstash Redis

1. Create an Upstash Redis database.
2. Copy the Redis URL.
3. Use it as `REDIS_URL`.

Use a `rediss://` URL if Upstash gives you TLS Redis.

### 3. Create Cloudflare R2 Storage

1. Create an R2 bucket, for example `algodiary-uploads`.
2. Create an R2 API token with object read/write permission for the bucket.
3. Configure public access through an R2 public URL or a custom domain.
4. Save these backend env vars:

```text
R2_BUCKET=algodiary-uploads
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://<public-r2-domain-or-dev-url>
R2_ACCESS_KEY=<r2-access-key-id>
R2_SECRET_KEY=<r2-secret-access-key>
```

### 4. Deploy Backend on Render

Create a new Render Web Service from this repository.

Render settings:

| Setting | Value |
| --- | --- |
| Runtime | Python |
| Root directory | `backend` |
| Build command | `pip install -r requirements.txt` |
| Start command | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/health` |

Set backend environment variables in Render:

```text
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DB?ssl=require
REDIS_URL=<upstash-redis-url>
SECRET_KEY=<random-32-plus-character-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=https://<your-vercel-domain>
FRONTEND_URLS=https://<your-vercel-preview-domain-if-needed>
ENVIRONMENT=production
R2_BUCKET=algodiary-uploads
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://<public-r2-domain-or-dev-url>
R2_ACCESS_KEY=<r2-access-key-id>
R2_SECRET_KEY=<r2-secret-access-key>
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=8
VAPID_PRIVATE_KEY=<optional>
VAPID_PUBLIC_KEY=<optional>
VAPID_CLAIM_EMAIL=<your-email>
BREVO_SMTP_KEY=<optional>
```

After deploy, verify:

```text
https://<render-service>.onrender.com/health
https://<render-service>.onrender.com/health/db
```

### 5. Deploy Frontend on Vercel

Create a new Vercel project from this repository.

Vercel settings:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | `frontend` |
| Install command | `npm install --legacy-peer-deps` |
| Build command | `npm run build` |
| Output directory | `dist` |

Set frontend environment variables in Vercel:

```text
VITE_API_BASE_URL=https://<render-service>.onrender.com
VITE_VAPID_PUBLIC_KEY=<optional-public-vapid-key>
```

After the Vercel domain is created, return to Render and set:

```text
FRONTEND_URL=https://<your-vercel-domain>
```

Redeploy the Render service so CORS uses the final frontend URL.

### 6. Optional Worker Setup

For local testing, workers still run with:

```bash
cd backend
celery -A app.workers.celery_app.celery_app worker -B --loglevel=info
```

For production reminders and weekly reports, deploy a separate paid Render worker or another always-on worker host with:

```bash
celery -A app.workers.celery_app.celery_app worker -B --loglevel=info
```

## VAPID Keys

Generate Web Push keys:

```bash
pip install py-vapid
python -m py_vapid --gen
```

Set the generated values in `backend/.env`:

```text
VAPID_PRIVATE_KEY=<private-key>
VAPID_PUBLIC_KEY=<public-key>
VAPID_CLAIM_EMAIL=you@example.com
```

Expose the public key to the frontend if push subscription UI is enabled:

```text
VITE_VAPID_PUBLIC_KEY=<public-key>
```

## Brevo SMTP

For weekly progress emails:

1. Create a Brevo account.
2. Open SMTP settings.
3. Generate an SMTP key.
4. Set `BREVO_SMTP_KEY` in the backend environment.

## License

No license has been added yet. Add one before publishing as an open-source project.
