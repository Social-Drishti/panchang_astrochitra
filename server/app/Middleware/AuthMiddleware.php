<?php

declare(strict_types=1);

namespace App\Middleware;

final class AuthMiddleware
{
    public function handle(string $path): bool
    {
        session_start_admin();

        if (!empty($_SESSION['admin'])) {
            return true;
        }

        // Preserve intended destination for post-login redirect.
        if (str_starts_with($path, '/admin') && !str_starts_with($path, '/admin/login')
            && $path !== '/admin/logout') {
            $_SESSION['intended'] = $path;
        }

        header('Location: /admin/login');
        exit;
    }
}