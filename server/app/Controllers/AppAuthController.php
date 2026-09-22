<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AppAuthMiddleware;
use App\Models\AuthToken;
use App\Models\User;

/**
 * Public app-account auth for the PWA: register, login, and token-protected
 * profile access. Reuses the shared `users` table with the `app` role.
 */
final class AppAuthController extends Controller
{
    public function register(): void
    {
        $name = trim((string) Request::input('name', ''));
        $email = strtolower(trim((string) Request::input('email', '')));
        $password = (string) Request::input('password', '');

        $error = self::validateCredentials($email, $password);
        if ($error !== null) {
            Response::json(['error' => $error], 422);
        }

        if (User::emailTakenBy($email)) {
            Response::json(['error' => 'An account with that email already exists.'], 409);
        }

        $user = User::create($email, $password, $name, 'app');
        $token = AuthToken::issue((int) $user['id']);

        Response::json([
            'token' => $token,
            'user' => self::publicUser($user),
        ], 201);
    }

    public function login(): void
    {
        $email = strtolower(trim((string) Request::input('email', '')));
        $password = (string) Request::input('password', '');

        $user = User::verify($email, $password);
        if ($user === null) {
            Response::json(['error' => 'Invalid email or password.'], 401);
        }

        $token = AuthToken::issue((int) $user['id']);
        Response::json([
            'token' => $token,
            'user' => self::publicUser($user),
        ]);
    }

    public function me(): void
    {
        $user = AppAuthMiddleware::$user;
        Response::json(['user' => self::publicUser($user)]);
    }

    public function logout(): void
    {
        AuthToken::revoke((string) AppAuthMiddleware::$token);
        Response::json(['ok' => true]);
    }

    private static function validateCredentials(string $email, string $password): ?string
    {
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return 'Enter a valid email address.';
        }
        if (strlen($password) < 6) {
            return 'Password must be at least 6 characters.';
        }
        return null;
    }

    /** @param array<string, mixed> $user */
    private static function publicUser(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'name' => $user['name'] ?? '',
            'email' => $user['email'] ?? '',
            'role' => $user['role'] ?? 'app',
        ];
    }
}