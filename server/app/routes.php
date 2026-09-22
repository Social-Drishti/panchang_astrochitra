<?php

declare(strict_types=1);

use App\Controllers\ApiDataController;
use App\Controllers\ApiKeyController;
use App\Controllers\AppAuthController;
use App\Controllers\AuthController;
use App\Controllers\ClientController;
use App\Controllers\ConfigController;
use App\Controllers\DashboardController;
use App\Controllers\DataController;
use App\Controllers\HealthController;
use App\Controllers\KundliController;
use App\Controllers\UserController;

$router = new \App\Core\Router();

// Public API (no key required — used by the anonymous PWA/mobile client)
$router->get('/api/v1/health', [HealthController::class, 'index']);
$router->get('/api/v1/config', [ConfigController::class, 'index']);
$router->post('/api/v1/client', [ClientController::class, 'heartbeat']);
$router->post('/api/v1/kundli', [KundliController::class, 'save']);

// App account auth (register/login are public; me/logout require a bearer token)
$router->post('/api/v1/auth/register', [AppAuthController::class, 'register']);
$router->post('/api/v1/auth/login', [AppAuthController::class, 'login']);
$router->get('/api/v1/auth/me', [AppAuthController::class, 'me'], ['middleware' => 'app_auth']);
$router->post('/api/v1/auth/logout', [AppAuthController::class, 'logout'], ['middleware' => 'app_auth']);

// Authenticated data API (requires an API key — see /admin/api-keys)
$router->get('/api/v1/stats', [ApiDataController::class, 'stats'], ['middleware' => 'api_key']);
$router->get('/api/v1/clients', [ApiDataController::class, 'clients'], ['middleware' => 'api_key']);
$router->post('/api/v1/clients/delete', [ApiDataController::class, 'deleteClient'], ['middleware' => 'api_key']);
$router->get('/api/v1/kundlis', [ApiDataController::class, 'kundlis'], ['middleware' => 'api_key']);
$router->post('/api/v1/kundlis/delete', [ApiDataController::class, 'deleteKundli'], ['middleware' => 'api_key']);

// Admin auth
$router->get('/admin/login', [AuthController::class, 'showLogin']);
$router->post('/admin/login', [AuthController::class, 'login']);
$router->get('/admin/logout', [AuthController::class, 'logout']);

// Admin dashboard (authed)
$router->get('/admin', [DashboardController::class, 'index'], ['middleware' => 'auth']);
$router->get('/admin/clients', [DashboardController::class, 'clients'], ['middleware' => 'auth']);
$router->get('/admin/kundlis', [DashboardController::class, 'kundlis'], ['middleware' => 'auth']);

// Admin dashboard — data clearing (admin role required for mutations)
$router->post('/admin/data/clear-all', [DataController::class, 'clearAll'], ['middleware' => 'auth']);
$router->post('/admin/data/clear-range', [DataController::class, 'clearRange'], ['middleware' => 'auth']);

// Admin dashboard — user management (admin role required for mutations)
$router->get('/admin/users', [UserController::class, 'index'], ['middleware' => 'auth']);
$router->post('/admin/users/create', [UserController::class, 'create'], ['middleware' => 'auth']);
$router->post('/admin/users/update', [UserController::class, 'update'], ['middleware' => 'auth']);
$router->post('/admin/users/delete', [UserController::class, 'delete'], ['middleware' => 'auth']);

// Admin dashboard — API key management (admin role required for mutations)
$router->get('/admin/api-keys', [ApiKeyController::class, 'index'], ['middleware' => 'auth']);
$router->post('/admin/api-keys/create', [ApiKeyController::class, 'create'], ['middleware' => 'auth']);
$router->post('/admin/api-keys/revoke', [ApiKeyController::class, 'revoke'], ['middleware' => 'auth']);

// Landing
$router->get('/', function () {
    header('Location: /admin');
    exit;
});

return $router;