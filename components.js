/* ============================================================
   components.js — Shared nav + footer for janekbehrens.de
   Include this script on every page. It replaces any element
   with id="site-nav" or id="site-footer", or auto-inserts at
   the start/end of <body> if those IDs are absent.
   ============================================================ */
(function () {
  'use strict';

  var NAV_HTML = [
    '<nav class="site-nav" id="site-nav" role="navigation" aria-label="Site navigation">',
    '  <div class="nav-inner">',
    '    <a href="/" class="nav-brand">',
    '      <img src="/img/companyLogo_transparent.png" class="nav-logo" alt="Janek Behrens" />',
    '      <span>Janek Behrens</span>',
    '    </a>',
    '    <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">',
    '      <span class="nav-toggle-bar"></span>',
    '      <span class="nav-toggle-bar"></span>',
    '      <span class="nav-toggle-bar"></span>',
    '    </button>',
    '    <div class="nav-links" id="nav-links-panel">',
    '      <a href="/#apps" class="nav-link">Apps</a>',
    '      <a href="/blog/" class="nav-link">Blog</a>',
    '      <div class="nav-dropdown">',
    '        <button class="nav-link nav-dropdown-toggle" aria-expanded="false" aria-haspopup="true">',
    '          Docs',
    '          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '        </button>',
    '        <div class="nav-dropdown-menu" role="menu">',
    '          <a href="/codedoc-ai-docs.html" role="menuitem">CodeDoc AI Docs</a>',
    '          <a href="/visual-progress-tracker-docs.html" role="menuitem">Progress Tracker Docs</a>',
    '          <a href="/priority-scoring-docs.html" role="menuitem">Priority Scoring Docs</a>',
    '        </div>',
    '      </div>',
    '      <a href="mailto:support@janekbehrens.de" class="nav-link">Support</a>',
    '    </div>',
    '  </div>',
    '</nav>'
  ].join('\n');

  var FOOTER_HTML = [
    '<footer class="site-footer" id="site-footer" role="contentinfo">',
    '  <div class="footer-inner">',
    '    <p class="footer-copy">&copy; 2026 Janek Behrens</p>',
    '    <nav class="footer-links" aria-label="Footer links">',
    '      <a href="/trust-center.html">Trust Center</a>',
    '      <span aria-hidden="true">&middot;</span>',
    '      <a href="/privacy-policy.html">Privacy Policy</a>',
    '      <span aria-hidden="true">&middot;</span>',
    '      <a href="/datenschutz.html">Datenschutz</a>',
    '      <span aria-hidden="true">&middot;</span>',
    '      <a href="/impressum.html">Impressum</a>',
    '    </nav>',
    '  </div>',
    '</footer>'
  ].join('\n');

  function injectComponents() {
    // ── Nav ──
    var existingNav = document.getElementById('site-nav');
    if (existingNav) {
      existingNav.outerHTML = NAV_HTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', NAV_HTML);
    }

    // ── Footer ──
    var existingFooter = document.getElementById('site-footer');
    if (existingFooter) {
      existingFooter.outerHTML = FOOTER_HTML;
    } else {
      document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
    }

    setupNav();
  }

  function setupNav() {
    var nav = document.getElementById('site-nav');
    if (!nav) return;

    // ── Hamburger toggle ──
    var toggle = nav.querySelector('.nav-toggle');
    var panel  = nav.querySelector('.nav-links');
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        var isOpen = panel.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        toggle.classList.toggle('open', isOpen);
      });
    }

    // ── Docs dropdown ──
    var dropBtn  = nav.querySelector('.nav-dropdown-toggle');
    var dropMenu = nav.querySelector('.nav-dropdown-menu');
    if (dropBtn && dropMenu) {
      dropBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = dropMenu.classList.toggle('open');
        dropBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      document.addEventListener('click', function () {
        dropMenu.classList.remove('open');
        dropBtn.setAttribute('aria-expanded', 'false');
      });
    }

    // ── Scroll shadow ──
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });
  }

  function initYouTubeConsent() {
    document.querySelectorAll('.yt-consent').forEach(function (el) {
      el.querySelector('.yt-play-btn').addEventListener('click', function () {
        var iframe = document.createElement('iframe');
        iframe.src = el.dataset.src;
        iframe.title = el.dataset.title || 'YouTube Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:8px;';
        el.replaceWith(iframe);
      });
    });
  }

  // Run immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { injectComponents(); initYouTubeConsent(); });
  } else {
    injectComponents();
    initYouTubeConsent();
  }
})();
