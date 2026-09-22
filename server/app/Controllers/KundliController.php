<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Models\Kundli;

final class KundliController extends Controller
{
    public function save(): void
    {
        $result = Kundli::upsert(Request::all());

        if (isset($result['error'])) {
            Response::json(['error' => $result['error']], $result['status']);
        }

        Response::json([
            'id' => $result['id'],
            'updated' => $result['updated'],
        ], $result['updated'] ? 200 : 201);
    }
}