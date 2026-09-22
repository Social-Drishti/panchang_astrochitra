<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

final class ApiKey
{
    public const SCOPES = ['read', 'read_write'];

    /**
     * Create a new API key. Returns the plaintext key (shown once) plus the stored row.
     * Only the SHA-256 hash of the key is ever persisted.
     *
     * @return array{plaintext: string, row: array<string, mixed>}
     */
    public static function generate(string $name, string $scope, ?int $createdBy): array
    {
        $scope = in_array($scope, self::SCOPES, true) ? $scope : 'read';
        $secret = bin2hex(random_bytes(24));
        $plaintext = 'ak_' . $secret;
        $prefix = substr($plaintext, 0, 11); // e.g. ak_3f9a2b1c
        $hash = hash('sha256', $plaintext);

        $stmt = Database::pdo()->prepare(
            'INSERT INTO api_keys (name, key_prefix, key_hash, scope, created_by) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([trim($name), $prefix, $hash, $scope, $createdBy]);

        $row = self::findById((int) Database::pdo()->lastInsertId());

        return ['plaintext' => $plaintext, 'row' => $row ?? []];
    }

    /**
     * Verify a plaintext key sent by an API caller. Updates last_used_at on success.
     */
    public static function verify(string $plaintext): ?array
    {
        $plaintext = trim($plaintext);
        if ($plaintext === '') {
            return null;
        }
        $hash = hash('sha256', $plaintext);

        $stmt = Database::pdo()->prepare(
            'SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([$hash]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }

        $touch = Database::pdo()->prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?');
        $touch->execute([gmdate('Y-m-d H:i:s'), $row['id']]);
        $row['last_used_at'] = gmdate('Y-m-d H:i:s');

        return $row;
    }

    /** @return array<int, array<string, mixed>> */
    public static function all(): array
    {
        $stmt = Database::pdo()->query(
            'SELECT k.*, u.name AS creator_name, u.email AS creator_email
             FROM api_keys k LEFT JOIN users u ON u.id = k.created_by
             ORDER BY k.id DESC'
        );
        return $stmt->fetchAll();
    }

    public static function findById(int $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM api_keys WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function revoke(int $id): bool
    {
        $stmt = Database::pdo()->prepare(
            "UPDATE api_keys SET is_active = 0, revoked_at = datetime('now') WHERE id = ?"
        );
        return $stmt->execute([$id]);
    }
}
