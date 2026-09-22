<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Response;
use App\Models\User;

final class UserController extends Controller
{
    public function index(): void
    {
        admin_view('dashboard/users', [
            'users' => User::all(),
            'pageTitle' => 'Users',
        ]);
    }

    public function create(): void
    {
        require_admin_role();

        if (!csrf_verify()) {
            flash_set('err', 'Session expired, please try again.');
            Response::redirect('/admin/users');
        }

        $name = trim((string) ($_POST['name'] ?? ''));
        $email = trim((string) ($_POST['email'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        $role = (string) ($_POST['role'] ?? 'admin');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            flash_set('err', 'Enter a valid email address.');
            Response::redirect('/admin/users');
        }
        if (strlen($password) < 8) {
            flash_set('err', 'Password must be at least 8 characters.');
            Response::redirect('/admin/users');
        }
        if (User::emailTakenBy($email)) {
            flash_set('err', 'A user with that email already exists.');
            Response::redirect('/admin/users');
        }

        $user = User::create($email, $password, $name, $role);
        flash_set('ok', 'User "' . $user['email'] . '" created.');
        Response::redirect('/admin/users');
    }

    public function update(): void
    {
        require_admin_role();

        if (!csrf_verify()) {
            flash_set('err', 'Session expired, please try again.');
            Response::redirect('/admin/users');
        }

        $id = (int) ($_POST['id'] ?? 0);
        $target = User::findById($id);
        if ($target === null) {
            flash_set('err', 'User not found.');
            Response::redirect('/admin/users');
        }

        $name = trim((string) ($_POST['name'] ?? ''));
        $email = trim((string) ($_POST['email'] ?? ''));
        $role = (string) ($_POST['role'] ?? 'admin');
        $password = (string) ($_POST['password'] ?? '');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            flash_set('err', 'Enter a valid email address.');
            Response::redirect('/admin/users');
        }
        if (User::emailTakenBy($email, $id)) {
            flash_set('err', 'A user with that email already exists.');
            Response::redirect('/admin/users');
        }
        if ($target['role'] === 'admin' && $role !== 'admin' && User::countAdmins() <= 1) {
            flash_set('err', 'Cannot demote the last remaining admin.');
            Response::redirect('/admin/users');
        }
        if ($password !== '' && strlen($password) < 8) {
            flash_set('err', 'New password must be at least 8 characters (or leave it blank to keep the current one).');
            Response::redirect('/admin/users');
        }

        User::updateProfile($id, $name, $email, $role);
        if ($password !== '') {
            User::updatePassword($id, $password);
        }

        flash_set('ok', 'User "' . $email . '" updated.');
        Response::redirect('/admin/users');
    }

    public function delete(): void
    {
        require_admin_role();

        if (!csrf_verify()) {
            flash_set('err', 'Session expired, please try again.');
            Response::redirect('/admin/users');
        }

        $id = (int) ($_POST['id'] ?? 0);
        $target = User::findById($id);
        if ($target === null) {
            flash_set('err', 'User not found.');
            Response::redirect('/admin/users');
        }

        $me = current_admin();
        if ($me !== null && (int) $me['id'] === $id) {
            flash_set('err', 'You cannot delete your own account while logged in.');
            Response::redirect('/admin/users');
        }
        if ($target['role'] === 'admin' && User::countAdmins() <= 1) {
            flash_set('err', 'Cannot delete the last remaining admin.');
            Response::redirect('/admin/users');
        }

        User::delete($id);
        flash_set('ok', 'User "' . $target['email'] . '" deleted.');
        Response::redirect('/admin/users');
    }
}
