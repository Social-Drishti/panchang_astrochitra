<?php

declare(strict_types=1);

date_default_timezone_set('Asia/Kolkata');

return [
    'app_name' => 'Panchang Astrochitra',
    'base_path' => dirname(__DIR__),
    'db_path' => dirname(__DIR__) . '/data/panchang.sqlite',
    'session_name' => 'panchang_admin',
    'session_lifetime' => 60 * 60 * 8,
    'timezone' => 'Asia/Kolkata',
];