<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

/**
 * The binding between one PWA install and one Astrochitra Slots client.
 *
 * device_id comes from the anonymous install id the PWA already generates, and
 * is the only identity the browser has. phone is the user-facing anchor and is
 * unique, so a number cannot be claimed by a second install.
 */
final class ConsultationClient
{
    /**
     * Normalises a user-typed phone to bare digits.
     *
     * The slots system stores phones exactly as entered and matches with a raw
     * LIKE, so the digits are what matter. A leading country code is dropped
     * only when 11 digits starting with 91 are given.
     */
    public static function normalisePhone(string $raw): string
    {
        $digits = preg_replace('/\D+/', '', $raw) ?? '';
        if (strlen($digits) === 11 && str_starts_with($digits, '91')) {
            $digits = substr($digits, 2);
        }

        return $digits;
    }

    public static function findByDeviceId(string $deviceId): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM consultation_clients WHERE device_id = ? LIMIT 1');
        $stmt->execute([$deviceId]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findByPhone(string $phone): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM consultation_clients WHERE phone = ? LIMIT 1');
        $stmt->execute([$phone]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findById(int $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM consultation_clients WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /**
     * Inserts a pending row. The caller fills in astro_client_id afterwards.
     *
     * @param array<string, string> $fields
     */
    public static function create(string $deviceId, string $phone, array $fields): int
    {
        $stmt = Database::pdo()->prepare(
            'INSERT INTO consultation_clients (device_id, phone, name, email, date_of_birth,
                birth_time, birth_place, question, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $now = gmdate('Y-m-d H:i:s');
        $stmt->execute([
            $deviceId,
            $phone,
            $fields['name'] ?? '',
            $fields['email'] ?? '',
            $fields['date_of_birth'] ?? '',
            $fields['birth_time'] ?? '',
            $fields['birth_place'] ?? '',
            $fields['question'] ?? '',
            'pending',
            $now,
            $now,
        ]);

        return (int) Database::pdo()->lastInsertId();
    }

    /**
     * Reuses an existing row for this install instead of inserting a new one.
     *
     * device_id is UNIQUE, so a retry after a failed upstream call cannot simply
     * call create() again. The details are refreshed from the new submission and
     * the row is returned to `pending` so the caller can retry the lead.
     *
     * @param array<string, string> $fields
     */
    public static function reopen(int $id, string $phone, array $fields): void
    {
        $stmt = Database::pdo()->prepare(
            'UPDATE consultation_clients
             SET phone = ?, name = ?, email = ?, date_of_birth = ?, birth_time = ?,
                 birth_place = ?, question = ?, status = ?, astro_client_id = NULL,
                 lead_response = \'\', last_error = ?, updated_at = ?
             WHERE id = ?'
        );
        $now = gmdate('Y-m-d H:i:s');
        $stmt->execute([
            $phone,
            $fields['name'] ?? '',
            $fields['email'] ?? '',
            $fields['date_of_birth'] ?? '',
            $fields['birth_time'] ?? '',
            $fields['birth_place'] ?? '',
            $fields['question'] ?? '',
            'pending',
            '',
            $now,
            $id,
        ]);
    }

    /**
     * Stamps a successful lead creation.
     *
     * @param array<string, mixed> $response raw leads.create body, kept for support
     */
    public static function markLinked(int $id, int $astroClientId, array $response): void
    {
        $stmt = Database::pdo()->prepare(
            'UPDATE consultation_clients
             SET astro_client_id = ?, status = ?, lead_response = ?, last_error = ?,
                 last_synced_at = ?, updated_at = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $astroClientId,
            'linked',
            json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '',
            '',
            gmdate('Y-m-d H:i:s'),
            gmdate('Y-m-d H:i:s'),
            $id,
        ]);
    }

    public static function markFailed(int $id, string $error): void
    {
        $stmt = Database::pdo()->prepare(
            'UPDATE consultation_clients SET status = ?, last_error = ?, updated_at = ? WHERE id = ?'
        );
        $stmt->execute(['failed', substr($error, 0, 500), gmdate('Y-m-d H:i:s'), $id]);
    }

    public static function markSynced(int $id, string $when): void
    {
        $stmt = Database::pdo()->prepare('UPDATE consultation_clients SET last_synced_at = ?, updated_at = ? WHERE id = ?');
        $stmt->execute([$when, $when, $id]);
    }

    /** Timestamp of the last successful upstream read, or null if never. */
    public static function lastSyncedAt(int $id): ?string
    {
        $stmt = Database::pdo()->prepare('SELECT last_synced_at FROM consultation_clients WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $value = $stmt->fetchColumn();
        return $value === false || $value === null ? null : (string) $value;
    }

    /**
     * True when the cached snapshot is still inside the freshness window.
     *
     * Timestamps are written with gmdate() and so are UTC, but strtotime()
     * would read a bare "Y-m-d H:i:s" string in the server's local timezone.
     * Under Asia/Kolkata that is 5.5 hours off, which would make every
     * snapshot look stale and defeat the cache, so the value is pinned to UTC
     * explicitly. An unparseable timestamp is treated as stale so a bad value
     * self-heals on the next sync.
     */
    public static function isFresh(?string $lastSyncedAt, int $ttlSeconds): bool
    {
        if ($lastSyncedAt === null || trim($lastSyncedAt) === '') {
            return false;
        }

        $parsed = \DateTimeImmutable::createFromFormat(
            'Y-m-d H:i:s',
            trim($lastSyncedAt),
            new \DateTimeZone('UTC')
        );
        if ($parsed === false) {
            return false;
        }

        return (time() - $parsed->getTimestamp()) < $ttlSeconds;
    }

    /** @return array<int, array<string, mixed>> */
    public static function paginated(int $limit = 50, int $offset = 0, string $q = ''): array
    {
        $limit = max(1, min(200, $limit));
        $offset = max(0, $offset);
        $pdo = Database::pdo();

        if ($q !== '') {
            $like = '%' . $q . '%';
            $stmt = $pdo->prepare(
                'SELECT * FROM consultation_clients
                 WHERE name LIKE ? OR phone LIKE ? OR device_id LIKE ? OR CAST(astro_client_id AS TEXT) LIKE ?
                 ORDER BY id DESC LIMIT ? OFFSET ?'
            );
            $stmt->bindValue(1, $like);
            $stmt->bindValue(2, $like);
            $stmt->bindValue(3, $like);
            $stmt->bindValue(4, $like);
            $stmt->bindValue(5, $limit, \PDO::PARAM_INT);
            $stmt->bindValue(6, $offset, \PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll();
        }

        $stmt = $pdo->prepare('SELECT * FROM consultation_clients ORDER BY id DESC LIMIT ? OFFSET ?');
        $stmt->bindValue(1, $limit, \PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function count(string $q = ''): int
    {
        $pdo = Database::pdo();
        if ($q === '') {
            return (int) $pdo->query('SELECT COUNT(*) FROM consultation_clients')->fetchColumn();
        }

        $like = '%' . $q . '%';
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM consultation_clients
             WHERE name LIKE ? OR phone LIKE ? OR device_id LIKE ? OR CAST(astro_client_id AS TEXT) LIKE ?'
        );
        $stmt->execute([$like, $like, $like, $like]);
        return (int) $stmt->fetchColumn();
    }

    /**
     * Releases a binding so the number can be registered again.
     *
     * This is the escape hatch for someone who wipes their app data and comes
     * back with a new device id. The lead in the slots system is deliberately
     * left alone; only the local link is removed.
     */
    public static function release(int $id): bool
    {
        $stmt = Database::pdo()->prepare('DELETE FROM consultation_clients WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
