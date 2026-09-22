# Panchang Backend — PHP + SQLite3 (MVC) Design

Date: 2026-09-22
Status: Approved in conversation; implementation in progress.

## Purpose

Add a self-hosted PHP + SQLite3 backend for the Panchang Astrochitra PWA.
The backend tracks anonymous web users vs installed PWA devices, stores
anonymous kundlis, and exposes an admin dashboard. Designed for local
development first (later deployable to shared hosting / VPS).

## Scope (v1)

- Anonymous client tracking (web users + installs) via a single heartbeat/upsert endpoint.
- Anonymous kundli storage (birth data + generated chart JSON).
- Admin dashboard with login (email + password) and read-only analytics.
- MVC folder layout under `server/`.

Out of scope for v1: public registration, OAuth, charts/predictions
computed server-side, kundli retrieval by guest, PII retention.

## Architecture

```
server/
  public/
    index.php            # front controller (dev router + PHP built-in server)
  app/
    Core/                # Router, Database (PDO sqlite), Controller, Request, Response
    Models/              # User, Client, Kundli
    Controllers/         # AuthController, ClientController, KundliController, DashboardController, HealthController
    Middleware/          # AuthMiddleware (session gate for /admin)
    helpers.php          # json(), view(), redirect(), csrf(), flash()
  views/
    layout.php
    auth/login.php
    dashboard/index.php  # stats + trend
    dashboard/clients.php
    dashboard/kundlis.php
    dashboard/events.php
  config/config.php
  db/init.php            # schema creation
  scripts/create-admin.php
  start.ps1              # php -S localhost:1212 -t server/public server/public/index.php
  data/                  # SQLite file lives here (gitignored)
```

Routing is `path-to-method` style: request URI + HTTP method is matched
against a route table in `app/routes.php` loaded by the front controller.

### SQLite schema

```sql
users    (id, email UNIQUE, password_hash, name, role DEFAULT 'admin', created_at)
clients  (id, device_id UNIQUE, is_installed, installed_at, platform,
          is_mobile, first_seen_at, last_seen_at, user_agent, app_version, created_at)
kundlis  (id, client_id REFERENCES clients(id), birth_name, date, time,
          timezone, latitude, longitude, place_name, kundli_json, created_at)
```

`clients` is the "guest users" concept: one row per anonymous device,
identified by a client-generated random `device_id` stored in the user's
localStorage. An install is the same row flagged `is_installed=1` with
`installed_at`. No PII is required.

### API endpoints (PWA-facing)

- `POST /api/v1/client` — upsert heartbeat `{device_id, is_installed, platform, is_mobile, app_version}`. First sight → web user count; flagged install → install count.
- `POST /api/v1/kundli` — save anonymous kundli `{device_id, birth_name?, date, time, timezone, latitude, longitude, place_name, kundli_json}`.
- `GET /api/v1/config` — `{api_enabled, kundli_quota}` so the PWA can degrade gracefully.
- `GET /api/v1/health` — `{ok: true}`.

All API responses JSON. Unknown API routes → 404 JSON. Requests to `/admin` not authenticated → login redirect.

### Admin dashboard (`/admin`)

Session-based login. Pages:
- `GET /admin` — stat cards (web users, installs, kundlis — total + today), 14-day trend bars, recent rows.
- `GET /admin/clients` — client table with search by device id.
- `GET /admin/kundlis` — kundli table with JSON viewer.
- `GET /admin/events` — reserved for future feature gates/config.

### Admin bootstrap

`php scripts/create-admin.php <email> <password> [--name="..."]` creates
or updates the admin user. SQLite file created/upgraded automatically on
first run via `db/init.php` (idempotent `CREATE TABLE IF NOT EXISTS`).

### Duplicate-guard

`kundli_id` duplicate prevention: the PWA sends its stable client-side
kundli id (`k*` hash from `kundliStorage`); backend stores it as `kundli_key`
with a UNIQUE index scoped per client so syncs are idempotent.

## PWA integration

- New `src/lib/backend.ts`: API base from `import.meta.env.VITE_API_BASE` default `/api/v1`; `deviceId()` (random persisted in localStorage); `reportClient()`, `syncKundlis()`.
- Heartbeat on app boot (once per session + when install state flips via `appinstalled` / standalone detection).
- Kundli save hook in `kundliStorage.saveKundli` → fire-and-forget `POST /api/v1/kundli`.
- Vite dev proxy: `/api/v1` → `http://localhost:1212`. Existing `/api/explabs` proxy untouched.
- Failures are silent; PWA stays offline-first.

## Testing

- `php -l` on every PHP file.
- Live server on :1212; exercise health, client upsert (web + install), kundli save, config; verify dashboard login + stats via curl/Invoke-WebRequest session.
- PWA dev build via `npm run dev`; confirm heartbeat reaches backend through the proxy.

## Security notes

- Passwords: `password_hash()`/`password_verify()`.
- Admin session: HttpOnly + SameSite cookies, session regeneration on login.
- CSRF token on dashboard forms (logout).
- Input validation on all API fields; store only structured birth data; ignore `birth_name` if empty.