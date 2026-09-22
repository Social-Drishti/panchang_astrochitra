<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/app/Core/Database.php';
require_once dirname(__DIR__) . '/app/Core/Router.php';
require_once dirname(__DIR__) . '/app/Core/Controller.php';
require_once dirname(__DIR__) . '/app/Core/Request.php';
require_once dirname(__DIR__) . '/app/Core/Response.php';
require_once dirname(__DIR__) . '/app/Middleware/AuthMiddleware.php';
require_once dirname(__DIR__) . '/app/helpers.php';

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $file = dirname(__DIR__) . '/app/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($file)) {
        require_once $file;
    }
});

\App\Core\Database::init();

$router = require dirname(__DIR__) . '/app/routes.php';
$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $_SERVER['REQUEST_URI'] ?? '/');