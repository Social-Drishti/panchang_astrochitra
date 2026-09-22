<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Response;

final class ConfigController extends Controller
{
    public function index(): void
    {
        Response::json([
            'api_enabled' => true,
            'kundli_quota' => 50,
            'heartbeat_interval_min' => 5,
        ]);
    }
}