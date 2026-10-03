/* ===================================================================
   SachinCoderX — Premium 3D Batch Hub · app.js
   Vanilla JS, zero dependency. Har animation GPU par (transform/opacity).

   Performance notes
     - Grid ek hi baar render hota hai; filter sirf class toggle karta hai
       (DOM nodes dobara bante nahi) => zero GC churn, zero jank.
     - Scroll / pointermove handlers rAF se throttle hote hain.
     - IntersectionObserver reveal + count-up ke liye (scroll listener nahi).
     - prefers-reduced-motion + coarse pointer par tilt/parallax band.
   =================================================================== */
(function (global) {
  'use strict';

  var D = global.SCX_DATA;
  if (!D) return; // data.js load nahi hua

  /* ---------------- utils ---------------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /** rAF throttle — ek frame me ek hi baar chalega. */
  function rafThrottle(fn) {
    var queued = false;
    var lastArgs = null;
    return function () {
      lastArgs = arguments;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        fn.apply(null, lastArgs);
      });
    };
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  var store = {
    get: function (k, fallback) {
      try {
        var raw = global.localStorage.getItem(k);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (k, v) {
      try { global.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ }
    }
  };

  var mqReduce = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var mqFine = global.matchMedia ? global.matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };
  var reduced = function () { return !!mqReduce.matches; };
  var finePointer = function () { return !!mqFine.matches; };

  var catById = {};
  D.categories.forEach(function (c) { catById[c.id] = c; });

  /* ---------------- state ---------------- */
  var state = {
    query: '',
    cat: 'all',
    sort: 'pop',
    favOnly: false,
    view: store.get('scx:view', 'grid'),
    favs: {},
    unlocked: !!store.get('scx:unlocked', false),
    theme: document.documentElement.dataset.theme || 'dark'
  };
  (store.get('scx:favs', []) || []).forEach(function (id) { state.favs[id] = true; });

  /* ---------------- element refs ---------------- */
  var el = {
    nav: $('#nav'), progress: $('#progress'), grid: $('#grid'), chips: $('#chips'),
    q: $('#q'), qClear: $('#q-clear'), sort: $('#sort'),
    favOnly: $('#btn-fav-only'), view: $('#btn-view'), viewLabel: $('#view-label'),
    resCount: $('#res-count'), resFilter: $('#res-filter'), resReset: $('#res-reset'),
    empty: $('#empty'), stats: $('#stats'), marquee: $('#marquee'),
    favCount: $('#fav-count'), modal: $('#modal'), palette: $('#palette'),
    toasts: $('#toasts'), toTop: $('#to-top'), toTopRing: $('#to-top-ring'),
    ownerChip: $('#owner-chip')
  };

  /* ---------------- toasts ---------------- */
  function toast(msg, kind) {
    if (!el.toasts) return;
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' toast--' + kind : '');
    t.innerHTML = '<span class="toast__dot"></span><span>' + esc(msg) + '</span>';
    el.toasts.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, 2600);
  }

  /* ---------------- icons (small helpers) ---------------- */
  function icon(name) { return '<svg aria-hidden="true"><use href="#i-' + name + '" /></svg>'; }

  /* ---------------- render: chips ---------------- */
  function renderChips() {
    var counts = { all: D.batches.length };
    D.batches.forEach(function (b) { counts[b.cat] = (counts[b.cat] || 0) + 1; });

    var html = ['<button class="chip is-on" type="button" role="tab" aria-selected="true" data-cat="all">All <span class="chip__n">' + counts.all + '</span></button>'];
    D.categories.forEach(function (c) {
      if (!counts[c.id]) return;
      html.push('<button class="chip" type="button" role="tab" aria-selected="false" data-cat="' + c.id + '">' + esc(c.label) + ' <span class="chip__n">' + counts[c.id] + '</span></button>');
    });
    el.chips.innerHTML = html.join('');
  }

  /* ---------------- render: stats ---------------- */
  function renderStats() {
    el.stats.innerHTML = D.stats.map(function (s, i) {
      return '<div class="stat fade-up" style="--i:' + (i + 5) + '">' +
        '<div class="stat__v"><span data-count="' + s.value + '" data-suffix="' + esc(s.suffix) + '">0' + esc(s.suffix) + '</span></div>' +
        '<div class="stat__l">' + esc(s.label) + '</div></div>';
    }).join('');
  }

  function countUp(node) {
    var target = parseFloat(node.dataset.count) || 0;
    var suffix = node.dataset.suffix || '';
    if (reduced()) { node.textContent = target + suffix; return; }
    var t0 = performance.now(), dur = 950;
    (function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------------- render: cards ---------------- */
  function cardHTML(b, i) {
    var cat = catById[b.cat] || { label: b.cat, hue: 260 };
    var initials = b.title.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase() || 'S';
    var badge = b.badge ? '<span class="badge badge--auto' + (b.badge === 'New' ? ' badge--new' : '') + '">' + esc(b.badge) + '</span>' : '';
    var subs = b.subjects.map(function (s) { return '<span class="sub">' + esc(s) + '</span>'; }).join('');
    var lockIcon = state.unlocked ? 'unlock' : 'lock';
    var lockText = state.unlocked ? D.config.unlockedLabel : D.config.lockedLabel;

    return '' +
      '<article class="card" data-id="' + esc(b.id) + '" data-cat="' + esc(b.cat) + '" style="--hue:' + cat.hue + '">' +
        '<div class="card__spot" aria-hidden="true"></div>' +
        '<div class="card__media">' +
          '<div class="card__fallback" aria-hidden="true">' + esc(initials) + '</div>' +
          '<img class="card__img" src="' + esc(b.img) + '" alt="' + esc(b.title) + ' batch cover" ' +
            'width="640" height="360" decoding="async" referrerpolicy="no-referrer" loading="' + (i < 4 ? 'eager' : 'lazy') + '" />' +
          '<div class="card__skeleton" aria-hidden="true"></div>' +
          '<div class="card__badges"><span class="badge badge--cat">' + esc(cat.label) + '</span>' + badge + '</div>' +
        '</div>' +
        '<button class="card__fav" type="button" data-fav="' + esc(b.id) + '" aria-pressed="false" aria-label="' + esc(b.title) + ' ko favorite karo">' + icon('heart') + '</button>' +
        '<div class="card__body">' +
          '<h3 class="card__title">' + esc(b.title) + '</h3>' +
          '<div class="card__subs">' + subs + '</div>' +
          '<div class="card__meta">' +
            '<span>⚡ ' + esc(b.year) + '</span><span>·</span><span>🎥 ' + esc(b.tag) + '</span><span>·</span>' +
            '<span data-lock-label>' + (state.unlocked ? '🔓 ' : '🔒 ') + esc(state.unlocked ? 'Unlocked' : 'Locked') + '</span>' +
          '</div>' +
          '<div class="card__foot">' +
            '<span class="card__owner"><i>S</i>' + esc(D.config.owner) + '</span>' +
            '<button class="card__unlock" type="button" data-unlock="' + esc(b.id) + '">' +
              '<span aria-hidden="true">' + icon(lockIcon) + '</span>' + esc(lockText) +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderGrid() {
    el.grid.innerHTML = D.batches.map(cardHTML).join('');
    // image load / error handling
    $$('.card__img', el.grid).forEach(function (img) {
      var card = img.closest('.card');
      var skel = $('.card__skeleton', card);
      function done() { if (skel && skel.parentNode) skel.parentNode.removeChild(skel); }
      if (img.complete && img.naturalWidth > 0) { img.classList.add('is-loaded'); done(); return; }
      img.addEventListener('load', function () { img.classList.add('is-loaded'); done(); });
      img.addEventListener('error', function () { img.remove(); done(); });
      // slow network par skeleton hamesha ke liye na atke
      setTimeout(done, 7000);
    });
    syncFavUI();
    applyFilters(true);
  }

  /* ---------------- filtering / sorting ---------------- */
  function matchQuery(b, q) {
    if (!q) return true;
    var hay = (b.title + ' ' + b.cat + ' ' + (catById[b.cat] ? catById[b.cat].label : '') + ' ' + b.subjects.join(' ') + ' ' + b.year).toLowerCase();
    return q.split(/\s+/).every(function (tok) { return hay.indexOf(tok) !== -1; });
  }

  function visibleList() {
    var q = state.query.trim().toLowerCase();
    return D.batches.filter(function (b) {
      if (state.favOnly && !state.favs[b.id]) return false;
      if (state.cat !== 'all' && b.cat !== state.cat) return false;
      return matchQuery(b, q);
    });
  }

  function applyFilters(firstRender) {
    var list = visibleList();
    var ids = {};
    list.forEach(function (b) { ids[b.id] = true; });

    var cards = $$('.card', el.grid);
    var shown = 0;

    cards.forEach(function (card) {
      var on = !!ids[card.dataset.id];
      card.classList.toggle('is-hidden', !on);
      if (on) {
        card.style.setProperty('--i', String(shown % 12));
        shown++;
        if (!firstRender && !reduced()) {
          card.classList.remove('is-enter');
          // reflow-free restart: next frame me class wapas lagao
          requestAnimationFrame(function () { card.classList.add('is-enter'); });
        } else if (firstRender) {
          card.classList.add('is-enter');
        }
      } else {
        card.classList.remove('is-enter');
      }
    });

    // order (list view / sort) — DOM ko chhede bina CSS order use karte hain
    var orderIndex = {};
    sortList(list).forEach(function (b, i) { orderIndex[b.id] = i; });
    cards.forEach(function (card) {
      card.style.order = orderIndex[card.dataset.id] === undefined ? 999 : orderIndex[card.dataset.id];
    });

    el.resCount.textContent = list.length;
    el.resFilter.textContent = state.favOnly
      ? 'Favorites only'
      : (state.cat === 'all' ? 'All categories' : (catById[state.cat] ? catById[state.cat].label : state.cat)) + (state.query ? ' · "' + state.query + '"' : '');
    var dirty = state.cat !== 'all' || state.favOnly || state.query !== '';
    el.resReset.hidden = !dirty;
    el.empty.classList.toggle('is-on', list.length === 0);
  }

  function sortList(list) {
    var out = list.slice();
    if (state.sort === 'az') out.sort(function (a, b) { return a.title.localeCompare(b.title); });
    else if (state.sort === 'za') out.sort(function (a, b) { return b.title.localeCompare(a.title); });
    else if (state.sort === 'new') out.sort(function (a, b) { return (b.badge === 'New' ? 1 : 0) - (a.badge === 'New' ? 1 : 0) || b.pop - a.pop; });
    else out.sort(function (a, b) { return b.pop - a.pop; });
    // favorites hamesha top par
    out.sort(function (a, b) { return (state.favs[b.id] ? 1 : 0) - (state.favs[a.id] ? 1 : 0); });
    return out;
  }

  /* ---------------- favorites ---------------- */
  function setFav(id, on) {
    if (on) state.favs[id] = true; else delete state.favs[id];
    store.set('scx:favs', Object.keys(state.favs));
    syncFavUI();
    applyFilters(false);
    var b = D.batches.filter(function (x) { return x.id === id; })[0];
    toast((on ? '❤️ ' : '💔 ') + (b ? b.title : 'Batch') + (on ? ' favorites me add ho gaya' : ' favorites se hata diya'), on ? 'ok' : '');
  }

  function syncFavUI() {
    var n = Object.keys(state.favs).length;
    $$('.card', el.grid).forEach(function (card) {
      var on = !!state.favs[card.dataset.id];
      card.classList.toggle('is-fav', on);
      var btn = $('.card__fav', card);
      if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (el.favCount) {
      el.favCount.textContent = n;
      el.favCount.classList.toggle('is-on', n > 0);
    }
    if (el.favOnly) el.favOnly.setAttribute('aria-pressed', state.favOnly ? 'true' : 'false');
  }

  /* ---------------- unlock ---------------- */
  var focusBefore = null;

  function openUnlock(batchId) {
    var modal = el.modal;
    focusBefore = document.activeElement;
    $('#modal-form-view').hidden = false;
    $('#modal-done-view').hidden = true;
    $('#code').value = '';
    $('#form-msg').textContent = '';
    $('#form-msg').classList.remove('is-ok');
    modal.classList.remove('is-error');
    modal.dataset.batch = batchId || '';
    var b = batchId ? D.batches.filter(function (x) { return x.id === batchId; })[0] : null;
    $('#modal-target').textContent = b ? b.title + ' · ' + (catById[b.cat] || {}).label : 'Poora library · ' + D.batches.length + ' batches';
    $('#modal-owner').textContent = D.config.ownerHandle;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      modal.classList.add('is-open');
      var inp = $('#code');
      if (inp) inp.focus();
    });
  }

  function closeUnlock() {
    var modal = el.modal;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      modal.hidden = true;
      if (focusBefore && focusBefore.focus) focusBefore.focus();
    }, 240);
  }

  function doUnlock(code) {
    var msg = $('#form-msg');
    var clean = String(code || '').trim().toUpperCase();
    if (!clean) {
      el.modal.classList.add('is-error');
      msg.classList.remove('is-ok');
      msg.textContent = 'Pehle code likhiye.';
      setTimeout(function () { el.modal.classList.remove('is-error'); }, 450);
      return false;
    }
    if (clean !== String(D.config.accessCode).toUpperCase()) {
      el.modal.classList.add('is-error');
      msg.classList.remove('is-ok');
      msg.textContent = 'Ye code galat hai. Owner se sahi code lijiye.';
      setTimeout(function () { el.modal.classList.remove('is-error'); }, 450);
      return false;
    }
    state.unlocked = true;
    store.set('scx:unlocked', true);
    paintUnlocked();
    $('#modal-form-view').hidden = true;
    $('#modal-done-view').hidden = false;
    $('#done-desc').textContent = D.batches.length + ' batches ab access-ready hain.';
    toast('🎉 Unlock successful — poori library khul gayi', 'ok');
    return true;
  }

  function paintUnlocked() {
    $$('.card', el.grid).forEach(function (card) {
      card.classList.toggle('is-unlocked', state.unlocked);
      var btn = $('.card__unlock', card);
      if (!btn) return;
      btn.innerHTML = '<span aria-hidden="true">' + icon(state.unlocked ? 'unlock' : 'lock') + '</span>' +
        esc(state.unlocked ? D.config.unlockedLabel : D.config.lockedLabel);
      var lbl = $('[data-lock-label]', card);
      if (lbl) lbl.textContent = (state.unlocked ? '🔓 ' : '🔒 ') + (state.unlocked ? 'Unlocked' : 'Locked');
    });
  }

  /* ---------------- command palette ---------------- */
  var palIndex = 0;

  function paletteItems(q) {
    var query = (q || '').trim().toLowerCase();
    var actions = [
      { g: 'Actions', t: 'Batches section par jao', run: function () { scrollToId('batches'); } },
      { g: 'Actions', t: 'Theme toggle karo', run: function () { toggleTheme(); } },
      { g: 'Actions', t: 'Sirf favorites dikhao', run: function () { state.favOnly = true; syncFavUI(); applyFilters(false); scrollToId('batches'); } },
      { g: 'Actions', t: 'Access code se unlock karo', run: function () { openUnlock(''); } }
    ];
    var cats = D.categories.map(function (c) {
      return { g: 'Categories', t: c.label, s: 'filter', run: function () { setCat(c.id); scrollToId('batches'); } };
    });
    var batches = D.batches.map(function (b) {
      return {
        g: 'Batches', t: b.title, s: (catById[b.cat] || {}).label,
        run: function () { scrollToId('batches'); focusBatch(b.id); }
      };
    });
    var all = actions.concat(cats, batches);
    if (!query) return all.slice(0, 12);
    return all.filter(function (it) { return (it.t + ' ' + (it.s || '') + ' ' + it.g).toLowerCase().indexOf(query) !== -1; }).slice(0, 14);
  }

  function renderPalette(q) {
    var items = paletteItems(q);
    palIndex = 0;
    if (!items.length) {
      el.palette.querySelector('#palette-list').innerHTML = '<div class="palette__group">Koi result nahi</div>';
      return;
    }
    var html = '', lastG = '';
    items.forEach(function (it, i) {
      if (it.g !== lastG) { html += '<div class="palette__group">' + esc(it.g) + '</div>'; lastG = it.g; }
      html += '<button class="palette__item' + (i === 0 ? ' is-active' : '') + '" type="button" role="option" data-i="' + i + '">' +
        esc(it.t) + (it.s ? '<small>' + esc(it.s) + '</small>' : '') + '</button>';
    });
    el.palette.querySelector('#palette-list').innerHTML = html;
    el.palette._items = items;
  }

  function movePalette(dir) {
    var nodes = $$('.palette__item', el.palette);
    if (!nodes.length) return;
    nodes[palIndex] && nodes[palIndex].classList.remove('is-active');
    palIndex = (palIndex + dir + nodes.length) % nodes.length;
    nodes[palIndex].classList.add('is-active');
    nodes[palIndex].scrollIntoView({ block: 'nearest' });
  }

  function openPalette() {
    closeUnlock();
    el.palette.hidden = false;
    document.body.style.overflow = 'hidden';
    renderPalette('');
    requestAnimationFrame(function () {
      el.palette.classList.add('is-open');
      var inp = $('#palette-q');
      inp.value = '';
      inp.focus();
    });
  }

  function closePalette() {
    el.palette.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { el.palette.hidden = true; }, 200);
  }

  /* ---------------- navigation helpers ---------------- */
  function scrollToId(id) {
    var node = document.getElementById(id);
    if (!node) return;
    var y = node.getBoundingClientRect().top + window.pageYOffset - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68) - 22;
    window.scrollTo({ top: Math.max(y, 0), behavior: reduced() ? 'auto' : 'smooth' });
  }

  function focusBatch(id) {
    var card = $('.card[data-id="' + id + '"]', el.grid);
    if (!card) return;
    card.classList.remove('is-hidden');
    card.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    card.classList.remove('is-enter');
    requestAnimationFrame(function () { card.classList.add('is-enter'); });
  }

  function setCat(id) {
    state.cat = id;
    $$('.chip', el.chips).forEach(function (c) {
      var on = c.dataset.cat === id;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    applyFilters(false);
  }

  /* ---------------- theme ---------------- */
  function toggleTheme() {
    var next = state.theme === 'dark' ? 'light' : 'dark';
    state.theme = next;
    document.documentElement.dataset.theme = next;
    store.set('scx:theme', next);
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#06070c' : '#f6f7fb');
    toast(next === 'dark' ? '🌙 Dark mode' : '☀️ Light mode');
  }

  /* ---------------- scroll: progress, nav, to-top ---------------- */
  var lastY = -1;
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (y === lastY) return;
    lastY = y;
    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    var p = clamp(y / max, 0, 1);
    if (el.progress) el.progress.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (el.nav) el.nav.classList.toggle('is-stuck', y > 8);
    if (el.toTop) el.toTop.classList.toggle('is-on', y > 520);
    if (el.toTopRing) el.toTopRing.style.strokeDashoffset = String(145 - 145 * p);
    // owner chip scroll par jaldi chhupa do
    if (el.ownerChip && y > 240) el.ownerChip.classList.add('is-out');
  }
  var onScrollRaf = rafThrottle(onScroll);

  /* ---------------- reveal + count-up observers ---------------- */
  function initObservers() {
    var supportsIO = typeof global.IntersectionObserver === 'function';
    var revealNodes = $$('.reveal');
    if (!supportsIO || reduced()) {
      revealNodes.forEach(function (n) { n.classList.add('is-in'); });
      $$('.stat__v span').forEach(function (n) { n.textContent = n.dataset.count + n.dataset.suffix; });
      return;
    }
    var io = new global.IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealNodes.forEach(function (n, i) { n.style.setProperty('--d', i % 4); io.observe(n); });

    var statIO = new global.IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        $$('span', en.target).forEach(countUp);
        statIO.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    if (el.stats) statIO.observe(el.stats);

    // active nav link
    var navIO = new global.IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        $$('.nav__link').forEach(function (l) {
          l.classList.toggle('is-active', l.dataset.nav === en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['batches', 'features', 'how', 'faq'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) navIO.observe(n);
    });
  }

  /* ---------------- 3D tilt + spotlight ---------------- */
  function initTilt() {
    if (!finePointer()) return;
    var MAX = 7;
    el.grid.addEventListener('pointermove', function (e) {
      if (reduced()) return;
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (!card) return;
      if (card._tiltPending) {
        card._tiltX = e.clientX; card._tiltY = e.clientY;
        return;
      }
      card._tiltPending = true;
      card._tiltX = e.clientX; card._tiltY = e.clientY;
      card.style.transition = 'transform 110ms linear';
      requestAnimationFrame(function () {
        card._tiltPending = false;
        var r = card.getBoundingClientRect();
        var px = (card._tiltX - r.left) / r.width;
        var py = (card._tiltY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100).toFixed(2) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(2) + '%');
        card.style.transform = 'translate3d(0,-6px,0) rotateX(' + ((0.5 - py) * MAX).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * MAX).toFixed(2) + 'deg)';
      });
    }, { passive: true });

    // grid se bahar nikle ya card change ho => tilt reset
    el.grid.addEventListener('pointerout', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (!card) return;
      var to = e.relatedTarget;
      if (!to || !card.contains(to)) resetTilt(card);
    });
  }
  function resetTilt(card) {
    if (!card) return;
    card.style.transition = '';
    card.style.transform = '';
  }

  /* ---------------- hero parallax ---------------- */
  function initParallax() {
    var stage = $('#hero-stage');
    if (!stage || !finePointer()) return;
    var cards = $$('.float-card', stage);
    var pending = false, cx = 0, cy = 0;
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      cx = (e.clientX - r.left) / r.width - 0.5;
      cy = (e.clientY - r.top) / r.height - 0.5;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        cards.forEach(function (c) {
          var d = parseFloat(c.dataset.depth) || 0.06;
          c.style.translate = (cx * d * 260).toFixed(1) + 'px ' + (cy * d * 260).toFixed(1) + 'px';
        });
      });
    }, { passive: true });
    stage.addEventListener('pointerleave', function () {
      cards.forEach(function (c) { c.style.translate = '0px 0px'; });
    });
  }

  /* ---------------- render: features / steps / faq / marquee ---------------- */
  function renderStatic() {
    $('#features-grid').innerHTML = D.features.map(function (f, i) {
      return '<article class="feature reveal" style="--d:' + (i % 4) + '">' +
        '<div class="feature__icon">' + icon(f.icon) + '</div>' +
        '<h3>' + esc(f.title) + '</h3><p>' + esc(f.text) + '</p></article>';
    }).join('');

    $('#steps').innerHTML = D.steps.map(function (s, i) {
      return '<article class="step reveal" style="--d:' + (i % 4) + '">' +
        '<div class="step__n">' + esc(s.n) + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></article>';
    }).join('');

    $('#faq-list').innerHTML = D.faqs.map(function (f) {
      return '<div class="faq__item">' +
        '<button class="faq__q" type="button" aria-expanded="false">' + esc(f.q) +
          '<i aria-hidden="true">' + icon('plus') + '</i></button>' +
        '<div class="faq__panel"><div><p>' + esc(f.a) + '</p></div></div></div>';
    }).join('');

    var names = D.batches.map(function (b) { return '<span class="marquee__item"><i></i>' + esc(b.title) + '</span>'; }).join('');
    el.marquee.innerHTML = '<div>' + names + '</div><div>' + names + '</div>';

    var total = $('#batch-total');
    if (total) total.textContent = '(' + D.batches.length + ')';
    var y = $('#year');
    if (y) y.textContent = String(new Date().getFullYear());
    var hint = $('#q-hint');
    if (hint) {
      var ua = (global.navigator && (global.navigator.platform || global.navigator.userAgent)) || '';
      hint.textContent = /Mac|iPhone|iPad/.test(ua) ? '⌘K' : 'Ctrl K';
    }
  }

  /* ---------------- events ---------------- */
  function initEvents() {
    // grid delegation: fav + unlock
    el.grid.addEventListener('click', function (e) {
      var favBtn = e.target.closest('[data-fav]');
      if (favBtn) {
        setFav(favBtn.dataset.fav, !state.favs[favBtn.dataset.fav]);
        return;
      }
      var unlockBtn = e.target.closest('[data-unlock]');
      if (!unlockBtn) return;
      var b = D.batches.filter(function (x) { return x.id === unlockBtn.dataset.unlock; })[0];
      if (state.unlocked && b && b.accessUrl) {
        global.open(b.accessUrl, '_blank', 'noopener');
        toast('🚀 ' + b.title + ' khol rahe hain', 'ok');
        return;
      }
      if (state.unlocked) {
        toast('ℹ️ Is batch ka link owner ne abhi attach nahi kiya');
        return;
      }
      openUnlock(unlockBtn.dataset.unlock);
    });

    // chips
    el.chips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip) setCat(chip.dataset.cat);
    });

    // search (debounced — typing smooth rehti hai)
    var runFilter = debounce(function () { applyFilters(false); }, 110);
    el.q.addEventListener('input', function () {
      state.query = el.q.value;
      el.qClear.classList.toggle('is-on', el.q.value.length > 0);
      runFilter();
    });
    el.qClear.addEventListener('click', function () {
      el.q.value = ''; state.query = '';
      el.qClear.classList.remove('is-on');
      applyFilters(false);
      el.q.focus();
    });
    el.sort.addEventListener('change', function () { state.sort = el.sort.value; applyFilters(false); });

    el.favOnly.addEventListener('click', function () {
      state.favOnly = !state.favOnly;
      el.favOnly.classList.toggle('is-on', state.favOnly);
      syncFavUI();
      applyFilters(false);
      if (state.favOnly && !Object.keys(state.favs).length) toast('Pehle kisi batch ko ❤️ karo');
    });

    el.view.addEventListener('click', function () {
      state.view = state.view === 'grid' ? 'list' : 'grid';
      el.grid.dataset.view = state.view;
      el.viewLabel.textContent = state.view === 'grid' ? 'List' : 'Grid';
      el.view.setAttribute('aria-pressed', state.view === 'list' ? 'true' : 'false');
      el.view.querySelector('use').setAttribute('href', state.view === 'grid' ? '#i-rows' : '#i-grid');
      store.set('scx:view', state.view);
    });

    function resetAll() {
      state.query = ''; state.cat = 'all'; state.favOnly = false;
      el.q.value = ''; el.qClear.classList.remove('is-on');
      el.favOnly.classList.remove('is-on');
      setCat('all'); syncFavUI(); applyFilters(false);
    }
    el.resReset.addEventListener('click', resetAll);
    $('#empty-reset').addEventListener('click', resetAll);

    // favorites shortcuts
    function goToFavs() {
      state.favOnly = true;
      el.favOnly.classList.add('is-on');
      syncFavUI(); applyFilters(false); scrollToId('batches');
      if (!Object.keys(state.favs).length) toast('Abhi koi favorite nahi — kisi batch par ❤️ dabao');
    }
    ['btn-favs', 'btn-favs-hero', 'btn-favs-cta'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.addEventListener('click', goToFavs);
    });

    // unlock buttons
    ['btn-unlock-nav', 'btn-unlock-hero', 'btn-unlock-cta'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.addEventListener('click', function () { openUnlock(''); });
    });

    // modal
    el.modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeUnlock(); });
    $('#unlock-form').addEventListener('submit', function (e) {
      e.preventDefault();
      doUnlock($('#code').value);
    });
    $('#code-eye').addEventListener('click', function () {
      var inp = $('#code');
      var show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      $('#code-eye').querySelector('use').setAttribute('href', show ? '#i-eye-off' : '#i-eye');
      inp.focus();
    });
    $('#code').addEventListener('input', function () {
      $('#form-msg').textContent = '';
      el.modal.classList.remove('is-error');
    });

    // palette
    $('#btn-palette').addEventListener('click', openPalette);
    el.palette.addEventListener('click', function (e) {
      if (e.target === el.palette) { closePalette(); return; }
      var item = e.target.closest('.palette__item');
      if (!item) return;
      var it = (el.palette._items || [])[parseInt(item.dataset.i, 10)];
      closePalette();
      if (it) setTimeout(it.run, 120);
    });
    $('#palette-q').addEventListener('input', function () { renderPalette(this.value); });
    $('#palette-q').addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); movePalette(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); movePalette(-1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var nodes = $$('.palette__item', el.palette);
        var it = (el.palette._items || [])[palIndex];
        closePalette();
        if (it) setTimeout(it.run, 120);
        if (nodes[palIndex]) nodes[palIndex].classList.remove('is-active');
      }
    });

    // faq accordion
    $('#faq-list').addEventListener('click', function (e) {
      var btn = e.target.closest('.faq__q');
      if (!btn) return;
      var item = btn.parentNode;
      var open = !item.classList.contains('is-open');
      $$('.faq__item', $('#faq-list')).forEach(function (i) {
        i.classList.remove('is-open');
        $('.faq__q', i).setAttribute('aria-expanded', 'false');
      });
      if (open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    });

    // theme
    $('#btn-theme').addEventListener('click', toggleTheme);

    // to-top
    el.toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    });

    // keyboard shortcuts
    document.addEventListener('keydown', function (e) {
      var mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); el.palette.hidden ? openPalette() : closePalette(); return; }
      if (e.key === 'Escape') {
        if (!el.palette.hidden) { closePalette(); return; }
        if (!el.modal.hidden) { closeUnlock(); return; }
      }
      if (e.key === '/' && el.palette.hidden) {
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); el.q.focus(); }
      }
    });

    // modal focus trap
    el.modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = $$('button, input, [href]', el.modal).filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.addEventListener('scroll', onScrollRaf, { passive: true });
    window.addEventListener('resize', rafThrottle(onScroll), { passive: true });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    renderStatic();
    renderChips();
    renderStats();
    renderGrid();

    el.grid.dataset.view = state.view;
    el.viewLabel.textContent = state.view === 'grid' ? 'List' : 'Grid';
    el.view.querySelector('use').setAttribute('href', state.view === 'grid' ? '#i-rows' : '#i-grid');
    paintUnlocked();

    initEvents();
    initObservers();
    initTilt();
    initParallax();
    onScroll();

    // hero intro
    requestAnimationFrame(function () { document.body.classList.add('is-ready'); });

    // owner chip: 5s baad fade
    setTimeout(function () { if (el.ownerChip) el.ownerChip.classList.add('is-out'); }, 5000);

    if (location.hash) setTimeout(function () { scrollToId(location.hash.replace('#', '')); }, 300);

    // debug / test surface
    global.SCX = {
      state: state,
      api: {
        setCat: setCat, applyFilters: applyFilters, setFav: setFav, doUnlock: doUnlock,
        toggleTheme: toggleTheme, openUnlock: openUnlock, closeUnlock: closeUnlock,
        openPalette: openPalette, closePalette: closePalette, toast: toast, visibleList: visibleList
      },
      data: D
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
