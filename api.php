<?php
/**
 * ============================================================
 *  VENOM api.php v1.3.2 — FINAL
 *  Lokasi: admin/admin_template/VENOM/api.php
 *  actions: series | notifications | catalog
 *
 *  v1.3.2 (hasil audit):
 *  - S3: gate privilege per-action. notifications = circulation r,
 *    catalog = bibliography r. 'series' tetap terbuka: hanya agregat
 *    angka yang sudah ditampilkan dashboard ke semua staf.
 *  - Escape wildcard LIKE (% dan _) pada pencarian katalog.
 *  - Respons tolak tetap JSON (+HTTP 403) agar fetch JS tidak error.
 * ============================================================
 */

define('INDEX_AUTH', '1');
require_once dirname(__DIR__, 3) . '/sysconfig.inc.php';
require LIB . 'ip_based_access.inc.php';
do_checkIP('smc');
require SB . 'admin/default/session.inc.php';
require SB . 'admin/default/session_check.inc.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$action = isset($_GET['action']) ? preg_replace('/[^a-z_]/', '', (string)$_GET['action']) : '';
$v_id   = stripos($sysconf['default_lang'] ?? '', 'id') === 0;

/* ===== S3: pagar privilege modul (fail-closed) ===== */
function v_can($mod) {
    return method_exists('utility', 'havePrivilege') ? (bool)utility::havePrivilege($mod, 'r') : false;
}
function v_forbid($extra = []) {
    http_response_code(403);
    echo json_encode(array_merge(['ok' => false, 'error' => 'forbidden'], $extra));
    exit;
}

function v_rows($sql) {
    global $dbs;
    try {
        $r = $dbs->query($sql);
        if ($r && !empty($r->num_rows)) { $out = []; while ($x = $r->fetch_assoc()) { $out[] = $x; } return $out; }
    } catch (\Throwable $e) {}
    return [];
}
function v_val($sql) { $r = v_rows($sql); return $r ? reset($r) : null; }
function v_has_col($table, $col) {
    global $dbs;
    try { $r = $dbs->query("SHOW COLUMNS FROM `$table` LIKE '$col'"); return $r && $r->num_rows > 0; }
    catch (\Throwable $e) { return false; }
}
function v_series($sql, $days) {
    $map = [];
    foreach (v_rows($sql) as $x) { $map[$x['d']] = (int)$x['c']; }
    $out = []; $labels = [];
    for ($i = $days - 1; $i >= 0; $i--) { $ts = strtotime("-$i days"); $d = date('Y-m-d', $ts); $labels[] = date('d/m', $ts); $out[] = $map[$d] ?? 0; }
    return [$labels, $out];
}

if ($action === 'series') {
    $days = isset($_GET['days']) ? (int)$_GET['days'] : 7;
    if (!in_array($days, [7, 30, 90], true)) { $days = 7; }
    $from = date('Y-m-d', strtotime('-' . ($days - 1) . ' days'));
    [$labels, $loan] = v_series("SELECT DATE(loan_date) d, COUNT(*) c FROM loan WHERE is_lent=1 AND loan_date >= '$from' GROUP BY DATE(loan_date)", $days);
    $return = v_has_col('loan', 'return_date')
        ? v_series("SELECT DATE(return_date) d, COUNT(*) c FROM loan WHERE is_return=1 AND return_date >= '$from' GROUP BY DATE(return_date)", $days)[1] : array_fill(0, $days, 0);
    $extend = v_has_col('loan', 'renew_date')
        ? v_series("SELECT DATE(renew_date) d, COUNT(*) c FROM loan WHERE renew_date >= '$from' GROUP BY DATE(renew_date)", $days)[1] : array_fill(0, $days, 0);
    echo json_encode(['ok' => true, 'days' => $days, 'labels' => $labels, 'loan' => $loan, 'return' => $return, 'extend' => $extend,
        'total' => array_sum($loan) + array_sum($return) + array_sum($extend)]);
    exit;
}

if ($action === 'notifications') {
    if (!v_can('circulation')) { v_forbid(['groups' => [], 'total' => 0]); }
    $groups = [];
    $dueCount = (int)(v_val("SELECT COUNT(*) c FROM loan WHERE is_lent=1 AND is_return=0 AND due_date = CURDATE()")['c'] ?? 0);
    $dueItems = v_rows("SELECT m.member_name t, CONCAT(COALESCE(b.title, l.item_code), ' · ', l.item_code) s
        FROM loan l JOIN member m ON m.member_id = l.member_id
        LEFT JOIN item i ON i.item_code = l.item_code LEFT JOIN biblio b ON b.biblio_id = i.biblio_id
        WHERE l.is_lent=1 AND l.is_return=0 AND l.due_date = CURDATE() ORDER BY m.member_name LIMIT 6");
    $groups[] = ['key' => 'due', 'count' => $dueCount, 'items' => $dueItems];
    $ovCount = (int)(v_val("SELECT COUNT(*) c FROM loan WHERE is_lent=1 AND is_return=0 AND due_date < CURDATE()")['c'] ?? 0);
    $ovItems = v_rows("SELECT m.member_name t, CONCAT(COALESCE(b.title, l.item_code), ' · ', DATEDIFF(CURDATE(), l.due_date), 'd') s
        FROM loan l JOIN member m ON m.member_id = l.member_id
        LEFT JOIN item i ON i.item_code = l.item_code LEFT JOIN biblio b ON b.biblio_id = i.biblio_id
        WHERE l.is_lent=1 AND l.is_return=0 AND l.due_date < CURDATE() ORDER BY l.due_date ASC LIMIT 6");
    $groups[] = ['key' => 'overdue', 'count' => $ovCount, 'items' => $ovItems];
    $rsCount = (int)(v_val("SELECT COUNT(*) c FROM reserve")['c'] ?? 0);
    $rsItems = v_rows("SELECT m.member_name t, CONCAT(b.title, ' · ', DATE_FORMAT(r.reserve_date, '%d/%m')) s
        FROM reserve r JOIN member m ON m.member_id = r.member_id JOIN biblio b ON b.biblio_id = r.biblio_id
        ORDER BY r.reserve_date DESC LIMIT 6");
    $groups[] = ['key' => 'reserve', 'count' => $rsCount, 'items' => $rsItems];
    $stockSql = "SELECT b.biblio_id, b.title, COUNT(i.item_code) total, SUM(CASE WHEN l.loan_id IS NULL THEN 1 ELSE 0 END) available
        FROM biblio b JOIN item i ON i.biblio_id = b.biblio_id
        LEFT JOIN loan l ON l.item_code = i.item_code AND l.is_lent=1 AND l.is_return=0
        GROUP BY b.biblio_id, b.title HAVING available <= 2 AND total > 0";
    $stCount = (int)(v_val("SELECT COUNT(*) c FROM ($stockSql) x")['c'] ?? 0);
    $stItems = v_rows("$stockSql ORDER BY available ASC, total ASC LIMIT 6");
    $word = $v_id ? 'eksemplar' : 'copies';
    foreach ($stItems as &$it) { $it = ['t' => $it['title'], 's' => $it['available'] . ' / ' . $it['total'] . ' ' . $word]; }
    unset($it);
    $groups[] = ['key' => 'stock', 'count' => $stCount, 'items' => $stItems];
    $total = 0; foreach ($groups as $g) { $total += $g['count']; }
    echo json_encode(['ok' => true, 'generated' => date('H:i:s'), 'total' => $total, 'groups' => $groups]);
    exit;
}

if ($action === 'catalog') {
    if (!v_can('bibliography')) { v_forbid(['items' => []]); }
    $q = trim((string)($_GET['q'] ?? ''));
    if (mb_strlen($q) < 2) { echo json_encode(['ok' => true, 'items' => []]); exit; }
    $esc = str_replace(['%', '_'], ['\\%', '\\_'], $dbs->escape_string($q));
    $rows = v_rows("SELECT biblio_id, title, publish_year, publisher FROM biblio
        WHERE title LIKE '%$esc%' OR isbn_issn LIKE '%$esc%' ORDER BY last_update DESC LIMIT 8");
    $items = [];
    foreach ($rows as $r) {
        $meta = trim((string)($r['publisher'] ?? ''));
        if (!empty($r['publish_year'])) { $meta .= ($meta ? ' · ' : '') . $r['publish_year']; }
        $items[] = ['id' => $r['biblio_id'], 'title' => $r['title'], 'meta' => $meta];
    }
    echo json_encode(['ok' => true, 'items' => $items]);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'unknown action']);