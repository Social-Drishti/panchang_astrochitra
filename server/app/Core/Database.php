<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;
use RuntimeException;

final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $config = require dirname(__DIR__, 2) . '/config/config.php';
        $dir = dirname($config['db_path']);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        try {
            self::$pdo = new PDO('sqlite:' . $config['db_path'], null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_STRINGIFY_FETCHES => false,
            ]);
            self::$pdo->exec('PRAGMA foreign_keys = ON');
            self::$pdo->exec('PRAGMA journal_mode = WAL');
        } catch (PDOException $e) {
            throw new RuntimeException('Database connection failed: ' . $e->getMessage(), 0, $e);
        }

        return self::$pdo;
    }

    public static function init(): void
    {
        $pdo = self::pdo();

        $pdo->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS users (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                email          TEXT    NOT NULL UNIQUE,
                password_hash  TEXT    NOT NULL,
                name           TEXT    NOT NULL DEFAULT '',
                role           TEXT    NOT NULL DEFAULT 'admin',
                created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            SQL);

        $pdo->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS clients (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id      TEXT    NOT NULL UNIQUE,
                is_installed   INTEGER NOT NULL DEFAULT 0,
                installed_at   TEXT,
                platform       TEXT    NOT NULL DEFAULT '',
                is_mobile      INTEGER NOT NULL DEFAULT 0,
                app_version    TEXT    NOT NULL DEFAULT '',
                user_agent     TEXT    NOT NULL DEFAULT '',
                first_seen_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                last_seen_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            SQL);

        $pdo->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS kundlis (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id      INTEGER REFERENCES clients(id) ON DELETE SET NULL,
                kundli_key     TEXT    NOT NULL DEFAULT '',
                birth_name     TEXT    NOT NULL DEFAULT '',
                date           TEXT    NOT NULL,
                time           TEXT    NOT NULL,
                timezone       REAL    NOT NULL DEFAULT 5.5,
                latitude       REAL    NOT NULL DEFAULT 0,
                longitude      REAL    NOT NULL DEFAULT 0,
                place_name     TEXT    NOT NULL DEFAULT '',
                kundli_json    TEXT    NOT NULL,
                created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            SQL);

        $pdo->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS api_keys (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                name           TEXT    NOT NULL,
                key_prefix     TEXT    NOT NULL,
                key_hash       TEXT    NOT NULL UNIQUE,
                scope          TEXT    NOT NULL DEFAULT 'read',
                created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
                is_active      INTEGER NOT NULL DEFAULT 1,
                last_used_at   TEXT,
                created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
                revoked_at     TEXT
            )
            SQL);

        $pdo->exec(
            'CREATE UNIQUE INDEX IF NOT EXISTS idx_kundli_client_key ON kundlis (client_id, kundli_key) '
            . 'WHERE kundli_key <> \'\'' 
        );
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_clients_installed ON clients (is_installed)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_kundlis_created ON kundlis (created_at)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys (is_active)');

        $pdo->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS auth_tokens (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash  TEXT    NOT NULL UNIQUE,
                created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                expires_at  TEXT    NOT NULL,
                revoked_at  TEXT
            )
            SQL);
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens (user_id)');
    }
}