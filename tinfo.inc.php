<?php
/**
 * ============================================================
 *  VENOM — Premium Admin Template for SLiMS 9 (Bulian)
 *  tinfo.inc.php — opsi template, skema identik default.
 *  Disimpan per-user oleh system/theme.php (user.admin_template)
 *  dan di-merge ke $sysconf['admin_template'] oleh utility::loadUserTemplate().
 *
 *  v1.1.0 — PATCH ANTI-RESET (additif, tanpa menghapus fitur lama):
 *  Core system/theme.php branch simpan (updateData) membangun $data
 *  dari identitas GLOBAL ('default') tanpa memanggil loadUserTemplate().
 *  tinfo.inc.php di-include SEBELUM $data dibangun, maka identitas
 *  template dikunci ke folder ini di sini -> kustomisasi tidak lagi
 *  mereset tampilan ke default. Bonus: auto-reload setelah simpan.
 * ============================================================
 */

use SLiMS\Polyglot\Memory;

$options_languages = [];
if (class_exists(Memory::class)) {
    foreach (Memory::getInstance()->getLanguages() as $lang) {
        $options_languages[] = [$lang[0], trim(Memory::getFlag($lang[0]) . ' ' . $lang[1])];
    }
}
if (!$options_languages) {
    $options_languages = [['en_US', 'English'], ['id_ID', 'Indonesia']];
}

/* ============================================================
 *  PATCH ANTI-RESET v1.0 (additif — jangan hapus kode lama)
 *  Bug inti SLiMS 9.8: system/theme.php branch simpan (updateData)
 *  membangun $data dari $sysconf['admin_template']['theme'/'css']
 *  GLOBAL (= 'default') tanpa memanggil loadUserTemplate().
 *  Akibat: user.admin_template tertulis theme=default -> reload
 *  kembali ke template default. tinfo.inc.php di-include SEBELUM
 *  $data dibangun, jadi kita kunci identitas ke folder ini di sini.
 * ============================================================ */
if (isset($_POST['updateData']) || isset($_GET['customize'])) {
    $venom_dir = basename(__DIR__); // otomatis = 'venom', ikut nama folder
    $sysconf['admin_template']['theme'] = $venom_dir;
    $sysconf['admin_template']['css']   = $sysconf['admin_template']['dir'] . '/' . $venom_dir . '/style.css';
}

$venom_options = [
    'accent' => [
        'dbfield' => 'venom_accent',
        'label'   => __('Venom Accent Color.<br><small>( Default : #00e57a )</small>'),
        'type'    => 'text',
        'default' => $sysconf['admin_template']['venom_accent'] ?? '#00e57a',
        'class'   => 'colorpicker',
    ],
    'mode' => [
        'dbfield' => 'venom_mode',
        'label'   => __('Appearance Mode'),
        'type'    => 'dropdown',
        'default' => $sysconf['admin_template']['venom_mode'] ?? 'dark',
        'data'    => [['dark', __('Dark (Symbiote)')], ['light', __('Light')], ['auto', __('Auto (follow system)')]],
    ],
    'sidebar' => [
        'dbfield' => 'venom_sidebar',
        'label'   => __('Sidebar Style'),
        'type'    => 'dropdown',
        'default' => $sysconf['admin_template']['venom_sidebar'] ?? 'expanded',
        'data'    => [['expanded', __('Expanded')], ['compact', __('Compact rail (expand on hover)')]],
    ],
    'density' => [
        'dbfield' => 'venom_density',
        'label'   => __('Interface Density'),
        'type'    => 'dropdown',
        'default' => $sysconf['admin_template']['venom_density'] ?? 'comfortable',
        'data'    => [['comfortable', __('Comfortable')], ['compact', __('Compact')]],
    ],
    'fx' => [
        'dbfield' => 'venom_fx',
        'label'   => __('Animations & Glow Effects'),
        'type'    => 'dropdown',
        'default' => $sysconf['admin_template']['venom_fx'] ?? 1,
        'data'    => [[1, __('Yes')], [0, __('No')]],
    ],
    'clock' => [
        'dbfield' => 'venom_clock',
        'label'   => __('Show Live Clock'),
        'type'    => 'dropdown',
        'default' => $sysconf['admin_template']['venom_clock'] ?? 1,
        'data'    => [[1, __('Yes')], [0, __('No')]],
    ],
    'palette' => [
        'dbfield' => 'venom_palette',
        'label'   => __('Command Palette (Ctrl+K)'),
        'type'    => 'dropdown',
        'default' => $sysconf['admin_template']['venom_palette'] ?? 1,
        'data'    => [[1, __('Yes')], [0, __('No')]],
    ],
    'idle' => [
        'dbfield' => 'venom_idle',
        'label'   => __('Session Idle Reminder'),
        'type'    => 'dropdown',
        'default' => $sysconf['admin_template']['venom_idle'] ?? 1,
        'data'    => [[1, __('Yes')], [0, __('No')]],
    ],
    'language' => [
        'dbfield' => 'default_lang',
        'label'   => __('User Language'),
        'type'    => 'dropdown',
        'default' => $sysconf['admin_template']['default_lang'] ?? $sysconf['default_lang'],
        'data'    => $options_languages,
        'class'   => 'form-control',
    ],
    'always-show-tracks' => [
        'dbfield' => 'always_show_tracks',
        'label'   => __('Always Show Tracks'),
        'type'    => 'dropdown',
        'default' => $sysconf['admin_template']['always_show_tracks'] ?? 1,
        'data'    => [[1, __('Yes')], [0, __('No')]],
    ],
    'particles' => [
        'dbfield' => 'venom_particles',
        'label'   => __('Background Particle Effect'),
        'type'    => 'dropdown',
        'default' => $sysconf['admin_template']['venom_particles'] ?? 1,
        'data'    => [[1, __('Yes')], [0, __('No')]],
    ],
];

// Daftar untuk folder 'venom' DAN theme aktif (kompatibel dgn theme.php & sysconfig).
$sysconf['admin_template']['option']['venom'] = $venom_options;
$sysconf['admin_template']['option'][$sysconf['admin_template']['theme']] = $venom_options;

/* ============================================================
 *  BONUS AUTO-RELOAD v1.0 (additif — blok ini opsional)
 *  Core SLiMS hanya menampilkan toast "reload manual" setelah
 *  simpan kustomisasi. Blok ini membuat jendela induk reload
 *  otomatis +/- 1,2 detik setelah simpan berhasil. Hanya dicetak
 *  di popup form (GET customize), TIDAK saat POST simpan, sehingga
 *  respons AJAX tetap bersih. Vanilla JS, tanpa dependensi jQuery.
 * ============================================================ */
if (isset($_GET['customize']) && !isset($_POST['updateData'])) {
    echo "\n<script>(function(){var O=XMLHttpRequest.prototype.open,S=XMLHttpRequest.prototype.send;"
        ."XMLHttpRequest.prototype.open=function(m,u){this.__vM=m;this.__vU=u;return O.apply(this,arguments);};"
        ."XMLHttpRequest.prototype.send=function(b){var x=this;"
        ."if(String(x.__vM||'').toUpperCase()==='POST'&&String(x.__vU||'').indexOf('theme.php')>-1&&String(b||'').indexOf('updateData')>-1){"
        ."x.addEventListener('load',function(){setTimeout(function(){try{parent.location.reload();}catch(e){location.reload();}},1200);});}"
        ."return S.apply(this,arguments);};})();</script>\n";
}