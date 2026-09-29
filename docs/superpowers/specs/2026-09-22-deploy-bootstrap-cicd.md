# Panchang Deploy — Production Bootstrap + 2-in-1 CI/CD

Date: 2026-09-22
Status: Approved in conversation; plan pending.

## Purpose

Take the already-cloned repo at `/var/www/astrochitra-app` (Social-Drishti/panchang_astrochitra, branch `main`, HEAD `bd5eb5d`) live on 64.227.188.196 at two hostnames, then add a single GitHub Actions workflow that keeps both surfaces deployed on push to `main`.

- **PWA** → `https://app.astrochitra.com`
- **PHP dashboard / API** → `https://api.app.astrochitra.com`

Patterns modeled on the existing `astrochitra-blogs` (pm2 + deploy.sh) and `astrochitra_slots` (PHP + fpm + deploy.sh) reference workflows.

## Decisions (approved in conversation)

- Architecture approved: PWA served by pm2 (`serve -s dist -l 4200`) behind nginx proxy; dashboard on its own nginx vhost with docs root `server/public` + dedicated php-fpm pool; same-origin `/api/v1` on the app vhost; certbot TLS for both domains.
- Admin login `create-admin.php` will be run by the user post-deploy (not automated); deploys document the command.
- Build-time AI keys delivered via GitHub Secrets injected during the server-side build.
- Must use the existing clone `/var/www/astrochitra-app` only — do not re-clone elsewhere.
- Deploy user is `deploy` (uid 1003, sudo NOPASSWD, pm2, in www-data group).

## Verified server facts

- `deploy` can read the repo: `git -c safe.directory=/var/www/astrochitra-app ls-remote origin HEAD` → `bd5eb5d`.
- PHP has `pdo_sqlite` + `sqlite3`. php 7.1–8.5 fpm installed; php8.4-fpm active.
- Precedents: hrms-pwa = pm2 `serve -s dist -l 7594`; newsletters = nginx `try_files → /index.php` + fpm `127.0.0.1:17000`; slots = dedicated fpm pool on `9001`, `data/` owned www-data 775.
- DNS: `app.astrochitra.com` and `api.app.astrochitra.com` both → 64.227.188.196. No certs/confs exist for either domain. (`api.astrochitra.com` already exists with a cert — unused by us, do not touch.)
- Root ssh config uses key `github_socialdrishti`; deploy user authenticates as `vinay-sd`.

## Planned topology

```
app.astrochitra.com  ── nginx :443 ─ proxy_pass ──> 127.0.0.1:4200 (pm2: serve -s dist)
                        └── /api/v1 ── fastcgi ──> 127.0.0.1:9002 (php-fpm8.4 pool "panchang")

api.app.astrochitra.com ── nginx :443 ─ root /var/www/astrochitra-app/server/public
                        try_files $uri → /index.php ──> 127.0.0.1:9002
```

- `server/data/panchang.sqlite` lives under repo data dir (gitignored), owned `deploy:www-data`, mode 775 so `www-data` (fpm) can read/write.
- DB schema synced idempotently via `php -r require server/db/init.php` — actually through the front controller's `Database::init()` on first request; deploy also runs `php server/db/init.php` via CLI to guarantee schema before traffic.
- Health check post-deploy: `GET https://app.astrochitra.com/api/v1/health` → `{ok:true}`; dashboard `https://api.app.astrochitra.com/admin` → login page 200.

## Bootstrap steps (manual, one-time)

1. `chown -R deploy:deploy /var/www/astrochitra-app`
2. `mkdir -p server/data && chown deploy:www-data server/data && chmod 775 server/data`
3. As `deploy`: `git config --global --add safe.directory /var/www/astrochitra-app` (or local), confirm fetch works.
4. Service files to add in repo (committed):
   - `ecosystem.panchang.config.js` — pm2: `serve` script `-s dist -l 4200`, cwd `/var/www/astrochitra-app`, name `panchang-app`.
   - `deploy/panchang-app.conf` — nginx app vhost (proxy 4200 + `/api/v1` fastcgi to 9002).
   - `deploy/panchang-api.conf` — nginx api vhost (root server/public, fastcgi to 9002).
   - `deploy/panchang.fpm.conf` — php-fpm8.4 pool `panchang` on 127.0.0.1:9002 (user/group www-data, listen.owner www-data).
   - `scripts/deploy.sh` — CI target (see below).
5. On server: npm ci, build with injected VITE_* + VITE_API_BASE=/api/v1, `php server/db/init.php`, write DB dir, pm2 start ecosystem, reload nginx with `nginx -t` first.
6. Certbot standalone/webroot for both domains (+ http) via sudo, reload nginx.
7. No admin created automatically (user runs `php scripts/create-admin.php <email> <password>`).

## CI/CD (one workflow)

`.github/workflows/deploy.yml` — on `push` to `main` + `workflow_dispatch`:

- Job 1 `validate`: `npm ci` → `tsc -b` → `npm run build` (checks), `php -l` on `server/**/*.php`.
- Job 2 `deploy`: needs validate; appleboy/ssh-action → host/user/key from secrets → runs `scripts/deploy.sh` with envs (VITE_GEMINI_KEY, VITE_DEEPSEEK_KEY, VITE_EXPLABS_KEY, VITE_API_BASE).

`scripts/deploy.sh` (mirrors blogs + slots style, deploy user, sudo as needed):

- `cd /var/www/astrochitra-app`
- `git fetch origin && git reset --hard origin/main`
- `npm ci && npm run build` (envs exported from CI)
- `sudo mkdir -p server/data && sudo chown deploy:www-data server/data && sudo chmod 775 server/data`
- sqlite schema sync (idempotent)
- copy nginx confs, `nginx -t`, reload; copy fpm pool, restart php8.4-fpm
- `pm2 startOrReload ecosystem.panchang.config.js` (sudo -u deploy)
- health check curl

## GitHub secrets required

| Secret | Purpose |
|---|---|
| `SERVER_SSH_KEY` | deploy user's private key (or a dedicated deploy key) |
| `SERVER_HOST` | `64.227.188.196` |
| `SERVER_USER` | `deploy` |
| `VITE_GEMINI_KEY` | build-time Gemini API key |
| `VITE_DEEPSEEK_KEY` | build-time DeepSeek API key |
| `VITE_EXPLABS_KEY` | build-time Explabs API key |
| `VITE_API_BASE` (optional) | default `/api/v1` (same-origin) |

## Rollback

- Git revert + push main re-deploys. `git reset --hard` on each deploy; pm2 keeps old process until startOrReload swaps. DB is gitignored and untouched by deploys.

## Out of scope

- DNS changes (already pointed), CDN/WAF, DB backup automation, /api CORS, staging host.