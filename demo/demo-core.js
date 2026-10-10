/* ============================================================
   demo-core.js — small shell for the interactive app demos
   Tabs (scenarios), guided steps with a pulsing marker, reset,
   toast, entrance animation. Each demo supplies its own sample
   data, markup and handlers. No network requests, no storage.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function mount(root, cfg) {
    var state = cfg.initialState();
    var tab = cfg.tabs[0].id;
    var handlers = { click: [], input: [], change: [] };
    var toastTimer = null;

    root.classList.add('demo', 'is-hidden');
    root.innerHTML = [
      '<div class="demo-bar">',
      '  <div class="demo-tabs" role="tablist" aria-label="' + esc(cfg.title) + ' demo scenarios">',
      cfg.tabs.map(function (t, i) {
        return '<button class="demo-tab" role="tab" id="' + cfg.id + '-tab-' + t.id + '" aria-controls="' + cfg.id + '-panel" data-tab="' + t.id + '" aria-selected="false" tabindex="-1">' +
          '<span class="demo-tab-num" aria-hidden="true">' + (i + 1) + '</span>' + esc(t.label) + '</button>';
      }).join(''),
      '  </div>',
      '  <div class="demo-meta">',
      '    <span class="demo-label">Interactive demo with sample data</span>',
      '    <button class="demo-reset" type="button" title="Start the demo again with the original sample data">Reset</button>',
      '  </div>',
      '</div>',
      '<div class="demo-stage">',
      '  <div class="demo-window">',
      '    <div class="demo-panel" id="' + cfg.id + '-panel" role="tabpanel"></div>',
      '  </div>',
      '</div>',
      '<div class="demo-hint" aria-live="polite"></div>'
    ].join('\n');

    var panel = root.querySelector('.demo-panel');
    var hint = root.querySelector('.demo-hint');
    var windowEl = root.querySelector('.demo-window');

    var api = {
      state: function () { return state; },
      update: render,
      refreshHint: renderHint,
      toast: toast,
      esc: esc,
      tab: function () { return tab; },
      go: selectTab,
      on: function (type, selector, fn) { handlers[type].push([selector, fn]); },
      el: function (sel) { return panel.querySelector(sel); }
    };

    function toast(msg) {
      var old = windowEl.querySelector('.d-toast');
      if (old) old.remove();
      var t = document.createElement('div');
      t.className = 'd-toast';
      t.setAttribute('role', 'status');
      t.textContent = msg;
      windowEl.appendChild(t);
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { t.remove(); }, 2200);
    }

    function selectTab(id, focus) {
      tab = id;
      root.querySelectorAll('.demo-tab').forEach(function (b) {
        var on = b.dataset.tab === id;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      panel.setAttribute('aria-labelledby', cfg.id + '-tab-' + id);
      render();
    }

    function render() {
      var active = document.activeElement;
      var fid = active && panel.contains(active) ? active.getAttribute('data-fid') : null;
      panel.innerHTML = cfg.render(tab, state, api);
      if (fid) {
        var again = panel.querySelector('[data-fid="' + fid + '"]');
        if (again) again.focus({ preventScroll: true });
      }
      if (cfg.afterRender) cfg.afterRender(tab, state, api);
      renderHint();
    }

    function tabSteps(id) { return (cfg.steps && cfg.steps[id]) || []; }
    function tabDone(id) {
      var s = tabSteps(id);
      return s.length > 0 && s.every(function (st) { return st.done(state); });
    }

    function renderHint() {
      panel.querySelectorAll('.d-pulse').forEach(function (n) { n.classList.remove('d-pulse'); });
      root.querySelectorAll('.demo-tab').forEach(function (b) {
        b.classList.toggle('is-done', tabDone(b.dataset.tab));
      });
      var steps = tabSteps(tab);
      var idx = -1;
      for (var i = 0; i < steps.length; i++) { if (!steps[i].done(state)) { idx = i; break; } }
      var dots = '<span class="demo-hint-steps" aria-hidden="true">' + steps.map(function (st, i) {
        return '<i class="' + (st.done(state) ? 'ok' : (i === idx ? 'on' : '')) + '"></i>';
      }).join('') + '</span>';

      if (idx === -1) {
        var pos = cfg.tabs.findIndex(function (t) { return t.id === tab; });
        var next = cfg.tabs.slice(pos + 1).concat(cfg.tabs.slice(0, pos)).find(function (t) { return !tabDone(t.id); });
        hint.classList.add('is-done');
        hint.innerHTML = '<span class="demo-hint-icon" aria-hidden="true">✓</span>' +
          '<span class="demo-hint-text">' + (cfg.doneText && cfg.doneText[tab] ? cfg.doneText[tab] : '<strong>Done.</strong> Feel free to keep clicking around.') + '</span>' +
          dots + (next ? '<button type="button" class="demo-next" data-goto="' + next.id + '">Next: ' + esc(next.label) + ' →</button>' : '');
        return;
      }
      hint.classList.remove('is-done');
      var st = steps[idx];
      hint.innerHTML = '<span class="demo-hint-icon" aria-hidden="true">' + (idx + 1) + '</span>' +
        '<span class="demo-hint-text"><strong>Try it:</strong> ' + st.text + '</span>' + dots;
      if (st.target) {
        var target = panel.querySelector(st.target);
        if (target) target.classList.add('d-pulse');
      }
    }

    // ── Events (delegated) ──
    root.addEventListener('click', function (e) {
      var tabBtn = e.target.closest('.demo-tab');
      if (tabBtn) { selectTab(tabBtn.dataset.tab); return; }
      var go = e.target.closest('[data-goto]');
      if (go) { selectTab(go.dataset.goto, true); return; }
      if (e.target.closest('.demo-reset')) {
        state = cfg.initialState();
        selectTab(cfg.tabs[0].id);
        toast('Sample data restored');
        return;
      }
      dispatch('click', e);
    });
    root.addEventListener('input', function (e) { dispatch('input', e); });
    root.addEventListener('change', function (e) { dispatch('change', e); });
    root.querySelector('.demo-tabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      var ids = cfg.tabs.map(function (t) { return t.id; });
      var i = ids.indexOf(tab);
      if (e.key === 'ArrowRight') i = (i + 1) % ids.length;
      if (e.key === 'ArrowLeft') i = (i - 1 + ids.length) % ids.length;
      if (e.key === 'Home') i = 0;
      if (e.key === 'End') i = ids.length - 1;
      selectTab(ids[i], true);
    });

    function dispatch(type, e) {
      var list = handlers[type];
      for (var i = 0; i < list.length; i++) {
        var el = e.target.closest(list[i][0]);
        if (el && root.contains(el)) { list[i][1](el, e); return; }
      }
    }

    // ── Entrance: flat as soon as the demo scrolls into view ──
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { root.classList.remove('is-hidden'); io.disconnect(); }
        });
      }, { threshold: 0.15 });
      io.observe(root);
    } else {
      root.classList.remove('is-hidden');
    }

    if (cfg.setup) cfg.setup(api);
    // #demo-<tab id> in the URL opens that scenario, e.g. visual-progress-tracker.html#demo-dash
    var deep = /^#demo-([\w-]+)$/.exec(window.location.hash);
    if (deep && cfg.tabs.some(function (t) { return t.id === deep[1]; })) {
      tab = deep[1];
      setTimeout(function () { (root.closest('section') || root).scrollIntoView({ block: 'start' }); }, 0);
    }
    selectTab(tab);
    return api;
  }

  // Shared helpers for the progress look (red / yellow / green)
  function tone(value, low, high) {
    if (value === null || value === undefined) return 'grey';
    if (value < low) return 'red';
    if (value < high) return 'yellow';
    return 'green';
  }
  function bar(pct, t, extra) {
    var w = Math.max(0, Math.min(100, pct || 0));
    return '<div class="d-bar is-' + t + '"' + (extra || '') + '><i style="width:' + w + '%"></i></div>';
  }
  function loz(text, t) {
    return '<span class="d-loz is-' + t + '">' + esc(text) + '</span>';
  }
  function avatar(name, color) {
    var ini = name.split(' ').map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase();
    return '<span class="d-avatar" style="background:' + color + '" aria-hidden="true">' + ini + '</span>';
  }

  window.JBDemo = { mount: mount, esc: esc, tone: tone, bar: bar, loz: loz, avatar: avatar };
})();
