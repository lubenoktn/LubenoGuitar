<?php
declare(strict_types=1);

// Prints a new VAPID key pair for config.php. Run once; changing the keys later
// means every device has to turn notifications on again.

require dirname(__DIR__) . '/vendor/autoload.php';

$keys = Minishlink\WebPush\VAPID::createVapidKeys();
echo "'publicKey' => '{$keys['publicKey']}',\n";
echo "'privateKey' => '{$keys['privateKey']}',\n";
