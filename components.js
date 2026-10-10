/* ============================================================
   components.js — Shared nav + footer for janekbehrens.de
   Include this script on every page. It replaces any element
   with id="site-nav" or id="site-footer", or auto-inserts at
   the start/end of <body> if those IDs are absent.
   ============================================================ */
(function () {
  'use strict';

  var CALENDLY_URL = 'https://calendly.com/calendly-janekbehrens/30min';

  // ── Apps (one registry for nav menus, app bar and app sub-nav) ──
  // status 'soon' = submitted, not on the Marketplace yet: no Marketplace link anywhere.
  var APPS = [
    { id: 'ep',   slug: 'epic-progress',           name: 'Epic Progress',    full: 'Epic Progress for Confluence',       page: 'epic-progress-for-confluence.html',  icon: '/img/epic-progress-icon.png',        mp: 'https://marketplace.atlassian.com/apps/2278189341/epic-progress-for-confluence' },
    { id: 'tc',   slug: 'team-capacity',           name: 'Team Capacity',    full: 'Team Capacity for Jira',            page: 'team-capacity-for-jira.html',        icon: '/img/team-capacity-icon.png',        mp: 'https://marketplace.atlassian.com/apps/2392093081/team-capacity-sprint-workload-resource-planning-for-jira' },
    { id: 'vpt',  slug: 'visual-progress-tracker', name: 'Progress Tracker', full: 'Visual Progress Tracker for Jira',   page: 'visual-progress-tracker.html',       icon: '/img/progresstracker144logo.png',    mp: 'https://marketplace.atlassian.com/apps/4156857006/visual-progress-tracker-for-jira' },
    { id: 'dora', slug: 'dora-metrics',            name: 'DevOps Metrics',   full: 'DevOps Metrics for Jira',            page: 'dora-metrics-for-jira.html',         icon: '/img/dora-metrics-icon.png',         mp: 'https://marketplace.atlassian.com/apps/1055828654/devops-metrics-deployment-frequency-lead-time-for-jira' },
    { id: 'vel',  slug: 'velocity-chart',          name: 'Velocity Chart',   full: 'Velocity Chart for Jira',            page: 'velocity-chart.html',                icon: '/img/velocity-chart-icon.png',       mp: 'https://marketplace.atlassian.com/apps/3707070829/velocity-chart-for-jira' },
    { id: 'cd',   slug: 'codedoc-ai',              name: 'CodeDoc AI',       full: 'CodeDoc AI for Confluence',          page: 'codedoc-ai.html',                    icon: '/img/codedoc-ai-icon.webp',          mp: 'https://marketplace.atlassian.com/apps/2654352538', extra: { label: 'Quick start', href: 'codedoc-ai-setup.html', key: 'setup' } },
    { id: 'ps',   slug: 'priority-scoring',        name: 'Priority Scoring', full: 'Priority Scoring for Jira',          page: 'priority-scoring.html',              icon: '/img/priority-scoring-icon.png',     mp: 'https://marketplace.atlassian.com/apps/966645375' }
  ];
  function appById(id) { for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i]; return null; }
  function soonTag(a) { return a.status === 'soon' ? ' <span class="soon-tag">Soon</span>' : ''; }

  function menuItems(kind) {
    return APPS.map(function (a) {
      var href = '/' + a.slug + '-' + kind + '.html';
      return '<a href="' + href + '" role="menuitem"><img src="' + a.icon + '" alt="" width="18" height="18">' + a.name + soonTag(a) + '</a>';
    }).join('');
  }

  var NAV_HTML = [
    '<nav class="site-nav" id="site-nav" role="navigation" aria-label="Site navigation">',
    '  <div class="nav-inner">',
    '    <a href="/" class="nav-brand">',
    '      <img src="/img/companyLogo_transparent.png" class="nav-logo" alt="" />',
    '      <span>Janek Behrens</span>',
    '    </a>',
    '    <span class="nav-divider" aria-hidden="true"></span>',
    '    <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">',
    '      <span class="nav-toggle-bar"></span>',
    '      <span class="nav-toggle-bar"></span>',
    '      <span class="nav-toggle-bar"></span>',
    '    </button>',
    '    <div class="nav-links" id="nav-links-panel">',
    '      <a href="/#apps" class="nav-link">Apps</a>',
    '      <div class="nav-dropdown">',
    '        <button class="nav-link nav-dropdown-toggle" aria-expanded="false" aria-haspopup="true">Docs',
    '          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '        </button>',
    '        <div class="nav-dropdown-menu" role="menu"><div class="nav-menu-title">Documentation</div>' + menuItems('docs') + '</div>',
    '      </div>',
    '      <div class="nav-dropdown">',
    '        <button class="nav-link nav-dropdown-toggle" aria-expanded="false" aria-haspopup="true">Support',
    '          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '        </button>',
    '        <div class="nav-dropdown-menu" role="menu"><div class="nav-menu-title">Help for an app</div>' + menuItems('support') +
    '          <div class="nav-menu-sep"></div><a href="mailto:support@janekbehrens.de" role="menuitem" class="nav-menu-mail">support@janekbehrens.de</a>' +
    '          <a href="' + CALENDLY_URL + '" role="menuitem" target="_blank" rel="noopener" class="nav-menu-mail">Book a 30-min call</a></div>',
    '      </div>',
    '      <a href="/blog/" class="nav-link">Blog</a>',
    '      <a href="' + CALENDLY_URL + '" class="nav-btn-book" target="_blank" rel="noopener">Book a call</a>',
    '    </div>',
    '  </div>',
    '</nav>'
  ].join('\n');

  // Homepage: bar with all apps (<body data-appbar>)
  function appBarHtml() {
    return '<div class="app-bar" id="app-bar"><nav class="app-bar-inner" aria-label="Apps">' +
      APPS.map(function (a) {
        return '<a href="/' + a.page + '" class="app-bar-link" data-app-id="' + a.id + '">' +
          '<img src="' + a.icon + '" alt="" width="20" height="20">' + a.name + soonTag(a) + '</a>';
      }).join('') +
      '</nav></div>';
  }

  // App pages (product, docs, support, legal): the app's own sub-nav.
  // The app comes from <body data-app> or from the file name.
  function currentAppAndPage() {
    var file = (window.location.pathname.split('/').pop() || '').toLowerCase();
    var forced = document.body.getAttribute('data-app');
    for (var i = 0; i < APPS.length; i++) {
      var a = APPS[i];
      var mine = forced ? a.id === forced : (file === a.page || file.indexOf(a.slug + '-') === 0);
      if (!mine) continue;
      var key = 'overview';
      if (file !== a.page) {
        var m = /-(docs|setup|support|security|privacy-policy|terms-of-service)\.html$/.exec(file);
        if (m) key = m[1];
      }
      return { app: a, key: key };
    }
    return null;
  }

  function appNavHtml(cur) {
    var a = cur.app;
    var links = [
      { key: 'overview', label: 'Overview', href: '/' + a.page },
      { key: 'docs', label: 'Docs', href: '/' + a.slug + '-docs.html' }
    ];
    if (a.extra) links.push({ key: a.extra.key, label: a.extra.label, href: '/' + a.extra.href });
    links.push(
      { key: 'support', label: 'Support', href: '/' + a.slug + '-support.html' },
      { key: 'security', label: 'Security', href: '/' + a.slug + '-security.html' },
      { key: 'privacy-policy', label: 'Privacy', href: '/' + a.slug + '-privacy-policy.html' },
      { key: 'terms-of-service', label: 'Terms', href: '/' + a.slug + '-terms-of-service.html' }
    );
    var cta = a.status === 'soon'
      ? '<span class="app-nav-cta is-soon" title="Submitted to the Atlassian Marketplace, not available yet">Coming soon</span>'
      : '<a class="app-nav-cta" href="' + a.mp + '" target="_blank" rel="noopener">Try it free</a>';
    return '<div class="app-nav" id="app-nav"><div class="app-nav-inner">' +
      '<a class="app-nav-name" href="/' + a.page + '"><img src="' + a.icon + '" alt="" width="24" height="24">' + a.full + '</a>' +
      '<nav class="app-nav-links" aria-label="' + a.full + '">' + links.map(function (l) {
        var on = l.key === cur.key;
        return '<a href="' + l.href + '"' + (on ? ' class="is-current" aria-current="page"' : '') + '>' + l.label + '</a>';
      }).join('') + '</nav>' + cta + '</div></div>';
  }

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
    var nav = document.getElementById('site-nav');
    if (document.body.hasAttribute('data-appbar')) {
      nav.insertAdjacentHTML('afterend', appBarHtml());
    } else {
      var cur = currentAppAndPage();
      if (cur) nav.insertAdjacentHTML('afterend', appNavHtml(cur));
    }

    // ── Footer ──
    var existingFooter = document.getElementById('site-footer');
    if (existingFooter) {
      existingFooter.outerHTML = FOOTER_HTML;
    } else {
      document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
    }

    setupNav();
    injectBookingCTA();
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

    // ── Dropdowns (Docs, Support): one open at a time, Escape closes ──
    var drops = Array.prototype.slice.call(nav.querySelectorAll('.nav-dropdown'));
    function closeAll(except) {
      drops.forEach(function (d) {
        if (d === except) return;
        d.querySelector('.nav-dropdown-menu').classList.remove('open');
        d.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
      });
    }
    drops.forEach(function (d) {
      var btn = d.querySelector('.nav-dropdown-toggle');
      var menu = d.querySelector('.nav-dropdown-menu');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeAll(d);
        var isOpen = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      menu.addEventListener('click', function (e) { e.stopPropagation(); });
    });
    document.addEventListener('click', function () { closeAll(null); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });

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
      '    <a href="' + CALENDLY_URL + '" class="btn-primary booking-cta-btn" target="_blank" rel="noopener">Book a call &rarr;</a>',
      '  </div>',
      '</section>'
    ].join('\n');

    if (footer) {
      footer.insertAdjacentHTML('beforebegin', html);
    } else {
      document.body.insertAdjacentHTML('beforeend', html);
    }
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
          '<div class="author-bio">Independent Atlassian Forge developer. Builds <a href="/team-capacity-for-jira.html">Team Capacity</a>, <a href="/dora-metrics-for-jira.html">DevOps Metrics</a>, <a href="/velocity-chart.html">Velocity Chart</a>, <a href="/priority-scoring.html">Priority Scoring</a> and <a href="/visual-progress-tracker.html">Visual Progress Tracker</a> for Jira, and <a href="/codedoc-ai.html">CodeDoc AI</a> for Confluence.</div>',
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

  // ── Hash alignment ──────────────────────────────────────────────────────
  // Lazy-loaded screenshots above an anchor target (no width/height) grow the
  // page after the jump, which pushes the target down. While the user has not
  // scrolled yet, re-align to the target after such loads. Click-triggered
  // hash changes wait for the browser's smooth scroll to settle first, so the
  // animation itself is not interrupted.
  var HASH_ALIGN_WINDOW_MS = 6000;
  var alignArmedUntil = 0;
  var alignUserMoved = false;
  var alignFromClick = false;
  var alignSettled = true;
  var alignFallbackTimer = null;

  function alignToHash() {
    var id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (e) { return; }
    var el = id && document.getElementById(id);
    if (!el) return;
    var padTop = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    var top = el.getBoundingClientRect().top + window.pageYOffset - padTop;
    if (Math.abs(window.pageYOffset - top) > 1) {
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    }
  }

  function realignIfArmed() {
    if (alignUserMoved || Date.now() > alignArmedUntil) return;
    if (!window.location.hash || window.location.hash.length < 2) return;
    if (alignFromClick && !alignSettled) return; // scrollend will call again
    alignToHash();
  }

  function armHashAlignment(fromClick) {
    alignUserMoved = false;
    alignFromClick = fromClick;
    alignArmedUntil = Date.now() + HASH_ALIGN_WINDOW_MS;
    if (fromClick) {
      alignSettled = false;
      clearTimeout(alignFallbackTimer);
      // Fallback if the browser does not fire scrollend (e.g. no movement needed)
      alignFallbackTimer = setTimeout(function () { alignSettled = true; realignIfArmed(); }, 1000);
    }
  }

  function setupHashAlignment() {
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) {
      window.addEventListener(t, function () { alignUserMoved = true; }, { passive: true });
    });
    // In-page link clicks and back/forward change the hash
    window.addEventListener('hashchange', function () { armHashAlignment(true); });
    window.addEventListener('scrollend', function () { alignSettled = true; realignIfArmed(); });
    window.addEventListener('load', realignIfArmed);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(realignIfArmed);
    // Capture phase: image load events do not bubble
    document.addEventListener('load', function (e) {
      if (e.target && e.target.tagName === 'IMG') realignIfArmed();
    }, true);
    if (window.location.hash && window.location.hash.length > 1) {
      armHashAlignment(false);
      realignIfArmed();
    }
  }

  // ── Notice before leaving the site (privacy): every external link ──
  // Shows where the link goes; "Open" opens it in a NEW tab and closes the
  // notice, this tab stays open. Esc / "Stay" closes it.
  var OWN_HOSTS = ['janekbehrens.de', 'www.janekbehrens.de'];
  var KNOWN_SITES = [
    ['marketplace.atlassian.com', 'Atlassian Marketplace'],
    ['developer.atlassian.com', 'Atlassian Developer'],
    ['support.atlassian.com', 'Atlassian Support'],
    ['atlassian.com', 'Atlassian'],
    ['calendly.com', 'Calendly (book a call)'],
    ['github.com', 'GitHub'],
    ['linkedin.com', 'LinkedIn'],
    ['youtube.com', 'YouTube'],
    ['youtu.be', 'YouTube']
  ];
  var EXIT_TEXT = {
    en: {
      title: 'You are leaving janekbehrens.de',
      lead: 'This link opens an external website in a new tab:',
      note: 'That website has its own privacy policy. janekbehrens.de has no influence on what it collects. This tab stays open.',
      open: 'Open in new tab',
      stay: 'Stay on this page',
      blocked: 'Your browser blocked the new tab. Allow pop-ups for this site, or copy the address above.'
    },
    de: {
      title: 'Sie verlassen janekbehrens.de',
      lead: 'Dieser Link öffnet eine externe Website in einem neuen Tab:',
      note: 'Dort gilt deren eigene Datenschutzerklärung; janekbehrens.de hat keinen Einfluss darauf, welche Daten sie erhebt. Dieser Tab bleibt geöffnet.',
      open: 'In neuem Tab öffnen',
      stay: 'Auf dieser Seite bleiben',
      blocked: 'Ihr Browser hat den neuen Tab blockiert. Erlauben Sie Pop-ups für diese Seite oder kopieren Sie die Adresse oben.'
    }
  };

  function externalUrl(a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return null;
    var u;
    try { u = new URL(href, window.location.href); } catch (e) { return null; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;   // mailto:, tel:, …
    if (u.host === window.location.host) return null;
    if (OWN_HOSTS.indexOf(u.hostname) !== -1) return null;
    if (a.hasAttribute('data-no-exit-notice')) return null;
    return u;
  }

  function siteLabel(host) {
    for (var i = 0; i < KNOWN_SITES.length; i++) {
      var d = KNOWN_SITES[i][0];
      if (host === d || host.slice(-(d.length + 1)) === '.' + d) return KNOWN_SITES[i][1];
    }
    return '';
  }

  var exitDialog = null, exitReturn = null, exitUrl = null;
  function buildExitDialog(t) {
    var d = document.createElement('dialog');
    d.className = 'exit-notice';
    d.setAttribute('aria-labelledby', 'exit-title');
    d.innerHTML = [
      '<div class="exit-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>',
      '<h2 id="exit-title">' + escapeHtml(t.title) + '</h2>',
      '<p class="exit-lead">' + escapeHtml(t.lead) + '</p>',
      '<div class="exit-target"><strong class="exit-host"></strong><span class="exit-label"></span><code class="exit-url"></code></div>',
      '<p class="exit-note">' + escapeHtml(t.note) + '</p>',
      '<p class="exit-blocked" role="alert" hidden>' + escapeHtml(t.blocked) + '</p>',
      '<div class="exit-actions">',
      '  <button type="button" class="exit-open">' + escapeHtml(t.open) + ' <span aria-hidden="true">↗</span></button>',
      '  <button type="button" class="exit-stay">' + escapeHtml(t.stay) + '</button>',
      '</div>'
    ].join('');
    document.body.appendChild(d);
    d.querySelector('.exit-stay').addEventListener('click', closeExit);
    d.querySelector('.exit-open').addEventListener('click', function () {
      var w = window.open(exitUrl, '_blank');
      if (w) { try { w.opener = null; } catch (e) { /* ignore */ } closeExit(); }
      else { d.querySelector('.exit-blocked').hidden = false; }
    });
    d.addEventListener('click', function (e) { if (e.target === d) closeExit(); }); // click on the backdrop
    d.addEventListener('close', function () { if (exitReturn) { exitReturn.focus({ preventScroll: true }); exitReturn = null; } });
    return d;
  }
  function closeExit() { if (exitDialog && exitDialog.open) exitDialog.close(); }
  function showExit(a, u) {
    var lang = (document.documentElement.lang || 'en').slice(0, 2) === 'de' ? 'de' : 'en';
    if (!exitDialog || exitDialog.getAttribute('data-lang') !== lang) {
      if (exitDialog) exitDialog.remove();
      exitDialog = buildExitDialog(EXIT_TEXT[lang]);
      exitDialog.setAttribute('data-lang', lang);
    }
    exitUrl = u.href;
    exitReturn = a;
    exitDialog.querySelector('.exit-host').textContent = u.hostname.replace(/^www\./, '');
    var label = siteLabel(u.hostname);
    exitDialog.querySelector('.exit-label').textContent = label;
    exitDialog.querySelector('.exit-label').hidden = !label;
    exitDialog.querySelector('.exit-url').textContent = u.href.length > 140 ? u.href.slice(0, 137) + '…' : u.href;
    exitDialog.querySelector('.exit-blocked').hidden = true;
    if (typeof exitDialog.showModal === 'function') exitDialog.showModal();
    else { window.open(exitUrl, '_blank'); return; }    // very old browsers: just open it
    exitDialog.querySelector('.exit-open').focus();
  }

  function setupExitNotice() {
    function handle(e) {
      if (e.defaultPrevented) return;
      if (e.type === 'auxclick' && e.button !== 1) return;     // middle click only
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var u = externalUrl(a);
      if (!u) return;
      e.preventDefault();
      showExit(a, u);
    }
    // capture phase: menus stop click propagation, the notice must still see the click
    document.addEventListener('click', handle, true);
    document.addEventListener('auxclick', handle, true);
  }

  function initAll() {
    setupExitNotice();   // first, so a failure elsewhere never skips the notice
    [injectComponents, initYouTubeConsent, enhanceBlogArticle, setupHashAlignment].forEach(function (fn) {
      try { fn(); } catch (e) { if (window.console) console.error(e); }
    });
  }

  // Run immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
