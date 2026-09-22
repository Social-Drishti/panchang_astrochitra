<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Response;
use App\Models\ApiKey;

final class ApiKeyMiddleware
{
    /** The verified key row for the current request, once handle() has passed. */
    public static ?array $key = null;

    public function handle(): bool
    {
        $raw = self::extractKey();

        if ($raw === '') {
            Response::json([
                'error' => 'Missing API key. Send it as "Authorization: Bearer <key>" or "X-Api-Key: <key>".',
            ], 401);
            return false;
        }

        $key = ApiKey::verify($raw);
        if ($key === null) {
            Response::json(['error' => 'Invalid or revoked API key.'], 401);
            return false;
        }

        self::$key = $key;
        return true;
    }

    /**
     * Call from a controller action after handle() to enforce write access.
     * Ends the request with a 403 if the current key's scope is insufficient.
     */
    public static function requireWriteScope(): void
    {
        if ((self::$key['scope'] ?? 'read') !== 'read_write') {
            Response::json(['error' => 'This API key has read-only scope and cannot perform this action.'], 403);
        }
    }

    private static function extractKey(): string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if ($header === '' && function_exists('apache_request_headers')) {
            foreach (apache_request_headers() as $name => $value) {
                if (strcasecmp($name, 'Authorization') === 0) {
                    $header = $value;
                    break;
                }
            }
        }
        if ($header !== '' && stripos($header, 'Bearer ') === 0) {
            return trim(substr($header, 7));
        }

        return trim((string) ($_SERVER['HTTP_X_API_KEY'] ?? ''));
    }
}
