<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

final class AuthToken
{
    public const DEFAULT_TTL = 60 * 60 * 24 * 30;

    /**
     * Issue a fresh bearer token for a user. The raw token is returned once;
     * only its SHA-256 hash is persisted.
     */
    public static function issue(int $userId, int $ttlSeconds = self::DEFAULT_TTL): string
    {
        $token = bin2hex(random_bytes(32));
        $hash = hash('sha256', $token);
        $expires = date('Y-m-d H:i:s', time() + $ttlSeconds);

        $stmt = Database::pdo()->prepare(
            'INSERT INTO auth_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
        );
        $stmt->execute([$userId, $hash, $expires]);

        return $token;
    }

    /**
     * Resolve a raw token to its user row (joined with the token row), or
     * null when it is missing, expired, or revoked.
     */
    public static function userFor(string $token): ?array
    {
        if ($token === '') {
            return null;
        }
        $hash = hash('sha256', $token);
        $stmt = Database::pdo()->prepare(
            'SELECT u.id, u.email, u.name, u.role, u.created_at, t.id AS token_id
             FROM auth_tokens t
             JOIN users u ON u.id = t.user_id
             WHERE t.token_hash = ?
               AND t.expires_at > datetime(\'now\')
               AND t.revoked_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([$hash]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function revoke(string $token): bool
    {
        if ($token === '') {
            return false;
        }
        $hash = hash('sha256', $token);
        $stmt = Database::pdo()->prepare(
            'UPDATE auth_tokens SET revoked_at = datetime(\'now\') WHERE token_hash = ? AND revoked_at IS NULL'
        );
        return $stmt->execute([$hash]);
    }

    public static function revokeForUser(int $userId): bool
    {
        $stmt = Database::pdo()->prepare(
            'UPDATE auth_tokens SET revoked_at = datetime(\'now\') WHERE user_id = ? AND revoked_at IS NULL'
        );
        return $stmt->execute([$userId]);
    }
}