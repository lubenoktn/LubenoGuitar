<?php
declare(strict_types=1);

// Notification subscriptions of this device.
//   GET                                        {publicKey} for PushManager.subscribe()
//   POST   {endpoint, keys: {p256dh, auth}}    save the subscription (from subscription.toJSON())
//   POST   {test: true}                        send a test notification to all my devices
//   DELETE {endpoint}                          forget the subscription

require dirname(__DIR__, 2) . '/lib/api.php';

$m = method('GET', 'POST', 'DELETE');
$user = require_user();
$in = input();

if ($m === 'GET') {
    respond(['publicKey' => config()['vapid']['publicKey']]);
}

if ($m === 'DELETE') {
    q('DELETE FROM push_subs WHERE endpoint = ? AND user_id = ?', [(string) ($in['endpoint'] ?? ''), $user['id']]);
    respond(['ok' => true]);
}

if (!empty($in['test'])) {
    require dirname(__DIR__, 2) . '/lib/push.php';
    $sent = push_to_users([(int) $user['id']], [
        'title' => 'Rodina',
        'body' => 'Notifikácie fungujú 👍',
        'url' => './#reminders',
        'tag' => 'test',
    ]);
    respond(['sent' => $sent]);
}

$endpoint = $in['endpoint'] ?? '';
$p256dh = $in['keys']['p256dh'] ?? '';
$auth = $in['keys']['auth'] ?? '';
if (!is_string($endpoint) || !str_starts_with($endpoint, 'https://') || strlen($endpoint) > 1000) {
    fail(400, 'Neplatný endpoint');
}
if (!is_string($p256dh) || !is_string($auth) || !preg_match('/^[A-Za-z0-9_=-]{20,200}$/', $p256dh) || !preg_match('/^[A-Za-z0-9_=-]{8,100}$/', $auth)) {
    fail(400, 'Neplatné kľúče');
}
// The same browser may have been signed in as someone else before: the endpoint moves to this user.
q(
    'INSERT INTO push_subs (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth',
    [$user['id'], $endpoint, $p256dh, $auth]
);
respond(['ok' => true]);
