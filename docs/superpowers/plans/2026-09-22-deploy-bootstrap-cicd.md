# Panchang Deploy (Live + CI/CD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the existing clone at `/var/www/astrochitra-app` live at `https://app.astrochitra.com` (React PWA via pm2) and `https://api.app.astrochitra.com` (PHP dashboard/API via php-fpm), then wire a single GitHub Actions workflow that redeploys both on every push to `main`.

**Architecture:** PWA's built `dist/` is served by `serve` under pm2 on `127.0.0.1:4200`; nginx proxies `app.astrochitra.com` to it and falls back `/api/v1` to a dedicated php-fpm8.4 pool `panchang` on `127.0.0.1:9002`. The API host `api.app.astrochitra.com` serves `server/public` through the same pool using the front-controller `try_files` pattern (newsletters/slots style). One workflow = validate job (build + PHP lint) then a deploy job (appleboy SSH) running `scripts/deploy.sh`.

**Tech Stack:** GitHub Actions (appleboy/ssh-action), bash deploy script, pm2 + `serve`, nginx, php-fpm8.4, Vite React PWA, PHP 8.4 CLI for schema sync, certbot TLS.

**Spec:** `docs/superpowers/specs/2026-09-22-deploy-bootstrap-cicd.md`

## Global Constraints

- Use the existing clone `/var/www/astrochitra-app` only — never clone elsewhere on the server.
- Deploy user on the server is `deploy` (uid 1003, NOPASSWD sudo, in www-data group, runs its own pm2).
- PWA build embeds `VITE_API_BASE` (empty → `/api/v1`, same-origin). AI keys come from GitHub Secrets → injected as env → written to `.env.local` (gitignored, survives `git reset --hard`).
- SQLite file: `server/data/panchang.sqlite`, group-writable by `www-data` (fpm) — dir `deploy:www-data` 775, file 664.
- Committed nginx templates reference `/etc/letsencrypt/live/<domain>/fullchain.pem`; certs are issued once during bootstrap (root SSH), never by CI.
- Ports: PWA `127.0.0.1:4200`, fpm pool `127.0.0.1:9002` (both verified free).
- No admin user is auto-created; user runs `php scripts/create-admin.php <email> <password>` post-deploy (documented, not automated).
- Workflow modeled on `astrochitra_slots/.github/workflows/deploy.yml` (git reset --hard + cd + bash scripts/deploy.sh) and `astrochitra-blogs» validate/pre-build gate.
- Do not touch the existing `api.astrochitra.com` vhost/cert.

## Review Focus

- **First-run confs reference certs that don't exist yet** → deploy.sh must NOT write nginx confs until certs exist; bootstrap issues certs first. `nginx -t` gates every reload.
- **DNS not yet pointed / pointing wrong** → every health check `curl -sk https://…` verifies end-to-end (A record already → 64.227.188.196, verified).
- **`git reset --hard` wipes server-local files** → only `.env.local` and `server/data/` must survive; both are gitignored untracked files, recreated by deploy.sh / left alone. `dist/`, `logs/`, `node_modules/` are disposable.
- **`serve` must exist as a local binary after CI installs deps** → declared as a devDependency in `package.json` (not global like hrms-pwa) so `npm ci` guarantees `node_modules/.bin/serve`.
- **Router needs the full `/api/v1/…` path preserved through fastcgi** → fastcgi must keep `REQUEST_URI`/`QUERY_STRING` (fastcgi_params default) and route everything to `index.php` so `Router::dispatch` sees clean paths.
- **SPA deep links (e.g. `/kundli`) must fall back to `index.html`** → `serve -s` (single-page mode) handles this on the 4200 side.

---

### Task 1: Add `serve` dependency + pm2 ecosystem config

**Files:**
- Modify: `package.json` (add `serve` to `devDependencies`)
- Create: `ecosystem.panchang.config.js`

**Interfaces:**
- Produces: `ecosystem.panchang.config.js` — consumed by Task 3 (`pm2 startOrReload ecosystem.panchang.config.js`). App name `panchang-app`, cwd `/var/www/astrochitra-app`.

- [ ] **Step 1: Add `serve` dependency**

Add to `devDependencies` in `package.json:26`-region, sorted alphabetically:

```json
"serve": "^14.2.4",
```

- [ ] **Step 2: Create the ecosystem file**

`ecosystem.panchang.config.js`:

```js
module.exports = {
  apps: [
    {
      name: 'panchang-app',
      cwd: '/var/www/astrochitra-app',
      script: 'node_modules/.bin/serve',
      args: '-s dist -l 4200',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4200,
      },
      max_memory_restart: '300M',
      kill_timeout: 5000,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '5s',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/panchang-error.log',
      out_file: './logs/panchang-out.log',
      merge_logs: true,
    },
  ],
};
```

- [ ] **Step 3: Verify config loads**

Run locally: `node -e "const c = require('./ecosystem.panchang.config.js'); if (c.apps.length !== 1) throw new Error('bad'); console.log('ok: ' + c.apps[0].name)"`
Expected: `ok: panchang-app`

- [ ] **Step 4: Verify `serve` resolves**

Run locally: `npm install` (updates `package-lock.json` too), then `npx serve --version`
Expected: prints a version like `14.x.x`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json ecosystem.panchang.config.js
git commit -m "build: add serve pwa runner + pm2 ecosystem (panchang-app)"
```

---

### Task 2: nginx + php-fpm config templates

**Files:**
- Create: `deploy/panchang-app.conf` (app vhost: proxy 4200 + `/api/v1` fastcgi → 9002)
- Create: `deploy/panchang-api.conf` (api vhost: `server/public` front controller → 9002)
- Create: `deploy/panchang.fpm.conf` (php-fpm8.4 pool `panchang` on 127.0.0.1:9002)

**Interfaces:**
- Consumes: Task 1's port choices `4200`/`9002`, routes from `server/app/routes.php` (`/api/v1/health`, `POST /api/v1/client`, `/admin…`).
- Produces: `deploy/panchang-app.conf`, `deploy/panchang-api.conf`, `deploy/panchang.fpm.conf` — copied by `scripts/deploy.sh` (Task 3) to `/etc/nginx/sites-enabled/` and `/etc/php/8.4/fpm/pool.d/`.

- [ ] **Step 1: Create `deploy/panchang-app.conf`**

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name app.astrochitra.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  http2 on;
  server_name app.astrochitra.com;

  ssl_certificate     /etc/letsencrypt/live/app.astrochitra.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.astrochitra.com/privkey.pem;

  access_log /var/log/nginx/app.astrochitra.com.access.log main;
  error_log  /var/log/nginx/app.astrochitra.com.error.log;

  client_max_body_size 10M;
  include /etc/nginx/global_settings;
  add_header Cache-Control no-transform;

  location ^~ /.well-known {
    auth_basic off;
    allow all;
  }

  # Same-origin API → php-fpm (keeps REQUEST_URI so the router sees /api/v1/...
  location /api/v1 {
    include fastcgi_params;
    fastcgi_pass 127.0.0.1:9002;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME /var/www/astrochitra-app/server/public/index.php;
    fastcgi_param SCRIPT_NAME /index.php;
    fastcgi_param HTTPS on;
    fastcgi_read_timeout 300;
  }

  # SPA → pm2 serve (single-page mode handles deep links)
  location / {
    proxy_pass http://127.0.0.1:4200;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

- [ ] **Step 2: Create `deploy/panchang-api.conf`**

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name api.app.astrochitra.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  http2 on;
  server_name api.app.astrochitra.com;

  ssl_certificate     /etc/letsencrypt/live/api.app.astrochitra.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.app.astrochitra.com/privkey.pem;

  root /var/www/astrochitra-app/server/public;

  access_log /var/log/nginx/api.app.astrochitra.com.access.log main;
  error_log  /var/log/nginx/api.app.astrochitra.com.error.log;

  client_max_body_size 10M;

  include /etc/nginx/global_settings;
  add_header Cache-Control no-transform;

  index index.php;

  location ^~ /.well-known {
    auth_basic off;
    allow all;
  }

  location / {
    try_files $uri $uri/ /index.php?$query_string;
  }

  location ~ [^/]\.php(/|$) {
    fastcgi_pass 127.0.0.1:9002;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_param SCRIPT_NAME $fastcgi_script_name;
    fastcgi_param REQUEST_METHOD $request_method;
    fastcgi_param QUERY_STRING $query_string;
    fastcgi_param REQUEST_URI $request_uri;
    fastcgi_param DOCUMENT_ROOT $document_root;
    fastcgi_param SERVER_NAME $server_name;
    fastcgi_param HTTPS on;
    fastcgi_read_timeout 300;
  }

  location ~ /\.ht { deny all; }

  location /data { deny all; }
  location /config { deny all; }
}
```

- [ ] **Step 3: Create `deploy/panchang.fpm.conf`**

```ini
[panchang]
user = www-data
group = www-data
listen = 127.0.0.1:9002
listen.allowed_clients = 127.0.0.1
pm = dynamic
pm.max_children = 20
pm.start_servers = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 8
pm.max_requests = 500
listen.backlog = 65535
```

- [ ] **Step 4: Syntax-check nginx confs locally**

Run: `nginx -t -c /dev/null -p .` (fails — nginx not installed locally). Instead validate structurally with an IDE/`npx prettier --parser html` if desired, or skip; real check happens on-server via `nginx -t` in Task 4 bootstrap. Mark verified after on-server `nginx -t`.

- [ ] **Step 5: Commit**

```bash
git add deploy/
git commit -m "deploy: add nginx vhosts (app+api) and php-fpm pool for panchang"
```

---

### Task 3: `scripts/deploy.sh`

**Files:**
- Create: `scripts/deploy.sh`

**Interfaces:**
- Consumes: repo templates from Task 2; `ecosystem.panchang.config.js` from Task 1; envs passed by CI (`VITE_GEMINI_API_KEY`, `VITE_DEEPSEEK_API_KEY`, `VITE_EXPLABS_API_KEY`, `VITE_API_BASE`).
- Produces: the one command CI runs — `bash scripts/deploy.sh` (from `/var/www/astrochitra-app`, after the slot-style `git fetch && git reset --hard origin/main`). Hard-fails fast (`set -e`); re-execs once after pull (slots pattern) so a self-update takes effect.

- [ ] **Step 1: Write `scripts/deploy.sh`**

```bash
#!/bin/bash
set -e

APP_DIR="/var/www/astrochitra-app"
BRANCH="main"
APP_DOMAIN="app.astrochitra.com"
API_DOMAIN="api.app.astrochitra.com"
FPM_PORT=9002
APP_PORT=4200
DOCROOT="$APP_DIR/server/public"
NGINX_ENABLED="/etc/nginx/sites-enabled"
FPM_POOL_DIR="/etc/php/8.4/fpm/pool.d"

cd "$APP_DIR"

echo "============================================"
echo "  Deploying Panchang ($BRANCH)"
echo "  App : https://$APP_DOMAIN  (pm2 :$APP_PORT)"
echo "  Api : https://$API_DOMAIN  (fpm :$FPM_PORT)"
echo "============================================"

echo "[1/8] Pulling $BRANCH..."
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

if [ -z "$_DEPLOY_REEXEC" ]; then
  export _DEPLOY_REEXEC=1
  echo "Re-executing with updated deploy script..."
  exec bash "$0" "$@"
fi

echo "[2/8] Ensuring data dir + permissions..."
sudo mkdir -p "$APP_DIR/server/data"
sudo chown deploy:www-data "$APP_DIR/server/data"
sudo chmod 775 "$APP_DIR/server/data"

echo "[3/8] Installing deps and building PWA..."
npm ci
cat > "$APP_DIR/.env.local" <<ENVEOF
VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY:-}
VITE_DEEPSEEK_API_KEY=${VITE_DEEPSEEK_API_KEY:-}
VITE_EXPLABS_API_KEY=${VITE_EXPLABS_API_KEY:-}
VITE_API_BASE=${VITE_API_BASE:-}
ENVEOF
VITE_GEMINI_API_KEY="$VITE_GEMINI_API_KEY" \
VITE_DEEPSEEK_API_KEY="$VITE_DEEPSEEK_API_KEY" \
VITE_EXPLABS_API_KEY="$VITE_EXPLABS_API_KEY" \
VITE_API_BASE="$VITE_API_BASE" \
npm run build

echo "[4/8] Syncing SQLite schema..."
php "$APP_DIR/server/db/init.php"
sudo chown "deploy:www-data" "$APP_DIR/server/data/panchang.sqlite" 2>/dev/null || true
sudo chmod 664 "$APP_DIR/server/data/panchang.sqlite" 2>/dev/null || true

echo "[5/8] Installing php-fpm pool + restarting..."
sudo cp "$APP_DIR/deploy/panchang.fpm.conf" "$FPM_POOL_DIR/panchang.conf"
sudo systemctl restart php8.4-fpm

echo "[6/8] Installing nginx vhosts..."
sudo cp "$APP_DIR/deploy/panchang-app.conf" "$NGINX_ENABLED/panchang-app.conf"
sudo cp "$APP_DIR/deploy/panchang-api.conf" "$NGINX_ENABLED/panchang-api.conf"
sudo nginx -t && sudo systemctl reload nginx

echo "[7/8] Starting/Reloading pm2 app..."
pm2 startOrReload "$APP_DIR/ecosystem.panchang.config.js" --update-env

echo "[8/8] Health checks..."
sleep 5
check() {
  CODE=$(curl -sk -o /dev/null -w "%{http_code}" "$1" 2>/dev/null || echo 000)
  [ "$CODE" = "200" ] || [ "$CODE" = "301" ] || [ "$CODE" = "302" ] && echo "  $1 -> HTTP $CODE" || { echo "  FAIL $1 -> HTTP $CODE"; exit 1; }
}
check "https://$APP_DOMAIN/"
check "https://$APP_DOMAIN/api/v1/health"
check "https://$API_DOMAIN/admin/login"

echo "============================================"
echo "  DEPLOY COMPLETE"
echo "  App : https://$APP_DOMAIN"
echo "  Api : https://$API_DOMAIN"
echo "============================================"
```

- [ ] **Step 2: Shellcheck / syntax check**

Run locally: `bash -n scripts/deploy.sh`
Expected: no output (exit 0)

- [ ] **Step 3: Commit**

```bash
git add scripts/deploy.sh deploy/
git commit -m "deploy: add panchang deploy script (build, fpm, nginx, pm2, health)"
```

---

### Task 4: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `scripts/deploy.sh` (Task 3). Needs GitHub Secrets: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `VITE_GEMINI_KEY`, `VITE_DEEPSEEK_KEY`, `VITE_EXPLABS_KEY` (repo `Social-Drishti/panchang_astrochitra`).
- Produces: on push to `main` (also `workflow_dispatch`) → validate job then deploy job. Matches slots reference (single deploy target, `script_stop: true`).

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Panchang Astrochitra CI/CD

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: deploy-panchang-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    name: Pre-flight Build Check
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build PWA (validation)
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: "ci-validate"
          VITE_DEEPSEEK_API_KEY: "ci-validate"
          VITE_EXPLABS_API_KEY: "ci-validate"

      - name: Lint PHP
        run: |
          set -e
          failed=""
          while IFS= read -r f; do
            if ! php -l "$f" >/dev/null 2>&1; then
              failed="$failed $f"
            fi
          done < <(find server -name '*.php' -type f)
          if [ -n "$failed" ]; then echo "PHP lint failed:$failed"; exit 1; fi
          echo "All PHP files lint clean"

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [validate]
    if: github.event_name != 'pull_request'
    timeout-minutes: 15
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.2.0
        env:
          FORCE_DEPLOY: ${{ github.event.inputs.force_deploy || 'false' }}
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_KEY }}
          VITE_DEEPSEEK_API_KEY: ${{ secrets.VITE_DEEPSEEK_KEY }}
          VITE_EXPLABS_API_KEY: ${{ secrets.VITE_EXPLABS_KEY }}
          VITE_API_BASE: ${{ secrets.VITE_API_BASE }}
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: 22
          script_stop: true
          command_timeout: 15m
          envs: FORCE_DEPLOY,VITE_GEMINI_API_KEY,VITE_DEEPSEEK_API_KEY,VITE_EXPLABS_API_KEY,VITE_API_BASE
          script: |
            set -e
            cd /var/www/astrochitra-app
            git fetch origin && git reset --hard origin/main
            bash scripts/deploy.sh
```

- [ ] **Step 2: YAML sanity check**

Run: `npx --yes yaml-lint .github/workflows/deploy.yml` (or any YAML linter)
Expected: valid YAML, exit 0.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add 2-in-1 panchang deploy workflow (validate + ssh deploy)"
```

---

### Task 5: Server bootstrap (one-time, run with root SSH + deploy user)

**Files:**
- None in repo. Runs commands on 64.227.188.196 via `run_ssh.py` driver + `cmd_bootstrap.sh`.

**Interfaces:**
- Consumes: committed repo (Tasks 1–3 must be pushed to `main` first), verified facts (DNS → 64.227.188.196, deploy can git-fetch, php8.4-fpm present, ports 4200/9002 free).
- Produces: working live sites + certs. Subsequent deploys are purely CI-driven.

- [ ] **Step 1: Fix clone ownership + deploy safe.directory**

```bash
sudo chown -R deploy:deploy /var/www/astrochitra-app
sudo -u deploy git config --global --add safe.directory /var/www/astrochitra-app
sudo -u deploy bash -lc 'cd /var/www/astrochitra-app && git fetch origin && git reset --hard origin/main' 
```
Expected: fetch/reset succeeds (deploy read access verified earlier).

- [ ] **Step 2: Issue TLS certs (root)**

```bash
sudo certbot certonly --nginx -d app.astrochitra.com -n --agree-tos --register-unsafely-without-email
sudo certbot certonly --nginx -d api.app.astrochitra.com -n --agree-tos --register-unsafely-without-email
```
Expected: two new cert dirs `/etc/letsencrypt/live/{app,api.app}.astrochitra.com`.

- [ ] **Step 3: Prime `server/data` before first web hit**

```bash
sudo -u deploy bash -lc 'cd /var/www/astrochitra-app && mkdir -p server/data && php server/db/init.php'
sudo chown deploy:www-data /var/www/astrochitra-app/server/data
sudo chmod 775 /var/www/astrochitra-app/server/data
```
Expected: `Database ready: …/server/data/panchang.sqlite`.

- [ ] **Step 4: Run the deploy script once (as deploy)**

```bash
sudo -u deploy bash -lc 'cd /var/www/astrochitra-app && \
  VITE_GEMINI_API_KEY= VITE_DEEPSEEK_API_KEY= VITE_EXPLABS_API_KEY= VITE_API_BASE= bash scripts/deploy.sh'
```
Expected: 8 steps complete; health checks for `/`, `/api/v1/health`, `/admin/login` all return 200.

- [ ] **Step 5: External health verification**

```bash
curl -sk https://app.astrochitra.com/          # PWA HTML
curl -sk https://app.astrochitra.com/api/v1/health   # {"ok":true}
curl -skI https://api.app.astrochitra.com/admin/login # 200 login page
dig +short app.astrochitra.com api.app.astrochitra.com
```
Expected: PWA HTML + `{"ok":true}` + login 200. (If a step fails → `systematic-debugging` skill on the specific failure.)

- [ ] **Step 6: Everything live + admin documented**

Bootstrap complete. Print/document for the user:

```bash
# After bootstrap, create the admin account (user-run, NOT automated):
ssh deploy@64.227.188.196 "cd /var/www/astrochitra-app && php scripts/create-admin.php <email> <password>"
```
Dashboard: `https://api.app.astrochitra.com/admin`

- [ ] **Step 7: No repo commit needed for Task 5** (server state only).

---

### Task 6: Push + first CI/CD run (user-assisted)

**Files:**
- `.github/workflows/deploy.yml`, `scripts/deploy.sh`, `deploy/*`, `ecosystem.panchang.config.js`, `package.json`/lock.

**Interfaces:**
- Consumes: Tasks 1–4 committed locally; user pushes/publishes to GitHub.
- Produces: real Production Action run; confirms secrets wiring end-to-end.

- [ ] **Step 1: Ask user to push `main` to GitHub** (`git push origin main`).
- [ ] **Step 2: Ask user to add the GitHub Secrets** in `Social-Drishti/panchang_astrochitra` → Settings → Secrets and variables → Actions:
  - `SERVER_HOST` = `64.227.188.196`
  - `SERVER_USER` = `deploy`
  - `SERVER_SSH_KEY` = deploy user's SSH private key (the one whose public part is in `/home/deploy/.ssh/authorized_keys` — verify it matches)
  - `VITE_GEMINI_KEY`, `VITE_DEEPSEEK_KEY`, `VITE_EXPLABS_KEY`
  - `VITE_API_BASE` = `` (empty, same-origin)
- [ ] **Step 3: Confirm the workflow ran green**: validate + deploy jobs pass and health checks inside `deploy.sh` pass.

---

## Self-Review notes (filled during writing)

- Spec coverage: PWA pm2 (Task 1, 3), API host + fpm pool (Task 2, 3), same-origin `/api/v1` (Task 2 app vhost), certbot (Task 5), single workflow + slots-style script (Task 4 + 3), secrets matrix (Task 6), admin left to user (Task 5 Step 6), gitignored persistence of `server/data` + `.env.local` handled (Task 3 steps 2–3, `.gitignore` unchanged). Rollback via `git reset --hard` re-deploy is inherent in Task 3.
- No placeholders: all file contents are given inline.
- Type consistency: `panchang-app` name used in Task 1 → Task 3 pm2; ports 4200/9002 constant across Tasks 1–3; conf filenames `panchang-app.conf`/`panchang-api.conf`/`panchang.fpm.conf` used in deploy.sh `cp` lines match Task 2.
- Review Focus lines → owning task: cert-first ordering (Task 5 Step 2 before Task 5 Step 4), health checks (Task 3 steps, Task 5 step 5), serve-as-devDependency (Task 1 step 4), REQUEST_URI fastcgi preservation (Task 2 steps 1–2), SPA deep-link fallback via `-s` (Task 1 step 2).