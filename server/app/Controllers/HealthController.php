<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Response;

final class HealthController extends Controller
{
    public function index(): void
    {
        Response::json(['ok' => true, 'time' => gmdate('c')]);
    }
}