<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

final class User
{
    const ROLES = ['admin', 'viewer', 'app'];

    public static function findByEmail(string $email): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([strtolower(trim($email))]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function verify(string $email, string $password): ?array
    {
        $user = self::findByEmail($email);
        if ($user === null || !password_verify($password, $user['password_hash'])) {
            return null;
        }
        return $user;
    }

    public static function create(string $email, string $password, string $name = '', string $role = 'admin'): array
    {
        $email = strtolower(trim($email));
        $role = in_array($role, self::ROLES, true) ? $role : 'admin';
        $stmt = Database::pdo()->prepare(
            'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$email, password_hash($password, PASSWORD_DEFAULT), trim($name), $role]);
        return [
            'id' => (int) Database::pdo()->lastInsertId(),
            'email' => $email,
            'name' => trim($name),
            'role' => $role,
        ];
    }

    public static function upsert(string $email, string $password, string $name = ''): array
    {
        $existing = self::findByEmail($email);
        if ($existing !== null) {
            $stmt = Database::pdo()->prepare(
                'UPDATE users SET password_hash = ?, name = ? WHERE id = ?'
            );
            $stmt->execute([password_hash($password, PASSWORD_DEFAULT), trim($name), $existing['id']]);
            $existing['name'] = trim($name) !== '' ? trim($name) : $existing['name'];
            return $existing;
        }
        return self::create($email, $password, $name);
    }

    /** @return array<int, array<string, mixed>> */
    public static function all(): array
    {
        $stmt = Database::pdo()->query('SELECT id, email, name, role, created_at FROM users ORDER BY id ASC');
        return $stmt->fetchAll();
    }

    public static function findById(int $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function emailTakenBy(string $email, ?int $excludeId = null): bool
    {
        $email = strtolower(trim($email));
        if ($excludeId !== null) {
            $stmt = Database::pdo()->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
            $stmt->execute([$email, $excludeId]);
        } else {
            $stmt = Database::pdo()->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([$email]);
        }
        return $stmt->fetch() !== false;
    }

    public static function updateProfile(int $id, string $name, string $email, string $role): bool
    {
        $role = in_array($role, self::ROLES, true) ? $role : 'admin';
        $stmt = Database::pdo()->prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?');
        return $stmt->execute([trim($name), strtolower(trim($email)), $role, $id]);
    }

    public static function updatePassword(int $id, string $password): bool
    {
        $stmt = Database::pdo()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        return $stmt->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
    }

    public static function delete(int $id): bool
    {
        $stmt = Database::pdo()->prepare('DELETE FROM users WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public static function countAdmins(): int
    {
        return (int) Database::pdo()->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
    }
}