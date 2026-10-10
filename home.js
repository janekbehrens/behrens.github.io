/* ============================================================
   home.js — homepage: the app switcher as a slideshow
   Plays through the apps (progress bar on the active app), pauses
   on hover, focus and touch, stops on any manual choice, never
   plays with "reduce motion". Arrows on the screenshot, swipe on
   phones, a pause/play button in the card header.
   The tab logic itself lives in redesign.js.
   ============================================================ */
(function () {
  'use strict';
  var card = document.querySelector('.switcher[data-slideshow]');
  if (!card) return;
  var list = card.querySelector('.switcher-list');
  var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
  if (tabs.length < 2) return;

  var DURATION = 7000;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = !reduce;      // user's choice (button) / autoplay allowed
  var hold = 0;               // > 0 while hovered, focused or touched
  var visible = false;
  var timer = null, startedAt = 0, remaining = DURATION;
  var programmatic = false;

  card.style.setProperty('--slide-ms', DURATION + 'ms');
  var panelsBox = document.getElementById(tabs[0].getAttribute('aria-controls')).parentElement;
  panelsBox.classList.add('slide-stage');

  // ── Controls: a small transparent strip on every screenshot (bottom right) ──
  var CTRL =
    '<div class="slide-ctrl" role="group" aria-label="Slideshow">' +
    '<button type="button" class="slide-btn" data-go="prev" aria-label="Previous app" title="Previous app"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg></button>' +
    '<button type="button" class="slide-btn slide-toggle" data-go="toggle"></button>' +
    '<button type="button" class="slide-btn" data-go="next" aria-label="Next app" title="Next app"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg></button>' +
    '</div>';
  tabs.forEach(function (t) {
    var panel = document.getElementById(t.getAttribute('aria-controls'));
    var frame = panel && panel.querySelector('.shot-frame');
    if (!frame) return;
    var wrap = document.createElement('div');
    wrap.className = 'shot-wrap';
    frame.parentNode.insertBefore(wrap, frame);
    wrap.appendChild(frame);
    wrap.insertAdjacentHTML('beforeend', CTRL);
  });
  var toggles = Array.prototype.slice.call(card.querySelectorAll('.slide-toggle'));

  // ── Progress bar inside each tab ──
  tabs.forEach(function (t) {
    var bar = document.createElement('span');
    bar.className = 'tab-progress';
    bar.setAttribute('aria-hidden', 'true');
    t.appendChild(bar);
  });

  function current() {
    for (var i = 0; i < tabs.length; i++) if (tabs[i].getAttribute('aria-selected') === 'true') return i;
    return 0;
  }
  function go(step) {
    var from = current();
    var to = (from + step + tabs.length) % tabs.length;
    var panel = document.getElementById(tabs[to].getAttribute('aria-controls'));
    if (panel) {
      panel.classList.remove('is-from-next', 'is-from-prev');
      void panel.offsetWidth; // restart the animation
      panel.classList.add(step > 0 ? 'is-from-next' : 'is-from-prev');
    }
    var active = document.activeElement;
    var refocus = active && active.closest && active.closest('.slide-ctrl') ? active.getAttribute('data-go') : null;
    programmatic = true;
    tabs[to].click();
    programmatic = false;
    if (refocus && panel) {
      var again = panel.querySelector('.slide-ctrl [data-go="' + refocus + '"]');
      if (again) again.focus({ preventScroll: true });
    }
    // keep the active chip visible in the horizontal list on phones (without moving the page)
    if (list.scrollWidth > list.clientWidth) {
      var lr = list.getBoundingClientRect(), tr = tabs[to].getBoundingClientRect();
      list.scrollTo({ left: list.scrollLeft + (tr.left - lr.left) - 4, behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  function running() { return playing && hold === 0 && visible && !document.hidden; }
  function schedule() {
    clearTimeout(timer);
    card.classList.toggle('is-playing', running());
    if (!running()) return;
    startedAt = Date.now();
    timer = setTimeout(function () { remaining = DURATION; go(1); restartBar(); schedule(); }, remaining);
  }
  function pauseClock() {
    if (timer) { clearTimeout(timer); timer = null; remaining = Math.max(400, remaining - (Date.now() - startedAt)); }
    card.classList.remove('is-playing');
  }
  function restartBar() {
    tabs.forEach(function (t) {
      var b = t.querySelector('.tab-progress');
      b.style.animation = 'none';
      void b.offsetWidth;
      b.style.animation = '';
    });
  }
  function update() {
    toggles.forEach(function (toggleBtn) {
    toggleBtn.setAttribute('aria-label', playing ? 'Pause the slideshow' : 'Play the slideshow');
    toggleBtn.title = playing ? 'Pause the slideshow' : 'Play the slideshow';
    toggleBtn.innerHTML = playing
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>';
    });
    panelsBox.setAttribute('aria-live', playing ? 'off' : 'polite');
    card.classList.toggle('is-stopped', !playing);
  }
  function stop() { playing = false; pauseClock(); remaining = DURATION; restartBar(); update(); }

  // Manual choices stop the slideshow
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { if (!programmatic) stop(); });
    t.addEventListener('keydown', function (e) {
      if (/^(Arrow|Home|End)/.test(e.key)) setTimeout(stop, 0);
    });
  });
  card.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]');
    if (!b) return;
    var what = b.getAttribute('data-go');
    if (what === 'toggle') {
      playing = !playing;
      if (playing) { remaining = DURATION; restartBar(); hold = 0; } // an explicit Play overrides the hover pause
      update(); schedule();
      return;
    }
    stop();
    go(what === 'next' ? 1 : -1);
  });

  // Pause while the visitor is looking at the slides or the list (not the header buttons)
  [panelsBox, list].forEach(function (el) {
    el.addEventListener('mouseenter', function () { hold++; pauseClock(); });
    el.addEventListener('mouseleave', function () { hold = Math.max(0, hold - 1); schedule(); });
    el.addEventListener('focusin', function () { hold++; pauseClock(); });
    el.addEventListener('focusout', function () { hold = Math.max(0, hold - 1); schedule(); });
  });

  // Swipe on phones
  var sx = 0, sy = 0, swiping = false;
  panelsBox.addEventListener('touchstart', function (e) {
    var t = e.touches[0]; sx = t.clientX; sy = t.clientY; swiping = true; hold++; pauseClock();
  }, { passive: true });
  panelsBox.addEventListener('touchend', function (e) {
    if (!swiping) return;
    swiping = false; hold = Math.max(0, hold - 1);
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { stop(); go(dx < 0 ? 1 : -1); }
    else schedule();
  }, { passive: true });

  // Only play while the card is on screen and the browser tab is visible
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) schedule(); else pauseClock();
    }, { threshold: 0.35 }).observe(card);
  } else { visible = true; }
  document.addEventListener('visibilitychange', function () { if (document.hidden) pauseClock(); else schedule(); });

  // #app-<id> in the URL opens that app and does not autoplay
  if (/^#app-\w+$/.test(location.hash)) playing = false;

  update();
  schedule();
})();
