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

## Deployment

### Backend on Fly.io

1. Create a Fly app.
2. Set secrets from `backend/.env.example`.
3. Use Neon for PostgreSQL and Upstash for Redis.
4. Deploy from `backend/`:

```bash
fly deploy
```

Run workers as a separate Fly process or app:

```bash
celery -A app.workers.celery_app.celery_app worker -B --loglevel=info
```

### Frontend on Cloudflare Pages

1. Create a Cloudflare Pages project.
2. Set the app directory to `frontend`.
3. Set build command:

```bash
npm run build
```

4. Set output directory:

```text
dist
```

5. Set `VITE_API_BASE_URL` to the deployed backend origin.

### File Storage on Cloudflare R2

Create an R2 bucket and set:

```text
R2_BUCKET
R2_ENDPOINT
R2_PUBLIC_URL
R2_ACCESS_KEY
R2_SECRET_KEY
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
