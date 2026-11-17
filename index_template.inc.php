<?php
/**
 * ============================================================
 *  VENOM — Premium Admin Template for SLiMS 9 (Bulian)
 *  Shell admin. Kontrak runtime SAMA PERSIS dengan template default:
 *  - urutan CSS/JS core, #mainMenu/#sidepan/#mainContent/.loader/#help
 *  - iframe blindSubmit, include "chat.php",
 *    echo $sysconf['page_footer'] (berisi script simbioAJAX pemuat
 *    modul yang ditempel admin/index.php — JANGAN DIHILANGKAN)
 *
 *  v1.3.2 (hasil audit): ikon FA 4.2.0, escape nama user,
 *  boot accent anti-FOUC, cache-buster filemtime aset venom,
 *  kunci config 'turl' untuk fallback API.
 * ============================================================
 */

$venom_at      = $sysconf['admin_template'] ?? [];

$venom_accent  = $venom_at['venom_accent'] ?? '#00e57a';
if (!preg_match('/^#[0-9a-fA-F]{6}$/', $venom_accent)) { $venom_accent = '#00e57a'; }

$venom_mode    = $venom_at['venom_mode'] ?? 'dark';
if (!in_array($venom_mode, ['dark', 'light', 'auto'], true)) { $venom_mode = 'dark'; }

$venom_sidebar = $venom_at['venom_sidebar'] ?? 'expanded';
if (!in_array($venom_sidebar, ['expanded', 'compact'], true)) { $venom_sidebar = 'expanded'; }

$venom_density = $venom_at['venom_density'] ?? 'comfortable';
if (!in_array($venom_density, ['comfortable', 'compact'], true)) { $venom_density = 'comfortable'; }

$venom_fx      = (int)($venom_at['venom_fx'] ?? 1);
$venom_clock   = (int)($venom_at['venom_clock'] ?? 1);
$venom_palette = (int)($venom_at['venom_palette'] ?? 1);
$venom_idle    = (int)($venom_at['venom_idle'] ?? 1);
$venom_tracks  = (int)($venom_at['always_show_tracks'] ?? 1);
$venom_timeout = (int)($sysconf['session_timeout'] ?? 7200);
$venom_turl    = $sysconf['admin_template']['dir'] . '/' . $sysconf['admin_template']['theme'];
$venom_ver     = '1.3.2';
$venom_initmode = $venom_mode === 'auto' ? 'dark' : $venom_mode;

/* Cache-buster aset venom: berubah hanya saat file diubah (bukan tiap detik). */
$venom_asset = function ($rel) use ($venom_ver) {
    $t = @filemtime(__DIR__ . '/' . $rel);
    return $t ? $t : $venom_ver;
};
$venom_realname = htmlspecialchars($_SESSION['realname'] ?? '', ENT_QUOTES, 'UTF-8');
$venom_role     = htmlspecialchars($_SESSION['nname'] ?? __('Librarian'), ENT_QUOTES, 'UTF-8');
?>
<!doctype html>
<html lang="<?= substr($sysconf['default_lang'] ?? 'en_US', 0, 2) ?>">
<head>
    <title><?php echo $page_title; ?></title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, post-check=0, pre-check=0" />
    <meta http-equiv="Expires" content="Sat, 26 Jul 1997 05:00:00 GMT" />
    <meta name="env" content="<?= (function_exists('isDev') && isDev()) ? 'dev' : 'prod' ?>"/>

    <?php
    $icon = SWB . 'webicon.ico';
    if (class_exists('\SLiMS\Filesystems\Storage')) {
        $imagesDisk = \SLiMS\Filesystems\Storage::images();
        if (isset($sysconf['webicon']) && !empty($sysconf['webicon']) && $imagesDisk->isExists($path = 'default/' . $sysconf['webicon'])) {
            $icon = SWB . 'lib/minigalnano/createthumb.php?filename=images/' . $path . '&width=130';
        }
    }
    ?>
    <link rel="icon" href="<?= $icon ?>" type="image/x-icon" />
    <link rel="shortcut icon" href="<?= $icon ?>" type="image/x-icon" />

    <!-- ===== CORE CSS (urutan default, jangan diubah) ===== -->
    <link href="<?php echo SWB; ?>css/bootstrap.min.css?<?php echo date('this') ?>" rel="stylesheet" type="text/css" />
    <link href="<?php echo SWB; ?>css/core.css?<?php echo date('this') ?>" rel="stylesheet" type="text/css" />
    <link href="<?php echo JWB; ?>colorbox/colorbox.css?<?php echo date('this') ?>" rel="stylesheet" type="text/css" />
    <link href="<?php echo JWB; ?>chosen/chosen.css?<?php echo date('this') ?>" rel="stylesheet" type="text/css" />
    <link href="<?php echo JWB; ?>toastr/toastr.min.css?<?php echo date('this') ?>" rel="stylesheet" type="text/css" />
    <link href="<?php echo JWB; ?>jquery.imgareaselect/css/imgareaselect-default.css" rel="stylesheet" type="text/css" />
    <link href="<?php echo JWB; ?>datepicker/css/datepicker-bs4.min.css" rel="stylesheet" />
    <link href="<?php echo $sysconf['admin_template']['css'].'?v='.$venom_asset('style.css'); ?>" rel="stylesheet" type="text/css" />
    <link rel="stylesheet" type="text/css" href="<?php echo JWB; ?>/croppie/croppie.css"/>

    <!-- ===== CORE JS (urutan default, jangan diubah) ===== -->
    <script type="text/javascript" src="<?php echo JWB; ?>jquery.js"></script>
    <script type="text/javascript" src="<?php echo AWB; ?>admin_template/<?php echo $sysconf['admin_template']['theme']?>/vendor/slimscroll/jquery.slimscroll.min.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>updater.js?v=<?php echo date('this') ?>"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>gui.js?v=<?php echo date('this') ?>"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>form.js?v=<?php echo date('this') ?>"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>calendar.js?v=<?php echo date('this') ?>"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>chosen/chosen.jquery.min.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>chosen/ajax-chosen.min.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>ckeditor5/ckeditor.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>tooltipsy.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>colorbox/jquery.colorbox-min.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>jquery.imgareaselect/scripts/jquery.imgareaselect.pack.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>webcam.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>scanner.js"></script>
    <script type="text/javascript" src="<?php echo SWB; ?>js/popper.min.js"></script>
    <script type="text/javascript" src="<?php echo SWB; ?>js/bootstrap.min.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>toastr/toastr.min.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>datepicker/js/datepicker-full.min.js"></script>
    <script type="text/javascript" src="<?php echo JWB; ?>/croppie/croppie.js"></script>
    <?php if (file_exists(SB . 'js/datepicker/js/locales/' . substr($sysconf['default_lang'], 0, 2) . '.js')): ?>
    <script type="text/javascript" src="<?php echo JWB; ?>datepicker/js/locales/<?= substr($sysconf['default_lang'], 0, 2) ?>.js"></script>
    <?php endif; ?>
    <script type="text/javascript" src="<?php echo $venom_turl; ?>/js/smooth-scrollbar.js"></script>
    <script type="text/javascript" src="<?php echo $venom_turl; ?>/js/overscroll.js"></script>
    <?php if ($sysconf['chat_system']['enabled']) : ?>
    <script src="<?php echo JWB; ?>fancywebsocket.js"></script>
    <?php endif; ?>

    <!-- ===== VENOM ENGINE ===== -->
    <script>
    window.VENOM = <?= json_encode([
        'version' => $venom_ver,
        'accent'  => $venom_accent,
        'mode'    => $venom_mode,
        'sidebar' => $venom_sidebar,
        'density' => $venom_density,
        'fx'      => $venom_fx,
        'clock'   => $venom_clock,
        'palette' => $venom_palette,
        'idle'    => $venom_idle,
        'timeout' => $venom_timeout,
        'uid'     => (int)($_SESSION['uid'] ?? 0),
        'locale'  => str_replace('_', '-', $sysconf['default_lang'] ?? 'id_ID'),
        'user'    => $_SESSION['realname'] ?? '',
        'library' => $sysconf['library_name'] ?? 'SLiMS',
        'awb'     => AWB, 'swb' => SWB, 'mwb' => MWB,
        'turl'    => $venom_turl,
    ], JSON_UNESCAPED_SLASHES) ?>;
    </script>
    <script type="text/javascript" src="<?php echo $venom_turl; ?>/js/venom.js?v=<?php echo $venom_asset('js/venom.js'); ?>"></script>
    <script type="text/javascript" src="<?php echo $venom_turl; ?>/js/venom-particles.js?v=<?php echo $venom_asset('js/venom-particles.js'); ?>"></script>
    <style>
        :root { --v-accent: <?= $venom_accent ?>; }
        #sidepan .scroll-content, #vNav .scroll-content { padding: 0; }
    </style>
</head>
<body class="v-body<?= $venom_density === 'compact' ? ' v-compact' : '' ?><?= $venom_sidebar === 'compact' ? ' v-rail' : '' ?>"
      data-venom-mode="<?= $venom_initmode ?>" data-venom-fx="<?= $venom_fx ?>">
<script>
/* Pre-paint boot: terapkan preferensi tersimpan sebelum render pertama (anti-FOUC). */
(function () {
    try {
        var c = window.VENOM || {}, k = 'venom:' + (c.uid || 0) + ':';
        var m = localStorage.getItem(k + 'mode');
        if (c.mode === 'auto' && !m) {
            m = (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
        }
        if (m === 'light' || m === 'dark') document.body.setAttribute('data-venom-mode', m);
        var r = localStorage.getItem(k + 'rail');
        if (r === '1') document.body.classList.add('v-rail');
        if (r === '0') document.body.classList.remove('v-rail');
        var a = localStorage.getItem(k + 'accent');
        if (a && /^#[0-9a-fA-F]{6}$/.test(a)) document.documentElement.style.setProperty('--v-accent', a);
    } catch (e) {}
})();
</script>

<div class="v-bg" aria-hidden="true"></div>
<div class="v-progress" id="vProgress" aria-hidden="true"></div>

<header id="header">
    <button type="button" id="vBurger" class="v-tool v-burger" aria-label="Toggle sidebar"><i class="fa fa-bars"></i></button>
    <a class="v-topbrand" href="index.php"><i class="fa fa-bolt"></i> VENOM</a>
    <nav id="mainMenu">
        <?php echo $main_menu; ?>
    </nav>
    <div class="v-tools">
        <?php if ($venom_palette): ?>
        <button type="button" id="vPaletteBtn" class="v-tool v-tool-wide" title="<?= __('Command Palette') ?> (Ctrl+K)">
            <i class="fa fa-search"></i><kbd>Ctrl K</kbd>
        </button>
        <?php endif; ?>
        <?php if ($venom_clock): ?>
        <div class="v-clock" aria-hidden="true"><span id="vTime">--:--:--</span><small id="vDate"></small></div>
        <?php endif; ?>
        <button type="button" id="vTheme" class="v-tool" title="<?= __('Toggle dark / light') ?> (Alt+L)"><i class="fa fa-moon-o"></i></button>
        <button type="button" id="vFull" class="v-tool" title="<?= __('Fullscreen') ?>"><i class="fa fa-expand"></i></button>
        <button type="button" id="vRail" class="v-tool v-rail-btn" title="<?= __('Collapse sidebar') ?> (Alt+M)"><i class="fa fa-angle-double-left"></i></button>
    </div>
</header>

<nav id="sidepan">
    <div class="v-brand">
        <span class="v-brand-badge">
            <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">
                <defs><linearGradient id="vlgA" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#00e57a"/><stop offset="1" stop-color="#7c3aed"/>
                </linearGradient></defs>
                <path d="M6 6 L17 6 L24 27 L31 6 L42 6 L29 42 L19 42 Z" fill="url(#vlgA)"/>
                <circle cx="24" cy="45" r="2.2" fill="#00e57a"/>
            </svg>
        </span>
        <span class="v-brand-text">
            <strong>VENOM</strong>
            <small>SLiMS ADMIN SUITE</small>
        </span>
    </div>

    <div class="s-user" id="profile">
        <div class="s-user-frame">
            <a href="<?php echo MWB.'system/app_user.php?changecurrent=true&action=detail'; ?>" class="s-user-photo subMenuItem">
                <?php
                $venom_upict = $_SESSION['upict'] ?? '';
                if (filter_var($venom_upict, FILTER_VALIDATE_URL)) {
                    $user_image_url = $venom_upict;
                } else {
                    $user_image = $venom_upict && file_exists(IMGBS . 'persons/' . $venom_upict) ? $venom_upict : 'person.png';
                    $user_image_url = '../lib/minigalnano/createthumb.php?filename=' . IMG . '/persons/' . urlencode(urlencode($user_image)) . '&width=200';
                }
                ?>
                <img src="<?= $user_image_url ?>" alt="Photo <?= $venom_realname ?>">
            </a>
            <span class="v-status" title="Online"></span>
        </div>
        <a href="<?php echo MWB.'system/app_user.php?changecurrent=true&action=detail'; ?>" class="s-user-meta subMenuItem">
            <h4 class="s-user-name"><?= $venom_realname ?></h4>
            <span class="v-role"><?= $venom_role ?></span>
        </a>
    </div>

    <div class="v-filter">
        <i class="fa fa-search"></i>
        <input type="text" id="vNavFilter" placeholder="<?= __('Filter menu…') ?>" autocomplete="off" spellcheck="false">
        <kbd>/</kbd>
    </div>

    <div class="v-nav" id="vNav">
        <?php echo $sub_menu; ?>
        <div class="v-nav-empty" hidden><i class="fa fa-search"></i> <?= __('No menu matched.') ?></div>
    </div>

    <div class="v-side-foot">
        <span class="v-chip"><i class="fa fa-bolt"></i> PHP <?= PHP_VERSION ?></span>
        <span class="v-chip"><?= defined('SENAYAN_VERSION_TAG') ? SENAYAN_VERSION_TAG : '' ?></span>
        <?php if (function_exists('isDev') && isDev()): ?><span class="v-chip v-chip-warn">DEV</span><?php endif; ?>
    </div>
</nav>
<div class="v-backdrop" id="vBackdrop" aria-hidden="true"></div>

<div class="v-crumbs" id="vCrumbs">
    <i class="fa fa-home"></i>
    <span id="vCrumbModule">Dashboard</span>
    <i class="fa fa-angle-right"></i>
    <span id="vCrumbPage"><?= __('Overview') ?></span>
</div>

<div class="loader">
    <div style="display:none;">Error</div>
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
</div>

<div id="mainContent">
    <?php echo $main_content; ?>
</div>

<div id="help">
    <a href="#" name="top" class="s-help d-none"><i class="fa fa-question-circle"></i></a>
    <a href="#" name="top" class="s-close d-none"><i class="fa fa-times"></i></a>
    <div class="s-help-content animated fade-in d-none"><!-- Place to put documentation --></div>
</div>

<footer>
    <div class="row">
        <div class="col-md-6">
            <?php echo SENAYAN_VERSION; ?>
            <span class="v-chip v-chip-accent"><i class="fa fa-bolt"></i> VENOM v<?= $venom_ver ?></span>
            <?php if (defined('SLiMS_START')): ?>
            <span class="v-chip" title="Render time &amp; memory">
                <i class="fa fa-tachometer"></i> <?= round((microtime(true) - SLiMS_START) * 1000) ?> ms · <?= round(memory_get_usage(true) / 1048576, 1) ?> MB
            </span>
            <?php endif; ?>
        </div>
        <div class="col-md-6 text-right"><?php echo $sysconf['page_footer']; ?></div>
    </div>
</footer>

<button type="button" id="vTop" class="v-top" aria-label="Back to top"><i class="fa fa-arrow-up"></i></button>

<?php if ($venom_palette): ?>
<div id="vPalette" class="v-palette" hidden>
    <div class="v-palette-box" role="dialog" aria-modal="true" aria-label="Command palette">
        <div class="v-palette-head">
            <i class="fa fa-bolt"></i>
            <input id="vPaletteInput" type="text" placeholder="<?= __('Search menus, modules, commands…') ?>" autocomplete="off" spellcheck="false">
            <kbd>ESC</kbd>
        </div>
        <div class="v-palette-list" id="vPaletteList"></div>
        <div class="v-palette-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> <?= __('navigate') ?></span>
            <span><kbd>↵</kbd> <?= __('open') ?></span>
            <span class="v-palette-brand">VENOM</span>
        </div>
    </div>
</div>
<?php endif; ?>

<?php if ($venom_idle): ?>
<div id="vIdle" class="v-idle" hidden>
    <div class="v-idle-box">
        <div class="v-idle-icon"><i class="fa fa-clock-o"></i></div>
        <h3><?= __('Your session is about to expire') ?></h3>
        <p><?= __('For security reasons you will be signed out in') ?> <b id="vIdleCount">120</b> <?= __('seconds') ?>.</p>
        <div class="v-idle-actions">
            <button type="button" class="btn btn-primary" id="vIdleStay"><i class="fa fa-refresh"></i> <?= __('Stay signed in') ?></button>
            <button type="button" class="btn btn-default" id="vIdleOut"><?= __('Logout') ?></button>
        </div>
    </div>
</div>
<?php endif; ?>

<!-- fake submit iframe for search form, DONT REMOVE THIS! -->
<iframe name="blindSubmit" style="display: none; visibility: hidden; width: 0; height: 0;"></iframe>
<!-- fake submit iframe -->

<script>
/* ===== Kontrak default (dipertahankan) ===== */
$('.loader').toggleClass('hidden').hide();

if (window.Scrollbar) {
    if (window.OverscrollPlugin) Scrollbar.use(window.OverscrollPlugin);
    var vNavEl = document.querySelector('#vNav');
    if (vNavEl) {
        window.VenomScrollbar = Scrollbar.init(vNavEl, {
            alwaysShowTracks: <?= $venom_tracks ? 'true' : 'false' ?>,
            continuousScrolling: false,
            plugins: { overscroll: { effect: 'glow' } }
        });
    }
}

$('.s-close').click(function (e) {
    e.preventDefault();
    $('.s-help').removeClass('d-none');
    $('.s-close').addClass('d-none');
    $('.s-help-content').html('').addClass('d-none');
});

$('.s-help').click(function (e) {
    e.preventDefault();
    if ($(this).attr('href') != '#') {
        $('.s-help-content').addClass('d-none');
        $('.left, .right, .loader, #s-help').toggleClass('active');
        $.ajax({ type: 'GET', url: $(this).attr('href') }).done(function (data) {
            $('.s-help-content').html(data).removeClass('d-none');
            $('.s-close').toggleClass('d-none');
        });
    } else {
        if (window.toastr) toastr.info('Help content will show according to available menu.', 'VENOM');
        else alert('Help content will show according to available menu.');
    }
});

$('.subMenuItem').click(function () {
    $('.s-help').removeClass('d-none');
    $('.s-close, .s-help-content').addClass('d-none');
    let get_url      = $(this).attr('href');
    let path_array   = get_url.split('/');
    let clean_path   = path_array[path_array.length - 1].split('.');
    let new_pathname = '<?php echo AWB ?>help.php?url=' + path_array[path_array.length - 2] + '/' + clean_path[0] + '.md';
    $('.s-help').attr('href', new_pathname);
});
</script>
<?php include "chat.php" ?>
</body>
</html>