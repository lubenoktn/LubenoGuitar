<?php
declare(strict_types=1);

// POST {id, list_id?, text?, qty?, done?, deleted?}
// Creates the item if the id is new (list_id and text required), otherwise
// changes only the fields sent, so two people editing different fields don't clash.

require dirname(__DIR__, 2) . '/lib/api.php';

method('POST');
$user = require_user();
$family = (int) $user['family_id'];
$in = input();
$id = id_field($in);

$changes = array_filter(
    [
        'text' => text_field($in, 'text', 200, false),
        'qty' => text_field($in, 'qty', 30, false),
        'done' => bool_field($in, 'done'),
        'deleted' => bool_field($in, 'deleted'),
    ],
    fn($v) => $v !== null
);
if (($changes['text'] ?? null) === '') {
    fail(400, 'Položka potrebuje text');
}
if (isset($in['list_id'])) {
    $listId = (string) $in['list_id'];
    if (!q('SELECT 1 FROM lists WHERE id = ? AND family_id = ? AND deleted = 0', [$listId, $family])->fetchColumn()) {
        fail(404, 'Zoznam neexistuje');
    }
    $changes['list_id'] = $listId;
}

$row = save_row('items', $id, $family, $changes, function ($c) use ($user) {
    if (!isset($c['list_id'], $c['text'])) {
        fail(400, 'Položka potrebuje zoznam a text');
    }
    return ['added_by' => (int) $user['id'], 'created_at' => now_ms()];
});

respond(['item' => $row]);
