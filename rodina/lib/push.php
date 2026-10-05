<?php
declare(strict_types=1);

// Sending Web Push notifications to every device of the given users.

require_once __DIR__ . '/db.php';
require_once dirname(__DIR__) . '/vendor/autoload.php';

use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Sends $payload (title, body, url, tag) to all subscriptions of $userIds.
 * Subscriptions the push service reports as gone are removed.
 * Returns the number of notifications delivered.
 */
function push_to_users(array $userIds, array $payload): int
{
    if (!$userIds) {
        return 0;
    }
    $marks = implode(',', array_fill(0, count($userIds), '?'));
    $subs = q("SELECT id, endpoint, p256dh, auth FROM push_subs WHERE user_id IN ($marks)", array_values($userIds))->fetchAll();
    if (!$subs) {
        return 0;
    }

    $config = config();
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!empty($config['push_dry_run'])) {
        foreach ($subs as $sub) {
            $line = "push (dry run) -> {$sub['endpoint']}: $json";
            PHP_SAPI === 'cli' ? print("$line\n") : error_log($line);
        }
        return count($subs);
    }

    $webPush = new WebPush(['VAPID' => $config['vapid']], ['TTL' => 6 * 3600, 'urgency' => 'high']);
    foreach ($subs as $sub) {
        $webPush->queueNotification(
            Subscription::create([
                'endpoint' => $sub['endpoint'],
                'publicKey' => $sub['p256dh'],
                'authToken' => $sub['auth'],
                'contentEncoding' => 'aes128gcm',
            ]),
            $json
        );
    }

    $delivered = 0;
    foreach ($webPush->flush() as $report) {
        if ($report->isSuccess()) {
            $delivered++;
        } elseif ($report->isSubscriptionExpired()) {
            q('DELETE FROM push_subs WHERE endpoint = ?', [$report->getEndpoint()]);
        } else {
            error_log('rodina push failed: ' . $report->getReason());
        }
    }
    return $delivered;
}
