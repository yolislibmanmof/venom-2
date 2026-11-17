<?php
/**
 * ============================================================
 *  VENOM home.php v1.3.2 — FINAL
 *  Lokasi: admin/admin_template/VENOM/home.php
 *  v2 + grafik pengunjung mingguan + top peminjam + redraw saat accent ganti.
 *
 *  v1.3.2 (hasil audit): ikon FA 4.2.0, locale angka adaptif,
 *  visitor null tampil —, catch fetch statistik, PHP_SELF json_encode.
 * ============================================================
 */

use SLiMS\DB;

if (!defined('INDEX_AUTH')) { define('INDEX_AUTH', '1'); }
if (basename($_SERVER['PHP_SELF'] ?? '') === basename(__FILE__)) {
    require_once dirname(__DIR__, 3) . '/sysconfig.inc.php';
    require SB . 'admin/default/session.inc.php';
    require SB . 'admin/default/session_check.inc.php';
}

$v_id  = stripos($sysconf['default_lang'] ?? '', 'id') === 0;
$v_api = AWB . 'admin_template/' . basename(__DIR__) . '/api.php';
$v_locale = $v_id ? 'id-ID' : str_replace('_', '-', $sysconf['default_lang'] ?? 'en-US');

$vq = function ($sql) use ($dbs) {
    try { $r = $dbs->query($sql); return ($r && !empty($r->num_rows)) ? $r : null; }
    catch (\Throwable $e) { return null; }
};
$v_has_col = function ($table, $col) use ($dbs) {
    try { $r = $dbs->query("SHOW COLUMNS FROM `$table` LIKE '$col'"); return $r && $r->num_rows > 0; }
    catch (\Throwable $e) { return false; }
};
$v_series = function ($sql, $days = 14) use ($vq) {
    $map = [];
    if ($r = $vq($sql)) { while ($x = $r->fetch_assoc()) { $map[$x['d']] = (int)$x['c']; } }
    $out = [];
    for ($i = $days - 1; $i >= 0; $i--) { $d = date('Y-m-d', strtotime("-$i days")); $out[] = $map[$d] ?? 0; }
    return $out;
};
$v_trend = function ($pts) {
    $n = count($pts);
    $last = array_sum(array_slice($pts, -7));
    $prev = array_sum(array_slice($pts, 0, max(0, $n - 7)));
    $pct = $prev > 0 ? (int)round(($last - $prev) / $prev * 100) : ($last > 0 ? 100 : 0);
    $dir = $last > $prev ? 'up' : ($last < $prev ? 'down' : 'flat');
    return [$dir, $pct];
};

$members_total = 0;
if ($r = $vq('SELECT COUNT(*) AS c FROM member')) { $members_total = (int)$r->fetch_assoc()['c']; }
$visitors_today = null;
if ($r = $vq("SELECT COUNT(*) AS c FROM visitor_count WHERE DATE(checkin_date) = CURDATE()")) { $visitors_today = (int)$r->fetch_assoc()['c']; }
$db_version = '-';
if ($r = $vq('SELECT VERSION() AS v')) { $db_version = $r->fetch_assoc()['v']; }
$top_titles = [];
if ($r = $vq('SELECT b.title, COUNT(*) AS c FROM loan l JOIN item i ON i.item_code = l.item_code JOIN biblio b ON b.biblio_id = i.biblio_id GROUP BY b.biblio_id, b.title ORDER BY c DESC LIMIT 5')) {
    while ($row = $r->fetch_assoc()) { $top_titles[] = $row; }
}
$top_members = [];
if ($r = $vq('SELECT m.member_id, m.member_name, COUNT(l.loan_id) AS c FROM loan l JOIN member m ON m.member_id = l.member_id GROUP BY m.member_id, m.member_name ORDER BY c DESC LIMIT 5')) {
    while ($row = $r->fetch_assoc()) { $top_members[] = $row; }
}
$recent_logs = [];
if ($r = $vq('SELECT * FROM system_log ORDER BY log_date DESC LIMIT 7')) {
    while ($row = $r->fetch_assoc()) { $recent_logs[] = $row; }
}
$disk_free = @disk_free_space(SB); $disk_total = @disk_total_space(SB);
$disk_pct = ($disk_free && $disk_total) ? round(100 * ($disk_total - $disk_free) / $disk_total) : null;
$hour = (int)date('G');
$greet = $hour < 11 ? ($v_id ? 'Selamat pagi' : __('Good morning'))
    : ($hour < 15 ? ($v_id ? 'Selamat siang' : __('Good afternoon'))
    : ($hour < 19 ? ($v_id ? 'Selamat sore' : __('Good evening'))
    : ($v_id ? 'Selamat malam' : __('Good night'))));

$v_from14 = date('Y-m-d', strtotime('-13 days'));
$v_has_return = $v_has_col('loan', 'return_date');
$v_sparks = [
    'biblio'    => $v_series("SELECT DATE(input_date) d, COUNT(*) c FROM biblio WHERE input_date >= '$v_from14' GROUP BY DATE(input_date)"),
    'item'      => $v_series("SELECT DATE(input_date) d, COUNT(*) c FROM item WHERE input_date >= '$v_from14' GROUP BY DATE(input_date)"),
    'lent'      => $v_series("SELECT DATE(loan_date) d, COUNT(*) c FROM loan WHERE is_lent=1 AND loan_date >= '$v_from14' GROUP BY DATE(loan_date)"),
    'available' => $v_has_return ? $v_series("SELECT DATE(return_date) d, COUNT(*) c FROM loan WHERE is_return=1 AND return_date >= '$v_from14' GROUP BY DATE(return_date)") : array_fill(0, 14, 0),
    'member'    => $v_series("SELECT DATE(input_date) d, COUNT(*) c FROM member WHERE input_date >= '$v_from14' GROUP BY DATE(input_date)"),
    'visitor'   => $v_series("SELECT DATE(checkin_date) d, COUNT(*) c FROM visitor_count WHERE checkin_date >= '$v_from14' GROUP BY DATE(checkin_date)"),
];

/* pengunjung mingguan (7 hari) */
$v_week = []; $v_week_labels = []; $v_week_total = 0;
$v_wmap = [];
if ($r = $vq("SELECT DATE(checkin_date) d, COUNT(*) c FROM visitor_count WHERE checkin_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(checkin_date)")) {
    while ($x = $r->fetch_assoc()) { $v_wmap[$x['d']] = (int)$x['c']; }
}
$v_daynames = $v_id ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
for ($i = 6; $i >= 0; $i--) {
    $ts = strtotime("-$i days"); $d = date('Y-m-d', $ts); $val = $v_wmap[$d] ?? 0;
    $v_week[] = $val; $v_week_labels[] = $v_daynames[(int)date('w', $ts)]; $v_week_total += $val;
}
$v_week_avg = $v_week_total > 0 ? round($v_week_total / 7, 1) : 0;
?>
<div class="menuBox adminHome v-home">
    <div class="menuBoxInner"><div class="per_title"><h2><?php echo __('Library Administration'); ?></h2></div></div>
</div>
<div id="backupProccess" style="display: none">
    <div class="alert alert-info"><strong><?= __('Database backup process is running, please wait') ?></strong></div>
</div>
<div class="contentDesc">
    <div class="container-fluid">
        <div id="alert-new-version" class="alert alert-info border-0 mt-3 hidden">
            <strong>News!</strong> New version of SLiMS (<code id="new_version"></code>) available to
            <a class="notAJAX" target="_blank" href="https://github.com/slims/slims9_bulian/releases/latest">download</a>.
        </div>
        <?php
        $warnings = array();
        if (!extension_loaded('gd')) {
            $warnings[] = __('<strong>PHP GD</strong> extension is not installed. Please install it or application won\'t be able to create image thumbnail and barcode.');
        } elseif (!function_exists('imagettftext')) {
            $warnings[] = __('<strong>Freetype</strong> support is not enabled in PHP GD extension. Rebuild PHP GD extension with Freetype support or application won\'t be able to create barcode.');
        }
        $overdue_q = $dbs->query('SELECT COUNT(loan_id) FROM loan AS l WHERE (l.is_lent=1 AND l.is_return=0 AND TO_DAYS(due_date) < TO_DAYS(\'' . date('Y-m-d') . '\')) GROUP BY member_id');
        $num_overdue = $overdue_q ? $overdue_q->num_rows : 0;
        if ($num_overdue > 0) {
            $warnings[] = str_replace('{num_overdue}', $num_overdue, __('There are currently <strong>{num_overdue}</strong> library members having overdue. Please check at <b>Circulation</b> module at <b>Overdues</b> section for more detail'));
            if ($overdue_q) $overdue_q->free_result();
        }
        if (!is_writable(IMGBS) or !is_writable(IMGBS . 'barcodes') or !is_writable(IMGBS . 'persons') or !is_writable(IMGBS . 'docs')) {
            $warnings[] = __('<strong>Images</strong> directory and directories under it is not writable. Make sure it is writable by changing its permission or you won\'t be able to upload any images and create barcodes');
        }
        if (!is_writable(REPOBS)) { $warnings[] = __('<strong>Repository</strong> directory is not writable. Make sure it is writable (and all directories under it) by changing its permission or you won\'t be able to upload any bibliographic attachments.'); }
        if (!is_writable(UPLOAD)) { $warnings[] = __('<strong>File upload</strong> directory is not writable. Make sure it is writable (and all directories under it) by changing its permission or you won\'t be able to upload any file, create report files and create database backups.'); }
        if (is_dir('../install/')) { $warnings[] = __('Installer folder is still exist inside your server. Please remove it or rename to another name for security reason.'); }

        $query_of_tables = $dbs->query('SHOW TABLES');
        $prevtable = ''; $repair = ''; $is_repaired = false;
        if ((int)($_SESSION['uid'] ?? 0) === 1) {
            $warnings[] = __('<strong><i>You are logged in as Super User. With great power comes great responsibility.</i></strong>');
            if (isset($_POST['do_repair']) && $_POST['do_repair'] == 1) {
                while ($row = $query_of_tables->fetch_row()) { $dbs->query('REPAIR TABLE ' . $row[0]); }
            }
            while ($row = $query_of_tables->fetch_row()) {
                $query_of_check = $dbs->query('CHECK TABLE `' . $row[0] . '`');
                if ($query_of_check) {
                    while ($rowcheck = $query_of_check->fetch_assoc()) {
                        if (!(($rowcheck['Msg_type'] == 'status') && ($rowcheck['Msg_text'] == 'OK'))) {
                            if ($row[0] != $prevtable) { $repair .= '<li>' . __('Table') . ' ' . $row[0] . ' ' . __('might need to be repaired.') . '</li>'; }
                            $prevtable = $row[0]; $is_repaired = true;
                        }
                    }
                }
            }
            if ($is_repaired && !isset($_POST['do_repair'])) {
                echo '<div class="message"><ul>' . $repair . '</ul></div>';
                echo '<form method="POST" style="margin:0 10px;"><input type="hidden" name="do_repair" value="1">
                    <input type="submit" value="' . __('Click Here To Repair The Tables') . '" class="button btn btn-block btn-default"></form>';
            }
        }

        $alreadyBackup = true;
        if (utility::havePrivilege('system', 'r') && utility::havePrivilege('system', 'w')) {
            $backupConfigStatus = config('database_backup.reminder') || config('database_backup.auto');
            $backupIsNoAuto = config('database_backup.reminder') && !config('database_backup.auto');
            try { if (method_exists(DB::class, 'hasBackup')) { $alreadyBackup = DB::hasBackup(by: DB::BACKUP_BASED_ON_DAY); } }
            catch (\Throwable $e) { $alreadyBackup = true; }
            if ($alreadyBackup === false && $backupConfigStatus) { $_SESSION['token'] = utility::createRandomString(32); }
            if ($alreadyBackup === false && $is_repaired === false && $backupIsNoAuto === true) {
                echo '<div class="alert alert-info border-0 mt-3"><span>' . __('It looks like today you haven\'t backup your database.') .
                    '.&nbsp;&nbsp;<a href="' . MWB . 'system/backup_proc.php" id="backupproc" class="notAJAX btn btn-primary">' . __('Backup Now') . '</a></span></div>';
            }
        }
        if ($warnings) {
            echo '<div class="alert alert-warning border-0 mt-3">';
            foreach ($warnings as $w) { echo '<div>' . $w . '</div>'; }
            echo '</div>';
        }
        ?>
        <div class="v-hero mt-3">
            <div class="v-hero-title"><?= $greet ?>, <b><?= htmlspecialchars($_SESSION['realname'] ?? '') ?></b> 🐍</div>
            <div class="v-hero-sub"><?= htmlspecialchars($sysconf['library_name'] ?? '') ?> — <?= htmlspecialchars($sysconf['library_subname'] ?? '') ?></div>
            <div class="v-hero-chips">
                <span class="v-chip v-chip-accent"><i class="fa fa-calendar"></i> <?= date('d M Y') ?></span>
                <span class="v-chip"><i class="fa fa-database"></i> MySQL <?= htmlspecialchars($db_version) ?></span>
                <span class="v-chip"><i class="fa fa-bolt"></i> PHP <?= PHP_VERSION ?></span>
                <?php if ($num_overdue > 0): ?><span class="v-chip v-chip-danger"><i class="fa fa-exclamation-triangle"></i> <?= $num_overdue ?> <?= __('Overdue') ?></span><?php endif; ?>
                <a class="v-chip v-chip-ok" href="../index.php" target="_blank" rel="noopener"><i class="fa fa-globe"></i> OPAC</a>
            </div>
        </div>

        <?php
        if (($sysconf['admin_home']['mode'] ?? 'dashboard') == 'default') {
            require LIB . 'content.inc.php';
            $content = new content();
            $content_data = $content->get($dbs, 'adminhome');
            if ($content_data) { echo '<div class="contentDesc">' . $content_data['Content'] . '</div>'; unset($content_data); }
        } else {
        ?>
        <div class="row">
            <?php
            $v_stats = [
                ['fa-bookmark', 'biblio_total_all', __('Total of Collections'), 'api', 'biblio'],
                ['fa-barcode', 'item_total_all', __('Total of Items'), 'api', 'item'],
                ['fa-archive', 'item_total_lent', __('Lent'), 'api', 'lent'],
                ['fa-check', 'item_total_available', __('Available'), 'api', 'available'],
                ['fa-users', '', __('Members'), $members_total, 'member'],
                ['fa-sign-in', '', __('Visitors Today'), $visitors_today, 'visitor'],
            ];
            foreach ($v_stats as $s):
                $pts = $v_sparks[$s[4]] ?? array_fill(0, 14, 0);
                [$tdir, $tpct] = $v_trend($pts);
                $ticon = $tdir === 'up' ? 'fa-arrow-up' : ($tdir === 'down' ? 'fa-arrow-down' : 'fa-arrow-right');
                $tlabel = $tdir === 'flat' ? ($v_id ? 'stabil' : 'flat') : abs($tpct) . '%';
            ?>
            <div class="col-6 col-md-4 col-xl-2 mb-3">
                <div class="card border-0 v-stat">
                    <span class="v-trend <?= $tdir ?>" title="<?= $v_id ? '7 hari terakhir vs 7 hari sebelumnya' : 'Last 7 days vs previous 7' ?>"><i class="fa <?= $ticon ?>"></i><?= $tlabel ?></span>
                    <div class="card-body">
                        <div class="s-widget-icon"><i class="fa <?= $s[0] ?>"></i></div>
                        <?php if ($s[3] === 'api'): ?><div class="s-widget-value <?= $s[1] ?>">0</div>
                        <?php elseif ($s[3] === null): ?><div class="s-widget-value">—</div>
                        <?php else: ?><div class="s-widget-value v-counter" data-target="<?= (int)$s[3] ?>">0</div><?php endif; ?>
                        <div class="s-widget-title"><?= $s[2] ?></div>
                        <canvas class="v-spark" data-points="<?= implode(',', $pts) ?>" height="34" aria-hidden="true"></canvas>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <div class="row mt-1">
            <div class="col-12 col-lg-8 s-dashboard mb-3">
                <div class="card border-0"><div class="card-body">
                    <div class="v-chart-head">
                        <h5 class="card-title"><?php echo __('Latest Transactions'); ?></h5>
                        <div class="v-period" id="vPeriod" role="group" aria-label="<?= $v_id ? 'Periode' : 'Period' ?>">
                            <button type="button" data-days="7" class="active">7H</button>
                            <button type="button" data-days="30">30H</button>
                            <button type="button" data-days="90">90H</button>
                        </div>
                        <span class="v-chip v-chip-accent" id="vPeriodTotal">…</span>
                    </div>
                    <div class="v-chart-box" id="vChartBox"><canvas id="line-chartjs"></canvas></div>
                    <div class="s-dashboard-legend">
                        <i class="fa fa-square" style="color:var(--v-accent);"></i> <?php echo __('Loan') ?>&nbsp;&nbsp;
                        <i class="fa fa-square" style="color:#38bdf8;"></i> <?php echo __('Return') ?>&nbsp;&nbsp;
                        <i class="fa fa-square" style="color:#a78bfa;"></i> <?php echo __('Extend') ?>
                    </div>
                </div></div>
            </div>
            <div class="col-12 col-lg-4 s-dashboard mb-3">
                <div class="card border-0"><div class="card-body">
                    <h5 class="card-title"><?php echo __('Summary'); ?></h5>
                    <div class="s-chart"><canvas id="radar-chartjs" width="175" height="175"></canvas></div>
                    <table class="table">
                        <tr><td class="text-left"><i class="fa fa-square" style="color:#64748b;"></i>&nbsp;&nbsp;<?php echo __('Total') ?></td><td class="text-right loan_total">0</td></tr>
                        <tr><td class="text-left"><i class="fa fa-square" style="color:var(--v-accent);"></i>&nbsp;&nbsp;<?php echo __('New') ?></td><td class="text-right loan_new">0</td></tr>
                        <tr><td class="text-left"><i class="fa fa-square" style="color:#38bdf8;"></i>&nbsp;&nbsp;<?php echo __('Return') ?></td><td class="text-right loan_return">0</td></tr>
                        <tr><td class="text-left"><i class="fa fa-square" style="color:#a78bfa;"></i>&nbsp;&nbsp;<?php echo __('Extends') ?></td><td class="text-right loan_extend">0</td></tr>
                        <tr><td class="text-left"><i class="fa fa-square" style="color:#ffb020;"></i>&nbsp;&nbsp;<?php echo __('Overdue') ?></td><td class="text-right loan_overdue">0</td></tr>
                    </table>
                </div></div>
            </div>
        </div>

        <!-- ===== Pengunjung mingguan + Top peminjam ===== -->
        <div class="row mt-1">
            <div class="col-12 col-lg-7 mb-3">
                <div class="card border-0 h-100"><div class="card-body">
                    <div class="v-chart-head">
                        <h5 class="card-title"><?= $v_id ? 'Pengunjung 7 Hari' : __('Visitors This Week') ?></h5>
                        <span class="v-chip v-chip-accent" style="margin-left:auto;"><?= number_format($v_week_total) ?> <?= $v_id ? 'kunjungan' : 'visits' ?></span>
                        <span class="v-chip"><?= $v_week_avg ?> <?= $v_id ? '/hari' : '/day' ?></span>
                    </div>
                    <?php if ($v_week_total > 0): ?>
                    <div class="v-chart-box v-chart-sm"><canvas id="vWeekChart"></canvas></div>
                    <?php else: ?>
                    <div class="v-empty"><i class="fa fa-sign-in" style="display:block;font-size:26px;color:var(--v-muted);margin-bottom:8px;"></i><?= $v_id ? 'Belum ada kunjungan tercatat.' : __('No visits recorded yet.') ?></div>
                    <?php endif; ?>
                </div></div>
            </div>
            <div class="col-12 col-lg-5 mb-3">
                <div class="card border-0 h-100"><div class="card-body">
                    <div class="v-section-title"><i class="fa fa-trophy"></i><?= $v_id ? 'Top Peminjam' : __('Top Borrowers') ?></div>
                    <?php if ($top_members): $mmax = max(array_map(fn($t) => (int)$t['c'], $top_members)); ?>
                    <ul class="v-rank">
                        <?php foreach ($top_members as $k => $t): ?>
                        <li>
                            <span class="v-rank-num"><?= $k + 1 ?></span>
                            <div class="v-rank-body">
                                <div class="v-rank-title" title="<?= htmlspecialchars($t['member_name']) ?>"><?= htmlspecialchars($t['member_name']) ?></div>
                                <div class="v-rank-meta"><?= htmlspecialchars($t['member_id']) ?></div>
                                <div class="v-rank-bar"><i style="width:<?= max(6, round(100 * (int)$t['c'] / max(1, $mmax))) ?>%"></i></div>
                            </div>
                            <span class="v-rank-count"><?= number_format((int)$t['c']) ?></span>
                        </li>
                        <?php endforeach; ?>
                    </ul>
                    <?php else: ?><div class="v-empty"><?= $v_id ? 'Belum ada data peminjam.' : __('No borrower data yet.') ?></div><?php endif; ?>
                </div></div>
            </div>
        </div>

        <div class="row mt-1">
            <div class="col-12 col-md-6 col-xl-3 mb-3">
                <div class="card border-0 h-100"><div class="card-body">
                    <div class="v-section-title"><i class="fa fa-bolt"></i><?= $v_id ? 'Aksi Cepat' : __('Quick Actions') ?></div>
                    <div class="v-quick">
                        <?php if (utility::havePrivilege('bibliography', 'w')): ?><a href="<?= MWB ?>bibliography/index.php?action=detail"><i class="fa fa-plus-circle"></i><?= __('Add Bibliography') ?></a><?php endif; ?>
                        <?php if (utility::havePrivilege('circulation', 'r')): ?><a href="<?= MWB ?>circulation/index.php"><i class="fa fa-exchange"></i><?= __('Circulation') ?></a><?php endif; ?>
                        <?php if (utility::havePrivilege('membership', 'w')): ?><a href="<?= MWB ?>membership/index.php?action=detail"><i class="fa fa-user"></i><?= __('Add Member') ?></a><?php endif; ?>
                        <?php if (utility::havePrivilege('stock_take', 'r')): ?><a href="<?= MWB ?>stock_take/index.php"><i class="fa fa-tasks"></i><?= __('Stock Take') ?></a><?php endif; ?>
                        <?php if (utility::havePrivilege('reporting', 'r')): ?><a href="<?= MWB ?>reporting/index.php"><i class="fa fa-bar-chart"></i><?= __('Reports') ?></a><?php endif; ?>
                        <?php if (utility::havePrivilege('system', 'r')): ?><a href="<?= MWB ?>system/index.php"><i class="fa fa-cog"></i><?= __('System') ?></a><?php endif; ?>
                    </div>
                </div></div>
            </div>
            <div class="col-12 col-md-6 col-xl-3 mb-3">
                <div class="card border-0 h-100"><div class="card-body">
                    <div class="v-section-title"><i class="fa fa-fire"></i><?= $v_id ? 'Paling Sering Dipinjam' : __('Most Borrowed') ?></div>
                    <?php if ($top_titles): $vmax = max(array_map(fn($t) => (int)$t['c'], $top_titles)); ?>
                    <ul class="v-rank">
                        <?php foreach ($top_titles as $k => $t): ?>
                        <li>
                            <span class="v-rank-num"><?= $k + 1 ?></span>
                            <div class="v-rank-body">
                                <div class="v-rank-title" title="<?= htmlspecialchars($t['title']) ?>"><?= htmlspecialchars($t['title']) ?></div>
                                <div class="v-rank-bar"><i style="width:<?= max(6, round(100 * (int)$t['c'] / max(1, $vmax))) ?>%"></i></div>
                            </div>
                            <span class="v-rank-count"><?= number_format((int)$t['c']) ?></span>
                        </li>
                        <?php endforeach; ?>
                    </ul>
                    <?php else: ?><div class="v-empty"><?= $v_id ? 'Belum ada data peminjaman.' : __('No loan data yet.') ?></div><?php endif; ?>
                </div></div>
            </div>
            <div class="col-12 col-md-6 col-xl-3 mb-3">
                <div class="card border-0 h-100"><div class="card-body">
                    <div class="v-section-title"><i class="fa fa-hdd-o"></i><?= $v_id ? 'Kesehatan Sistem' : __('System Health') ?></div>
                    <div class="v-health-row"><span>SLiMS</span><b><?= defined('SENAYAN_VERSION_TAG') ? SENAYAN_VERSION_TAG : '-' ?></b></div>
                    <div class="v-health-row"><span>PHP</span><b><?= PHP_VERSION ?></b></div>
                    <div class="v-health-row"><span>MySQL</span><b><?= htmlspecialchars($db_version) ?></b></div>
                    <div class="v-health-row"><span><?= $v_id ? 'Batas unggah' : __('Upload max') ?></span><b><?= ini_get('upload_max_filesize') ?> / <?= ini_get('post_max_size') ?></b></div>
                    <div class="v-health-row"><span><?= $v_id ? 'Batas sesi' : __('Session timeout') ?></span><b><?= gmdate('H:i', (int)($sysconf['session_timeout'] ?? 7200)) ?> h</b></div>
                    <?php if ($disk_pct !== null): ?>
                    <div class="v-health-row"><span><?= $v_id ? 'Disk terpakai' : __('Disk used') ?></span><b><?= $disk_pct ?>% · <?= round($disk_free / 1073741824, 1) ?> GB <?= $v_id ? 'bebas' : __('free') ?></b></div>
                    <div class="v-bar"><i style="width:<?= $disk_pct ?>%"></i></div>
                    <?php endif; ?>
                </div></div>
            </div>
            <div class="col-12 col-md-6 col-xl-3 mb-3">
                <div class="card border-0 h-100"><div class="card-body">
                    <div class="v-section-title"><i class="fa fa-history"></i><?= $v_id ? 'Aktivitas Terbaru' : __('Recent Activity') ?></div>
                    <?php if ($recent_logs): ?>
                    <ul class="v-log">
                        <?php foreach ($recent_logs as $lg):
                            $lmsg = $lg['log_msg'] ?? ($lg['log_message'] ?? '');
                            $ldate = $lg['log_date'] ?? ''; $ltype = $lg['log_type'] ?? 'log';
                            $ts = $ldate ? strtotime($ldate) : false; $ago = $ts ? max(0, time() - $ts) : null;
                            $human = $ago === null ? '' : ($ago < 60 ? __('just now') : ($ago < 3600 ? floor($ago / 60) . ' m' : ($ago < 86400 ? floor($ago / 3600) . ' h' : floor($ago / 86400) . ' d')));
                        ?>
                        <li><span class="v-log-type"><?= htmlspecialchars($ltype) ?></span><span class="v-log-time"><?= $human ?></span>
                            <div class="v-log-msg"><?= htmlspecialchars(mb_substr(strip_tags($lmsg), 0, 120)) ?></div></li>
                        <?php endforeach; ?>
                    </ul>
                    <?php else: ?><div class="v-empty"><?= $v_id ? 'Belum ada aktivitas tercatat.' : __('No activity recorded.') ?></div><?php endif; ?>
                </div></div>
            </div>
        </div>
    </div>
</div>
<script src="<?php echo JWB ?>chartjs/Chart.min.js"></script>
<script>
$(function () {
    var NF = new Intl.NumberFormat('<?= $v_locale ?>');
    var ISID = <?= $v_id ? 'true' : 'false' ?>;
    var VAPI = '<?= $v_api ?>';
    var ACCENT = (getComputedStyle(document.body).getPropertyValue('--v-accent') || '#00e57a').trim();
    var WEEK_LABELS = <?= json_encode($v_week_labels) ?>;
    var WEEK_DATA = <?= json_encode($v_week) ?>;
    var WEEK_TOTAL = <?= (int)$v_week_total ?>;
    var curDays = 7, vBar = null, vWeek = null, lastSum = null;

    function setNum(sel, val) { var el = document.querySelector(sel); if (window.Venom && Venom.countUp && el) Venom.countUp(el, val); else $(sel).text(NF.format(val)); }
    async function getTotal(url, sel) {
        if (sel !== null) $(sel).text('…');
        try {
            let r = await (await fetch(url, { headers: { 'SLiMS-Http-Cache': 'cache' } })).json();
            if (sel !== null) setNum(sel, r.data);
            return r.data;
        } catch (e) { if (sel !== null) $(sel).text('—'); return null; }
    }
    getTotal('<?= SWB ?>index.php?p=api/biblio/total/all', '.biblio_total_all');
    getTotal('<?= SWB ?>index.php?p=api/item/total/all', '.item_total_all');
    getTotal('<?= SWB ?>index.php?p=api/item/total/lent', '.item_total_lent');
    getTotal('<?= SWB ?>index.php?p=api/item/total/available', '.item_total_available');

    if (window.Chart && Chart.defaults && Chart.defaults.global) {
        Chart.defaults.global.defaultFontColor = '#8fa89b';
        Chart.defaults.global.defaultFontFamily = "'Quicksand','Segoe UI',sans-serif";
    }

    function drawPeriod(days) {
        curDays = days;
        var box = document.getElementById('vChartBox'); box.classList.add('loading');
        fetch(VAPI + '?action=series&days=' + days, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.json()).then(function (d) {
                box.classList.remove('loading');
                document.getElementById('vPeriodTotal').textContent = NF.format(d.total) + ' ' + (ISID ? 'transaksi' : 'transactions');
                var ctx = document.getElementById('line-chartjs').getContext('2d');
                if (vBar) { try { vBar.destroy(); } catch (e) {} vBar = null; }
                vBar = new Chart(ctx).Bar({ labels: d.labels, datasets: [
                    { fillColor: ACCENT, highlightFill: ACCENT, data: d.loan },
                    { fillColor: '#38bdf8', highlightFill: '#38bdf8', data: d.return },
                    { fillColor: '#a78bfa', highlightFill: '#a78bfa', data: d.extend }] },
                    { barShowStroke: false, barDatasetSpacing: 4, responsive: true, maintainAspectRatio: false, animation: true });
            }).catch(function () { box.classList.remove('loading'); });
    }
    document.getElementById('vPeriod').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-days]'); if (!b) return;
        Array.prototype.forEach.call(this.querySelectorAll('button'), x => x.classList.toggle('active', x === b));
        drawPeriod(parseInt(b.dataset.days, 10));
    });

    function drawWeek() {
        if (WEEK_TOTAL <= 0) return;
        var el = document.getElementById('vWeekChart'); if (!el) return;
        if (vWeek) { try { vWeek.destroy(); } catch (e) {} vWeek = null; }
        vWeek = new Chart(el.getContext('2d')).Line({ labels: WEEK_LABELS, datasets: [{
            fillColor: ACCENT + '2e', strokeColor: ACCENT, pointColor: ACCENT, pointStrokeColor: '#0d1512',
            pointHighlightFill: '#fff', pointHighlightStroke: ACCENT, data: WEEK_DATA }] },
            { responsive: true, maintainAspectRatio: false, bezierCurve: true, pointDotRadius: 4, datasetFill: true, scaleShowGridLines: false, tooltipFillColor: 'rgba(13,21,18,.95)' });
    }

    function drawDoughnut(res) {
        lastSum = res;
        var data = [
            { value: parseInt(res.total), color: '#64748b', label: '<?php echo __('Total'); ?>' },
            { value: parseInt(res.new), color: ACCENT, label: '<?php echo __('Loan'); ?>' },
            { value: parseInt(res.return), color: '#38bdf8', label: '<?php echo __('Return'); ?>' },
            { value: parseInt(res.extend), color: '#a78bfa', label: '<?php echo __('Extend'); ?>' },
            { value: parseInt(res.overdue), color: '#ffb020', label: '<?php echo __('Overdue'); ?>' }];
        var r = $('#radar-chartjs'), container = $(r).parent(), rt = r.get(0).getContext('2d');
        function respond() { r.attr('width', $(container).width()); r.attr('height', $(container).height()); new Chart(rt).Doughnut(data, { animation: false, segmentStrokeWidth: 1, segmentStrokeColor: 'rgba(0,0,0,.25)' }); }
        $(window).off('resize.vdough').on('resize.vdough', respond); respond();
    }
    fetch('<?= SWB ?>index.php?p=api/loan/summary', { headers: { 'SLiMS-Http-Cache': 'cache' } }).then(r => r.json()).then(res => {
        setNum('.loan_total', res.data.total); setNum('.loan_new', res.data.new); setNum('.loan_return', res.data.return);
        setNum('.loan_extend', res.data.extend); setNum('.loan_overdue', res.data.overdue);
        drawDoughnut(res.data);
    }).catch(function () {
        $('.loan_total, .loan_new, .loan_return, .loan_extend, .loan_overdue').text('—');
    });

    document.addEventListener('venom:accent', function () {
        ACCENT = (getComputedStyle(document.body).getPropertyValue('--v-accent') || '#00e57a').trim();
        drawPeriod(curDays); drawWeek(); if (lastSum) drawDoughnut(lastSum);
        if (window.Venom) { document.querySelectorAll('canvas.v-spark').forEach(c => { delete c.dataset.vDone; }); Venom.enhance(); }
    });

    drawPeriod(7); drawWeek();

    <?php if (utility::havePrivilege('system', 'r') && utility::havePrivilege('system', 'w')): ?>
        <?php if (config('database_backup.reminder') && !config('database_backup.auto')): ?>
        $('#backupproc').click(function (e) {
            e.preventDefault(); var lbl = $(this).html();
            $(this).removeClass('btn-primary').addClass('btn-secondary disabled').html('<?= __('Please wait') ?>');
            backupDatabase($(this).attr('href'), function (r) { if (r.status) window.location.href = <?= json_encode($_SERVER['PHP_SELF']) ?>; else { $('#backupproc').html(lbl); window.toastr.error(r.message, '<?= __('Error') ?>'); } });
        });
        <?php endif; ?>
        function backupDatabase(href, cb) { $.post(href, { start: true, tkn: '<?= $_SESSION['token'] ?? '' ?>', verbose: 'no', response: 'json' }, function (r) { cb(JSON.parse(r)); }); }
        <?php if (!$is_repaired && !$alreadyBackup && config('database_backup.auto')): ?>
        $('.contentDesc').slideUp(); $('#backupProccess').slideDown();
        backupDatabase('<?= MWB . 'system/backup_proc.php' ?>', function (r) { if (r.status) window.location.href = <?= json_encode($_SERVER['PHP_SELF']) ?>; else window.toastr.error(r.message, '<?= __('Error') ?>'); });
        <?php endif; ?>
    <?php endif; ?>

    <?php if ((int)($_SESSION['uid'] ?? 0) === 1): ?>
    fetch('https://api.github.com/repos/slims/slims9_bulian/releases/latest').then(r => r.json()).then(r => {
        if (r.tag_name && r.tag_name > '<?= defined('SENAYAN_VERSION_TAG') ? SENAYAN_VERSION_TAG : '' ?>') { $('#new_version').text(r.tag_name); $('#alert-new-version').removeClass('hidden'); $('#alert-new-version a').attr('href', r.html_url); }
    }).catch(function () {});
    <?php endif; ?>
});
</script>
<?php } ?>