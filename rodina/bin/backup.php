<?php
declare(strict_types=1);

// Consistent copy of the database, safe while the app is running (WAL mode
// keeps recent writes in a side file, so a plain `cp` could miss them).
//   php bin/backup.php [target-folder]        default: data/backups, keeps 30 days
// Daily from cron:
//   15 3 * * * php /path/to/rodina/bin/backup.php

require dirname(__DIR__) . '/lib/db.php';

$dir = $argv[1] ?? dirname(config()['db']) . '/backups';
if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
    fwrite(STDERR, "Cannot create $dir\n");
    exit(1);
}
$target = "$dir/rodina-" . date('Y-m-d') . '.sqlite';
@unlink($target);
db()->exec('VACUUM INTO ' . db()->quote($target));
echo "$target\n";

foreach (glob("$dir/rodina-*.sqlite") as $old) {
    if (filemtime($old) < time() - 30 * 86400) {
        unlink($old);
    }
}
