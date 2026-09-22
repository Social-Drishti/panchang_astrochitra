<?php

declare(strict_types=1);

function e(mixed $value): string
{
    return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES, 'UTF-8');
}

function view(string $template, array $data = []): void
{
    $config = require dirname(__DIR__) . '/config/config.php';
    $path = $config['base_path'] . '/views/' . $template . '.php';
    if (!is_file($path)) {
        throw new RuntimeException('View not found: ' . $template);
    }
    extract($data, EXTR_SKIP);
    require $path;
}

function admin_view(string $template, array $data = []): void
{
    $config = require dirname(__DIR__) . '/config/config.php';
    $path = $config['base_path'] . '/views/' . $template . '.php';
    if (!is_file($path)) {
        throw new RuntimeException('View not found: ' . $template);
    }
    extract($data, EXTR_SKIP);
    $__view = $path;
    require $config['base_path'] . '/views/layout.php';
}

function session_start_admin(): void
{
    $config = require dirname(__DIR__) . '/config/config.php';
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name($config['session_name']);
    session_set_cookie_params([
        'lifetime' => $config['session_lifetime'],
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']),
    ]);
    $ok = @session_start();
    if (!$ok) {
        $err = error_get_last();
        throw new RuntimeException(
            'session_start failed: ' . (is_array($err) ? ($err['message'] ?? 'unknown') : 'unknown')
        );
    }
}

function flash_set(string $type, string $message): void
{
    session_start_admin();
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function flash_get(): ?array
{
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return is_array($flash) && isset($flash['type'], $flash['message']) ? $flash : null;
}

function csrf_token(): string
{
    session_start_admin();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . e(csrf_token()) . '">';
}

function csrf_verify(): bool
{
    $sent = $_POST['csrf'] ?? '';
    return is_string($sent) && hash_equals($_SESSION['csrf'] ?? '', $sent);
}

function current_admin(): ?array
{
    return $_SESSION['admin'] ?? null;
}

function is_admin_role(): bool
{
    return ($_SESSION['admin']['role'] ?? 'admin') === 'admin';
}

/**
 * Blocks non-admin (viewer) roles from mutating actions like user
 * management or API key management. Redirects back with a flash error.
 */
function require_admin_role(): void
{
    if (!is_admin_role()) {
        flash_set('err', 'Only admins can do that.');
        \App\Core\Response::redirect('/admin');
    }
}