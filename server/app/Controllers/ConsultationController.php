<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\AstrochitraClient;
use App\Models\ConsultationCache;
use App\Models\ConsultationClient;

/**
 * PWA-facing endpoints for consultation leads and a client's own history.
 *
 * These are public in the same way the existing /api/v1/client heartbeat is:
 * the browser has no account, so identity is the anonymous install id. Every
 * request is scoped to the row bound to that id, so a caller can only ever read
 * the data of the install they are making the request from.
 */
final class ConsultationController
{
    private const MAX_NAME = 120;
    private const MAX_PHONE = 20;
    private const MAX_SHORT = 120;

    // ---------------------------------------------------------------- register

    /**
     * Binds an install to a new consultation lead.
     *
     * Name and phone are the only required fields; birth details are optional
     * and are sent only when present, which also keeps the upstream call fast
     * (supplying a date of birth and place makes it generate a birth chart
     * synchronously, which can take up to a minute).
     */
    public function register(): void
    {
        $deviceId = $this->deviceId();
        if ($deviceId === '') {
            Response::json(['error' => 'A device id is required.'], 400);
        }

        $name = $this->text(Request::input('name'), self::MAX_NAME);
        $phone = ConsultationClient::normalisePhone((string) Request::input('phone', ''));

        if ($name === '') {
            Response::json(['error' => 'Name is required.', 'field' => 'name'], 400);
        }
        if (strlen($phone) < 10 || strlen($phone) > 15) {
            Response::json(['error' => 'Enter a valid phone number.', 'field' => 'phone'], 400);
        }

        // Already registered on this install: idempotent, so a retry after a
        // dropped response does not create a second lead.
        $existing = ConsultationClient::findByDeviceId($deviceId);
        if ($existing !== null && $existing['status'] === 'linked') {
            Response::json(['ok' => true, 'created' => false, 'profile' => $this->profileOf($existing)]);
        }

        // The number is already tied to a different install. There is no OTP in
        // this flow, so releasing a binding has to be done by an admin.
        if (AstrochitraClient::isLocalDuplicate($deviceId, $phone)) {
            Response::json([
                'error' => 'This phone number is already registered on another device. Contact support to release it.',
                'field' => 'phone',
                'code' => 'phone_taken',
            ], 409);
        }

        $fields = [
            'name' => $name,
            'phone' => $phone,
            'email' => $this->text(Request::input('email'), 160),
            'date_of_birth' => $this->text(Request::input('date_of_birth'), 20),
            'birth_time' => $this->text(Request::input('birth_time'), 10),
            'birth_place' => $this->text(Request::input('birth_place'), self::MAX_SHORT),
            'question' => $this->text(Request::input('question'), 500),
        ];

        $config = require dirname(__DIR__, 2) . '/config/config.php';
        $leadReference = (string) ($config['astrochitra']['lead_reference'] ?? 'pwa_consultation');

        $localId = $existing !== null
            ? $this->reopenFor($existing, $phone, $fields)
            : $this->insertFor($deviceId, $phone, $fields);

        if ($localId === null) {
            // Lost a race against a concurrent registration from this same
            // install: the row now exists, so report it as retryable rather
            // than failing the user with a constraint violation.
            Response::json([
                'error' => 'A registration for this device is already in progress. Please try again.',
                'code' => 'register_conflict',
                'retryable' => true,
            ], 409);
        }

        $payload = ['name' => $fields['name'], 'phone' => $fields['phone'], 'reference' => $leadReference];
        foreach (['email', 'date_of_birth', 'birth_time', 'birth_place', 'question'] as $field) {
            if ($fields[$field] !== '') {
                $payload[$field] = $fields[$field];
            }
        }

        $result = AstrochitraClient::createLead($payload);

        if (!$result['ok'] || !isset($result['body']['id'])) {
            $message = $result['error'] !== '' ? $result['error'] : 'The lead could not be created.';
            ConsultationClient::markFailed($localId, $message);
            Response::json(['error' => $message, 'retryable' => true], 502);
        }

        $astroClientId = (int) $result['body']['id'];
        ConsultationClient::markLinked($localId, $astroClientId, $result['body']);

        // Pull the history straight away so the dashboard has something to show
        // without waiting for the first explicit sync. A failure here is not
        // fatal: the lead exists, history can be fetched on the next sync.
        $this->syncFor($localId, $astroClientId, true);

        $profile = ConsultationClient::findById($localId);
        Response::json(['ok' => true, 'created' => true, 'profile' => $this->profileOf($profile ?? [])]);
    }

    // ---------------------------------------------------------------- profile

    /** Returns the bound lead, or null when this install has not registered. */
    public function profile(): void
    {
        $deviceId = $this->deviceId();
        if ($deviceId === '') {
            Response::json(['error' => 'A device id is required.'], 400);
        }

        $row = ConsultationClient::findByDeviceId($deviceId);
        if ($row === null) {
            Response::json(['profile' => null]);
        }

        Response::json(['profile' => $this->profileOf($row)]);
    }

    // ------------------------------------------------------------------- sync

    /**
     * Returns this install's client plus their appointments.
     *
     * Serves the cached snapshot while it is inside the freshness window so a
     * user re-opening the page does not spend an upstream call; ?force=1 skips
     * the cache. If the upstream read fails but a snapshot exists, the stale
     * snapshot is returned with a flag rather than showing an error.
     */
    public function sync(): void
    {
        $deviceId = $this->deviceId();
        if ($deviceId === '') {
            Response::json(['error' => 'A device id is required.'], 400);
        }

        $row = ConsultationClient::findByDeviceId($deviceId);
        if ($row === null) {
            Response::json(['error' => 'This device has not registered for a consultation yet.', 'code' => 'not_registered'], 404);
        }
        if ($row['status'] !== 'linked' || !$row['astro_client_id']) {
            Response::json([
                'error' => 'Your consultation request is still being processed. Please try again shortly.',
                'code' => 'not_linked',
            ], 409);
        }

        $config = require dirname(__DIR__, 2) . '/config/config.php';
        $ttl = (int) ($config['astrochitra']['sync_ttl'] ?? 900);
        // Read from the query string directly: Request::input() only merges
        // $_POST and the JSON body, so a ?force=1 would otherwise be invisible.
        $force = filter_var($_GET['force'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $astroClientId = (int) $row['astro_client_id'];
        $lastSynced = ConsultationClient::lastSyncedAt((int) $row['id']);

        $fromCache = !$force && ConsultationClient::isFresh($lastSynced, $ttl);

        $upstreamError = '';
        $client = [];

        if (!$fromCache) {
            $result = AstrochitraClient::appointmentsForClient($astroClientId);
            if ($result['ok']) {
                $body = $result['body'];
                $appointments = $body['appointments'] ?? [];
                ConsultationCache::replaceForClient(
                    (int) $row['id'],
                    $astroClientId,
                    is_array($appointments['offline'] ?? null) ? $appointments['offline'] : [],
                    is_array($appointments['online'] ?? null) ? $appointments['online'] : []
                );
                $when = gmdate('Y-m-d H:i:s');
                ConsultationClient::markSynced((int) $row['id'], $when);
                $row = ConsultationClient::findById((int) $row['id']) ?? $row;
                $lastSynced = $when;
                $client = is_array($body['client'] ?? null) ? $body['client'] : [];
            } else {
                $upstreamError = $result['error'];
            }
        }

        $split = ConsultationCache::forConsultationClient((int) $row['id'], date('Y-m-d'));

        Response::json([
            'ok' => true,
            'profile' => $this->profileOf($row),
            'client' => $client,
            'appointments' => [
                'upcoming' => array_map([$this, 'shapeAppointment'], $split['upcoming']),
                'past' => array_map([$this, 'shapeAppointment'], $split['past']),
            ],
            'synced_at' => $lastSynced,
            'stale' => $upstreamError !== '',
            'message' => $upstreamError,
        ]);
    }

    // ---------------------------------------------------------------- helpers

    /** @param array<string, mixed> $row */
    private function profileOf(array $row): array
    {
        if ($row === []) {
            return [];
        }

        return [
            'id' => (int) $row['id'],
            'name' => (string) $row['name'],
            'phone' => (string) $row['phone'],
            'email' => (string) $row['email'],
            'date_of_birth' => (string) $row['date_of_birth'],
            'birth_time' => (string) $row['birth_time'],
            'birth_place' => (string) $row['birth_place'],
            'question' => (string) $row['question'],
            'status' => (string) $row['status'],
            'astro_client_id' => $row['astro_client_id'] !== null ? (int) $row['astro_client_id'] : null,
            'last_error' => (string) $row['last_error'],
            'last_synced_at' => $row['last_synced_at'] !== null ? (string) $row['last_synced_at'] : null,
            'created_at' => (string) $row['created_at'],
        ];
    }

    /**
     * Refreshes the existing row for this install and returns to `pending`.
     *
     * @param array<string, mixed> $existing
     * @param array<string, string> $fields
     */
    private function reopenFor(array $existing, string $phone, array $fields): int
    {
        // Any appointments cached for the previous attempt no longer apply.
        ConsultationCache::clearForConsultationClient((int) $existing['id']);
        ConsultationClient::reopen((int) $existing['id'], $phone, $fields);

        return (int) $existing['id'];
    }

    /**
     * Inserts a new pending row, or null if the unique index rejected it.
     *
     * @param array<string, string> $fields
     */
    private function insertFor(string $deviceId, string $phone, array $fields): ?int
    {
        try {
            return ConsultationClient::create($deviceId, $phone, $fields);
        } catch (\PDOException $e) {
            if ($this->isUniqueViolation($e)) {
                return null;
            }
            throw $e;
        }
    }

    private function isUniqueViolation(\PDOException $e): bool
    {
        $message = strtolower($e->getMessage());

        return str_contains($message, 'unique constraint')
            || str_contains($message, 'duplicate key')
            || str_contains($message, 'constraint failed');
    }

    /**
     * Trims a cached row into the shape the PWA renders, adding a derived
     * has_meet flag so the UI does not have to test the link string itself.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function shapeAppointment(array $row): array
    {
        $link = trim((string) $row['google_meet_link']);

        return [
            'id' => (int) $row['astro_appointment_id'],
            'kind' => (string) $row['kind'],
            'date' => (string) $row['appt_date'],
            'time' => (string) $row['appt_time'],
            'duration' => (string) $row['duration'],
            'token_number' => $row['token_number'] !== null ? (int) $row['token_number'] : null,
            'status' => (string) $row['status'],
            'google_meet_link' => $link,
            'has_meet' => $link !== '',
            'feedback_link' => (string) $row['feedback_link'],
        ];
    }

    /**
     * Best-effort initial history fetch. Failures are swallowed on purpose: the
     * lead has already been created, and history can be retried on next sync.
     */
    private function syncFor(int $localId, int $astroClientId, bool $force): void
    {
        if ($force) {
            $result = AstrochitraClient::appointmentsForClient($astroClientId);
            if ($result['ok']) {
                $appointments = $result['body']['appointments'] ?? [];
                ConsultationCache::replaceForClient(
                    $localId,
                    $astroClientId,
                    is_array($appointments['offline'] ?? null) ? $appointments['offline'] : [],
                    is_array($appointments['online'] ?? null) ? $appointments['online'] : []
                );
                ConsultationClient::markSynced($localId, gmdate('Y-m-d H:i:s'));
            }
        }
    }

    private function deviceId(): string
    {
        $raw = trim((string) ($_GET['device_id'] ?? Request::input('device_id', '')));
        return preg_match('/^[A-Za-z0-9_\-]{8,128}$/', $raw) === 1 ? $raw : '';
    }

    private function text(mixed $value, int $max): string
    {
        $text = trim((string) ($value ?? ''));
        // Strip control characters so nothing odd reaches the lead record.
        $text = preg_replace('/[\x00-\x1F\x7F]/u', '', $text) ?? '';
        return mb_substr($text, 0, $max);
    }
}
