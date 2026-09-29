#!/bin/bash
set -e

APP_DIR="/var/www/astrochitra-app"
BRANCH="main"
APP_DOMAIN="app.astrochitra.com"
API_DOMAIN="api.app.astrochitra.com"
FPM_PORT=9002
APP_PORT=4200
NGINX_ENABLED="/etc/nginx/sites-enabled"
NGINX_AVAILABLE="/etc/nginx/sites-available"
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
npm ci --include=dev --loglevel=error
if [ -n "${APP_ENV:-}" ]; then
  printf '%s\n' "$APP_ENV" > "$APP_DIR/.env.local"
  echo "  wrote .env.local from APP_ENV ($(wc -l < "$APP_DIR/.env.local") lines)"
else
  cat > "$APP_DIR/.env.local" <<ENVEOF
VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY:-}
VITE_DEEPSEEK_API_KEY=${VITE_DEEPSEEK_API_KEY:-}
VITE_EXPLABS_API_KEY=${VITE_EXPLABS_API_KEY:-}
VITE_EXPLABS_PROXY=${VITE_EXPLABS_PROXY:-/api/explabs}
VITE_API_BASE=${VITE_API_BASE:-/api/v1}
ENVEOF
  echo "  wrote .env.local from legacy per-var secrets"
fi
npm run build

echo "[4/8] Syncing SQLite schema..."
php "$APP_DIR/server/db/init.php"
sudo chown deploy:www-data "$APP_DIR/server/data/panchang.sqlite" 2>/dev/null || true
sudo chmod 664 "$APP_DIR/server/data/panchang.sqlite" 2>/dev/null || true

echo "[5/8] Installing php-fpm pool..."
sudo cp "$APP_DIR/deploy/panchang.fpm.conf" "$FPM_POOL_DIR/panchang.conf"
sudo systemctl reload php8.4-fpm

echo "[6/8] Installing nginx vhosts..."
sudo cp "$APP_DIR/deploy/panchang-app.conf" "$NGINX_AVAILABLE/panchang-app.conf"
sudo cp "$APP_DIR/deploy/panchang-api.conf" "$NGINX_AVAILABLE/panchang-api.conf"
sudo ln -sfn "$NGINX_AVAILABLE/panchang-app.conf" "$NGINX_ENABLED/panchang-app.conf"
sudo ln -sfn "$NGINX_AVAILABLE/panchang-api.conf" "$NGINX_ENABLED/panchang-api.conf"
sudo nginx -t && sudo systemctl reload nginx

echo "[7/8] Starting/Reloading pm2 app..."
pm2 startOrReload "$APP_DIR/ecosystem.panchang.config.cjs" --update-env

echo "[8/8] Health checks..."
sleep 5
check() {
  local url="$1" code
  code=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 20 "$url" || true)
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
    echo "  OK   $url -> HTTP $code"
  else
    echo "  FAIL $url -> HTTP $code"
    exit 1
  fi
}
check "https://$APP_DOMAIN/"
check "https://$APP_DOMAIN/api/v1/health"
check "https://$API_DOMAIN/admin/login"

echo "============================================"
echo "  DEPLOY COMPLETE"
echo "  App : https://$APP_DOMAIN"
echo "  Api : https://$API_DOMAIN"
echo "============================================"