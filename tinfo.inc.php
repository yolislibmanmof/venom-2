<?php
/**
 * ============================================================
 *  VENOM — Premium Admin Template for SLiMS 9 (Bulian)
 *  tinfo.inc.php — opsi template, skema identik default.
 *  Disimpan per-user oleh system/theme.php (user.admin_template)
 *  dan di-merge ke $sysconf['admin_template'] oleh utility::loadUserTemplate().
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