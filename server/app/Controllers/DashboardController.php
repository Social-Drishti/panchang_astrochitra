<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Response;
use App\Models\Client;
use App\Models\Kundli;

final class DashboardController extends Controller
{
    public function index(): void
    {
        $today = gmdate('Y-m-d');
        $sinceToday = $today . ' 00:00:00';

        $pdo = \App\Core\Database::pdo();

        $totalClients = (int) $pdo->query('SELECT COUNT(*) FROM clients')->fetchColumn();
        $totalInstalls = (int) $pdo->query('SELECT COUNT(*) FROM clients WHERE is_installed = 1')->fetchColumn();

        $stmt = $pdo->prepare('SELECT COUNT(*) FROM clients WHERE first_seen_at >= ?');
        $stmt->execute([$sinceToday]);
        $webToday = (int) $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM clients WHERE is_installed = 1 AND installed_at >= ?");
        $stmt->execute([$sinceToday]);
        $installsToday = (int) $stmt->fetchColumn();

        $totalKundlis = Kundli::count();
        $kundlisToday = Kundli::count($sinceToday);

        $clientTrend = $this->clientTrend(14);
        $kundliTrend = Kundli::trend(14);

        $recentClients = $pdo->query('SELECT * FROM clients ORDER BY id DESC LIMIT 10')->fetchAll();
        $recentKundlis = Kundli::recent(10);

        $firstClient = $pdo->query('SELECT MIN(first_seen_at) FROM clients')->fetchColumn();

        admin_view('dashboard/index', [
            'today' => $today,
            'totalClients' => $totalClients,
            'totalInstalls' => $totalInstalls,
            'webToday' => $webToday,
            'installsToday' => $installsToday,
            'totalKundlis' => $totalKundlis,
            'kundlisToday' => $kundlisToday,
            'clientTrend' => $clientTrend,
            'kundliTrend' => $kundliTrend,
            'recentClients' => $recentClients,
            'recentKundlis' => $recentKundlis,
            'firstClient' => $firstClient,
            'pageTitle' => 'Overview',
        ]);
    }

    public function clients(): void
    {
        $q = trim((string) ($_GET['q'] ?? ''));
        $pdo = \App\Core\Database::pdo();

        if ($q !== '') {
            $stmt = $pdo->prepare(
                'SELECT * FROM clients WHERE device_id LIKE ? OR platform LIKE ? OR user_agent LIKE ?
                 ORDER BY id DESC LIMIT 100'
            );
            $like = '%' . $q . '%';
            $stmt->execute([$like, $like, $like]);
            $clients = $stmt->fetchAll();
        } else {
            $clients = $pdo->query('SELECT * FROM clients ORDER BY id DESC LIMIT 200')->fetchAll();
        }

        admin_view('dashboard/clients', ['clients' => $clients, 'q' => $q, 'pageTitle' => 'Clients']);
    }

    public function kundlis(): void
    {
        $kundlis = Kundli::recent(200);
        admin_view('dashboard/kundlis', ['kundlis' => $kundlis, 'pageTitle' => 'Kundlis']);
    }

    private function clientTrend(int $days): array
    {
        $pdo = \App\Core\Database::pdo();
        $stmt = $pdo->prepare(
            "SELECT date(first_seen_at) AS day, COUNT(*) AS n FROM clients
             WHERE first_seen_at >= datetime('now', :offset) GROUP BY day ORDER BY day"
        );
        $stmt->execute([':offset' => '-' . $days . ' days']);
        $counts = [];
        foreach ($stmt->fetchAll() as $row) {
            $counts[$row['day']] = (int) $row['n'];
        }
        return Kundli::fillTrend($counts, $days);
    }
}