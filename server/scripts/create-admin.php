<?php

declare(strict_types=1);

/**
 * Create or update an admin dashboard user.
 *
 * Usage:
 *   php scripts/create-admin.php <email> <password> [--name="Admin Name"]
 */

require_once __DIR__ . '/../app/Core/Database.php';
require_once __DIR__ . '/../app/Models/User.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Run from the command line only.\n");
    exit(1);
}

$args = array_values(array_filter($argv, fn ($a) => !str_starts_with((string) $a, '--')));
$email = (string) ($args[1] ?? '');
$password = (string) ($args[2] ?? '');

$name = '';
foreach ($argv as $arg) {
    if (str_starts_with((string) $arg, '--name=')) {
        $name = substr((string) $arg, 7);
    }
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Usage: php scripts/create-admin.php <email> <password> [--name=\"Name\"]\n");
    exit(1);
}
if (strlen($password) < 8) {
    fwrite(STDERR, "Password must be at least 8 characters.\n");
    exit(1);
}

\App\Core\Database::init();
$user = \App\Models\User::upsert($email, $password, $name);

fwrite(STDOUT, "Admin user ready: {$user['email']} (id={$user['id']})\n");
echo "Log in at http://localhost:1212/admin\n";