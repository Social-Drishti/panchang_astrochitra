# Panchang Astrochitra — REST API Documentation

This document describes every HTTP endpoint exposed by the server, how to
authenticate against it, and how to manage users and API keys from the admin
dashboard.

## Base URL

All examples below assume the app is running locally via:

```
php -S localhost:1212 router.php
```

Replace `http://localhost:1212` with your deployed domain in production.

## Two tiers of API

| Tier | Prefix | Auth required | Who calls it |
|---|---|---|---|
| **Public client API** | `/api/v1/health`, `/api/v1/config`, `/api/v1/client`, `/api/v1/kundli` | None | The PWA / mobile app itself (anonymous devices) |
| **Authenticated data API** | `/api/v1/stats`, `/api/v1/clients`, `/api/v1/kundlis` | API key | Your own scripts, dashboards, or partner integrations |

The public client endpoints stay open on purpose — the app calls them
anonymously before a user has any identity. The data API is for anyone who
needs to *pull data out* of the system programmatically, and always requires
an API key.

---

## 1. Public client API (no auth)

### `GET /api/v1/health`
Liveness check.

```bash
curl http://localhost:1212/api/v1/health
```

```json
{ "ok": true, "time": "2026-09-22T09:00:00+00:00" }
```

### `GET /api/v1/config`
Returns feature flags/config the client app should respect.

```bash
curl http://localhost:1212/api/v1/config
```

```json
{ "api_enabled": true, "kundli_quota": 50, "heartbeat_interval_min": 5 }
```

### `POST /api/v1/client`
Anonymous device heartbeat. Upserts a client row by `device_id`. Throttled to
one update per minute per device.

| Field | Type | Notes |
|---|---|---|
| `device_id` | string | 8–128 chars, `[A-Za-z0-9_-]`. Omit to have the server generate one. |
| `is_installed` | bool | Whether the PWA has been installed. |
| `platform` | string | Free-form, e.g. `web`, `android`, `ios`. |
| `is_mobile` | bool | |
| `app_version` | string | |

```bash
curl -X POST http://localhost:1212/api/v1/client \
  -d "device_id=abc123devicehash" \
  -d "is_installed=1" \
  -d "platform=web" \
  -d "app_version=1.4.0"
```

```json
{ "client_id": 1, "device_id": "abc123devicehash", "is_new": true, "is_new_install": true, "throttled": false }
```

### `POST /api/v1/kundli`
Saves (or idempotently updates, when `kundli_key` matches an existing one for
the same device) an anonymous kundli record.

| Field | Type | Required |
|---|---|---|
| `device_id` | string | no — links the kundli to a client if provided |
| `kundli_key` | string | no — send the same key again to update instead of duplicate |
| `birth_name` | string | no |
| `date` | string | **yes** |
| `time` | string | **yes** |
| `timezone` | float | no (default 5.5) |
| `latitude` / `longitude` | float | no |
| `place_name` | string | no |
| `kundli_json` | string (JSON) | **yes**, max 4MB |

```bash
curl -X POST http://localhost:1212/api/v1/kundli \
  -d "device_id=abc123devicehash" \
  -d "date=1990-01-01" \
  -d "time=10:30" \
  -d 'kundli_json={"sun":"aries"}'
```

```json
{ "id": 1, "updated": false }
```

---

## 2. Authenticated data API (requires an API key)

### Getting a key
1. Log into the admin dashboard at `/admin`.
2. Go to **API Keys** (only visible/usable to users with the `admin` role).
3. Give it a name and pick a scope, then click **Generate key**.
4. Copy the key immediately — it's shown **once** and only its hash is
   stored server-side, so it can't be recovered later. If you lose it, revoke
   it and generate a new one.

### Sending the key
Send it on every request, either as a bearer token or a custom header:

```bash
curl -H "Authorization: Bearer ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" ...
# or
curl -H "X-Api-Key: ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" ...
```

Missing or invalid keys get `401 Unauthorized`.

### Scopes
| Scope | Can do |
|---|---|
| `read` | Call the `GET` endpoints below. |
| `read_write` | Everything `read` can, plus the delete endpoints. |

A `read` key calling a write endpoint gets `403 Forbidden`.

### `GET /api/v1/stats`
Overview counters.

```bash
curl -H "Authorization: Bearer ak_..." http://localhost:1212/api/v1/stats
```

```json
{
  "clients_total": 128,
  "clients_installed": 41,
  "kundlis_total": 302,
  "kundlis_today": 6,
  "generated_at": "2026-09-22T09:00:00+00:00"
}
```

### `GET /api/v1/clients`
List clients (devices), newest first.

Query params: `limit` (default 50, max 200), `offset` (default 0), `q`
(optional search across device id / platform / user agent).

```bash
curl -H "Authorization: Bearer ak_..." \
  "http://localhost:1212/api/v1/clients?limit=20&q=android"
```

```json
{
  "data": [ { "id": 12, "device_id": "...", "platform": "android", "is_installed": 1, "...": "..." } ],
  "limit": 20,
  "offset": 0,
  "count": 1
}
```

### `POST /api/v1/clients/delete`  *(requires `read_write` scope)*
Deletes a client by id. Any kundlis linked to it keep their `client_id` set
to `null` rather than being deleted.

```bash
curl -X POST -H "Authorization: Bearer ak_readwrite_..." \
  -d "id=12" \
  http://localhost:1212/api/v1/clients/delete
```

```json
{ "deleted": true, "id": 12 }
```

### `GET /api/v1/kundlis`
List saved kundlis, newest first, including the owning device id when known.

Query params: `limit` (default 50, max 200), `offset` (default 0).

```bash
curl -H "Authorization: Bearer ak_..." \
  "http://localhost:1212/api/v1/kundlis?limit=20"
```

```json
{
  "data": [ { "id": 5, "birth_name": "...", "date": "1990-01-01", "time": "10:30", "kundli_json": "{...}", "...": "..." } ],
  "limit": 20,
  "offset": 0,
  "count": 1
}
```

### `POST /api/v1/kundlis/delete`  *(requires `read_write` scope)*

```bash
curl -X POST -H "Authorization: Bearer ak_readwrite_..." \
  -d "id=5" \
  http://localhost:1212/api/v1/kundlis/delete
```

```json
{ "deleted": true, "id": 5 }
```

---

## 3. Errors

All errors are JSON with an `error` field and an appropriate HTTP status:

| Status | Meaning |
|---|---|
| `401` | Missing or invalid/revoked API key |
| `403` | Valid key, but its scope doesn't allow this action |
| `404` | Route not found, or the resource (e.g. client id) doesn't exist |
| `422` | Validation failed (missing/invalid fields) |

```json
{ "error": "Invalid or revoked API key." }
```

---

## 4. Admin dashboard reference

These are browser pages (session-based login, not the API key system above),
useful context if you're wiring up SSO or need to know what's manageable
where:

| Page | Path | Who |
|---|---|---|
| Overview | `/admin` | any logged-in user |
| Clients | `/admin/clients` | any logged-in user |
| Kundlis | `/admin/kundlis` | any logged-in user |
| Users | `/admin/users` | viewable by all; create/edit/delete restricted to `admin` role |
| API Keys | `/admin/api-keys` | viewable by all; create/revoke restricted to `admin` role |

Two roles exist:
- **admin** — full access, including managing other users and API keys.
- **viewer** — can see every dashboard page but can't create, edit, delete,
  or generate/revoke keys.

Safety rails: the last remaining admin account can't be deleted or demoted,
and you can't delete your own account while logged in.

---

## 5. Notes & limits

- The `/api/v1/client` heartbeat is throttled server-side to once per minute
  per `device_id` when nothing material has changed.
- `kundli_json` payloads are capped at 4MB.
- API keys are stored as SHA-256 hashes — the server can never show you a
  key's plaintext again after creation, only its prefix (e.g. `ak_3f9a2b1c…`)
  for identification.
- Revoking a key takes effect immediately on the next request.

## Changelog

- **2026-09-22** — Added the authenticated data API (`/api/v1/stats`,
  `/api/v1/clients`, `/api/v1/kundlis`, and their delete actions), the API
  key management dashboard page, and the user management dashboard page
  with `admin`/`viewer` roles.
