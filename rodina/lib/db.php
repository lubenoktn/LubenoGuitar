<?php
declare(strict_types=1);

// Configuration and the database connection, shared by the API, cron and bin scripts.

function config(): array
{
    static $config = null;
    if ($config === null) {
        $file = getenv('RODINA_CONFIG') ?: dirname(__DIR__) . '/config.php';
        if (!is_file($file)) {
            throw new RuntimeException("Missing $file (copy config.example.php)");
        }
        $config = require $file;
        date_default_timezone_set($config['timezone'] ?? 'UTC');
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $path = config()['db'];
        $fresh = !is_file($path);
        $pdo = new PDO('sqlite:' . $path, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA busy_timeout = 5000');
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA synchronous = NORMAL');
        if ($fresh || !$pdo->query("SELECT 1 FROM sqlite_master WHERE name = 'clock'")->fetchColumn()) {
            $pdo->exec(file_get_contents(dirname(__DIR__) . '/schema.sql'));
        }
    }
    return $pdo;
}

function now_ms(): int
{
    return (int) floor(microtime(true) * 1000);
}

/**
 * Runs $fn in a write transaction and passes it a fresh timestamp for updated_at.
 *
 * The timestamp is taken while holding SQLite's write lock and is always larger
 * than any earlier one, so a sync that has seen rows up to clock.last can never
 * miss a row committed later.
 */
function write_tx(callable $fn): mixed
{
    $pdo = db();
    $pdo->exec('BEGIN IMMEDIATE');
    try {
        $last = (int) $pdo->query('SELECT last FROM clock WHERE id = 1')->fetchColumn();
        $ts = max(now_ms(), $last + 1);
        $pdo->prepare('UPDATE clock SET last = ? WHERE id = 1')->execute([$ts]);
        $result = $fn($pdo, $ts);
        $pdo->exec('COMMIT');
        return $result;
    } catch (Throwable $e) {
        $pdo->exec('ROLLBACK');
        throw $e;
    }
}

function q(string $sql, array $params = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}
