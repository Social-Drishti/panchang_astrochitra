<?php

declare(strict_types=1);

namespace App\Core;

final class Request
{
    public static function method(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }

    public static function path(): string
    {
        return parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    }

    /** @return array<string, mixed> */
    public static function json(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    /** @return array<string, mixed> */
    public static function all(): array
    {
        return array_merge($_POST, self::json());
    }

    public static function input(string $key, mixed $default = null): mixed
    {
        $all = self::all();
        return $all[$key] ?? $default;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        return filter_var(self::input($key, $default), FILTER_VALIDATE_BOOLEAN);
    }
}