<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Response;
use App\Models\User;

final class AuthController extends Controller
{
    public function showLogin(): void
    {
        if ($this->isLoggedIn()) {
            Response::redirect('/admin');
        }
        view('auth/login', ['error' => null]);
    }

    public function login(): void
    {
        session_start_admin();

        if (!csrf_verify()) {
            view('auth/login', ['error' => 'Session expired. Please try again.']);
            return;
        }

        $email = (string) ($_POST['email'] ?? '');
        $password = (string) ($_POST['password'] ?? '');

        $user = User::verify($email, $password);
        if ($user === null) {
            view('auth/login', ['error' => 'Invalid email or password.']);
            return;
        }

        session_start_admin();
        session_regenerate_id(true);
        $_SESSION['admin'] = [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'] ?? 'admin',
        ];

        Response::redirect('/admin');
    }

    public function logout(): void
    {
        session_start_admin();
        $_SESSION = [];
        session_destroy();
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
        Response::redirect('/admin/login');
    }

    private function isLoggedIn(): bool
    {
        session_start_admin();
        return !empty($_SESSION['admin']);
    }
}