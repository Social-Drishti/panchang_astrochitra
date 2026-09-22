<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

final class Client
{
    /**
     * Upsert an anonymous device heartbeat.
     * Returns the client row with a flag describing what changed.
     */
    public static function upsert(array $payload): array
    {
        $pdo = Database::pdo();
        $deviceId = trim((string) ($payload['device_id'] ?? ''));
        $isInstalled = (int) !empty($payload['is_installed']);
        $platform = substr((string) ($payload['platform'] ?? ''), 0, 32);
        $isMobile = (int) !empty($payload['is_mobile']);
        $appVersion = substr((string) ($payload['app_version'] ?? ''), 0, 32);
        $userAgent = isset($_SERVER['HTTP_USER_AGENT'])
            ? substr($_SERVER['HTTP_USER_AGENT'], 0, 512)
            : '';

        if ($deviceId === '') {
            $deviceId = 'd' . bin2hex(random_bytes(16));
        }

        $stmt = $pdo->prepare('SELECT * FROM clients WHERE device_id = ? LIMIT 1');
        $stmt->execute([$deviceId]);
        $client = $stmt->fetch();

        // Rate-limit heartbeats per device to once a minute per connection.
        $now = time();
        if (is_array($client)) {
            $lastSeen = strtotime((string) $client['last_seen_at']) ?: 0;
            if ($now - $lastSeen < 60 && (int) $client['is_installed'] === $isInstalled) {
                return ['client' => $client, 'is_new' => false, 'is_new_install' => false, 'throttled' => true];
            }

            $becomingInstalled = $isInstalled && (int) $client['is_installed'] === 0;
            $installedAt = $client['installed_at'];
            if ($becomingInstalled) {
                $installedAt = gmdate('Y-m-d H:i:s');
            }

            $stmt = $pdo->prepare(
                'UPDATE clients SET is_installed = ?, installed_at = COALESCE(?, installed_at),
                 platform = ?, is_mobile = ?, app_version = ?, user_agent = ?, last_seen_at = ?
                 WHERE id = ?'
            );
            $stmt->execute([
                $isInstalled,
                $installedAt,
                $platform !== '' ? $platform : $client['platform'],
                $isMobile,
                $appVersion !== '' ? $appVersion : $client['app_version'],
                $userAgent !== '' ? $userAgent : $client['user_agent'],
                gmdate('Y-m-d H:i:s'),
                $client['id'],
            ]);

            $client['is_installed'] = $isInstalled;
            $client['installed_at'] = $installedAt;
            $client['last_seen_at'] = gmdate('Y-m-d H:i:s');

            return ['client' => $client, 'is_new' => false, 'is_new_install' => $becomingInstalled, 'throttled' => false];
        }

        $stmt = $pdo->prepare(
            'INSERT INTO clients (device_id, is_installed, installed_at, platform, is_mobile, app_version, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $deviceId,
            $isInstalled,
            $isInstalled ? gmdate('Y-m-d H:i:s') : null,
            $platform,
            $isMobile,
            $appVersion,
            $userAgent,
        ]);

        $id = (int) $pdo->lastInsertId();
        $client = [
            'id' => $id,
            'device_id' => $deviceId,
            'is_installed' => $isInstalled,
            'installed_at' => $isInstalled ? gmdate('Y-m-d H:i:s') : null,
            'platform' => $platform,
            'is_mobile' => $isMobile,
            'app_version' => $appVersion,
            'user_agent' => $userAgent,
            'first_seen_at' => gmdate('Y-m-d H:i:s'),
            'last_seen_at' => gmdate('Y-m-d H:i:s'),
        ];

        return ['client' => $client, 'is_new' => true, 'is_new_install' => $isInstalled, 'throttled' => false];
    }

    public static function findById(int $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM clients WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findByDeviceId(string $deviceId): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM clients WHERE device_id = ? LIMIT 1');
        $stmt->execute([$deviceId]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /** @return array<int, array<string, mixed>> */
    public static function paginated(string $q = '', int $limit = 50, int $offset = 0): array
    {
        $pdo = Database::pdo();
        $limit = max(1, min(200, $limit));
        $offset = max(0, $offset);

        if ($q !== '') {
            $like = '%' . $q . '%';
            $stmt = $pdo->prepare(
                'SELECT * FROM clients WHERE device_id LIKE ? OR platform LIKE ? OR user_agent LIKE ?
                 ORDER BY id DESC LIMIT ? OFFSET ?'
            );
            $stmt->bindValue(1, $like);
            $stmt->bindValue(2, $like);
            $stmt->bindValue(3, $like);
            $stmt->bindValue(4, $limit, PDO::PARAM_INT);
            $stmt->bindValue(5, $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll();
        }

        $stmt = $pdo->prepare('SELECT * FROM clients ORDER BY id DESC LIMIT ? OFFSET ?');
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function delete(int $id): bool
    {
        $stmt = Database::pdo()->prepare('DELETE FROM clients WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public static function clearAll(): int
    {
        return (int) Database::pdo()->exec('DELETE FROM clients');
    }

    /** Deletes clients first seen between $from and $to (inclusive, 'Y-m-d H:i:s'). */
    public static function clearRange(string $from, string $to): int
    {
        $stmt = Database::pdo()->prepare('DELETE FROM clients WHERE first_seen_at >= ? AND first_seen_at <= ?');
        $stmt->execute([$from, $to]);
        return $stmt->rowCount();
    }
}