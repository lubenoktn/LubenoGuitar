<?php
declare(strict_types=1);

// POST {id, text?, due_at?, repeat?, for_user?, done?, deleted?}
// due_at is in milliseconds (UTC); for_user null means everyone in the family.
// Changing the time or the repeat arms the reminder again.

require dirname(__DIR__, 2) . '/lib/api.php';

const REPEATS = ['', 'daily', 'weekly', 'monthly', 'yearly'];

method('POST');
$user = require_user();
$family = (int) $user['family_id'];
$in = input();
$id = id_field($in);

$changes = array_filter(
    [
        'text' => text_field($in, 'text', 200, false),
        'due_at' => int_field($in, 'due_at'),
        'done' => bool_field($in, 'done'),
        'deleted' => bool_field($in, 'deleted'),
    ],
    fn($v) => $v !== null
);
if (($changes['text'] ?? null) === '') {
    fail(400, 'Pripomienka potrebuje text');
}
if (array_key_exists('repeat', $in)) {
    if (!in_array($in['repeat'], REPEATS, true)) {
        fail(400, 'Neplatné opakovanie');
    }
    $changes['repeat'] = $in['repeat'];
}
if (array_key_exists('for_user', $in)) {
    $forUser = int_field($in, 'for_user');
    if ($forUser !== null && !q('SELECT 1 FROM users WHERE id = ? AND family_id = ?', [$forUser, $family])->fetchColumn()) {
        fail(400, 'Taký člen rodiny neexistuje');
    }
    $changes['for_user'] = $forUser;
}
if (isset($changes['due_at']) || isset($changes['repeat'])) {
    $changes['sent'] = 0;
}

$row = save_row('reminders', $id, $family, $changes, function ($c) use ($user) {
    if (!isset($c['text'], $c['due_at'])) {
        fail(400, 'Pripomienka potrebuje text a čas');
    }
    return ['created_by' => (int) $user['id']];
});

respond(['reminder' => $row]);
