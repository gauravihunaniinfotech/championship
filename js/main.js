/* =========================================================
   CHAMPIONSHIP CHAINS — main.js (vanilla, no dependencies)
   Header · menu · search · reveal · counters · marquee ·
   video · review rail · back-to-top
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Adds .js so reveal styles only apply when scripting works
  document.documentElement.classList.add('js');

  /* ---------- Header + back-to-top ---------- */
  function initHeader() {
    var header = $('#header');
    var toTop = $('#toTop');
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 20);
      if (toTop) toTop.classList.toggle('is-visible', y > 900);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();

    if (toTop) toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Full-screen menu ---------- */
  var menu, menuBtn, search, lastFocus;

  function openMenu() {
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var c = $('#menuClose'); if (c) c.focus(); }, 400);
  }
  function closeMenu() {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initMenu() {
    menu = $('#menu');
    menuBtn = $('#menuOpen');
    if (!menu || !menuBtn) return;
    menuBtn.addEventListener('click', openMenu);
    $('#menuClose').addEventListener('click', closeMenu);
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1100) closeMenu(); });
  }

  /* ---------- Search ---------- */
  var searchTimer;
  function openSearch() {
    lastFocus = document.activeElement;
    clearTimeout(searchTimer);
    search.hidden = false;
    requestAnimationFrame(function () { search.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var q = $('#q'); if (q) q.focus(); }, 250);
  }
  function closeSearch() {
    if (!search || search.hidden) return;
    search.classList.remove('is-open');
    document.body.style.overflow = '';
    searchTimer = setTimeout(function () { search.hidden = true; }, 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function initSearch() {
    search = $('#search');
    var open = $('#searchOpen'), close = $('#searchClose');
    if (!search || !open) return;
    open.addEventListener('click', openSearch);
    if (close) close.addEventListener('click', closeSearch);
    search.addEventListener('click', function (e) { if (e.target === search) closeSearch(); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeSearch(); closeMenu(); }
  });

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = $$('.rv');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    // small stagger for siblings that enter together
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty('--d', (Math.min(n, 5) * 0.09) + 's');
        entry.target.classList.add('in');
        io.unobserve(entry.target);
        n++;
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up numbers ---------- */
  function initCounters() {
    var els = $$('[data-count]');
    if (!els.length || reduce || !('IntersectionObserver' in window)) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var t0 = null, dur = 1600;
      function tick(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run(e.target);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) {
      el.textContent = (0).toFixed(parseInt(el.getAttribute('data-decimals') || '0', 10));
      io.observe(el);
    });
  }

  /* ---------- Marquees (announcement bar + brand logos) ---------- */
  function initMarquees() {
    $$('[data-marquee]').forEach(function (m) {
      var track = $('.marquee__track', m);
      if (!track) return;
      var speed = parseFloat(m.getAttribute('data-speed')) || 40; // px / second
      var base = Array.prototype.slice.call(track.children);
      var clone;

      function build() {
        // reset
        if (clone) { clone.remove(); clone = null; }
        while (track.children.length > base.length) track.removeChild(track.lastChild);
        // repeat items until one track is wider than the viewport
        var guard = 0;
        while (track.scrollWidth < m.clientWidth * 1.05 && guard++ < 12) {
          base.forEach(function (el) { track.appendChild(el.cloneNode(true)); });
        }
        clone = track.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        m.appendChild(clone);
        var w = track.scrollWidth;
        m.style.setProperty('--dur', Math.max(w / speed, 12) + 's');
        track.style.setProperty('--dur', Math.max(w / speed, 12) + 's');
        clone.style.setProperty('--dur', Math.max(w / speed, 12) + 's');
      }

      var t;
      build();
      window.addEventListener('load', build);
      window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(build, 200); });
    });
  }

  /* ---------- Video (set data-video on #videoPlay) ----------
     Accepts a YouTube link, a Vimeo link, or a direct .mp4 / .webm URL */
  function initVideo() {
    var frame = $('#videoFrame'), btn = $('#videoPlay');
    if (!frame || !btn) return;

    btn.addEventListener('click', function () {
      var url = (btn.getAttribute('data-video') || '').trim();
      if (!url) { console.warn('Add a video link to the data-video attribute on #videoPlay.'); return; }

      var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
      var vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      var el;
      if (yt || vm) {
        el = document.createElement('iframe');
        el.src = yt
          ? 'https://www.youtube.com/embed/' + yt[1] + '?autoplay=1&rel=0&modestbranding=1'
          : 'https://player.vimeo.com/video/' + vm[1] + '?autoplay=1';
        el.allow = 'autoplay; fullscreen; picture-in-picture';
        el.allowFullscreen = true;
        el.title = 'Championship Chains video';
      } else {
        el = document.createElement('video');
        el.src = url; el.controls = true; el.autoplay = true; el.playsInline = true;
      }
      el.className = 'video__el';
      frame.appendChild(el);
      frame.classList.add('is-playing');
    });
  }

  /* ---------- Reviews rail (CSS scroll-snap + arrows + counter) ---------- */
  function initRail() {
    var rail = $('#rail');
    if (!rail) return;
    var cards = $$('.review', rail);
    var prev = $('#railPrev'), next = $('#railNext');
    var cur = $('#railCur'), total = $('#railTotal'), bar = $('#railBar');
    var pad = function (n) { return String(n).padStart(2, '0'); };
    if (total) total.textContent = pad(cards.length);

    function step() {
      var c = cards[0];
      return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 16) : 300;
    }
    function update() {
      var max = rail.scrollWidth - rail.clientWidth;
      var atEnd = rail.scrollLeft >= max - 4;
      var idx = Math.round(rail.scrollLeft / step());
      var visible = Math.max(1, Math.round(rail.clientWidth / step()));
      var last = atEnd ? cards.length : Math.min(idx + visible, cards.length);
      if (cur) cur.textContent = pad(last);
      if (bar) bar.style.transform = 'scaleX(' + (last / cards.length) + ')';
      if (prev) prev.disabled = rail.scrollLeft <= 4;
      if (next) next.disabled = atEnd;
    }
    if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
    rail.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    rail.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { rail.scrollBy({ left: step(), behavior: 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { rail.scrollBy({ left: -step(), behavior: 'smooth' }); e.preventDefault(); }
    });
    update();
  }

  /* ---------- Hero: gentle pointer parallax (fine pointers only) ---------- */
  function initParallax() {
    var vis = $('.hero__visual');
    if (!vis || reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var seal = $('.seal', vis), card = $('.float-card', vis);
    vis.addEventListener('mousemove', function (e) {
      var r = vis.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5;
      var y = (e.clientY - r.top) / r.height - .5;
      if (seal) seal.style.translate = (x * -18) + 'px ' + (y * -18) + 'px';
      if (card) card.style.translate = (x * 18) + 'px ' + (y * 14) + 'px';
    });
    vis.addEventListener('mouseleave', function () {
      if (seal) seal.style.translate = '';
      if (card) card.style.translate = '';
    });
  }

  /* ---------- boot: each part isolated so one error can't stop the rest ---------- */
  function init() {
    [initHeader, initMenu, initSearch, initReveal, initCounters, initMarquees, initVideo, initRail, initParallax]
      .forEach(function (fn) {
        try { fn(); } catch (err) { console.error('[main.js] ' + fn.name + ' failed:', err); }
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
