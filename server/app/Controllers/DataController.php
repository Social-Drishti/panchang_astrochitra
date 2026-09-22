<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Core\Response;
use App\Models\Client;
use App\Models\Kundli;

final class DataController extends Controller
{
    public function clearAll(): void
    {
        $this->guard('/admin');

        // Kundlis first, then clients (schema is ON DELETE SET NULL, but this
        // keeps the wipe clean), then reset both sequences so ids start fresh.
        $kundlis = Kundli::clearAll();
        $clients = Client::clearAll();
        Database::pdo()->exec("DELETE FROM sqlite_sequence WHERE name IN ('clients', 'kundlis')");

        flash_set('ok', sprintf('Cleared %d kundlis and %d clients.', $kundlis, $clients));
        Response::redirect('/admin');
    }

    public function clearRange(): void
    {
        $this->guard('/admin');

        $from = trim((string) ($_POST['from'] ?? ''));
        $to = trim((string) ($_POST['to'] ?? ''));

        if (!self::isDate($from) || !self::isDate($to)) {
            flash_set('err', 'Pick both a From and a To date.');
            Response::redirect('/admin');
        }

        if ($from > $to) {
            flash_set('err', 'From date must be on or before To date.');
            Response::redirect('/admin');
        }

        $kundlis = Kundli::clearRange($from . ' 00:00:00', $to . ' 23:59:59');
        $clients = Client::clearRange($from . ' 00:00:00', $to . ' 23:59:59');

        flash_set(
            'ok',
            sprintf('Cleared %d kundlis and %d clients from %s to %s.', $kundlis, $clients, $from, $to)
        );
        Response::redirect('/admin');
    }

    private function guard(string $redirect): void
    {
        require_admin_role();

        if (!csrf_verify()) {
            flash_set('err', 'Session expired, please try again.');
            Response::redirect($redirect);
        }
    }

    private static function isDate(string $value): bool
    {
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $m)) {
            return false;
        }
        return checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
    }
}
