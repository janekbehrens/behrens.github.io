/* ============================================================
   docs.js — documentation pages: sidebar highlight, lightbox
   for screenshots, explanations for <dfn class="term" data-tip>.
   The explanations also work on other pages that load this file.
   ============================================================ */
(function () {
  'use strict';

  // ── Explanations on hover, focus or tap ──
  var tip = null, owner = null, uid = 0, openedAt = 0;
  function hideTip() {
    if (tip) { tip.remove(); tip = null; }
    if (owner) { owner.removeAttribute('aria-describedby'); owner = null; }
  }
  function showTip(el) {
    if (owner === el) return;
    hideTip();
    owner = el;
    openedAt = Date.now();
    tip = document.createElement('span');
    tip.className = 'term-tip';
    tip.id = 'term-tip-' + (++uid);
    tip.setAttribute('role', 'tooltip');
    tip.textContent = el.getAttribute('data-tip');
    document.body.appendChild(tip);
    el.setAttribute('aria-describedby', tip.id);
    var r = el.getBoundingClientRect();
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), document.documentElement.clientWidth - w - 8);
    var top = r.top - h - 8;
    if (top < 72) top = r.bottom + 8;
    tip.style.left = (left + window.scrollX) + 'px';
    tip.style.top = (top + window.scrollY) + 'px';
  }
  function setupTerms() {
    document.querySelectorAll('.term[data-tip]').forEach(function (el) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      el.addEventListener('mouseenter', function () { showTip(el); });
      el.addEventListener('mouseleave', hideTip);
      el.addEventListener('focus', function () { showTip(el); });
      el.addEventListener('blur', hideTip);
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        // A tap focuses the term first (tip opens); don't close it again in the same tap
        if (owner === el && Date.now() - openedAt > 400) hideTip(); else showTip(el);
      });
    });
    document.addEventListener('click', hideTip);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTip(); });
    window.addEventListener('scroll', hideTip, { passive: true });
  }

  // ── Lightbox for screenshots in the docs (native <dialog>: focus stays inside, background inert) ──
  function setupLightbox() {
    var imgs = document.querySelectorAll('.docs main img:not(.icon)');
    if (!imgs.length) return;
    var old = document.getElementById('lightbox');
    if (old && old.tagName !== 'DIALOG') old.remove();
    var box = document.getElementById('lightbox');
    if (!box) {
      box = document.createElement('dialog');
      box.className = 'lightbox';
      box.id = 'lightbox';
      box.setAttribute('aria-label', 'Screenshot');
      box.innerHTML = '<button type="button" class="lightbox-close" aria-label="Close">&times;</button><img id="lightbox-img" alt="">';
      document.body.appendChild(box);
    }
    var big = box.querySelector('img');
    var last = null;
    function close() { if (box.open) box.close(); }
    box.addEventListener('close', function () { big.removeAttribute('src'); if (last) last.focus({ preventScroll: true }); });
    box.addEventListener('click', function (e) { if (e.target !== big) close(); });
    box.querySelector('.lightbox-close').addEventListener('click', close);
    imgs.forEach(function (img) {
      if (img.closest('a, .no-zoom')) return;
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Enlarge: ' + (img.alt || 'screenshot'));
      function open() {
        last = img;
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        if (typeof box.showModal === 'function') box.showModal(); else box.setAttribute('open', '');
        box.querySelector('.lightbox-close').focus();
      }
      img.addEventListener('click', open);
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  // ── Sidebar: highlight the section in view ──
  function setupScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.sidebar-toc a[href^="#"]'));
    if (!links.length) return;
    var items = links.map(function (a) {
      var id; try { id = decodeURIComponent(a.getAttribute('href').slice(1)); } catch (e) { id = ''; }
      return { a: a, el: id ? document.getElementById(id) : null };
    }).filter(function (x) { return x.el; });
    var ticking = false;
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.3, current = items.length ? items[0] : null;
      items.forEach(function (x) { if (x.el.getBoundingClientRect().top <= line) current = x; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items[items.length - 1];
      items.forEach(function (x) { x.a.classList.toggle('active', x === current); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ── Links to a section inside a collapsed <details>: open it first ──
  function openForHash() {
    var id;
    try { id = decodeURIComponent((window.location.hash || '').slice(1)); } catch (e) { return; }
    if (!id || /^(app|demo)-/.test(id)) return;
    var el = document.getElementById(id);
    if (!el) return;
    var opened = false;
    for (var d = el; d; d = d.parentElement) {
      if (d.tagName === 'DETAILS' && !d.open) { d.open = true; opened = true; }
    }
    if (opened) setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 0);
  }

  function init() {
    setupTerms(); setupLightbox(); setupScrollSpy();
    openForHash();
    window.addEventListener('hashchange', openForHash);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
