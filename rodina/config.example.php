<?php
// Copy to config.php (next to this file, outside public/) and fill in.
// Generate the VAPID keys once with: php bin/vapid.php
return [
    // SQLite file; keep it outside the web root. The folder must be writable by PHP.
    'db' => __DIR__ . '/data/rodina.sqlite',

    // Time zone used to compute the next time of a repeating reminder
    // ("every day at 8:00" stays at 8:00 across daylight-saving changes).
    'timezone' => 'Europe/Bratislava',

    'vapid' => [
        'subject' => 'mailto:you@example.com',
        'publicKey' => '',
        'privateKey' => '',
    ],

    // true: cron writes notifications to its output instead of sending them (for testing)
    'push_dry_run' => false,

    // How long deleted rows are kept so that every device learns about the deletion.
    'tombstone_days' => 60,
];
