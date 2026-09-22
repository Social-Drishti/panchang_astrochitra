<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

final class Kundli
{
    /**
     * Save an anonymous kundli. When a client_id + kundli_key pair exists
     * it updates that row (idempotent sync), otherwise inserts.
     */
    public static function upsert(array $payload): array
    {
        $pdo = Database::pdo();
        $client = null;
        $deviceId = trim((string) ($payload['device_id'] ?? ''));
        if ($deviceId !== '') {
            $client = Client::findByDeviceId($deviceId);
        }

        $key = substr(trim((string) ($payload['kundli_key'] ?? '')), 0, 64);
        $name = substr(trim((string) ($payload['birth_name'] ?? '')), 0, 120);
        $date = (string) ($payload['date'] ?? '');
        $time = (string) ($payload['time'] ?? '');
        $timezone = (float) ($payload['timezone'] ?? 5.5);
        $lat = (float) ($payload['latitude'] ?? 0);
        $lng = (float) ($payload['longitude'] ?? 0);
        $place = substr(trim((string) ($payload['place_name'] ?? '')), 0, 200);
        $json = (string) ($payload['kundli_json'] ?? '');

        if ($date === '' || $time === '' || $json === '') {
            return ['error' => 'date, time and kundli_json are required', 'status' => 422];
        }
        if (strlen($json) > 4_000_000) {
            return ['error' => 'kundli_json too large', 'status' => 422];
        }

        $clientId = $client !== null ? (int) $client['id'] : null;

        if ($clientId !== null && $key !== '') {
            $stmt = $pdo->prepare('SELECT id FROM kundlis WHERE client_id = ? AND kundli_key = ? LIMIT 1');
            $stmt->execute([$clientId, $key]);
            $existing = $stmt->fetch();
            if ($existing !== false) {
                $stmt = $pdo->prepare(
                    'UPDATE kundlis SET birth_name = ?, date = ?, time = ?, timezone = ?, latitude = ?, longitude = ?,
                     place_name = ?, kundli_json = ?, created_at = datetime(\'now\') WHERE id = ?'
                );
                $stmt->execute([$name, $date, $time, $timezone, $lat, $lng, $place, $json, $existing['id']]);
                return ['id' => (int) $existing['id'], 'updated' => true];
            }
        }

        $stmt = $pdo->prepare(
            'INSERT INTO kundlis (client_id, kundli_key, birth_name, date, time, timezone, latitude, longitude, place_name, kundli_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$clientId, $key, $name, $date, $time, $timezone, $lat, $lng, $place, $json]);

        return ['id' => (int) $pdo->lastInsertId(), 'updated' => false];
    }

    public static function recent(int $limit = 20): array
    {
        $stmt = Database::pdo()->query(
            'SELECT k.*, c.device_id FROM kundlis k LEFT JOIN clients c ON c.id = k.client_id
             ORDER BY k.id DESC LIMIT ' . max(1, min(500, $limit))
        );
        return $stmt->fetchAll();
    }

    public static function count(?string $since = null): int
    {
        if ($since === null) {
            return (int) Database::pdo()->query('SELECT COUNT(*) FROM kundlis')->fetchColumn();
        }
        $stmt = Database::pdo()->prepare("SELECT COUNT(*) FROM kundlis WHERE created_at >= ?");
        $stmt->execute([$since]);
        return (int) $stmt->fetchColumn();
    }

    /** @return array<int, array{day:string,n:int}> */
    public static function trend(int $days): array
    {
        $stmt = Database::pdo()->prepare(
            "SELECT date(created_at) AS day, COUNT(*) AS n
             FROM kundlis
             WHERE created_at >= datetime('now', :offset)
             GROUP BY day ORDER BY day"
        );
        $stmt->execute([':offset' => '-' . max(1, $days) . ' days']);
        $rows = [];
        foreach ($stmt->fetchAll() as $row) {
            $rows[$row['day']] = (int) $row['n'];
        }
        return self::fillTrend($rows, $days);
    }

    /** @return array<int, array<string, mixed>> */
    public static function paginated(int $limit = 50, int $offset = 0): array
    {
        $limit = max(1, min(200, $limit));
        $offset = max(0, $offset);
        $stmt = Database::pdo()->prepare(
            'SELECT k.*, c.device_id FROM kundlis k LEFT JOIN clients c ON c.id = k.client_id
             ORDER BY k.id DESC LIMIT ? OFFSET ?'
        );
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function delete(int $id): bool
    {
        $stmt = Database::pdo()->prepare('DELETE FROM kundlis WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public static function clearAll(): int
    {
        return (int) Database::pdo()->exec('DELETE FROM kundlis');
    }

    /** Deletes kundlis created between $from and $to (inclusive, 'Y-m-d H:i:s'). */
    public static function clearRange(string $from, string $to): int
    {
        $stmt = Database::pdo()->prepare('DELETE FROM kundlis WHERE created_at >= ? AND created_at <= ?');
        $stmt->execute([$from, $to]);
        return $stmt->rowCount();
    }

    /** @return array<int, array{day:string,n:int}> */
    public static function fillTrend(array $counts, int $days): array
    {
        $out = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $day = gmdate('Y-m-d', strtotime("-$i days"));
            $out[] = ['day' => $day, 'n' => $counts[$day] ?? 0];
        }
        return $out;
    }
}