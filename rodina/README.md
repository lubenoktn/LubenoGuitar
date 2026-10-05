# Rodina

Spoločné nákupné zoznamy a pripomienky pre rodinu. Aplikácia (PWA) sa inštaluje na plochu telefónu a funguje aj bez signálu. Na serveri beží PHP API so SQLite a cron, ktorý posiela pripomienky ako Web Push notifikácie.

```
telefón (PWA) ──HTTPS──> public/api/*.php ──> data/rodina.sqlite <── cron/reminders.php
   ▲  IndexedDB + fronta zmien                                        │
   └──────────────────────── Web Push ────────────────────────────────┘
```

## Štruktúra

| Cesta | Čo obsahuje |
| --- | --- |
| `public/` | **jediný priečinok, ktorý má byť na webe** (document root) |
| `public/index.html`, `app.js`, `style.css` | aplikácia: Nákup, Pripomienky, Nastavenia; bez build kroku |
| `public/sw.js`, `manifest.webmanifest`, ikony | inštalácia na plochu, offline kópia aplikácie, zobrazenie notifikácií |
| `public/api/auth.php` | registrácia, prihlásenie, odhlásenie, pripojenie k rodine cez kód pozvánky |
| `public/api/sync.php` | `?since=…`: všetko, čo sa v rodine zmenilo od daného času; jediné volanie pri pollingu |
| `public/api/lists.php`, `items.php`, `reminders.php` | pridať, upraviť, odškrtnúť, zmazať |
| `public/api/push.php` | uloží alebo zruší odber notifikácií zariadenia, skúšobná notifikácia |
| `lib/` | pripojenie k databáze, pomocné funkcie API, odosielanie push, výpočet opakovania |
| `cron/reminders.php` | každú minútu: odošle splatné pripomienky, upratuje zmazané záznamy |
| `bin/vapid.php`, `bin/backup.php` | vygenerovanie kľúčov pre notifikácie, záloha databázy |
| `schema.sql` | databáza (vytvorí sa sama pri prvej požiadavke) |
| `tests/run.php` | testy celého API a cronu proti dočasnej databáze |

## Inštalácia na server

Potrebné: PHP 8.1+ s `pdo_sqlite`, `curl`, `mbstring`, `openssl` (odporúčané aj `gmp`, šifrovanie notifikácií je s ním rýchlejšie), Composer, HTTPS (Let's Encrypt). Service worker aj notifikácie fungujú iba cez HTTPS.

```bash
cd /var/www/rodina                 # celý priečinok rodina/
composer install --no-dev
cp config.example.php config.php
php bin/vapid.php                  # vložiť oba kľúče do config.php, nastaviť 'subject' na svoj e-mail
mkdir -p data && chown www-data data   # databáza; PHP do nej musí vedieť zapisovať
```

**Web server** musí mať ako document root `rodina/public`, nie `rodina/` – databáza, `config.php` aj kód tak ostanú mimo webu. Nginx:

```nginx
server {
    server_name rodina.example.sk;
    root /var/www/rodina/public;
    index index.html;
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_AUTHORIZATION $http_authorization;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
    location = /sw.js { add_header Cache-Control "no-cache"; }
    # listen 443 ssl; ... (certbot --nginx doplní)
}
```

Pri Apache stačí nasmerovať `DocumentRoot` na `public/`; súbory `.htaccess` sa postarajú o hlavičku `Authorization` a pre istotu zakážu prístup ku všetkému mimo `public/`. Aplikácia môže bežať aj v podpriečinku (všetky cesty sú relatívne).

**Cron** (`crontab -e` pod používateľom, ktorý môže zapisovať do `data/`):

```
* * * * *  php /var/www/rodina/cron/reminders.php >> /var/www/rodina/data/cron.log 2>&1
15 3 * * * php /var/www/rodina/bin/backup.php
```

**Záloha:** `bin/backup.php` uloží konzistentnú kópiu do `data/backups/rodina-RRRR-MM-DD.sqlite` (cez `VACUUM INTO`) a zmaže zálohy staršie ako 30 dní. Obyčajné `cp` súboru by v režime WAL mohlo vynechať posledné zápisy, ktoré ešte ležia v `rodina.sqlite-wal`. Obnova: zastaviť web, nakopírovať zálohu na miesto `data/rodina.sqlite`, zmazať `-wal` a `-shm`.

## Použitie

1. Prvý člen si v appke vytvorí účet a rodinu.
2. V Nastaveniach je kód pozvánky a tlačidlo *Poslať pozvánku*; odkaz otvorí registráciu s vyplneným kódom.
3. Každý si v Nastaveniach na svojom zariadení zapne notifikácie (a môže poslať skúšobnú).

Na **iPhone** notifikácie fungujú len v appke pridanej na plochu (Safari → Zdieľať → Pridať na plochu, iOS 16.4+), nie v otvorenom Safari.

V zozname ťuknutie na položku ju odškrtne (presunie do „V košíku“), ✎ ju upraví a prázdny text ju zmaže. „Vymazať“ odstráni všetko odškrtnuté. Pripomienku upravíte ťuknutím.

## Ako funguje synchronizácia

- Každá zmena sa v telefóne prejaví hneď, uloží sa do IndexedDB a zaradí do fronty. Kým je appka otvorená, každé 4 sekundy odošle frontu a zavolá `sync.php?since=<cursor>`. Keď je appka na pozadí, nepolluje.
- Bez signálu appka ukazuje posledný uložený stav, zmeny čakajú vo fronte (v hlavičke `↑ n`) a odídu po pripojení. Server prepisuje iba polia, ktoré klient poslal, takže keď jeden odškrtne a druhý premenuje tú istú položku, platí oboje; pri zmene toho istého poľa vyhráva neskoršia.
- Id záznamov (UUID) vytvára klient, aby sa dal záznam offline pridať a hneď aj upraviť.
- `updated_at` neberie čas priamo z hodín, ale z riadku `clock` pod zámkom zápisu: každá hodnota je väčšia než všetky predchádzajúce. `sync.php` číta v jednej transakcii a ako cursor vráti najnovšiu hodnotu, ktorú videl, takže sa nestane, že by zápis, ktorý sa dokončil o chvíľu neskôr, s menším časom „prekĺzol“.
- Zmazanie je záznam s `deleted = 1`, aby sa o ňom dozvedeli všetci. Cron takéto záznamy po 60 dňoch (`tombstone_days`) vymaže; zariadenie, ktoré bolo offline dlhšie, dostane pri ďalšom syncu celý stav nanovo (`full: true`).
- API vždy filtruje podľa `family_id` prihláseného používateľa; cudzí záznam sa tvári ako neexistujúci (404).

**Pripomienky:** cron vyberie `due_at <= teraz AND sent = 0`, najprv záznam označí (aby pri chybe nikto nedostal notifikáciu dvakrát), potom pošle push na všetky zariadenia adresátov. Jednorazová dostane `sent = 1`, opakovaná sa posunie na najbližší ďalší termín v miestnom čase (8:00 ostane 8:00 aj po zmene času; mesačná 31. 1. → 28. 2. → 31. 3.). Odškrtnutá pripomienka sa neodošle. Zmena času pripomienku znova „natiahne“. Odbery, ktoré push služba označí za neplatné, sa zmažú.

## Oproti pôvodnému návrhu

- `items` majú aj `family_id`, `lists` a `reminders` aj `deleted`; pribudli `created_at`, `created_by`, `sort` a tabuľka `clock`.
- V `tokens` je uložený SHA-256 tokenu, nie token samotný – únik databázy neumožní prihlásenie.
- Opakovaná pripomienka je jeden záznam, ktorý sa posúva, nie nový riadok pre každý termín.
- Záloha cez `bin/backup.php` namiesto kopírovania súboru (kvôli WAL).

## Vývoj a testy

```bash
composer install
composer test        # = php tests/run.php: spustí PHP server s dočasnou databázou a prejde celé API aj cron
```

Lokálne skúšanie appky: `cp config.example.php config.php`, potom `php -S localhost:8000 -t public` a otvoriť `http://localhost:8000` (localhost sa počíta za zabezpečený, service worker funguje). S `'push_dry_run' => true` cron notifikácie len vypíše.

Pri zmene súborov aplikácie zvýšte `CACHE` v `public/sw.js` (napr. `rodina-v2`), aby sa stará offline kópia zahodila; nová verzia sa inak načíta pri ďalšom otvorení appky.
