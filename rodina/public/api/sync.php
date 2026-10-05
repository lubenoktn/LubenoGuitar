<?php
declare(strict_types=1);

// GET sync.php?since=<cursor>
// Everything in the family that changed after `since`, including deleted rows
// (deleted = 1), plus the family and its members. Keep the returned `cursor` and
// send it next time. With since=0, or a cursor older than the purged tombstones,
// the answer is a full copy (`full: true`) and the client replaces what it has.

require dirname(__DIR__, 2) . '/lib/api.php';

method('GET');
$user = require_user();
$family = (int) $user['family_id'];
$since = max(0, (int) ($_GET['since'] ?? 0));

$pdo = db();
// One read transaction: every query sees the same snapshot, and clock.last is
// the newest timestamp in that snapshot, so nothing committed later is skipped.
$pdo->exec('BEGIN');
$clock = $pdo->query('SELECT last, purged_before FROM clock WHERE id = 1')->fetch();
$full = $since === 0 || $since < (int) $clock['purged_before'];
$filter = $full ? 'deleted = 0' : 'updated_at > ?';
$params = $full ? [$family] : [$family, $since];

$out = [
    'cursor' => (int) $clock['last'],
    'full' => $full,
    'user' => ['id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email']],
    'family' => q('SELECT id, name, invite_code FROM families WHERE id = ?', [$family])->fetch(),
    'members' => q('SELECT id, name FROM users WHERE family_id = ? ORDER BY name', [$family])->fetchAll(),
    'lists' => q("SELECT id, name, sort, updated_at, deleted FROM lists WHERE family_id = ? AND $filter", $params)->fetchAll(),
    'items' => q(
        "SELECT id, list_id, text, qty, done, added_by, created_at, updated_at, deleted FROM items
         WHERE family_id = ? AND $filter",
        $params
    )->fetchAll(),
    'reminders' => q(
        "SELECT id, text, due_at, repeat, for_user, created_by, done, sent, updated_at, deleted FROM reminders
         WHERE family_id = ? AND $filter",
        $params
    )->fetchAll(),
];
$pdo->exec('COMMIT');
respond($out);
