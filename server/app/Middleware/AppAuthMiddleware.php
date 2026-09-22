<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Response;
use App\Models\AuthToken;

final class AppAuthMiddleware
{
    /** The verified user row for the current request, once handle() has passed. */
    public static ?array $user = null;

    /** The raw bearer token used for the current request. */
    public static ?string $token = null;

    public function handle(): bool
    {
        $token = self::extractToken();

        if ($token === '') {
            Response::json([
                'error' => 'Missing auth token. Send it as "Authorization: Bearer <token>".',
            ], 401);
            return false;
        }

        $user = AuthToken::userFor($token);
        if ($user === null) {
            Response::json(['error' => 'Invalid or expired auth token.'], 401);
            return false;
        }

        self::$token = $token;
        self::$user = $user;
        return true;
    }

    public static function extractToken(): string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if ($header !== '' && stripos($header, 'Bearer ') === 0) {
            return trim(substr($header, 7));
        }
        return '';
    }
}