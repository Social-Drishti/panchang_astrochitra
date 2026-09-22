<?php

declare(strict_types=1);

namespace App\Core;

final class Router
{
    /** @var array<string, array<string, array{r:callable|array{0:class-string,1:string}, m?:string}>> */
    private array $routes = [];

    public function add(string $method, string $path, callable|array $handler, array $options = []): void
    {
        $this->routes[strtoupper($method)][$path] = ['r' => $handler, 'm' => $options['middleware'] ?? null];
    }

    public function get(string $path, callable|array $handler, array $options = []): void
    {
        $this->add('GET', $path, $handler, $options);
    }

    public function post(string $path, callable|array $handler, array $options = []): void
    {
        $this->add('POST', $path, $handler, $options);
    }

    public function dispatch(string $method, string $path): mixed
    {
        $method = strtoupper($method);
        $path = parse_url($path, PHP_URL_PATH) ?: '/';

        if (!isset($this->routes[$method][$path])) {
            $this->notFound($path);
            return null;
        }

        $route = $this->routes[$method][$path];

        if (($route['m'] ?? null) === 'auth') {
            $middleware = new \App\Middleware\AuthMiddleware();
            $passed = $middleware->handle($path);
            if (!$passed) {
                return null;
            }
        } elseif (($route['m'] ?? null) === 'api_key') {
            $middleware = new \App\Middleware\ApiKeyMiddleware();
            $passed = $middleware->handle();
            if (!$passed) {
                return null;
            }
        } elseif (($route['m'] ?? null) === 'app_auth') {
            $middleware = new \App\Middleware\AppAuthMiddleware();
            $passed = $middleware->handle();
            if (!$passed) {
                return null;
            }
        }

        $handler = $route['r'];
        if (is_array($handler)) {
            [$class, $action] = $handler;
            $controller = new $class();
            return $controller->$action();
        }

        return $handler();
    }

    private function notFound(string $path): never
    {
        if (str_starts_with($path, '/api/')) {
            Response::json(['error' => 'Not found'], 404);
        }
        http_response_code(404);
        echo '404 Not Found';
        exit;
    }
}