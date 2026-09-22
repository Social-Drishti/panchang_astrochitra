<?php

declare(strict_types=1);

/**
 * Idempotent database initialisation. Safe to run on every request.
 */

require_once __DIR__ . '/../app/Core/Database.php';

\App\Core\Database::init();

fwrite(STDOUT, "Database ready: " . (require __DIR__ . '/../config/config.php')['db_path'] . PHP_EOL);