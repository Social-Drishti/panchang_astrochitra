<?php

declare(strict_types=1);

/**
 * Loads KEY=VALUE pairs from a .env-style file into a process-wide array.
 * Values may be wrapped in single or double quotes; blank lines and lines
 * starting with # are ignored. Existing environment variables always win, so
 * a real env var can override the file.
 */
$loadEnv = static function (string $path): array {
    static $parsed = null;
    if ($parsed !== null) {
        return $parsed;
    }

    $parsed = [];
    if (is_readable($path)) {
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            if (strlen($value) >= 2 && ($value[0] === '"' || $value[0] === "'") && $value[0] === substr($value, -1)) {
                $value = substr($value, 1, -1);
            }
            if ($key !== '') {
                $parsed[$key] = $value;
            }
        }
    }

    return $parsed;
};

// App root is two levels up from server/config. The same .env.local that Vite
// reads at build time; non-VITE_ keys in it are never inlined into the bundle.
$env = $loadEnv(dirname(__DIR__, 2) . '/.env.local');

$envValue = static function (string $key, string $default = '') use ($env): string {
    $value = getenv($key);
    if ($value === false || $value === '') {
        $value = $env[$key] ?? '';
    }

    return $value !== '' ? $value : $default;
};

date_default_timezone_set('Asia/Kolkata');

return [
    'app_name' => 'Panchang Astrochitra',
    'base_path' => dirname(__DIR__),
    'db_path' => dirname(__DIR__) . '/data/panchang.sqlite',
    'session_name' => 'panchang_admin',
    'session_lifetime' => 60 * 60 * 8,
    'timezone' => 'Asia/Kolkata',

    // Astrochitra Slots external API. Server-side only: these are read from
    // .env.local without a VITE_ prefix, so they never reach the browser bundle.
    'astrochitra' => [
        'api_key' => $envValue('ASTROCHITRA_API_KEY'),
        'api_base' => $envValue('ASTROCHITRA_API_BASE', 'https://slots.astrochitra.com/api/external.php'),
        'timeout' => max(5, (int) $envValue('ASTROCHITRA_API_TIMEOUT', '90')),

        // How long a synced consultation snapshot stays fresh. Each sync is one
        // upstream API call, and the key is rate limited per hour, so this is
        // the main control on how many users the integration can serve.
        'sync_ttl' => max(60, (int) $envValue('ASTROCHITRA_SYNC_TTL', '900')),

        // Marks where leads in the slots system came from.
        'lead_reference' => $envValue('ASTROCHITRA_LEAD_REFERENCE', 'pwa_consultation'),
    ],
];
