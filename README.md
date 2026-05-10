# Algodiary

Algodiary is a multi-user FAANG interview prep tracker with a FastAPI backend, PostgreSQL, Redis, Celery, and a React/Vite frontend.

## Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node 20+
- A PostgreSQL host such as Neon for production
- A Redis host such as Upstash for production

## Local Setup

```bash
cd prep-tracker
docker-compose up -d

cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

In another terminal:

```bash
cd prep-tracker/frontend
npm install --legacy-peer-deps
npm run dev
```

Open the frontend at `http://localhost:5173`. The API runs at `http://localhost:8000`.

## VAPID Keys

Install a VAPID key generator and create a key pair:

```bash
pip install py-vapid
python -m py_vapid --gen
```

Add the private key to `backend/.env` as `VAPID_PRIVATE_KEY`, the public key as `VAPID_PUBLIC_KEY`, and expose the same public key to the frontend as `VITE_VAPID_PUBLIC_KEY`.

## Brevo SMTP

Create a free Brevo account, open SMTP settings, generate an SMTP key, and set `BREVO_SMTP_KEY` in the backend environment. The weekly Celery report task sends through Brevo when this key is present.

## Deployment

- Backend: create a Fly.io app, configure secrets from `backend/.env.example`, point `DATABASE_URL` to Neon and `REDIS_URL` to Upstash, then run `fly deploy` from `backend/`.
- Workers: run a separate Fly process or app with `celery -A app.workers.celery_app.celery_app worker -B --loglevel=info`.
- Frontend: create a Cloudflare Pages project using `frontend/` as the app directory, set `VITE_API_BASE_URL` to the deployed backend URL, and build with `npm run build`.
- Files: create a Cloudflare R2 bucket and configure the R2 variables before enabling avatar/file upload flows.

## Knowledge Base Usage

- Notes and snippets require a category: DSA, HLD, LLD, or General.
- Notes can be marked Revision Ready; the Knowledge Base can filter to those polished notes for quick review.
- `/` focuses KB search, `Escape` clears search and closes the editor panel, and `Cmd+K` or `Ctrl+K` opens the Knowledge Base from anywhere.
- Tags power the sidebar cloud, filters, and `/api/v1/kb/tags` statistics.

## Common Commands

```bash
# Backend checks
cd backend
python -m compileall app
alembic upgrade head

# Frontend checks
cd frontend
npm run build
```
