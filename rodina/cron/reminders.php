<?php
declare(strict_types=1);

// Run every minute from cron:
//   * * * * * php /path/to/rodina/cron/reminders.php >> /path/to/rodina/data/cron.log 2>&1
//
// Sends every reminder whose time has come to the devices of the people it is
// for, then marks it sent (or, if it repeats, moves it to its next time).
// Also purges deleted rows old enough that every device has seen the deletion.

require dirname(__DIR__) . '/lib/db.php';
require dirname(__DIR__) . '/lib/push.php';
require dirname(__DIR__) . '/lib/repeat.php';

// one run at a time, in case a run takes longer than a minute
$lock = fopen(sys_get_temp_dir() . '/rodina-cron-' . md5(config()['db']) . '.lock', 'c');
if (!flock($lock, LOCK_EX | LOCK_NB)) {
    exit(0);
}

$now = now_ms();
$due = q('SELECT * FROM reminders WHERE sent = 0 AND deleted = 0 AND due_at <= ? ORDER BY due_at', [$now])->fetchAll();

foreach ($due as $r) {
    // Mark it first: if sending fails halfway, nobody gets the same notification twice.
    $claimed = write_tx(function (PDO $pdo, int $ts) use ($r, $now) {
        if ($r['repeat'] !== '') {
            $stmt = $pdo->prepare('UPDATE reminders SET due_at = ?, done = 0, updated_at = ? WHERE id = ? AND sent = 0 AND due_at = ?');
            $stmt->execute([next_due((int) $r['due_at'], $r['repeat'], $now), $ts, $r['id'], $r['due_at']]);
        } else {
            $stmt = $pdo->prepare('UPDATE reminders SET sent = 1, updated_at = ? WHERE id = ? AND sent = 0 AND due_at = ?');
            $stmt->execute([$ts, $r['id'], $r['due_at']]);
        }
        return $stmt->rowCount() === 1;
    });
    if (!$claimed || $r['done']) {
        continue; // changed in the meantime, or ticked off before its time
    }

    $users = $r['for_user'] !== null
        ? q('SELECT id FROM users WHERE id = ? AND family_id = ?', [$r['for_user'], $r['family_id']])->fetchAll(PDO::FETCH_COLUMN)
        : q('SELECT id FROM users WHERE family_id = ?', [$r['family_id']])->fetchAll(PDO::FETCH_COLUMN);
    $sent = push_to_users(array_map('intval', $users), [
        'title' => 'Pripomienka',
        'body' => $r['text'],
        'url' => './#reminders',
        'tag' => 'reminder-' . $r['id'],
    ]);
    echo date('Y-m-d H:i:s') . " reminder {$r['id']} -> $sent device(s)\n";
}

// tombstones
$horizon = $now - (int) (config()['tombstone_days'] ?? 60) * 86400000;
write_tx(function (PDO $pdo) use ($horizon) {
    foreach (['items', 'reminders', 'lists'] as $table) {
        $pdo->prepare("DELETE FROM $table WHERE deleted = 1 AND updated_at < ?")->execute([$horizon]);
    }
    $pdo->prepare('UPDATE clock SET purged_before = ? WHERE id = 1')->execute([$horizon]);
});
