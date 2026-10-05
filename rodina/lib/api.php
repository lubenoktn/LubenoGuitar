<?php
declare(strict_types=1);

// Helpers for the files in public/api/: JSON in and out, the signed-in user, validation.

require_once __DIR__ . '/db.php';

/** An error answer for the client; thrown so that an open transaction is rolled back. */
final class HttpError extends Exception
{
}

set_exception_handler(function (Throwable $e) {
    if ($e instanceof HttpError) {
        respond(['error' => $e->getMessage()], $e->getCode());
    }
    error_log('rodina: ' . $e);
    respond(['error' => 'Chyba servera'], 500);
});

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(int $status, string $message): never
{
    throw new HttpError($message, $status);
}

function method(string ...$allowed): string
{
    $m = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($m, $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        fail(405, 'Nepovolená metóda');
    }
    return $m;
}

function input(): array
{
    static $data = null;
    if ($data === null) {
        $raw = file_get_contents('php://input');
        $data = $raw === '' ? [] : json_decode($raw, true);
        if (!is_array($data)) {
            fail(400, 'Neplatný JSON');
        }
    }
    return $data;
}

function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('apache_request_headers')) {
        $headers = array_change_key_case(apache_request_headers());
        $header = $headers['authorization'] ?? '';
    }
    if (preg_match('/^Bearer\s+([0-9a-f]{64})$/i', $header, $m)) {
        return strtolower($m[1]);
    }
    // Some hosts drop the Authorization header before it reaches PHP.
    $alt = $_SERVER['HTTP_X_TOKEN'] ?? '';
    return preg_match('/^[0-9a-f]{64}$/i', $alt) ? strtolower($alt) : null;
}

/** The signed-in user (id, family_id, name, email); responds 401 when there is none. */
function require_user(): array
{
    $token = bearer_token();
    if ($token !== null) {
        $user = q(
            'SELECT u.id, u.family_id, u.name, u.email FROM tokens t JOIN users u ON u.id = t.user_id
             WHERE t.token = ?',
            [hash('sha256', $token)]
        )->fetch();
        if ($user) {
            return $user;
        }
    }
    fail(401, 'Nie si prihlásený');
}

function new_token(int $userId): string
{
    $token = bin2hex(random_bytes(32));
    q('INSERT INTO tokens (token, user_id, created_at) VALUES (?, ?, ?)', [hash('sha256', $token), $userId, now_ms()]);
    return $token;
}

// --- validation ---------------------------------------------------------------

function text_field(array $in, string $key, int $max, bool $required = true): ?string
{
    if (!array_key_exists($key, $in)) {
        if ($required) {
            fail(400, "Chýba pole $key");
        }
        return null;
    }
    if (!is_string($in[$key]) && !is_int($in[$key]) && !is_float($in[$key])) {
        fail(400, "Pole $key musí byť text");
    }
    $value = trim(preg_replace('/\s+/u', ' ', (string) $in[$key]) ?? '');
    if ($required && $value === '') {
        fail(400, "Pole $key je prázdne");
    }
    if (mb_strlen($value) > $max) {
        fail(400, "Pole $key je príliš dlhé");
    }
    return $value;
}

function bool_field(array $in, string $key): ?int
{
    return array_key_exists($key, $in) ? ($in[$key] ? 1 : 0) : null;
}

function int_field(array $in, string $key): ?int
{
    if (!array_key_exists($key, $in) || $in[$key] === null) {
        return null;
    }
    if (!is_int($in[$key]) && !(is_string($in[$key]) && ctype_digit($in[$key]))) {
        fail(400, "Pole $key musí byť číslo");
    }
    return (int) $in[$key];
}

function id_field(array $in): string
{
    $id = $in['id'] ?? null;
    if (!is_string($id) || !preg_match('/^[A-Za-z0-9_-]{8,64}$/', $id)) {
        fail(400, 'Neplatné id');
    }
    return $id;
}

// --- shared row writes --------------------------------------------------------

/**
 * Creates or updates a row of a family-owned table (lists, items, reminders).
 * $changes holds only the fields the client sent; $create the extra fields for a new row.
 * $after($pdo, $ts) runs in the same transaction once the row is saved.
 * A row of another family is reported as missing.
 */
function save_row(string $table, string $id, int $familyId, array $changes, callable $create, ?callable $after = null): array
{
    return write_tx(function (PDO $pdo, int $ts) use ($table, $id, $familyId, $changes, $create, $after) {
        $stmt = $pdo->prepare("SELECT * FROM $table WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row && (int) $row['family_id'] !== $familyId) {
            fail(404, 'Záznam neexistuje');
        }
        if ($row) {
            $changes['updated_at'] = $ts;
            $set = implode(', ', array_map(fn($k) => "$k = ?", array_keys($changes)));
            $pdo->prepare("UPDATE $table SET $set WHERE id = ?")->execute([...array_values($changes), $id]);
        } else {
            if (!empty($changes['deleted'])) {
                // deleting something the server never saw: nothing to do
                return ['id' => $id, 'deleted' => 1, 'updated_at' => $ts];
            }
            $fields = $create($changes) + $changes + ['id' => $id, 'family_id' => $familyId, 'updated_at' => $ts];
            $cols = implode(', ', array_keys($fields));
            $marks = implode(', ', array_fill(0, count($fields), '?'));
            $pdo->prepare("INSERT INTO $table ($cols) VALUES ($marks)")->execute(array_values($fields));
        }
        if ($after) {
            $after($pdo, $ts);
        }
        $stmt->execute([$id]);
        return $stmt->fetch();
    });
}
