<?php

declare(strict_types=1);

/**
 * Router script for the PHP built-in web server.
 *
 * Usage (from inside server/):
 *   php -S localhost:1212 router.php
 *
 * Serves real static files inside public/ as-is and routes everything
 * else through the front controller (public/index.php).
 */

$public = __DIR__ . '/public';
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

if ($path !== '/' && is_callable('realpath')) {
    $candidate = realpath($public . $path);
    if ($candidate !== false && is_file($candidate) && str_starts_with($candidate, $public . DIRECTORY_SEPARATOR)) {
        // Let the built-in server stream the static file.
        return false;
    }
}

require_once __DIR__ . '/public/index.php';
return true;