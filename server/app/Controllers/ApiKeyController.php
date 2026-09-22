<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Response;
use App\Models\ApiKey;

final class ApiKeyController extends Controller
{
    public function index(): void
    {
        admin_view('dashboard/api_keys', [
            'keys' => ApiKey::all(),
            'newKey' => null,
            'pageTitle' => 'API Keys',
        ]);
    }

    public function create(): void
    {
        require_admin_role();

        if (!csrf_verify()) {
            flash_set('err', 'Session expired, please try again.');
            Response::redirect('/admin/api-keys');
        }

        $name = trim((string) ($_POST['name'] ?? ''));
        $scope = (string) ($_POST['scope'] ?? 'read');

        if ($name === '') {
            flash_set('err', 'Give the key a name so you can recognize it later.');
            Response::redirect('/admin/api-keys');
        }
        if (!in_array($scope, ApiKey::SCOPES, true)) {
            $scope = 'read';
        }

        $admin = current_admin();
        $generated = ApiKey::generate($name, $scope, $admin['id'] ?? null);

        // Render the page directly (rather than redirecting) so the plaintext
        // key can be shown exactly once. It is never persisted or logged.
        admin_view('dashboard/api_keys', [
            'keys' => ApiKey::all(),
            'newKey' => $generated['plaintext'],
            'newKeyName' => $generated['row']['name'] ?? $name,
            'pageTitle' => 'API Keys',
        ]);
    }

    public function revoke(): void
    {
        require_admin_role();

        if (!csrf_verify()) {
            flash_set('err', 'Session expired, please try again.');
            Response::redirect('/admin/api-keys');
        }

        $id = (int) ($_POST['id'] ?? 0);
        $key = ApiKey::findById($id);
        if ($key === null) {
            flash_set('err', 'API key not found.');
            Response::redirect('/admin/api-keys');
        }

        ApiKey::revoke($id);
        flash_set('ok', 'API key "' . $key['name'] . '" revoked.');
        Response::redirect('/admin/api-keys');
    }
}
