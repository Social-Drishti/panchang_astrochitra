<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

/**
 * Local mirror of a client's appointments, so the PWA can render history
 * without a call to the rate-limited upstream API on every page view.
 */
final class ConsultationCache
{
    /**
     * Drops every cached appointment for a consultation client.
     *
     * Used when a row is reopened for a retry, so a previous attempt's
     * appointments cannot be shown against a new upstream lead.
     */
    public static function clearForConsultationClient(int $consultationClientId): void
    {
        $stmt = Database::pdo()->prepare('DELETE FROM consultation_cache WHERE consultation_client_id = ?');
        $stmt->execute([$consultationClientId]);
    }

    /**
     * Replaces the stored appointments for one client with a fresh snapshot.
     *
     * Runs in a transaction so a mid-way failure cannot leave the user looking
     * at a half-updated history.
     *
     * @param array<int, array<string, mixed>> $offline
     * @param array<int, array<string, mixed>> $online
     */
    public static function replaceForClient(int $consultationClientId, int $astroClientId, array $offline, array $online): int
    {
        $pdo = Database::pdo();
        $syncedAt = gmdate('Y-m-d H:i:s');

        $pdo->beginTransaction();
        try {
            $del = $pdo->prepare('DELETE FROM consultation_cache WHERE consultation_client_id = ?');
            $del->execute([$consultationClientId]);

            $ins = $pdo->prepare(
                'INSERT INTO consultation_cache (
                    consultation_client_id, astro_client_id, kind, astro_appointment_id,
                    appt_date, appt_time, duration, token_number, status,
                    google_meet_link, feedback_link, synced_at
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );

            $count = 0;
            foreach ($offline as $row) {
                $ins->execute([
                    $consultationClientId,
                    $astroClientId,
                    'offline',
                    (int) ($row['id'] ?? 0),
                    (string) ($row['slot_date'] ?? ''),
                    (string) ($row['slot_time'] ?? ''),
                    '',
                    isset($row['token_number']) ? (int) $row['token_number'] : null,
                    (string) ($row['status'] ?? ''),
                    '',
                    '',
                    $syncedAt,
                ]);
                $count++;
            }

            foreach ($online as $row) {
                $newDate = trim((string) ($row['new_date'] ?? ''));
                $newTime = trim((string) ($row['new_time'] ?? ''));
                $ins->execute([
                    $consultationClientId,
                    $astroClientId,
                    'online',
                    (int) ($row['id'] ?? 0),
                    // A rescheduled consultation is shown on its new date and
                    // time, which is the day the client actually has to join.
                    $newDate !== '' ? $newDate : (string) ($row['consultation_date'] ?? ''),
                    $newTime !== '' ? $newTime : (string) ($row['time'] ?? ''),
                    (string) ($row['duration'] ?? ''),
                    null,
                    (string) ($row['status'] ?? ''),
                    (string) ($row['google_meet_link'] ?? ''),
                    (string) ($row['feedback_link'] ?? ''),
                    $syncedAt,
                ]);
                $count++;
            }

            $pdo->commit();
            return $count;
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Cached appointments, split into upcoming and past around $today.
     *
     * @return array{upcoming: array<int, array<string, mixed>>, past: array<int, array<string, mixed>>}
     */
    public static function forConsultationClient(int $consultationClientId, string $today): array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT * FROM consultation_cache WHERE consultation_client_id = ?
             ORDER BY appt_date DESC, appt_time DESC, id DESC'
        );
        $stmt->execute([$consultationClientId]);

        $upcoming = [];
        $past = [];
        foreach ($stmt->fetchAll() as $row) {
            // Completed consultations always belong in past.
            // An appointment still marked pending on a past date is more likely
            // to be an unscheduled leftover than a real upcoming session, but
            // treat it as upcoming so it stays visible rather than disappearing.
            $status = strtolower((string) $row['status']);
            $isPast = $status === 'completed' || (string) $row['appt_date'] < $today;
            if ($isPast) {
                $past[] = $row;
            } else {
                $upcoming[] = $row;
            }
        }

        // Upcoming reads soonest-first so the next session is first.
        usort($upcoming, static fn (array $a, array $b): int => [$a['appt_date'], $a['appt_time']] <=> [$b['appt_date'], $b['appt_time']]);

        return ['upcoming' => $upcoming, 'past' => $past];
    }
}
