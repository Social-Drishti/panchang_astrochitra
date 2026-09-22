<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Models\Client;

final class ClientController extends Controller
{
    public function heartbeat(): void
    {
        $deviceId = trim((string) Request::input('device_id', ''));
        if ($deviceId !== '' && !preg_match('/^[A-Za-z0-9_\-]{8,128}$/', $deviceId)) {
            Response::json(['error' => 'invalid device_id'], 422);
        }

        $result = Client::upsert([
            'device_id' => $deviceId,
            'is_installed' => (bool) Request::input('is_installed', false),
            'platform' => (string) Request::input('platform', ''),
            'is_mobile' => (bool) Request::input('is_mobile', false),
            'app_version' => (string) Request::input('app_version', ''),
        ]);

        Response::json([
            'client_id' => (int) $result['client']['id'],
            'device_id' => $result['client']['device_id'],
            'is_new' => $result['is_new'],
            'is_new_install' => $result['is_new_install'],
            'throttled' => $result['throttled'],
        ]);
    }
}