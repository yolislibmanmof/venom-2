/**
 * ============================================================
 *  VENOM UX ENGINE v1.3.2 — FINAL
 *  Core v1.2 + bell v2 + favorit + katalog palette +
 *  cheatsheet (?) + preset accent topbar.
 *
 *  v1.3.2 (hasil audit):
 *  - filter sidebar & blok favorit sadar wrapper .scroll-content
 *  - idle habis hitungan -> logout.php (janji UI ditepati)
 *  - ikon disesuaikan Font Awesome 4.2.0 yang dibundel
 *  - renderFavs sinkronkan tinggi scrollbar
 *  - fallback API pakai C.turl (folder-agnostik, case-safe)
 * ============================================================
 */
(function () {
  'use strict';
  var C = window.VENOM || {};
  var $ = window.jQuery;
  var Venom = window.Venom = {};
  var body = null;
  var isId = /^id/i.test(C.locale || '');
  function L(en, id) { return isId ? id : en; }
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn('[VENOM]', e); } }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); var a = arguments, self = this; t = setTimeout(function () { fn.apply(self, a); }, ms); }; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function hexRgba(hex, a) { var h = hex.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  var fmt = new Intl.NumberFormat(C.locale || 'id-ID');
  var store = {
    key: function (k) { return 'venom:' + (C.uid || 0) + ':' + k; },
    get: function (k, d) { try { var v = localStorage.getItem(this.key(k)); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(this.key(k), v); } catch (e) {} }
  };
  function editing(e) { var t = e.target; return t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], .cke, .chzn-container'); }
  function fxOn() { var b = document.body; return !b || b.getAttribute('data-venom-fx') !== '0'; }
  function isDark() { var b = document.body; return !b || b.getAttribute('data-venom-mode') !== 'light'; }

  var SRC = ''; try { SRC = (document.currentScript && document.currentScript.src) || ''; } catch (e) {}
  if (!SRC) { var ss = qs('script[src*="/venom.js"]'); SRC = ss ? ss.src : ''; }
  var API = SRC ? SRC.replace(/\/js\/venom\.js(\?.*)?$/, '/api.php') : ((C.awb || '') + (C.turl || 'admin_template/venom') + '/api.php');

  /* ---------- THEME ---------- */
  var theme = {
    current: function () { var b = document.body; return b && b.getAttribute('data-venom-mode') === 'light' ? 'light' : 'dark'; },
    apply: function (m, persist) {
      var b = document.body; if (!b) return;
      b.setAttribute('data-venom-mode', m);
      var i = qs('#vTheme i'); if (i) i.className = 'fa ' + (m === 'light' ? 'fa-sun-o' : 'fa-moon-o');
      if (persist) store.set('mode', m);
      safe(function () { scanFrames(document); });
    },
    toggle: function () { this.apply(this.current() === 'dark' ? 'light' : 'dark', true); }
  };
  Venom.theme = theme;

  /* ---------- ACCENT PRESETS ---------- */
  var PRESETS = [
    { n: 'Venom', h: '#00e57a' }, { n: L('Purple', 'Ungu'), h: '#7c3aed' },
    { n: 'Cyan', h: '#38bdf8' }, { n: 'Amber', h: '#ffb020' }
  ];
  function applyAccent(hex, persist) {
    document.documentElement.style.setProperty('--v-accent', hex);
    document.documentElement.style.setProperty('--v-line', hexRgba(hex, .16));
    if (persist) store.set('accent', hex);
    qsa('.v-accent-sw').forEach(function (s) { s.classList.toggle('on', s.dataset.hex === hex); });
    var ci = qs('#vAccentCustom'); if (ci) ci.value = hex;
    document.dispatchEvent(new CustomEvent('venom:accent', { detail: { accent: hex } }));
  }
  Venom.applyAccent = applyAccent;

  /* ---------- IFRAME THEMING ---------- */
  function frameCSS() {
    var accent = (getComputedStyle(document.documentElement).getPropertyValue('--v-accent') || C.accent || '#00e57a').trim();
    if (!isDark()) return 'html{color-scheme:light}';
    return 'html{color-scheme:dark}body{background:#0d1512!important;color:#e8f5ee!important}' +
      'h1,h2,h3,h4,h5,h6,.per_title h2{color:#e8f5ee!important}a{color:' + accent + '}' +
      'small,.text-muted,.form-text,.authors{color:#8fa89b!important}' +
      'table,.datagrid,#dataList,.dataListPrinted{background:#0d1512!important;color:#e8f5ee!important}' +
      'td,th{color:#e8f5ee!important;background-color:transparent}' +
      '.dataListHeader td,.dataListHeaderPrinted td{background:#121c17!important;color:#8fa89b!important}' +
      '.alterCell,.alterCell2{background:#0d1512!important}' +
      'input[type="text"],input[type="password"],input[type="number"],input[type="search"],select,textarea{background:#121c17!important;color:#e8f5ee!important;border:1px solid rgba(255,255,255,.1)!important}' +
      'input[type="radio"],input[type="checkbox"]{accent-color:' + accent + '}' +
      'hr{border-color:rgba(255,255,255,.08)!important}' +
      '::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-track{background:#0d1512}::-webkit-scrollbar-thumb{background:#1d3a2c;border-radius:8px;border:2px solid #0d1512}::-webkit-scrollbar-thumb:hover{background:#2a5a42}::-webkit-scrollbar-corner{background:#0d1512}';
  }
  function themeFrame(ifr) {
    try {
      if (!ifr || ifr.name === 'blindSubmit' || ifr.dataset.vNoTheme) return;
      var doc = ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document);
      if (!doc || !doc.head || !doc.body) return;
      var st = doc.getElementById('v-frame-theme');
      if (!st) { st = doc.createElement('style'); st.id = 'v-frame-theme'; doc.head.appendChild(st); }
      st.textContent = frameCSS();
    } catch (e) {}
  }
  function scanFrames(root) {
    qsa('iframe', root || document).forEach(function (f) {
      if (f.dataset.vFrameHook) { themeFrame(f); return; }
      f.dataset.vFrameHook = '1';
      f.addEventListener('load', function () { themeFrame(f); setTimeout(function () { themeFrame(f); }, 200); });
      themeFrame(f); setTimeout(function () { themeFrame(f); }, 250);
    });
  }
  Venom.scanFrames = scanFrames;

  /* ---------- ICONS ---------- */
  var ICONS = [
    [/biblio|catalog/i, 'fa-book'], [/item|barcode|copy/i, 'fa-barcode'],
    [/loan|circul|transact|checkout/i, 'fa-exchange'], [/return/i, 'fa-undo'],
    [/reserve/i, 'fa-bookmark'], [/overdue|due|fine|keterlambatan/i, 'fa-exclamation-triangle'],
    [/member|visitor|presence/i, 'fa-users'], [/card/i, 'fa-credit-card'],
    [/import|upload/i, 'fa-upload'], [/export|download/i, 'fa-download'],
    [/authority|rules|loan_rule|aturan/i, 'fa-gavel'], [/subject|topic|label/i, 'fa-tags'],
    [/gmd|collection|type/i, 'fa-th-large'], [/publisher/i, 'fa-building'],
    [/place|location|map/i, 'fa-map-marker'], [/language/i, 'fa-language'],
    [/freq|serial|kardex/i, 'fa-newspaper-o'], [/holiday|calendar/i, 'fa-calendar'],
    [/report|recap|statistic|pelapor/i, 'fa-bar-chart'], [/chart|graph/i, 'fa-pie-chart'],
    [/log|history|recent|sejarah/i, 'fa-history'], [/user|librarian|staff|profil/i, 'fa-user'],
    [/group|privilege|module/i, 'fa-cubes'], [/backup|database|mysql/i, 'fa-database'],
    [/theme|template|tema/i, 'fa-paint-brush'], [/content|news/i, 'fa-file-text'],
    [/plugin/i, 'fa-plug'], [/env|server|node|ucs/i, 'fa-hdd-o'],
    [/mail|notif/i, 'fa-envelope'], [/currency|price/i, 'fa-money'],
    [/shortcut/i, 'fa-bolt'], [/stock|inventaris/i, 'fa-tasks'], [/print|receipt/i, 'fa-print'],
    [/popular|top/i, 'fa-fire'], [/system|config|setting|misc|pemintas/i, 'fa-cog'],
    [/custom|field/i, 'fa-list-alt'], [/z39|marc|sru|p2p/i, 'fa-search'],
    [/photo|webcam|camera/i, 'fa-camera'], [/scan/i, 'fa-qrcode'], [/attach|file|repo|lampir/i, 'fa-paperclip']
  ];
  function iconFor(href) { for (var i = 0; i < ICONS.length; i++) if (ICONS[i][0].test(href || '')) return ICONS[i][1]; return 'fa-angle-right'; }

  /* ---------- RECENT & FAVORITES ---------- */
  function getRecent() { try { return JSON.parse(store.get('recent', '[]')) || []; } catch (e) { return []; } }
  function pushRecent(item) { safe(function () { var l = getRecent().filter(x => x.h !== item.h); l.unshift(item); store.set('recent', JSON.stringify(l.slice(0, 8))); }); }
  function getFavs() { try { return JSON.parse(store.get('favs', '[]')) || []; } catch (e) { return []; } }
  function setFavs(a) { store.set('favs', JSON.stringify(a.slice(0, 24))); }
  function isFav(h) { return getFavs().some(f => f.h === h); }
  function toggleFav(item) { var a = getFavs(); var i = a.findIndex(f => f.h === item.h); if (i >= 0) a.splice(i, 1); else a.unshift(item); setFavs(a); refreshFavUI(); }
  Venom.getFavs = getFavs;

  /* ---------- CRUMBS & LOAD ---------- */
  function moduleName() { var a = qs('#mainMenu a.menuCurrent span'); var t = a ? a.textContent.trim() : 'Home'; return /^(home|beranda)$/i.test(t) ? 'Dashboard' : t; }
  function moduleHref() { var a = qs('#mainMenu a.menuCurrent'); return a ? a.getAttribute('href') : 'index.php'; }
  function setCrumb(page) { var m = qs('#vCrumbModule'), p = qs('#vCrumbPage'), mod = moduleName(); if (m) m.textContent = mod; if (p && page) p.textContent = page; document.title = (page ? page + ' · ' : '') + mod + ' — VENOM'; }
  function venomLoad(href, modHref, title) {
    safe(function () {
      if (modHref) qsa('#mainMenu a.menu').forEach(a => a.classList.toggle('menuCurrent', a.getAttribute('href') === modHref));
      if (window.jQuery && jQuery.fn.simbioAJAX) jQuery('#mainContent').simbioAJAX(href, { method: 'get' });
      else location.assign(href);
      setCrumb(title || '');
    });
  }
  Venom.load = venomLoad;

  /* ---------- LOKALISASI ---------- */
  var ID_MAP = { 'Good morning': 'Selamat pagi', 'Good afternoon': 'Selamat siang', 'Good evening': 'Selamat sore', 'Good night': 'Selamat malam', 'Overview': 'Ringkasan', 'Quick Actions': 'Aksi Cepat', 'Most Borrowed': 'Paling Sering Dipinjam', 'System Health': 'Kesehatan Sistem', 'Recent Activity': 'Aktivitas Terbaru', 'No loan data yet.': 'Belum ada data peminjaman.', 'No activity recorded.': 'Belum ada aktivitas tercatat.', 'Visitors Today': 'Pengunjung Hari Ini', 'Upload max': 'Batas unggah', 'Session timeout': 'Batas sesi', 'Disk used': 'Disk terpakai', 'No menu matched.': 'Tidak ada menu yang cocok.', 'Your session is about to expire': 'Sesi Anda akan segera berakhir', 'For security reasons you will be signed out in': 'Demi keamanan, Anda akan keluar dalam', 'seconds.': 'detik.', 'Stay signed in': 'Tetap masuk', 'Logout': 'Keluar', 'navigate': 'navigasi', 'open': 'buka' };
  function trText(el) { if (!el) return; Array.prototype.forEach.call(el.childNodes, function (n) { if (n.nodeType !== 3) return; var raw = n.textContent, key = raw.trim().replace(/[,:\s]+$/, ''); if (ID_MAP[key]) n.textContent = raw.replace(key, ID_MAP[key]); }); }
  function localize() { if (!isId) return; safe(function () { qsa('.v-hero-title,.v-section-title,.v-stat .s-widget-title,.v-empty,.v-health-row span,#vCrumbPage,.v-nav-empty,#vIdle h3,#vIdle p,#vIdleStay,#vIdleOut,.v-palette-foot span').forEach(trText); qsa('.v-health-row b').forEach(b => { b.textContent = b.textContent.replace(/\bfree\b/, 'bebas'); }); var pi = qs('#vPaletteInput'); if (pi) pi.placeholder = 'Cari menu, modul, perintah, atau judul/ISBN…'; }); }

  /* ---------- API ---------- */
  Venom.countUp = function (el, target, dur) { if (!el) return; target = Number(target) || 0; if (!fxOn() || document.hidden) { el.textContent = fmt.format(target); return; } var start = null, D = dur || 900; function step(ts) { if (!start) start = ts; var p = Math.min(1, (ts - start) / D), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt.format(Math.round(target * e)); if (p < 1) requestAnimationFrame(step); } requestAnimationFrame(step); };
  Venom.spark = function (canvas, points) { var b = document.body; if (!b || !canvas || !canvas.getContext || !points || points.length < 2) return; var dpr = window.devicePixelRatio || 1, w = canvas.clientWidth || 120, h = canvas.clientHeight || 36; canvas.width = w * dpr; canvas.height = h * dpr; var ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); var accent = (getComputedStyle(b).getPropertyValue('--v-accent') || '#00e57a').trim(); var min = Math.min.apply(null, points), max = Math.max.apply(null, points), span = (max - min) || 1; var px = i => 4 + (i / (points.length - 1)) * (w - 8); var py = v => h - 5 - ((v - min) / span) * (h - 10); var grad = ctx.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, accent + '55'); grad.addColorStop(1, accent + '00'); ctx.beginPath(); ctx.moveTo(px(0), py(points[0])); points.forEach((v, i) => ctx.lineTo(px(i), py(v))); ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke(); ctx.lineTo(px(points.length - 1), h); ctx.lineTo(px(0), h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill(); ctx.beginPath(); ctx.arc(px(points.length - 1), py(points[points.length - 1]), 3, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill(); };
  Venom.toast = function (type, msg, title) { if (window.toastr) window.toastr[type || 'info'](msg, title || 'VENOM'); };
  function enhance() {
    safe(function () { qsa('#mainContent table#dataList, #mainContent table.datagrid').forEach(function (t) { var p = t.parentElement; if (p && p.classList.contains('v-table-scroll')) { p.classList.toggle('is-wide', t.scrollWidth > p.clientWidth + 4); return; } if (p && t.scrollWidth > p.clientWidth + 4) { var w = document.createElement('div'); w.className = 'v-table-scroll is-wide'; p.insertBefore(w, t); w.appendChild(t); } }); });
    safe(function () { qsa('.v-counter[data-target]').forEach(el => { if (el.dataset.vDone) return; el.dataset.vDone = '1'; Venom.countUp(el, parseFloat(el.dataset.target || '0')); }); qsa('canvas.v-spark[data-points]').forEach(el => { if (el.dataset.vDone) return; el.dataset.vDone = '1'; Venom.spark(el, (el.dataset.points || '').split(',').map(Number)); }); qsa('#mainContent a[target="_blank"]').forEach(a => { a.rel = 'noopener noreferrer'; }); });
    safe(function () { scanFrames(qs('#mainContent') || document); });
  }
  Venom.enhance = enhance;

  /* ---------- FAVORITES UI ---------- */
  var favsBox = null;
  function syncNavScroll() { if (window.VenomScrollbar && window.VenomScrollbar.update) window.VenomScrollbar.update(); }
  function renderFavs() {
    if (!favsBox) return;
    var favs = getFavs();
    if (!favs.length) { favsBox.hidden = true; favsBox.innerHTML = ''; syncNavScroll(); return; }
    favsBox.hidden = false;
    favsBox.innerHTML = '<div class="v-favs-title"><i class="fa fa-star"></i>' + L('Favorites', 'Favorit') + '</div>' +
      favs.slice(0, 8).map(f => '<a class="v-fav-row" data-h="' + esc(f.h) + '" data-m="' + esc(f.m || '') + '" data-t="' + esc(f.t) + '"><i class="fi fa ' + esc(f.i || 'fa-angle-right') + '"></i><span>' + esc(f.t) + '</span><button type="button" class="v-fav-star on" data-h="' + esc(f.h) + '" title="' + L('Unpin', 'Lepas pin') + '"><i class="fa fa-star"></i></button></a>').join('');
    syncNavScroll();
  }
  function refreshFavUI() {
    qsa('#sidepan .v-nav a.subMenuItem').forEach(function (a) {
      var st = qs('.v-fav-star', a); if (!st) return;
      var on = isFav(a.getAttribute('href'));
      st.classList.toggle('on', on);
      qs('i', st).className = 'fa ' + (on ? 'fa-star' : 'fa-star-o');
    });
    renderFavs();
    if (Venom.palette && Venom.palette.refresh) Venom.palette.refresh();
  }
  Venom.refreshFavUI = refreshFavUI;

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    body = document.body; if (!body) return;

    /* ACCENT (apply saved early) */
    safe(function () { var saved = store.get('accent', null); if (saved) applyAccent(saved, false); });

    /* THEME */
    safe(function () {
      var saved = store.get('mode', null);
      if (C.mode === 'auto') { var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: light)') : null; theme.apply(saved || (mq && mq.matches ? 'light' : 'dark'), false); if (mq && mq.addEventListener) mq.addEventListener('change', ev => { if (!store.get('mode', null)) theme.apply(ev.matches ? 'light' : 'dark', false); }); }
      else if (saved === 'light' || saved === 'dark') theme.apply(saved, false);
      else theme.apply(C.mode === 'light' ? 'light' : 'dark', false);
      var b = qs('#vTheme'); if (b) b.addEventListener('click', () => theme.toggle());
    });

    /* LAYOUT */
    safe(function () {
      var railBtn = qs('#vRail');
      function railIcon() { var i = qs('#vRail i'); if (i) i.className = 'fa ' + (body.classList.contains('v-rail') ? 'fa-angle-double-right' : 'fa-angle-double-left'); }
      function toggleRail() { body.classList.toggle('v-rail'); store.set('rail', body.classList.contains('v-rail') ? '1' : '0'); railIcon(); setTimeout(() => Venom.menuUpdate && Venom.menuUpdate(), 320); }
      Venom.toggleRail = toggleRail;
      if (railBtn) railBtn.addEventListener('click', toggleRail); railIcon();
      var burger = qs('#vBurger'), backdrop = qs('#vBackdrop');
      if (burger) burger.addEventListener('click', () => body.classList.toggle('v-side-open'));
      if (backdrop) backdrop.addEventListener('click', () => body.classList.remove('v-side-open'));
      document.addEventListener('click', e => { if (window.innerWidth <= 960 && e.target.closest && e.target.closest('#sidepan a.subMenuItem')) body.classList.remove('v-side-open'); });
    });

    /* HEADER MENU */
    safe(function () {
      var menu = qs('#mainMenu'); if (!menu || menu.dataset.vWrap) return; menu.dataset.vWrap = '1';
      qsa('a.menu', menu).forEach(a => { var s = qs('span', a); if (s) a.setAttribute('title', s.textContent.trim()); });
      var wrap = document.createElement('div'); wrap.className = 'v-menu-wrap'; menu.parentNode.insertBefore(wrap, menu); wrap.appendChild(menu);
      function navBtn(dir) { var b = document.createElement('button'); b.type = 'button'; b.className = 'v-menu-nav v-menu-' + dir; b.setAttribute('aria-label', L('Scroll menu', 'Geser menu')); b.innerHTML = '<i class="fa fa-angle-' + (dir === 'prev' ? 'left' : 'right') + '"></i>'; b.addEventListener('click', () => menu.scrollBy({ left: dir === 'prev' ? -240 : 240, behavior: 'smooth' })); wrap.appendChild(b); return b; }
      var prev = navBtn('prev'), next = navBtn('next');
      function update() { var over = menu.scrollWidth > menu.clientWidth + 2; var atStart = menu.scrollLeft <= 2, atEnd = menu.scrollLeft >= menu.scrollWidth - menu.clientWidth - 2; wrap.classList.toggle('is-overflow', over); wrap.classList.toggle('at-start', atStart); wrap.classList.toggle('at-end', atEnd); prev.classList.toggle('show', over && !atStart); next.classList.toggle('show', over && !atEnd); }
      Venom.menuUpdate = update;
      menu.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', debounce(update, 150));
      menu.addEventListener('wheel', e => { if (menu.scrollWidth > menu.clientWidth + 2 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); menu.scrollLeft += e.deltaY; } }, { passive: false });
      var cur = qs('a.menuCurrent', menu); if (cur && menu.scrollWidth > menu.clientWidth + 2) menu.scrollLeft = Math.max(0, cur.offsetLeft - menu.clientWidth / 2 + cur.offsetWidth / 2);
      update(); setTimeout(update, 350);
    });

    /* CLOCK */
    safe(function () { var t = qs('#vTime'), d = qs('#vDate'); if (!C.clock || !t) return; var loc = C.locale || 'id-ID'; var tf = new Intl.DateTimeFormat(loc, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); var df = new Intl.DateTimeFormat(loc, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }); function tick() { var n = new Date(); t.textContent = tf.format(n); if (d) d.textContent = df.format(n); } tick(); setInterval(tick, 1000); });

    /* PROGRESS & TOP */
    safe(function () { var bar = qs('#vProgress'), top = qs('#vTop'), ticking = false; function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(function () { var h = document.documentElement, max = h.scrollHeight - h.clientHeight; if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%'; if (top) top.classList.toggle('show', h.scrollTop > 420); ticking = false; }); } window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: fxOn() ? 'smooth' : 'auto' })); });

    /* FULLSCREEN */
    safe(function () { var b = qs('#vFull'); if (!b) return; function toggle() { if (!document.fullscreenElement) { var p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(function () {}); } else if (document.exitFullscreen) document.exitFullscreen(); } Venom.toggleFullscreen = toggle; b.addEventListener('click', toggle); document.addEventListener('fullscreenchange', () => { var i = qs('#vFull i'); if (i) i.className = 'fa ' + (document.fullscreenElement ? 'fa-compress' : 'fa-expand'); }); });

    /* SIDEBAR ICONS + FAVORITE STARS + PINNED GROUP */
    safe(function () {
      var nav = qs('#vNav'); if (!nav) return;
      favsBox = document.createElement('div'); favsBox.id = 'vFavs'; favsBox.hidden = true;
      var vNavContent = qs('.scroll-content', nav) || nav;
      vNavContent.insertBefore(favsBox, vNavContent.firstChild);
      qsa('a.subMenuItem', nav).forEach(function (a) {
        var span = qs('span', a); if (!span) return;
        if (!a.dataset.vIcon) { a.dataset.vIcon = '1'; var i = document.createElement('i'); i.className = 'fa ' + iconFor(a.getAttribute('href')); a.insertBefore(i, a.firstChild); }
        if (qs('.v-fav-star', a)) return;
        var href = a.getAttribute('href');
        var st = document.createElement('button'); st.type = 'button'; st.className = 'v-fav-star' + (isFav(href) ? ' on' : '');
        st.title = L('Pin to favorites', 'Pin ke favorit');
        st.innerHTML = '<i class="fa ' + (isFav(href) ? 'fa-star' : 'fa-star-o') + '"></i>';
        st.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          toggleFav({ t: span.textContent.trim(), h: href, m: moduleHref(), i: iconFor(href) });
        });
        a.appendChild(st);
      });
      favsBox.addEventListener('click', function (e) {
        var star = e.target.closest('.v-fav-star');
        if (star) { e.preventDefault(); e.stopPropagation(); var h = star.dataset.h; var f = getFavs().find(x => x.h === h); if (f) toggleFav(f); return; }
        var row = e.target.closest('.v-fav-row');
        if (row) { e.preventDefault(); venomLoad(row.dataset.h, row.dataset.m || null, row.dataset.t); if (window.innerWidth <= 960) body.classList.remove('v-side-open'); }
      });
      renderFavs();
    });

    /* NAV FILTER */
    safe(function () { var input = qs('#vNavFilter'), nav = qs('#vNav'), empty = qs('.v-nav-empty'); if (!input || !nav) return; function apply() { var term = input.value.trim().toLowerCase(), any = false, header = null, headerHas = false; Array.prototype.forEach.call((qs('.scroll-content', nav) || nav).children, function (el) { if (el.id === 'vFavs') return; if (el.classList.contains('subMenuHeader')) { if (header) header.classList.toggle('v-hide', !headerHas); header = el; headerHas = false; return; } if (el.classList.contains('subMenuItem')) { var span = qs('span', el); var hit = !term || (span && span.textContent.toLowerCase().indexOf(term) !== -1); el.classList.toggle('v-hide', !hit); if (hit) { any = true; headerHas = true; } } }); if (header) header.classList.toggle('v-hide', !headerHas); if (empty) empty.hidden = any || !term; if (window.VenomScrollbar && window.VenomScrollbar.update) window.VenomScrollbar.update(); } input.addEventListener('input', apply); input.addEventListener('keydown', e => { if (e.key === 'Escape') { input.value = ''; apply(); input.blur(); } }); Venom.focusFilter = function () { input.focus(); input.select(); }; });

    /* CRUMBS */
    safe(function () { var cur = qs('#sidepan .v-nav a.curModuleLink span'); setCrumb(cur ? cur.textContent.trim() : L('Overview', 'Ringkasan')); document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('#sidepan a.subMenuItem'); if (!a) return; if (e.target.closest('.v-fav-star')) return; var span = qs('span', a); if (!span) return; setCrumb(span.textContent.trim()); pushRecent({ t: span.textContent.trim(), h: a.getAttribute('href'), m: moduleHref() }); }); if ($) $(document).on('simbioAJAXloaded', debounce(function () { var cur = qs('#sidepan .v-nav a.curModuleLink span'); if (cur) setCrumb(cur.textContent.trim()); }, 90)); });

    safe(localize);

    /* COMMAND PALETTE (favorites + catalog + local) */
    safe(function () {
      if (!C.palette) return;
      var wrap = qs('#vPalette'), input = qs('#vPaletteInput'), list = qs('#vPaletteList'), btn = qs('#vPaletteBtn');
      if (!wrap || !input || !list) return;
      var baseItems = [], active = 0, lastFocus = null;
      var catalogResults = [], catalogLoading = false, catTimer = null, catSeq = 0;
      var FAV = L('Favorites', 'Favorit'), CAT = L('Catalog', 'Katalog'), MEN = L('Menus', 'Menu');
      function actions() { return [
        { g: L('Commands', 'Perintah'), t: L('Toggle dark / light mode', 'Ganti mode gelap / terang'), i: 'fa-moon-o', k: 'Alt+L', run: () => theme.toggle() },
        { g: L('Commands', 'Perintah'), t: L('Collapse / expand sidebar', 'Ciutkan / lebarkan sidebar'), i: 'fa-columns', k: 'Alt+M', run: () => Venom.toggleRail && Venom.toggleRail() },
        { g: L('Commands', 'Perintah'), t: L('Toggle fullscreen', 'Layar penuh'), i: 'fa-expand', run: () => Venom.toggleFullscreen && Venom.toggleFullscreen() },
        { g: L('Commands', 'Perintah'), t: L('Keyboard shortcuts', 'Pintasan keyboard'), i: 'fa-keyboard-o', k: '?', run: () => Venom.keys && Venom.keys.open() },
        { g: L('Commands', 'Perintah'), t: L('Accent presets', 'Preset accent'), i: 'fa-tint', run: () => Venom.accentPop && Venom.accentPop.toggle() },
        { g: L('Commands', 'Perintah'), t: L('Background particle settings', 'Setelan partikel latar'), i: 'fa-asterisk', k: 'Alt+P', run: () => window.VenomParticles && VenomParticles.toggleLab() },
        { g: L('Commands', 'Perintah'), t: L('Reload current content', 'Muat ulang konten'), i: 'fa-refresh', run: () => { var c = qs('#sidepan a.curModuleLink'); if (c) c.click(); else location.reload(); } },
        { g: L('Commands', 'Perintah'), t: L('Open OPAC (new tab)', 'Buka OPAC (tab baru)'), i: 'fa-globe', run: () => { var o = qs('#mainMenu a.opac'); window.open(o ? o.getAttribute('href') : (C.swb || '../') + 'index.php', '_blank', 'noopener'); } },
        { g: L('Commands', 'Perintah'), t: L('Logout', 'Keluar'), i: 'fa-sign-out', run: () => { if (confirm(L('Logout from VENOM?', 'Keluar dari VENOM?'))) { var l = qs('#mainMenu a.logout'); location.href = l ? l.getAttribute('href') : 'logout.php'; } } }
      ]; }
      function build() {
        baseItems = [];
        qsa('#mainMenu a.menu').forEach(a => { if (a.classList.contains('logout') || a.classList.contains('opac')) return; var s = qs('span', a), t = s ? s.textContent.trim() : a.getAttribute('href'); var href = a.getAttribute('href'); baseItems.push({ g: L('Modules', 'Modul'), t: t, i: 'fa-cube', sub: href, run: () => location.assign(href) }); });
        qsa('#sidepan .v-nav a.subMenuItem').forEach(a => { var s = qs('span', a); if (!s) return; var href = a.getAttribute('href'); baseItems.push({ g: MEN, t: s.textContent.trim(), i: iconFor(href), sub: href, run: () => clickSub(href) }); });
        baseItems = baseItems.concat(actions());
      }
      function clickSub(href) { var a = qsa('#sidepan .v-nav a.subMenuItem').filter(x => x.getAttribute('href') === href)[0]; if (a) a.click(); else venomLoad(href, null, ''); }
      function openBiblio(r) { var url = (C.mwb || '') + 'bibliography/index.php?action=detail&itemID=' + encodeURIComponent(r.id); venomLoad(url, 'index.php?mod=bibliography', r.title); }
      function score(it, q) { var t = it.t.toLowerCase(); if (t.indexOf(q) === 0) return 3; if (t.indexOf(q) !== -1) return 2; var qi = 0; for (var i = 0; i < t.length && qi < q.length; i++) if (t[i] === q[qi]) qi++; return qi === q.length ? 1 : 0; }
      function render() {
        var q = input.value.trim().toLowerCase();
        var comp = [];
        getFavs().forEach(f => { if (!q || score({ t: f.t }, q) > 0) comp.push({ g: FAV, t: f.t, i: 'fa-star', sub: f.h, run: () => venomLoad(f.h, f.m || null, f.t) }); });
        comp = comp.slice(0, 6);
        if (q.length >= 2) {
          if (catalogLoading) comp.push({ g: CAT, t: L('Searching catalog…', 'Mencari katalog…'), i: 'fa-spinner fa-spin', loading: true, run: function () {} });
          else catalogResults.forEach(r => comp.push({ g: CAT, t: r.title, i: 'fa-book', sub: r.meta || ('ID ' + r.id), run: () => openBiblio(r) }));
        }
        var base = q ? baseItems.map(it => ({ it: it, s: score(it, q) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.it)
          : baseItems.filter(it => it.g !== MEN).concat(baseItems.filter(it => it.g === MEN).slice(0, 6));
        comp = comp.concat(base).slice(0, 16); active = 0;
        if (!comp.length) { list.innerHTML = '<div class="v-palette-empty"><i class="fa fa-search"></i> ' + L('Nothing matched.', 'Tidak ada yang cocok.') + '</div>'; list._shown = []; return; }
        var html = '', lastG = '';
        comp.forEach(function (it, idx) {
          if (it.g !== lastG) { html += '<div class="v-palette-group">' + esc(it.g) + '</div>'; lastG = it.g; }
          html += '<div class="v-palette-item' + (idx === 0 ? ' active' : '') + (it.loading ? ' loading' : '') + '" data-idx="' + idx + '"><i class="fa ' + esc(it.i) + '"></i><span class="v-pi-title">' + esc(it.t) + '</span>' + (it.k ? '<kbd>' + esc(it.k) + '</kbd>' : (it.sub ? '<span class="v-pi-sub">' + esc(String(it.sub).split('/').pop().split('?')[0]) + '</span>' : '')) + '</div>';
        });
        list.innerHTML = html; list._shown = comp;
      }
      function setActive(n) { var els = qsa('.v-palette-item', list); if (!els.length) return; active = (n + els.length) % els.length; els.forEach((el, i) => el.classList.toggle('active', i === active)); els[active].scrollIntoView({ block: 'nearest' }); }
      function open() { lastFocus = document.activeElement; build(); wrap.hidden = false; input.value = ''; catalogResults = []; catalogLoading = false; render(); setTimeout(() => input.focus(), 20); }
      function close() { wrap.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
      function run(idx) { var shown = list._shown || []; var it = shown[idx]; if (!it || it.loading) return; close(); setTimeout(() => safe(it.run), 30); }
      Venom.palette = { open: open, close: close, refresh: function () { if (!wrap.hidden) { build(); render(); } } };
      if (btn) btn.addEventListener('click', open);
      wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
      input.addEventListener('input', function () {
        render(); clearTimeout(catTimer);
        var q = input.value.trim();
        if (q.length < 2) { catalogResults = []; catalogLoading = false; render(); return; }
        catalogLoading = true; render();
        catTimer = setTimeout(function () {
          var seq = ++catSeq;
          fetch(API + '?action=catalog&q=' + encodeURIComponent(q), { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.json()).then(d => { if (seq !== catSeq) return; catalogResults = d.items || []; catalogLoading = false; render(); })
            .catch(() => { if (seq !== catSeq) return; catalogResults = []; catalogLoading = false; render(); });
        }, 260);
      });
      input.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); } else if (e.key === 'Enter') { e.preventDefault(); run(active); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
      list.addEventListener('click', e => { var el = e.target.closest('.v-palette-item'); if (el) run(parseInt(el.dataset.idx, 10)); });
      list.addEventListener('mousemove', e => { var el = e.target.closest('.v-palette-item'); if (el) setActive(parseInt(el.dataset.idx, 10)); });
    });

    /* CHEATSHEET (?) */
    safe(function () {
      var tools = qs('.v-tools'); if (!tools) return;
      var kb = document.createElement('button'); kb.type = 'button'; kb.id = 'vKeysBtn'; kb.className = 'v-tool'; kb.title = L('Keyboard shortcuts', 'Pintasan keyboard') + ' (?)'; kb.innerHTML = '<i class="fa fa-keyboard-o"></i>';
      tools.insertBefore(kb, qs('#vTheme') || null);
      var modal = document.createElement('div'); modal.id = 'vKeys'; modal.className = 'v-keys'; modal.hidden = true;
      var ROWS = [
        [['Ctrl', 'K'], L('Command palette', 'Command palette')],
        [['/'], L('Filter sidebar menu', 'Filter menu sidebar')],
        [['?'], L('This shortcuts sheet', 'Daftar pintasan ini')],
        [['Alt', 'M'], L('Collapse / expand sidebar', 'Ciutkan / lebarkan sidebar')],
        [['Alt', 'L'], L('Toggle dark / light', 'Ganti gelap / terang')],
        [['Alt', 'N'], L('Notifications', 'Notifikasi')],
        [['Alt', 'P'], L('Particle field settings', 'Setelan partikel latar')],
        [['Esc'], L('Close panel / modal', 'Tutup panel / modal')],
        [['Alt', '←'], L('Back (AJAX history)', 'Kembali (riwayat AJAX)')],
        [['Alt', 'R'], L('Reload page', 'Muat ulang halaman')]
      ];
      modal.innerHTML = '<div class="v-keys-box"><div class="v-keys-head"><i class="fa fa-keyboard-o"></i><strong>' + L('Keyboard Shortcuts', 'Pintasan Keyboard') + '</strong><button type="button" class="v-keys-close" id="vKeysClose"><i class="fa fa-times"></i></button></div>' +
        '<div class="v-keys-grid">' + ROWS.map(r => '<div class="v-keys-row"><span>' + esc(r[1]) + '</span><span class="kk">' + r[0].map(k => '<kbd>' + esc(k) + '</kbd>').join('') + '</span></div>').join('') + '</div>' +
        '<div class="v-keys-note">' + L('Shortcuts are disabled while typing in a field.', 'Pintasan nonaktif saat mengetik di kolom input.') + '</div></div>';
      document.body.appendChild(modal);
      function openK() { modal.hidden = false; }
      function closeK() { modal.hidden = true; }
      Venom.keys = { open: openK, close: closeK };
      kb.addEventListener('click', openK);
      qs('#vKeysClose', modal).addEventListener('click', closeK);
      modal.addEventListener('click', e => { if (e.target === modal) closeK(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeK(); });
      Venom._keysOpen = openK;
    });

    /* ACCENT POPOVER */
    safe(function () {
      var tools = qs('.v-tools'); if (!tools) return;
      var ab = document.createElement('button'); ab.type = 'button'; ab.id = 'vAccentBtn'; ab.className = 'v-tool'; ab.title = L('Accent presets', 'Preset accent'); ab.innerHTML = '<i class="fa fa-tint"></i>';
      tools.insertBefore(ab, qs('#vTheme') || null);
      var pop = document.createElement('div'); pop.id = 'vAccentPop'; pop.className = 'v-accent-pop'; pop.hidden = true;
      pop.innerHTML = '<div class="v-accent-title"><i class="fa fa-tint"></i>' + L('Accent', 'Aksen') + '</div><div class="v-accent-grid">' +
        PRESETS.map(p => '<button type="button" class="v-accent-sw" data-hex="' + p.h + '" title="' + esc(p.n) + '" style="background:' + p.h + ';color:' + p.h + '"></button>').join('') +
        '</div><label class="v-accent-custom"><input type="color" id="vAccentCustom" value="#00e57a"><span>' + L('Custom color', 'Warna kustom') + '</span></label>';
      document.body.appendChild(pop);
      var open = false;
      function setOpen(v) { open = v; pop.hidden = !v; if (v) { var cur = (getComputedStyle(document.documentElement).getPropertyValue('--v-accent') || '#00e57a').trim(); qsa('.v-accent-sw', pop).forEach(s => s.classList.toggle('on', s.dataset.hex === cur)); var ci = qs('#vAccentCustom', pop); if (ci) ci.value = cur; } }
      Venom.accentPop = { toggle: function () { setOpen(!open); }, close: function () { setOpen(false); } };
      ab.addEventListener('click', e => { e.stopPropagation(); setOpen(!open); });
      pop.addEventListener('click', e => { e.stopPropagation(); var sw = e.target.closest('.v-accent-sw'); if (sw) applyAccent(sw.dataset.hex, true); });
      qs('#vAccentCustom', pop).addEventListener('input', e => applyAccent(e.target.value, true));
      document.addEventListener('click', e => { if (open && !pop.contains(e.target) && !ab.contains(e.target)) setOpen(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) setOpen(false); });
      var cur0 = (getComputedStyle(document.documentElement).getPropertyValue('--v-accent') || '#00e57a').trim();
      qsa('.v-accent-sw', pop).forEach(s => s.classList.toggle('on', s.dataset.hex === cur0));
    });

    /* BELL NOTIFICATIONS */
    safe(function () {
      var tools = qs('.v-tools'); if (!tools) return;
      var META = { due: { icon: 'fa-clock-o', cls: 'g-warn', go: 'index.php?mod=circulation', en: 'Due Today', id: 'Jatuh Tempo Hari Ini' }, overdue: { icon: 'fa-exclamation-triangle', cls: 'g-danger', go: 'index.php?mod=circulation', en: 'Overdue', id: 'Terlambat' }, reserve: { icon: 'fa-bookmark', cls: 'g-info', go: 'index.php?mod=circulation', en: 'Pending Reserves', id: 'Reservasi Menunggu' }, stock: { icon: 'fa-cubes', cls: 'g-ok', go: 'index.php?mod=bibliography', en: 'Low Stock', id: 'Stok Menipis' } };
      var bell = document.createElement('button'); bell.type = 'button'; bell.id = 'vBell'; bell.className = 'v-tool v-bell'; bell.title = L('Notifications', 'Notifikasi') + ' (Alt+N)'; bell.setAttribute('aria-expanded', 'false'); bell.innerHTML = '<i class="fa fa-bell-o"></i><span class="v-bell-badge" hidden>0</span>';
      tools.insertBefore(bell, qs('#vTheme') || null);
      var badge = qs('.v-bell-badge', bell);
      var panel = document.createElement('div'); panel.id = 'vBellPanel'; panel.className = 'v-bell-panel'; panel.hidden = true;
      panel.innerHTML = '<div class="v-bell-head"><i class="fa fa-bell"></i><strong>' + L('Notifications', 'Notifikasi') + '</strong><span class="v-chip v-chip-accent" id="vBellCount">0</span><button type="button" class="v-bell-refresh" id="vBellRefresh" title="' + L('Refresh', 'Segarkan') + '"><i class="fa fa-refresh"></i></button></div><div id="vBellBody"></div><div class="v-bell-foot"><span id="vBellTime">—</span><span><kbd>Alt+N</kbd></span></div>';
      document.body.appendChild(panel);
      var pBody = qs('#vBellBody', panel), pFoot = qs('#vBellTime', panel), pCount = qs('#vBellCount', panel), refreshBtn = qs('#vBellRefresh', panel);
      var data = null, open = false, loading = false;
      function render() { var groups = (data && data.groups) || []; var act = groups.filter(g => g.count > 0 && META[g.key]); var total = act.reduce((s, g) => s + g.count, 0); badge.hidden = total === 0; badge.textContent = total > 99 ? '99+' : total; pCount.textContent = total; bell.classList.toggle('has-new', total > 0 && !open); pBody.innerHTML = act.length ? act.map(g => { var m = META[g.key]; return '<div class="v-bell-group ' + m.cls + '"><div class="v-bell-gtitle"><i class="fa ' + m.icon + '"></i>' + L(m.en, m.id) + '<span class="cnt">' + g.count + '</span></div>' + (g.items || []).map(it => '<button type="button" class="v-bell-item" data-go="' + m.go + '"><span class="t"><b>' + esc(it.t) + '</b><small>' + esc(it.s) + '</small></span><i class="fa fa-angle-right go"></i></button>').join('') + '</div>'; }).join('') : '<div class="v-bell-empty"><i class="fa fa-check-circle"></i>' + (data ? L('All clear. No notifications.', 'Semua aman. Tidak ada notifikasi.') : L('Could not load notifications.', 'Gagal memuat notifikasi.')) + '</div>'; pFoot.textContent = (data && data.generated) ? (L('Updated', 'Diperbarui') + ' ' + data.generated) : '—'; }
      function load() { if (loading) return; loading = true; refreshBtn.classList.add('spin'); fetch(API + '?action=notifications', { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } }).then(r => r.json()).then(d => { data = d; }).catch(() => {}).finally(() => { loading = false; refreshBtn.classList.remove('spin'); render(); }); }
      function setOpen(v) { open = v; panel.hidden = !v; bell.setAttribute('aria-expanded', v ? 'true' : 'false'); if (v) { bell.classList.remove('has-new'); if (!data) load(); } }
      bell.addEventListener('click', e => { e.stopPropagation(); setOpen(!open); });
      refreshBtn.addEventListener('click', e => { e.stopPropagation(); load(); });
      panel.addEventListener('click', e => { e.stopPropagation(); var it = e.target.closest('.v-bell-item'); if (it) { setOpen(false); location.assign(it.dataset.go); } });
      document.addEventListener('click', e => { if (open && !panel.contains(e.target) && !bell.contains(e.target)) setOpen(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) setOpen(false); if (e.altKey && !e.ctrlKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); setOpen(!open); } });
      setInterval(() => { if (!document.hidden) load(); }, 60000);
      load();
    });

    /* IDLE */
    safe(function () { var box = qs('#vIdle'); if (!C.idle || !box || !C.timeout || C.timeout < 300) return; var count = qs('#vIdleCount'), stay = qs('#vIdleStay'), out = qs('#vIdleOut'); var last = Date.now(), shown = false, limit = C.timeout * 1000, warnAt = limit - 120000; ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(ev => window.addEventListener(ev, debounce(() => { if (!shown) last = Date.now(); }, 4000), { passive: true })); setInterval(function () { var idle = Date.now() - last; if (!shown && idle >= warnAt) { shown = true; box.hidden = false; } if (shown) { var left = Math.max(0, Math.ceil((limit - idle) / 1000)); if (count) count.textContent = left; if (left <= 0) location.assign('logout.php'); } }, 1000); if (stay) stay.addEventListener('click', () => { fetch(window.location.href, { method: 'HEAD', credentials: 'same-origin', cache: 'no-store' }).catch(() => {}).finally(() => { last = Date.now(); shown = false; box.hidden = true; }); }); if (out) out.addEventListener('click', () => location.assign('logout.php')); });

    /* ENHANCER + FRAMES */
    safe(function () { if ($) { $(document).on('simbioAJAXloaded', debounce(() => { enhance(); localize(); }, 80)); $(document).on('cbox_complete cbox_load', () => { scanFrames(qs('#cboxLoadedContent') || document); setTimeout(() => scanFrames(qs('#cboxLoadedContent') || document), 250); }); } var mc = qs('#mainContent'); if (mc && window.MutationObserver) new MutationObserver(debounce(() => scanFrames(mc), 120)).observe(mc, { childList: true, subtree: true }); scanFrames(document); enhance(); });

    /* RIPPLE */
    safe(function () { document.addEventListener('click', e => { if (!fxOn()) return; var b = e.target.closest && e.target.closest('.btn'); if (!b) return; var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height); var sp = document.createElement('span'); sp.className = 'v-ripple'; sp.style.width = sp.style.height = s + 'px'; sp.style.left = (e.clientX - r.left - s / 2) + 'px'; sp.style.top = (e.clientY - r.top - s / 2) + 'px'; b.appendChild(sp); sp.addEventListener('animationend', () => sp.remove()); }); });

    /* SHORTCUTS */
    safe(function () {
      document.addEventListener('keydown', function (e) {
        if (e.isComposing) return;
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'k' || e.key === 'K')) { if (C.palette && Venom.palette) { e.preventDefault(); Venom.palette.open(); } return; }
        if (e.altKey && !e.ctrlKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); Venom.toggleRail && Venom.toggleRail(); return; }
        if (e.altKey && !e.ctrlKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); theme.toggle(); return; }
        if (editing(e)) return;
        if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); Venom.keys && Venom.keys.open(); return; }
        if (e.key === '/' && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); Venom.focusFilter && Venom.focusFilter(); }
        if (e.key === 'Escape') body.classList.remove('v-side-open');
      });
    });

    /* EASTER EGG */
    safe(function () { var buf = ''; document.addEventListener('keydown', e => { if (editing(e) || e.key.length !== 1) return; buf = (buf + e.key.toLowerCase()).slice(-8); if (buf.slice(-5) === 'venom' && fxOn()) { body.classList.add('v-symbiote'); Venom.toast('success', 'We are Venom.', '🐍'); setTimeout(() => body.classList.remove('v-symbiote'), 2600); } }); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();