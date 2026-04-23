/* ============================================================
   components.js — Shared nav + footer for janekbehrens.de
   Include this script on every page. It replaces any element
   with id="site-nav" or id="site-footer", or auto-inserts at
   the start/end of <body> if those IDs are absent.
   ============================================================ */
(function () {
  'use strict';

  var CALENDLY_URL = 'https://calendly.com/calendly-janekbehrens/30min';

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
    '      <a href="' + CALENDLY_URL + '" class="nav-btn-book" data-calendly-popup target="_blank" rel="noopener">Book a call</a>',
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

  function injectCalendly() {
    if (!document.querySelector('link[href*="calendly"]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src*="calendly"]')) {
      var script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }

  function openCalendlyPopup(e) {
    e.preventDefault();
    if (window.Calendly) {
      Calendly.initPopupWidget({ url: CALENDLY_URL });
    } else {
      window.open(CALENDLY_URL, '_blank', 'noopener');
    }
  }

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

    injectCalendly();
    setupNav();
    injectBookingCTA();

    // Wire any remaining [data-calendly-popup] outside the nav
    document.querySelectorAll('[data-calendly-popup]').forEach(function (el) {
      el.removeEventListener('click', openCalendlyPopup);
      el.addEventListener('click', openCalendlyPopup);
    });
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

    // ── Calendly popup triggers ──
    nav.querySelectorAll('[data-calendly-popup]').forEach(function (el) {
      el.addEventListener('click', openCalendlyPopup);
    });

    // ── Scroll shadow ──
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });
  }

  function injectBookingCTA() {
    var path = window.location.pathname;
    var isDocsOrSupport = /-(docs|support)\.html/.test(path);
    if (!isDocsOrSupport) return;
    if (document.querySelector('.booking-cta')) return;

    var footer = document.getElementById('site-footer');
    var html = [
      '<section class="booking-cta">',
      '  <div class="booking-cta-inner">',
      '    <div class="booking-cta-text">',
      '      <strong>Still have questions?</strong>',
      '      <span>Book a free 30-minute call — I\'ll help you get set up.</span>',
      '    </div>',
      '    <a href="' + CALENDLY_URL + '" class="btn-primary booking-cta-btn" data-calendly-popup target="_blank" rel="noopener">Book a call &rarr;</a>',
      '  </div>',
      '</section>'
    ].join('\n');

    if (footer) {
      footer.insertAdjacentHTML('beforebegin', html);
    } else {
      document.body.insertAdjacentHTML('beforeend', html);
    }

    document.querySelectorAll('[data-calendly-popup]').forEach(function (el) {
      el.removeEventListener('click', openCalendlyPopup);
      el.addEventListener('click', openCalendlyPopup);
    });
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

  // ── Blog-article enhancements: breadcrumbs, related posts, author box ─────
  var ARTICLE_CSS = [
    '.breadcrumb{max-width:1120px;margin:24px auto 0;padding:0 24px;font-size:0.85rem;color:var(--text-2);}',
    '.breadcrumb ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px;}',
    '.breadcrumb li{display:inline-flex;align-items:center;}',
    '.breadcrumb li+li::before{content:"›";margin:0 8px;color:var(--text-faint);}',
    '.breadcrumb a{color:var(--text-2);text-decoration:none;}',
    '.breadcrumb a:hover{color:var(--blue);text-decoration:underline;}',
    '.breadcrumb li[aria-current="page"] span{color:var(--text);font-weight:500;}',
    '.author-box{margin:48px 0 0;padding:24px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;}',
    '.author-box-inner{display:flex;gap:16px;align-items:flex-start;}',
    '.author-avatar{width:56px;height:56px;border-radius:50%;object-fit:contain;background:var(--white);border:1px solid var(--border);flex-shrink:0;}',
    '.author-meta{flex:1;min-width:0;}',
    '.author-name{font-size:1rem;font-weight:700;color:var(--text);margin-bottom:6px;}',
    '.author-bio{font-size:0.92rem;color:var(--text-2);line-height:1.6;margin-bottom:8px;}',
    '.author-bio a{color:var(--blue);text-decoration:none;}',
    '.author-bio a:hover{text-decoration:underline;}',
    '.author-links{font-size:0.85rem;color:var(--text-faint);}',
    '.author-links a{color:var(--blue);text-decoration:none;}',
    '.author-links a:hover{text-decoration:underline;}',
    '.related-posts{border-top:1px solid var(--border);background:var(--bg);padding:56px 24px 48px;margin-top:56px;}',
    '.related-posts-inner{max-width:1120px;margin:0 auto;}',
    '.related-posts h2{font-size:1.5rem;font-weight:800;color:var(--text);letter-spacing:-0.02em;margin:0 0 24px;}',
    '.related-posts-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}',
    '@media (max-width:900px){.related-posts-grid{grid-template-columns:repeat(2,1fr);}}',
    '@media (max-width:560px){.related-posts-grid{grid-template-columns:1fr;}}',
    '.related-post-card{display:block;padding:18px;background:var(--white);border:1px solid var(--border);border-radius:10px;text-decoration:none;transition:border-color .15s,transform .15s;}',
    '.related-post-card:hover{border-color:var(--blue);transform:translateY(-2px);}',
    '.related-post-label{font-size:0.72rem;font-weight:600;color:var(--blue);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;}',
    '.related-post-title{font-size:0.95rem;font-weight:700;color:var(--text);line-height:1.4;margin-bottom:10px;}',
    '.related-post-meta{font-size:0.78rem;color:var(--text-faint);}'
  ].join('');

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function isBlogArticle() {
    var p = window.location.pathname;
    if (!/\/blog\//.test(p)) return false;
    if (p === '/blog/' || p.endsWith('/blog/index.html')) return false;
    return /\.html$/.test(p);
  }

  function currentArticleFile() {
    return window.location.pathname.split('/').pop();
  }

  function currentArticleTitle() {
    var h1 = document.querySelector('.article-body h1, article h1, h1');
    return h1 ? h1.textContent.trim() : document.title.replace(/\s*\|\s*Janek Behrens\s*$/i, '').trim();
  }

  function injectArticleStyles() {
    if (document.getElementById('components-article-css')) return;
    var style = document.createElement('style');
    style.id = 'components-article-css';
    style.textContent = ARTICLE_CSS;
    document.head.appendChild(style);
  }

  function injectBreadcrumbs() {
    if (document.querySelector('.breadcrumb')) return;
    var layout = document.querySelector('.article-layout');
    if (!layout) return;
    var title = currentArticleTitle();
    var nav = document.createElement('nav');
    nav.className = 'breadcrumb';
    nav.setAttribute('aria-label', 'Breadcrumb');
    nav.innerHTML = [
      '<ol itemscope itemtype="https://schema.org/BreadcrumbList">',
        '<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">',
          '<a itemprop="item" href="/"><span itemprop="name">Home</span></a>',
          '<meta itemprop="position" content="1" />',
        '</li>',
        '<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">',
          '<a itemprop="item" href="/blog/"><span itemprop="name">Blog</span></a>',
          '<meta itemprop="position" content="2" />',
        '</li>',
        '<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" aria-current="page">',
          '<span itemprop="name">' + escapeHtml(title) + '</span>',
          '<meta itemprop="position" content="3" />',
        '</li>',
      '</ol>'
    ].join('');
    layout.parentNode.insertBefore(nav, layout);
  }

  function injectAuthorBox() {
    var article = document.querySelector('article.article-body, article');
    if (!article) return;
    if (article.querySelector('.author-box')) return;
    var box = document.createElement('aside');
    box.className = 'author-box';
    box.setAttribute('aria-label', 'About the author');
    box.innerHTML = [
      '<div class="author-box-inner">',
        '<img src="/img/companyLogo_transparent.png" alt="Janek Behrens" class="author-avatar" loading="lazy" width="56" height="56" />',
        '<div class="author-meta">',
          '<div class="author-name">Janek Behrens</div>',
          '<div class="author-bio">Independent Atlassian Forge developer. Builds <a href="/priority-scoring-docs.html">Priority Scoring</a>, <a href="/visual-progress-tracker.html">Visual Progress Tracker</a>, and <a href="/codedoc-ai.html">CodeDoc AI</a> &mdash; native Forge apps for Jira and Confluence.</div>',
          '<div class="author-links"><a href="https://www.linkedin.com/in/janek-behrens-55b3651b6/" target="_blank" rel="noopener">LinkedIn</a> &middot; <a href="https://marketplace.atlassian.com/vendors/92692174/janek-behrens" target="_blank" rel="noopener">Atlassian Marketplace</a> &middot; <a href="/blog/">More articles</a></div>',
        '</div>',
      '</div>'
    ].join('');
    article.appendChild(box);
  }

  function injectRelatedPosts() {
    if (document.querySelector('.related-posts')) return;
    var layout = document.querySelector('.article-layout');
    if (!layout) return;

    fetch('/blog/posts.json', { cache: 'default' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (posts) {
        if (!posts || !Array.isArray(posts)) return;
        var currentFile = currentArticleFile();
        var me = posts.find(function (p) { return p.file === currentFile; });
        if (!me) return;

        var scored = posts
          .filter(function (p) { return p.file !== currentFile; })
          .map(function (p) {
            var shared = p.tags.filter(function (t) { return me.tags.indexOf(t) !== -1; }).length;
            return { post: p, score: shared };
          })
          .filter(function (x) { return x.score > 0; })
          .sort(function (a, b) {
            if (b.score !== a.score) return b.score - a.score;
            return b.post.date.localeCompare(a.post.date);
          });

        var picks = scored.slice(0, 6).map(function (x) { return x.post; });

        // Fallback: backfill with newest posts if fewer than 4 tag matches
        if (picks.length < 4) {
          var seen = {};
          picks.forEach(function (p) { seen[p.file] = 1; });
          seen[currentFile] = 1;
          for (var i = 0; i < posts.length && picks.length < 6; i++) {
            if (!seen[posts[i].file]) {
              picks.push(posts[i]);
              seen[posts[i].file] = 1;
            }
          }
        }

        if (picks.length === 0) return;

        var html = '<div class="related-posts-inner"><h2>Keep reading</h2><div class="related-posts-grid">';
        picks.forEach(function (p) {
          html += '<a href="/blog/' + encodeURIComponent(p.file) + '" class="related-post-card">' +
            '<div class="related-post-label">' + escapeHtml(p.label || '') + '</div>' +
            '<div class="related-post-title">' + escapeHtml(p.title) + '</div>' +
            '<div class="related-post-meta">' + (p.readTime ? p.readTime + ' min read' : '') +
              (p.readTime && p.dateStr ? ' &middot; ' : '') +
              escapeHtml(p.dateStr || '') +
            '</div>' +
          '</a>';
        });
        html += '</div></div>';

        var section = document.createElement('section');
        section.className = 'related-posts';
        section.setAttribute('aria-label', 'Related articles');
        section.innerHTML = html;
        layout.parentNode.insertBefore(section, layout.nextSibling);
      })
      .catch(function () { /* silent */ });
  }

  function enhanceBlogArticle() {
    if (!isBlogArticle()) return;
    injectArticleStyles();
    injectBreadcrumbs();
    injectAuthorBox();
    injectRelatedPosts();
  }

  // Run immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectComponents();
      initYouTubeConsent();
      enhanceBlogArticle();
    });
  } else {
    injectComponents();
    initYouTubeConsent();
    enhanceBlogArticle();
  }
})();
