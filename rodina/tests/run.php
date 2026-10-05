<?php
declare(strict_types=1);

// End-to-end tests: starts PHP's built-in server on public/ with a throwaway
// database, talks to the API like the app does, and runs cron in dry-run mode.
//   php tests/run.php

$root = dirname(__DIR__);
$tmp = sys_get_temp_dir() . '/rodina-test-' . bin2hex(random_bytes(4));
mkdir($tmp);
$configFile = "$tmp/config.php";
$writeConfig = function (int $tombstoneDays) use ($configFile, $tmp) {
    file_put_contents($configFile, '<?php return ' . var_export([
        'db' => "$tmp/test.sqlite",
        'timezone' => 'Europe/Bratislava',
        'vapid' => ['subject' => 'mailto:test@example.com', 'publicKey' => 'test-public-key', 'privateKey' => ''],
        'push_dry_run' => true,
        'tombstone_days' => $tombstoneDays,
    ], true) . ';');
};
$writeConfig(60);
putenv("RODINA_CONFIG=$configFile");

$port = 18000 + random_int(0, 999);
$server = proc_open(
    [PHP_BINARY, '-S', "127.0.0.1:$port", '-t', "$root/public"],
    [1 => ['file', "$tmp/server.log", 'a'], 2 => ['file', "$tmp/server.log", 'a']],
    $pipes,
    null,
    ['RODINA_CONFIG' => $configFile] + getenv()
);
register_shutdown_function(function () use ($server, $tmp) {
    proc_terminate($server);
    proc_close($server);
    array_map('unlink', glob("$tmp/*"));
    rmdir($tmp);
});
for ($i = 0; $i < 50 && !@fsockopen('127.0.0.1', $port); $i++) {
    usleep(100000);
}

$failures = 0;
$count = 0;
function check(bool $ok, string $what): void
{
    global $failures, $count;
    $count++;
    if (!$ok) {
        $failures++;
        echo "FAIL: $what\n";
    }
}

function call(string $method, string $path, ?array $body = null, ?string $token = null): array
{
    global $port;
    $ch = curl_init("http://127.0.0.1:$port/api/$path");
    $headers = ['Accept: application/json'];
    if ($token) {
        $headers[] = "Authorization: Bearer $token";
    }
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_PROXY => '',
        CURLOPT_NOPROXY => '*',
    ]);
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    return [$status, json_decode((string) $raw, true) ?? ['raw' => $raw]];
}

function cron(): string
{
    global $root;
    return (string) shell_exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg("$root/cron/reminders.php") . ' 2>&1');
}

function ids(array $rows): array
{
    $ids = array_column($rows, 'id');
    sort($ids);
    return $ids;
}

// --- accounts -----------------------------------------------------------------

[$s, $a] = call('POST', 'auth.php?action=register', ['name' => 'Peter', 'email' => 'Peter@Example.com', 'password' => 'tajne-heslo', 'family_name' => 'Novákovci']);
check($s === 201 && strlen($a['token'] ?? '') === 64, 'register creates a family and returns a token');
$tokA = $a['token'];
$code = $a['family']['invite_code'];
check((bool) preg_match('/^[A-Z2-9]{8}$/', $code), 'invite code format');

[$s] = call('POST', 'auth.php?action=register', ['name' => 'X', 'email' => 'peter@example.com', 'password' => 'tajne-heslo', 'family_name' => 'Y']);
check($s === 409, 'duplicate e-mail is refused (case-insensitive)');
[$s] = call('POST', 'auth.php?action=register', ['name' => 'X', 'email' => 'x@example.com', 'password' => 'short', 'family_name' => 'Y']);
check($s === 400, 'short password is refused');
[$s] = call('POST', 'auth.php?action=register', ['name' => 'X', 'email' => 'x@example.com', 'password' => 'tajne-heslo', 'invite_code' => 'NOPE1234']);
check($s === 404, 'unknown invite code is refused');
[$s] = call('GET', 'auth.php?action=me', null, 'nope');
check($s === 401, 'garbage token is refused');

[$s, $b] = call('POST', 'auth.php?action=register', ['name' => 'Jana', 'email' => 'jana@example.com', 'password' => 'ine-heslo-123', 'invite_code' => strtolower(substr($code, 0, 4) . '-' . substr($code, 4))]);
check($s === 201 && $b['family']['id'] === $a['family']['id'], 'second member joins with the invite code (any case, with dash)');
check(count($b['members']) === 2, 'members listed');
$tokB = $b['token'];
$janaId = $b['user']['id'];

[$s, $c] = call('POST', 'auth.php?action=register', ['name' => 'Cudzí', 'email' => 'c@example.com', 'password' => 'heslo-cudzie', 'family_name' => 'Iní']);
$tokC = $c['token'];

[$s] = call('POST', 'auth.php?action=login', ['email' => 'jana@example.com', 'password' => 'zle']);
check($s === 401, 'wrong password is refused');
[$s, $login] = call('POST', 'auth.php?action=login', ['email' => 'JANA@example.com', 'password' => 'ine-heslo-123']);
check($s === 200 && $login['token'] !== $tokB, 'login gives a new device token');
$tokB2 = $login['token'];

// --- lists and items ------------------------------------------------------------

[$s, $init] = call('GET', 'sync.php?since=0', null, $tokB);
check($s === 200 && $init['full'] === true && $init['lists'] === [], 'first sync is full and empty');
$cursorB = $init['cursor'];

[$s] = call('POST', 'lists.php', ['id' => 'list-0001', 'name' => 'Potraviny'], $tokA);
check($s === 200, 'create list');
[$s, $r] = call('POST', 'items.php', ['id' => 'item-0001', 'list_id' => 'list-0001', 'text' => '  mlieko  ', 'qty' => '2'], $tokA);
check($s === 200 && $r['item']['text'] === 'mlieko' && $r['item']['added_by'] === $a['user']['id'], 'create item (trimmed, added_by set)');
call('POST', 'items.php', ['id' => 'item-0002', 'list_id' => 'list-0001', 'text' => 'chlieb'], $tokA);

[$s, $d] = call('GET', "sync.php?since=$cursorB", null, $tokB);
check($d['full'] === false && ids($d['lists']) === ['list-0001'] && ids($d['items']) === ['item-0001', 'item-0002'], 'other member gets the new list and items');
$cursorB = $d['cursor'];

[$s, $d] = call('GET', "sync.php?since=$cursorB", null, $tokB);
check($d['lists'] === [] && $d['items'] === [], 'nothing new -> empty sync');

[$s, $r] = call('POST', 'items.php', ['id' => 'item-0001', 'done' => true], $tokB);
check($s === 200 && $r['item']['done'] === 1 && $r['item']['text'] === 'mlieko', 'tick off changes only done');
[$s, $d] = call('GET', "sync.php?since=$cursorB", null, $tokA);
check(ids($d['items']) === ['item-0001'] && $d['items'][0]['done'] === 1, 'tick seen by the other');

[$s] = call('POST', 'items.php', ['id' => 'item-0003', 'text' => 'bez zoznamu'], $tokA);
check($s === 400, 'new item needs a list');
[$s] = call('POST', 'items.php', ['id' => 'item-0001', 'text' => ''], $tokA);
check($s === 400, 'empty text refused');
[$s] = call('POST', 'items.php', ['id' => 'bad id!', 'text' => 'x', 'list_id' => 'list-0001'], $tokA);
check($s === 400, 'invalid id refused');
[$s] = call('POST', 'items.php', ['id' => 'item-0009', 'text' => 'x', 'list_id' => 'list-0001']);
check($s === 401, 'no token -> 401');
[$s] = call('GET', 'items.php', null, $tokA);
check($s === 405, 'GET on items -> 405');

// another family can neither see nor touch it
[$s, $d] = call('GET', 'sync.php?since=0', null, $tokC);
check($d['lists'] === [] && $d['items'] === [], 'other family sees nothing');
[$s] = call('POST', 'items.php', ['id' => 'item-0001', 'done' => false], $tokC);
check($s === 404, 'other family cannot change an item');
[$s] = call('POST', 'items.php', ['id' => 'item-0100', 'list_id' => 'list-0001', 'text' => 'votrelec'], $tokC);
check($s === 404, 'other family cannot add to a list');
[$s] = call('POST', 'lists.php', ['id' => 'list-0001', 'deleted' => true], $tokC);
check($s === 404, 'other family cannot delete a list');

// deleting
[$s, $d0] = call('GET', 'sync.php?since=0', null, $tokA);
$cursorA = $d0['cursor'];
call('POST', 'items.php', ['id' => 'item-0002', 'deleted' => true], $tokB);
[$s, $d] = call('GET', "sync.php?since=$cursorA", null, $tokA);
check(ids($d['items']) === ['item-0002'] && $d['items'][0]['deleted'] === 1, 'deletion arrives as a tombstone');
[$s, $d] = call('GET', 'sync.php?since=0', null, $tokA);
check(ids($d['items']) === ['item-0001'], 'full sync leaves deleted rows out');
[$s, $r] = call('POST', 'items.php', ['id' => 'never-seen-1', 'deleted' => true], $tokA);
check($s === 200, 'deleting an unknown id is harmless');

call('POST', 'lists.php', ['id' => 'list-0002', 'name' => 'Drogéria'], $tokA);
call('POST', 'items.php', ['id' => 'item-0010', 'list_id' => 'list-0002', 'text' => 'mydlo'], $tokA);
[$s, $d0] = call('GET', 'sync.php?since=0', null, $tokB);
call('POST', 'lists.php', ['id' => 'list-0002', 'deleted' => true], $tokA);
[$s, $d] = call('GET', "sync.php?since={$d0['cursor']}", null, $tokB);
check(ids($d['lists']) === ['list-0002'] && ids($d['items']) === ['item-0010'] && $d['items'][0]['deleted'] === 1, 'deleting a list deletes its items');
[$s] = call('POST', 'items.php', ['id' => 'item-0011', 'list_id' => 'list-0002', 'text' => 'neskoro'], $tokB);
check($s === 404, 'cannot add to a deleted list');

// --- reminders and push -----------------------------------------------------------

[$s, $pk] = call('GET', 'push.php', null, $tokA);
check($pk['publicKey'] === 'test-public-key', 'push public key');
$sub = fn($n) => ['endpoint' => "https://push.example.com/$n", 'keys' => ['p256dh' => str_repeat('B', 87), 'auth' => str_repeat('a', 22)]];
check(call('POST', 'push.php', $sub('peter'), $tokA)[0] === 200, 'save subscription');
call('POST', 'push.php', $sub('jana-phone'), $tokB);
call('POST', 'push.php', $sub('jana-laptop'), $tokB2);
call('POST', 'push.php', $sub('cudzi'), $tokC);
[$s] = call('POST', 'push.php', ['endpoint' => 'http://insecure', 'keys' => ['p256dh' => 'x', 'auth' => 'y']], $tokA);
check($s === 400, 'bad subscription refused');

$past = (int) (microtime(true) * 1000) - 60000;
$future = $past + 86400000 * 3;
[$s] = call('POST', 'reminders.php', ['id' => 'rem-once-1', 'text' => 'Zaplatiť škôlku', 'due_at' => $past, 'for_user' => null], $tokA);
check($s === 200, 'create reminder');
call('POST', 'reminders.php', ['id' => 'rem-jana-1', 'text' => 'Vyzdvihnúť balík', 'due_at' => $past, 'for_user' => $janaId], $tokA);
call('POST', 'reminders.php', ['id' => 'rem-daily-1', 'text' => 'Lieky', 'due_at' => $past, 'repeat' => 'daily'], $tokA);
call('POST', 'reminders.php', ['id' => 'rem-later-1', 'text' => 'Neskôr', 'due_at' => $future], $tokA);
call('POST', 'reminders.php', ['id' => 'rem-done-1', 'text' => 'Už vybavené', 'due_at' => $past, 'done' => true], $tokA);
[$s] = call('POST', 'reminders.php', ['id' => 'rem-bad-1', 'text' => 'x', 'due_at' => $past, 'for_user' => $c['user']['id']], $tokA);
check($s === 400, 'reminder for someone outside the family refused');
[$s] = call('POST', 'reminders.php', ['id' => 'rem-bad-2', 'text' => 'x', 'due_at' => $past, 'repeat' => 'hourly'], $tokA);
check($s === 400, 'unknown repeat refused');

$out = cron();
$lines = fn(string $needle) => substr_count($out, $needle);
check($lines('Zaplatiť škôlku') === 3, 'reminder for everyone goes to all 3 family devices: ' . $out);
check($lines('Vyzdvihnúť balík') === 2 && !preg_match('#/peter: .*Vyzdvihnúť#', $out), 'reminder for Jana goes only to her 2 devices');
check($lines('Lieky') === 3, 'daily reminder sent');
check(!str_contains($out, 'Neskôr') && !str_contains($out, 'Už vybavené') && !str_contains($out, 'cudzi'), 'future, done and other-family reminders not sent');

[$s, $d] = call('GET', 'sync.php?since=0', null, $tokA);
$rem = array_column($d['reminders'], null, 'id');
check($rem['rem-once-1']['sent'] === 1, 'one-time reminder marked sent');
check($rem['rem-daily-1']['sent'] === 0 && $rem['rem-daily-1']['due_at'] === $past + 86400000, 'daily reminder moved to tomorrow');
check(cron() === '', 'second cron run sends nothing');

[$s, $r] = call('POST', 'reminders.php', ['id' => 'rem-once-1', 'due_at' => $past + 1000], $tokA);
check($r['reminder']['sent'] === 0, 'changing the time re-arms a reminder');

[$s, $r] = call('POST', 'push.php', ['test' => true], $tokB);
check($r['sent'] === 2, 'test notification goes to all my devices');

// --- repeat arithmetic -----------------------------------------------------------

require "$root/lib/db.php";
require "$root/lib/repeat.php";
config();
$ms = fn(string $local) => (new DateTimeImmutable($local, new DateTimeZone('Europe/Bratislava')))->getTimestamp() * 1000;
$fmt = fn(int $ms) => (new DateTimeImmutable('@' . intdiv($ms, 1000)))->setTimezone(new DateTimeZone('Europe/Bratislava'))->format('Y-m-d H:i');
check($fmt(next_due($ms('2026-10-24 08:00'), 'daily', $ms('2026-10-24 09:00'))) === '2026-10-25 08:00', 'daily keeps 8:00 across the DST change');
check($fmt(next_due($ms('2026-01-31 08:00'), 'monthly', $ms('2026-02-01 00:00'))) === '2026-02-28 08:00', 'monthly 31 Jan -> 28 Feb');
check($fmt(next_due($ms('2026-01-31 08:00'), 'monthly', $ms('2026-03-01 00:00'))) === '2026-03-31 08:00', 'monthly keeps the 31st after February');
check($fmt(next_due($ms('2026-10-05 08:00'), 'weekly', $ms('2026-10-30 00:00'))) === '2026-11-02 08:00', 'weekly skips missed weeks');
check($fmt(next_due($ms('2024-02-29 08:00'), 'yearly', $ms('2024-03-01 00:00'))) === '2025-02-28 08:00', 'yearly from 29 Feb');

// --- purge and full resync, family change, logout -----------------------------------

[$s, $d] = call('GET', 'sync.php?since=0', null, $tokB);
$oldCursor = $d['cursor'];
usleep(5000);
$writeConfig(0);
cron();
[$s, $d] = call('GET', "sync.php?since=$oldCursor", null, $tokB);
check($d['full'] === true, 'cursor older than the purge -> full sync');
$pdo = new PDO("sqlite:$tmp/test.sqlite");
check((int) $pdo->query('SELECT COUNT(*) FROM items WHERE deleted = 1')->fetchColumn() === 0, 'tombstones purged');
$writeConfig(60);

[$s, $j] = call('POST', 'auth.php?action=join', ['invite_code' => $c['family']['invite_code']], $tokB2);
check($j['family']['id'] === $c['family']['id'], 'join moves the user to another family');
[$s, $d] = call('GET', 'sync.php?since=0', null, $tokB);
check($d['lists'] === [] && $d['family']['id'] === $c['family']['id'], 'after moving, the old family data is out of reach');

call('POST', 'auth.php?action=logout', null, $tokA);
[$s] = call('GET', 'sync.php?since=0', null, $tokA);
check($s === 401, 'logout ends the token');

$log = file_get_contents("$tmp/server.log");
check(!str_contains($log, 'PHP Warning') && !str_contains($log, 'PHP Fatal') && !str_contains($log, 'rodina:'), "server log clean:\n$log");

echo $failures ? "\n$failures of $count checks failed\n" : "All $count checks passed\n";
exit($failures ? 1 : 0);
