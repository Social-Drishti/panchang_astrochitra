<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

/**
 * Thin client for the Astrochitra Slots external API.
 *
 * The key is read from the server-side environment and never leaves the
 * backend. Every call is server-to-server (no Origin header), so CORS does not
 * apply and the API does not need this install's origin registered.
 */
final class AstrochitraClient
{
    private const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;

    /** @return array{ok: bool, status: int, body: array<string, mixed>, error: string} */
    private static function request(string $action, string $method, array $payload = [], array $query = []): array
    {
        $config = require dirname(__DIR__, 2) . '/config/config.php';
        $astro = $config['astrochitra'];
        $key = (string) ($astro['api_key'] ?? '');

        if ($key === '') {
            return self::fail(0, 'ASTROCHITRA_API_KEY is not configured');
        }

        $url = rtrim((string) $astro['api_base'], '?') . '?' . http_build_query(['action' => $action] + $query);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => (int) $astro['timeout'],
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HTTPHEADER => [
                'X-API-Key: ' . $key,
                'Accept: application/json',
                'Content-Type: application/json',
            ],
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        }

        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $raw === '') {
            return self::fail($status, $curlError !== '' ? 'Upstream request failed: ' . $curlError : 'Empty response from upstream');
        }

        if (strlen($raw) > self::MAX_RESPONSE_BYTES) {
            return self::fail($status, 'Upstream response too large');
        }

        $body = json_decode($raw, true);
        if (!is_array($body)) {
            return self::fail($status, 'Upstream returned a non-JSON response');
        }

        if ($status >= 400 || isset($body['error'])) {
            $message = (string) ($body['error'] ?? ('Upstream returned HTTP ' . $status));
            // 429 is a rate limit, 401/403 a key problem: worth saying plainly so
            // the cause is visible rather than looking like a generic outage.
            if ($status === 429) {
                $message = 'Upstream rate limit reached. Try again later.';
            } elseif ($status === 401 || $status === 403) {
                $message = 'Upstream rejected the API key or its permissions.';
            }
            return self::fail($status, $message);
        }

        return ['ok' => true, 'status' => $status, 'body' => $body, 'error' => ''];
    }

    /** @return array{ok: bool, status: int, body: array<string, mixed>, error: string} */
    private static function fail(int $status, string $message): array
    {
        return ['ok' => false, 'status' => $status, 'body' => [], 'error' => $message];
    }

    /** Health check; used by the admin page to confirm the key works. */
    public static function ping(): array
    {
        return self::request('ping', 'GET');
    }

    /**
     * Creates a lead (a client record with lead_captured status).
     *
     * @param array<string, string> $fields
     * @return array{ok: bool, status: int, body: array<string, mixed>, error: string}
     */
    public static function createLead(array $fields): array
    {
        return self::request('leads.create', 'POST', $fields);
    }

    /**
     * A client's complete appointment history plus their record.
     *
     * @return array{ok: bool, status: int, body: array<string, mixed>, error: string}
     */
    public static function appointmentsForClient(int $clientId): array
    {
        return self::request('appointments.list', 'GET', [], ['client_id' => $clientId]);
    }

    /** @return array{ok: bool, status: int, body: array<string, mixed>, error: string} */
    public static function getClient(int $clientId): array
    {
        return self::request('clients.get', 'GET', [], ['id' => $clientId]);
    }

    /**
     * Looks a client up by the exact phone digits they were stored with.
     *
     * @return array{ok: bool, status: int, body: array<string, mixed>, error: string}
     */
    public static function searchByPhone(string $phone): array
    {
        return self::request('clients.search', 'GET', [], ['q' => $phone, 'limit' => 5]);
    }

    /**
     * True when a record is already bound to an install other than $deviceId.
     * Used to stop one person claiming a second install while keeping an
     * install that re-submits its own number working.
     */
    public static function isLocalDuplicate(string $deviceId, string $phone): bool
    {
        $stmt = Database::pdo()->prepare('SELECT device_id FROM consultation_clients WHERE phone = ? LIMIT 1');
        $stmt->execute([$phone]);
        $existing = $stmt->fetchColumn();
        if ($existing === false) {
            return false;
        }

        return (string) $existing !== $deviceId;
    }
}
