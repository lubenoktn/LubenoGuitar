<?php
declare(strict_types=1);

/** The first occurrence of a repeating reminder after $now, keeping the local time of day. */
function next_due(int $dueMs, string $repeat, int $nowMs): int
{
    $step = ['daily' => 'P1D', 'weekly' => 'P1W', 'monthly' => 'P1M', 'yearly' => 'P1Y'][$repeat];
    $start = (new DateTimeImmutable('@' . intdiv($dueMs, 1000)))->setTimezone(new DateTimeZone(date_default_timezone_get()));
    $day = (int) $start->format('j');
    for ($n = 1; ; $n++) {
        if ($repeat === 'monthly' || $repeat === 'yearly') {
            // counted from the original date, so 31 Jan -> 28 Feb -> 31 Mar (not 28 Mar)
            $months = $repeat === 'monthly' ? $n : 12 * $n;
            $first = $start->modify('first day of this month')->modify("+$months months");
            $next = $first->setDate((int) $first->format('Y'), (int) $first->format('n'), min($day, (int) $first->format('t')));
        } else {
            $next = $start->add(new DateInterval(str_replace('1', (string) $n, $step)));
        }
        $ms = $next->getTimestamp() * 1000 + $dueMs % 1000;
        if ($ms > $nowMs) {
            return $ms;
        }
    }
}
