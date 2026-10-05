<?php
declare(strict_types=1);

// POST {id, name?, sort?, deleted?}
// Creates the list if the id is new, otherwise changes only the fields sent.
// Deleting a list deletes its items too.

require dirname(__DIR__, 2) . '/lib/api.php';

method('POST');
$user = require_user();
$in = input();
$id = id_field($in);

$changes = array_filter(
    [
        'name' => text_field($in, 'name', 60, false),
        'sort' => int_field($in, 'sort'),
        'deleted' => bool_field($in, 'deleted'),
    ],
    fn($v) => $v !== null
);
if (($changes['name'] ?? null) === '') {
    fail(400, 'Zoznam potrebuje názov');
}

$row = save_row(
    'lists',
    $id,
    (int) $user['family_id'],
    $changes,
    function ($c) {
        if (!isset($c['name'])) {
            fail(400, 'Zoznam potrebuje názov');
        }
        return [];
    },
    function (PDO $pdo, int $ts) use ($changes, $id) {
        if (!empty($changes['deleted'])) {
            q('UPDATE items SET deleted = 1, updated_at = ? WHERE list_id = ? AND deleted = 0', [$ts, $id]);
        }
    }
);

respond(['list' => $row]);
