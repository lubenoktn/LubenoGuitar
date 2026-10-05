<?php
declare(strict_types=1);

// Accounts and families.
//   POST ?action=register  {name, email, password, family_name | invite_code}
//   POST ?action=login     {email, password}
//   POST ?action=logout
//   GET  ?action=me
//   POST ?action=join      {invite_code}           move to another family
//   POST ?action=profile   {name}
//   POST ?action=family    {name?, new_code?}      rename the family, issue a new invite code
// register and login answer with {token, user, family, members}; send the token as
// "Authorization: Bearer <token>" with every other request.

require dirname(__DIR__, 2) . '/lib/api.php';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function invite_code(): string
{
    do {
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= INVITE_ALPHABET[random_int(0, strlen(INVITE_ALPHABET) - 1)];
        }
    } while (q('SELECT 1 FROM families WHERE invite_code = ?', [$code])->fetchColumn());
    return $code;
}

function family_by_code(array $in): array
{
    $code = strtoupper(preg_replace('/[\s-]/', '', (string) ($in['invite_code'] ?? '')));
    $family = $code === '' ? false : q('SELECT * FROM families WHERE invite_code = ?', [$code])->fetch();
    if (!$family) {
        fail(404, 'Neplatný kód pozvánky');
    }
    return $family;
}

function me(int $userId): array
{
    $user = q('SELECT id, family_id, name, email FROM users WHERE id = ?', [$userId])->fetch();
    return [
        'user' => $user,
        'family' => q('SELECT id, name, invite_code FROM families WHERE id = ?', [$user['family_id']])->fetch(),
        'members' => q('SELECT id, name FROM users WHERE family_id = ? ORDER BY name', [$user['family_id']])->fetchAll(),
    ];
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        method('POST');
        $in = input();
        $name = text_field($in, 'name', 60);
        $email = strtolower(text_field($in, 'email', 120));
        $password = (string) ($in['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            fail(400, 'Neplatný e-mail');
        }
        if (strlen($password) < 8) {
            fail(400, 'Heslo musí mať aspoň 8 znakov');
        }
        if (q('SELECT 1 FROM users WHERE email = ?', [$email])->fetchColumn()) {
            fail(409, 'Tento e-mail už je zaregistrovaný');
        }
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $userId = write_tx(function (PDO $pdo) use ($in, $name, $email, $hash) {
            if (!empty($in['invite_code'])) {
                $familyId = (int) family_by_code($in)['id'];
            } else {
                $familyName = text_field($in, 'family_name', 60);
                q('INSERT INTO families (name, invite_code) VALUES (?, ?)', [$familyName, invite_code()]);
                $familyId = (int) $pdo->lastInsertId();
            }
            q('INSERT INTO users (family_id, name, email, password_hash) VALUES (?, ?, ?, ?)', [
                $familyId,
                $name,
                $email,
                $hash,
            ]);
            return (int) $pdo->lastInsertId();
        });
        respond(['token' => new_token($userId)] + me($userId), 201);

    case 'login':
        method('POST');
        $in = input();
        $user = q('SELECT id, password_hash FROM users WHERE email = ?', [strtolower(trim((string) ($in['email'] ?? '')))])->fetch();
        if (!$user || !password_verify((string) ($in['password'] ?? ''), $user['password_hash'])) {
            usleep(500000); // slows down password guessing
            fail(401, 'Nesprávny e-mail alebo heslo');
        }
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($in['password'], PASSWORD_DEFAULT), $user['id']]);
        }
        respond(['token' => new_token((int) $user['id'])] + me((int) $user['id']));

    case 'logout':
        method('POST');
        require_user();
        q('DELETE FROM tokens WHERE token = ?', [hash('sha256', bearer_token())]);
        respond(['ok' => true]);

    case 'me':
        method('GET');
        respond(me((int) require_user()['id']));

    case 'join':
        method('POST');
        $user = require_user();
        $family = family_by_code(input());
        q('UPDATE users SET family_id = ? WHERE id = ?', [$family['id'], $user['id']]);
        respond(me((int) $user['id']));

    case 'profile':
        method('POST');
        $user = require_user();
        q('UPDATE users SET name = ? WHERE id = ?', [text_field(input(), 'name', 60), $user['id']]);
        respond(me((int) $user['id']));

    case 'family':
        method('POST');
        $user = require_user();
        $in = input();
        if (($name = text_field($in, 'name', 60, false)) !== null) {
            q('UPDATE families SET name = ? WHERE id = ?', [$name, $user['family_id']]);
        }
        if (!empty($in['new_code'])) {
            q('UPDATE families SET invite_code = ? WHERE id = ?', [invite_code(), $user['family_id']]);
        }
        respond(me((int) $user['id']));

    default:
        fail(404, 'Neznáma akcia');
}
