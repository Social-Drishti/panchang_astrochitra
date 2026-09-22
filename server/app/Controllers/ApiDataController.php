<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\ApiKeyMiddleware;
use App\Models\Client;
use App\Models\Kundli;

final class ApiDataController extends Controller
{
    public function stats(): void
    {
        $pdo = Database::pdo();
        $today = gmdate('Y-m-d') . ' 00:00:00';

        $totalClients = (int) $pdo->query('SELECT COUNT(*) FROM clients')->fetchColumn();
        $totalInstalls = (int) $pdo->query('SELECT COUNT(*) FROM clients WHERE is_installed = 1')->fetchColumn();

        Response::json([
            'clients_total' => $totalClients,
            'clients_installed' => $totalInstalls,
            'kundlis_total' => Kundli::count(),
            'kundlis_today' => Kundli::count($today),
            'generated_at' => gmdate('c'),
        ]);
    }

    public function clients(): void
    {
        $limit = (int) Request::input('limit', 50);
        $offset = (int) Request::input('offset', 0);
        $q = trim((string) Request::input('q', ''));

        $clients = Client::paginated($q, $limit, $offset);

        Response::json([
            'data' => $clients,
            'limit' => max(1, min(200, $limit)),
            'offset' => max(0, $offset),
            'count' => count($clients),
        ]);
    }

    public function deleteClient(): void
    {
        ApiKeyMiddleware::requireWriteScope();

        $id = (int) Request::input('id', 0);
        if ($id <= 0 || Client::findById($id) === null) {
            Response::json(['error' => 'Client not found.'], 404);
        }

        Client::delete($id);
        Response::json(['deleted' => true, 'id' => $id]);
    }

    public function kundlis(): void
    {
        $limit = (int) Request::input('limit', 50);
        $offset = (int) Request::input('offset', 0);

        $kundlis = Kundli::paginated($limit, $offset);

        Response::json([
            'data' => $kundlis,
            'limit' => max(1, min(200, $limit)),
            'offset' => max(0, $offset),
            'count' => count($kundlis),
        ]);
    }

    public function deleteKundli(): void
    {
        ApiKeyMiddleware::requireWriteScope();

        $id = (int) Request::input('id', 0);
        if ($id <= 0) {
            Response::json(['error' => 'A valid id is required.'], 422);
        }

        Kundli::delete($id);
        Response::json(['deleted' => true, 'id' => $id]);
    }
}
