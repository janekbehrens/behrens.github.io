/* ============================================================
   ep-demo.js — interactive demo for Epic Progress for Confluence
   Sample data and fixed behavior only; written for the website,
   not taken from the app. Shown rules are the documented ones:
   green done, blue in progress, grey to do; 100 % only when
   everything is done; snapshots for readers without Jira.
   Everything else is precomputed sample data.
   ============================================================ */
(function () {
  'use strict';
  var root = document.querySelector('[data-demo="ep"]');
  if (!root || !window.JBDemo) return;
  var D = window.JBDemo, esc = D.esc;
  var APP = 'Epic Progress for Confluence', TAG = 'Epic Progress';
  var NB = ' ';
  var TODAY = '2026-10-08';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

  // ── Sample data (invented) ──
  // c: work items [done, in progress, to do]; pts: story points [done, in progress, to do, work items without estimate]
  var EPICS = {
    'CP-1': { name: 'Single sign-on for business customers', status: 'In Progress', due: '2026-11-13', c: [3, 2, 3], pts: [8, 5, 7, 1],
      open: [['CP-5', 'Admin setting to require single sign-on', 'In Progress'], ['CP-6', 'Map identity provider groups to portal roles', 'In Progress'], ['CP-7', 'Sign-in audit log', 'To Do'], ['CP-8', 'Set-up guide for IT admins', 'To Do'], ['CP-9', 'Security review of the login flow', 'To Do']] },
    'CP-26': { name: 'Mobile-friendly dashboard', status: 'In Progress', due: '2026-11-27', c: [2, 1, 2], pts: [5, 3, 5, 0],
      open: [['CP-29', 'Touch-friendly charts', 'In Progress'], ['CP-30', 'Offline notice', 'To Do'], ['CP-31', 'Speed up the dashboard on older phones', 'To Do']] },
    'CP-19': { name: 'Invoice history and PDF download', status: 'In Progress', due: '2026-10-16', c: [5, 1, 0], pts: [13, 3, 0, 0], flagged: 1,
      open: [['CP-24', 'PDF layout for long invoices', 'In Progress']] },
    'CP-10': { name: 'Self-service account settings', status: 'In Progress', due: '2026-10-30', c: [5, 2, 1], pts: [15, 13, 3, 1],
      open: [['CP-12', 'Change the email address', 'In Progress'], ['CP-14', 'Notification preferences', 'In Progress'], ['CP-15', 'Delete my account', 'To Do']] },
    'CP-41': { name: 'Faster page loads', status: 'In Progress', due: '2026-09-30', c: [4, 1, 0], pts: [10, 3, 0, 0] },
    'CP-32': { name: 'Accessibility to WCAG 2.2 AA', status: 'In Progress', due: '2026-12-11', c: [2, 2, 4], pts: [5, 5, 11, 0] },
    'CP-47': { name: 'Support chat in the portal', status: 'In Progress', due: '2027-01-29', c: [1, 0, 4], pts: [2, 0, 12, 1] },
    'CP-53': { name: 'Password reset redesign', status: 'Done', due: '2026-08-28', c: [4, 0, 0], pts: [8, 0, 0, 0] },
    'MOB-2': { name: 'Live courier tracking', status: 'In Progress', due: '2026-11-06', c: [6, 2, 2], pts: [14, 5, 5, 0] },
    'MOB-8': { name: 'Apple Pay at checkout', status: 'In Progress', due: '2026-10-23', c: [3, 1, 0], pts: [8, 2, 0, 0] },
    'MOB-12': { name: 'Dark mode for the order screen', status: 'To Do', due: '2027-01-15', c: [0, 1, 4], pts: [0, 3, 10, 2] },
    'MOB-4': { name: 'Store listing refresh', status: 'Done', due: '2026-09-18', c: [3, 0, 0], pts: [5, 0, 0, 0] }
  };
  var PICK_EPICS = ['CP-1', 'CP-26', 'CP-19', 'CP-10', 'CP-41', 'CP-32', 'CP-47'];
  var RANK = { CP: ['CP-41', 'CP-19', 'CP-10', 'CP-1', 'CP-26', 'CP-32', 'CP-47', 'CP-53'], MOB: ['MOB-8', 'MOB-2', 'MOB-12', 'MOB-4'] };
  var PARENTS = [
    { key: 'CP-100', name: 'Customer Portal 2026', kids: ['CP-1', 'CP-10', 'CP-19', 'CP-53'] },
    { key: 'CP-200', name: 'Accessibility and performance', kids: ['CP-41', 'CP-32', 'CP-47'] }
  ];
  var LIST_JQL = [
    { id: 'roadmap', q: 'issuetype = Epic AND labels = roadmap ORDER BY rank', keys: ['CP-1', 'CP-26', 'CP-47'] },
    { id: 'q4', q: 'project = CP AND issuetype = Epic AND statusCategory != Done AND duedate <= 2026-12-31 ORDER BY duedate', keys: ['CP-41', 'CP-19', 'CP-10', 'CP-1', 'CP-26', 'CP-32'] }
  ];
  var PROJECTS = [
    { key: 'CP', name: 'Customer Portal', c: [31, 15, 12], pts: [78, 41, 36, 4], subs: [9, 3, 2] },
    { key: 'MOB', name: 'Mobile App', c: [18, 6, 9], pts: [40, 13, 25, 2], subs: [5, 2, 1] }
  ];
  var RELEASES = {
    CP: [
      { id: 'p30', name: 'Portal 3.0', date: '2026-11-27', released: false, c: [7, 4, 2], pts: [21, 13, 5, 2], subs: [3, 1, 1], flagged: 1 },
      { id: 'p31', name: 'Portal 3.1', date: '2027-02-26', released: false, c: [0, 1, 7], pts: [0, 3, 18, 3], subs: [0, 0, 2] },
      { id: 'p29', name: 'Portal 2.9', date: '2026-10-02', released: true, c: [12, 0, 0], pts: [30, 0, 0, 0], subs: [4, 0, 0] }
    ],
    MOB: [
      { id: 'm50', name: 'Mobile 5.0', date: '2026-12-04', released: false, c: [9, 3, 5], pts: [19, 8, 13, 1], subs: [2, 1, 0] },
      { id: 'm49', name: 'Mobile 4.9', date: '2026-09-25', released: false, c: [8, 1, 0], pts: [17, 2, 0, 0], subs: [1, 0, 0] }
    ]
  };
  var FILTERS = [
    { id: 'beta', name: 'Beta feedback: bugs', fav: true, c: [4, 2, 1], pts: [11, 5, 3, 1], subs: [1, 0, 1] },
    { id: 'sec', name: 'Security work this quarter', fav: false, c: [3, 2, 5], pts: [9, 8, 13, 0], subs: [1, 1, 0] }
  ];
  var JQLS = [
    { id: 'beta', q: 'project = CP AND labels = beta', c: [8, 3, 2], pts: [20, 8, 5, 1], subs: [1, 0, 0] },
    { id: 'bugs', q: 'project = CP AND type = Bug AND created >= -30d', c: [5, 2, 3], pts: [8, 3, 5, 2], subs: [1, 0, 1] }
  ];
  var SPACES = [{ key: 'DOCS', name: 'Product documentation' }, { key: 'SUP', name: 'Support' }];
  // Pages with their labels, per scope of Page Progress
  var CHILD_PAGES = [
    ['Getting started', 'doc approved'], ['Reset your password', 'doc approved'], ['Invoices and payments', 'doc approved'],
    ['Account settings', 'doc approved'], ['Single sign-on', 'doc approved'], ['Accessibility statement', 'doc'],
    ['Contact support', 'doc'], ['Meeting notes 2 Oct', 'approved']
  ];
  var PAGES = {
    children: CHILD_PAGES,
    space: CHILD_PAGES.concat([['Q4 status report', ''], ['Steering committee update', ''], ['Release notes 3.0', 'doc approved'], ['Team onboarding', 'doc']]),
    DOCS: [['Installation', 'doc approved reviewed'], ['Configuration', 'doc reviewed'], ['User roles', 'doc approved reviewed'], ['API overview', 'doc'],
      ['Webhooks', 'doc reviewed'], ['Data export', 'doc approved'], ['Upgrade guide', 'doc'], ['Troubleshooting', 'doc reviewed'], ['Glossary', 'doc approved reviewed'], ['Style guide', '']],
    SUP: [['Escalation process', 'doc approved'], ['Refund policy', 'doc approved'], ['Shift plan', ''], ['Phone scripts', 'doc']]
  };

  // ── Small helpers ──
  function day(iso) { var p = iso.split('-'); return (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function dayDiff(iso) {
    var a = iso.split('-'), b = TODAY.split('-');
    return Math.round((Date.UTC(+a[0], +a[1] - 1, +a[2]) - Date.UTC(+b[0], +b[1] - 1, +b[2])) / 864e5);
  }
  function inDays(amount) {
    var nearby = { '0': 'today', '1': 'tomorrow', '-1': 'yesterday' };
    return nearby[amount] || (amount > 0 ? ['in', amount, 'days'] : [-amount, 'days ago']).join(' ');
  }
  function clock(mins) {
    var h = Math.floor(mins / 60) % 24, m = mins % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function cnt(arr, flagged) { return { d: arr[0], p: arr[1], o: arr[2], un: arr[3] || 0, flagged: flagged || 0 }; }
  function tot(c) { return c.d + c.p + c.o; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2], (a[3] || 0) + (b[3] || 0)]; }
  function completedPercent(done, total) {
    if (total === 0) return null;
    var whole = Math.trunc((done / total) * 100);
    return done < total ? Math.max(0, Math.min(whole, 99)) : 100;
  }
  function progressText(done, total) {
    var amount = completedPercent(done, total);
    return amount === null ? '–' : [(amount || done === 0) ? amount : '<1', '%'].join(NB);
  }
  var WORDS = { wi: ['work item', 'work items'], sp: ['story point', 'story points'], pg: ['page', 'pages'], st: ['step', 'steps'] };
  function wordFor(n, u) { return WORDS[u][n === 1 ? 0 : 1]; }
  function summary(d, t, u, doneWords) {
    if (!t) return 'No ' + WORDS[u][1] + ' yet';
    return d + ' of ' + t + ' ' + wordFor(t, u) + ' ' + (doneWords || 'done');
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  var LEGEND_TIP = {
    wi: 'Green: done, blue: in progress, grey: to do. Each work item counts once, by the status category of its status in Jira, like Jira’s own progress bars.',
    sp: 'Green: done, blue: in progress, grey: to do, added up in story points. Work items without an estimate are not part of the sum and are listed separately.',
    pg: 'Green: pages with the "done" label. Grey: the other pages in scope. Only pages you can open are counted.'
  };
  function help(text, label) {
    return '<span class="ep-help" tabindex="0" role="img" aria-label="' + esc((label ? label + ': ' : '') + text) + '" title="' + esc(text) + '">?</span>';
  }
  function loz(text, tone, tip) {
    return '<span class="ep-loz is-' + tone + '"' + (tip ? ' title="' + esc(tip) + '"' : '') + '>' + esc(text) + '</span>';
  }
  var TONE = { 'To Do': 'grey', 'In Progress': 'blue', 'In Review': 'blue', 'Done': 'green' };
  function statusLoz(s) { return s ? loz(s, TONE[s] || 'grey') : ''; }
  function dueLoz(iso, done, prefix) {
    var n = dayDiff(iso), late = !done && n < 0, rel = inDays(n);
    var tip = late ? 'The due date passed ' + rel + ' and the work is not done yet.' : done ? 'Due date from Jira (' + rel + '). The work is done.' : 'Due date from Jira: ' + rel + '.';
    return loz((late ? 'Overdue ' : (prefix ? prefix + ' ' : '')) + day(iso), late ? 'red' : 'grey', tip);
  }
  function bar(c, cls) {
    var t = tot(c), wd = t ? c.d / t * 100 : 0, wp = t ? c.p / t * 100 : 0;
    return '<div class="ep-bar' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><i class="is-done" style="width:' + wd.toFixed(2) + '%"></i><i class="is-prog" style="width:' + wp.toFixed(2) + '%"></i></div>';
  }
  function countRow(c, u, doneWords) {
    var t = tot(c);
    var legend = u === 'pg' ? '' : [['d', 'done', 'is-done'], ['p', 'in progress', 'is-prog'], ['o', 'to do', 'is-todo']].filter(function (x) { return c[x[0]] > 0; })
      .map(function (x) { return '<span><i class="ep-dot ' + x[2] + '"></i>' + c[x[0]] + ' ' + x[1] + '</span>'; }).join('');
    var flagged = c.flagged ? loz(c.flagged + ' flagged', 'red', 'Open work items with a flag in Jira. Teams usually flag work that is blocked.') : '';
    var un = u === 'sp' && c.un ? '<span class="ep-warn" title="These work items have no story point estimate, so they are not part of the sum. Estimate them in Jira for a complete picture.">' + plural(c.un, 'work item', 'work items') + ' without estimate</span>' : '';
    return '<div class="ep-counts"><span class="ep-num"><b class="ep-pct">' + progressText(c.d, t) + '</b><span>' + esc(summary(c.d, t, u, doneWords)) + '</span></span>' +
      '<span class="ep-legend">' + legend + flagged + un + help(LEGEND_TIP[u] || LEGEND_TIP.wi, 'How is this counted?') + '</span></div>';
  }
  var REFRESH_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><polyline points="3 4 3 9 8 9"/></svg>';
  var PAGE_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>';
  function footer(o) {
    var tip = o.source === 'Confluence'
      ? APP + ' counts the pages live when the page opens. Pages you cannot open are not counted for you.'
      : APP + ' loads these numbers live from Jira when the page opens, with your own Jira permissions. People who cannot see the work items in Jira do not see the numbers.';
    return '<div class="ep-foot"><span class="ep-live" title="' + esc(tip) + '">Live from ' + o.source + (o.time ? ' · as of ' + o.time : '') + '</span>' +
      (o.refresh ? '<button type="button" class="ep-sbtn" data-refresh="' + o.refresh + '" data-fid="ref-' + o.refresh + '" title="Load the latest numbers from ' + o.source + ' now.">' + REFRESH_SVG + 'Refresh</button>' : '') +
      (o.jiraLink ? '<button type="button" class="ep-link" data-jira data-fid="jira-' + (o.refresh || o.jiraLink.length) + '" title="Opens exactly these work items in Jira’s search, so you can see each one.">' + o.jiraLink + '</button>' : '') +
      (o.extra || '') + '</div>';
  }
  function openList(items, links) {
    if (!items.length) return '<p class="ep-small">Nothing open: every work item is done.</p>';
    return '<ul class="ep-open">' + items.map(function (i) {
      return '<li><span class="' + (links ? 'ep-a' : 'ep-plain') + '">' + i[0] + '</span><span>' + esc(i[1]) + '</span>' + statusLoz(i[2]) + '</li>';
    }).join('') + '</ul>';
  }
  function msgBox(tone, title, body, hint) {
    return '<div class="ep-msg is-' + tone + '" role="note"><span class="ep-msg-icon" aria-hidden="true">' + (tone === 'info' ? 'i' : '!') + '</span><div><div class="ep-msg-title">' + esc(title) + '</div><p>' + esc(body) + '</p><p>What to do: ' + esc(hint) + '</p></div></div>';
  }

  // ── Views shared by the page, the preview and the snapshot ──
  function epicCounts(key, unit, override) {
    var e = override || EPICS[key];
    return cnt(unit === 'sp' ? e.pts : e.c, e.flagged);
  }
  function epicMacro(key, o) {
    var e = o.data || EPICS[key], c = epicCounts(key, o.unit, o.data);
    var name = o.title || e.name;
    return '<div class="ep-macro">' +
      '<div class="ep-head"><div class="ep-name"><span class="' + (o.links === false ? 'ep-plain' : 'ep-a') + '">' + key + '</span><span class="ep-title">' + esc(name) + '</span></div>' +
      (o.withStatus ? '<div class="ep-tags">' + statusLoz(e.status) + dueLoz(e.due, e.status === 'Done', 'Due') + '</div>' : '') + '</div>' +
      (tot(c) ? bar(c) + countRow(c, o.unit) : infoBox(o.unit === 'sp' ? 'No estimated work items yet' : 'No work items in this epic yet', 'The bar fills up as work items are added to ' + key + ' and moved to Done in Jira.')) +
      (o.foot || '') + (o.list || '') + '</div>';
  }
  function infoBox(title, text) {
    return '<div class="ep-msg is-info"><span class="ep-msg-icon" aria-hidden="true">i</span><div><div class="ep-msg-title">' + esc(title) + '</div><p>' + esc(text) + '</p></div></div>';
  }
  function listMacro(rows, o) {
    var unit = o.unit;
    var body = rows.map(function (r) {
      var c = r.c, t = tot(c);
      return '<tr><td><div class="ep-cell-name"><span class="' + (o.links ? 'ep-a' : 'ep-plain') + '">' + esc(r.name) + '</span><span class="ep-cap">' + r.key + '</span></div></td>' +
        '<td>' + (t ? bar(c, 'is-thin') : '<span class="ep-cap">No work items yet</span>') + '</td>' +
        '<td title="' + esc(t ? summary(c.d, t, unit) : 'Nothing to count yet') + '"><div class="ep-cell-pct"><b>' + progressText(c.d, t) + '</b>' + (t ? '<span class="ep-cap">' + c.d + '/' + t + (unit === 'sp' ? ' pts' : '') + '</span>' : '') + '</div></td>' +
        '<td class="d-hide-sm">' + (r.status ? statusLoz(r.status) : '<span class="ep-cap">–</span>') + '</td>' +
        '<td>' + (r.due ? dueLoz(r.due, r.status === 'Done', '') : '<span class="ep-cap">–</span>') + '</td></tr>';
    }).join('');
    var sum = { d: 0, p: 0, o: 0 };
    rows.forEach(function (r) { sum.d += r.c.d; sum.p += r.c.p; sum.o += r.c.o; });
    var overall = o.total && tot(sum) ? '<div class="ep-overall"><div class="ep-overall-line"><b>Overall</b><span class="ep-cap">' + progressText(sum.d, tot(sum)) + ' · ' + esc(summary(sum.d, tot(sum), unit)) + '</span></div>' + bar(sum, 'is-thinner') + '</div>' : '';
    if (!rows.length) {
      return '<div class="ep-macro">' + (o.title ? '<div class="ep-title">' + esc(o.title) + '</div>' : '') + infoBox('No epics to show', o.emptyText || 'None of the chosen epics is available to you.') + (o.foot || '') + '</div>';
    }
    return '<div class="ep-macro">' + (o.title ? '<div class="ep-title">' + esc(o.title) + '</div>' : '') +
      '<div class="d-table-wrap"><table class="ep-table"><thead><tr><th class="ep-c-epic">Epic</th><th class="ep-c-bar">Progress</th><th class="ep-c-pct">Done</th><th class="ep-c-st d-hide-sm">Status</th><th class="ep-c-due">Due</th></tr></thead><tbody>' + body + '</tbody></table></div>' +
      overall + (o.foot || '') + '</div>';
  }
  function rowOf(key, unit, data) {
    var e = data || EPICS[key];
    return { key: key, name: e.name, c: cnt(unit === 'sp' ? e.pts : e.c), status: e.status, due: e.due };
  }

  // ════════════════════════════════════════════════════════════
  // Tab 1: a status page with several macros
  // ════════════════════════════════════════════════════════════
  var CP19_DONE = { name: EPICS['CP-19'].name, status: 'In Progress', due: '2026-10-16', c: [6, 0, 0], pts: [16, 0, 0, 0], flagged: 0, open: [] };

  function renderStatus(S) {
    var T = S.s1;
    function epic(key, unit) {
      var data = key === 'CP-19' && T.cp19 ? CP19_DONE : null;
      var e = data || EPICS[key], c = epicCounts(key, unit, data);
      var nOpen = unit === 'sp' ? null : c.p + c.o;
      var open = !!T.open[key] && nOpen !== 0;
      var toggle = nOpen === 0 ? '' : '<button type="button" class="ep-sbtn is-text" data-open="' + key + '" data-fid="open-' + key + '" aria-expanded="' + open + '" title="Lists the work items that are not done yet, as far as your Jira permissions allow.">' +
        (open ? 'Hide open work items' : nOpen ? 'Show ' + plural(nOpen, 'open work item', 'open work items') : 'Show open work items') + '</button>';
      return epicMacro(key, {
        unit: unit, withStatus: true, data: data,
        foot: footer({ source: 'Jira', time: T.time[key] || '15:59', refresh: key, jiraLink: 'Open in Jira', extra: toggle }),
        list: open ? openList(e.open, true) : ''
      });
    }
    var pages = CHILD_PAGES, missing = pages.filter(function (p) { return p[1].split(' ').indexOf('approved') === -1; });
    var pc = { d: pages.length - missing.length, p: 0, o: missing.length };
    var pageToggle = '<button type="button" class="ep-sbtn is-text" data-open="pages" data-fid="open-pages" aria-expanded="' + !!T.pages + '" title="Lists the pages that do not have the label &quot;approved&quot; yet, as far as you can open them.">' +
      (T.pages ? 'Hide pages' : 'Show ' + plural(missing.length, 'page', 'pages') + ' without "approved"') + '</button>';
    var pageList = T.pages ? '<ul class="ep-pages">' + missing.map(function (p) { return '<li>' + PAGE_SVG + '<span class="ep-a">' + esc(p[0]) + '</span></li>'; }).join('') + '</ul>' : '';

    return [
      '<div class="d-context"><span>Spaces</span><span class="d-sep">/</span><span>Customer Portal</span><span class="d-sep">/</span><b>Q4 status report</b></div>',
      '<div class="ep-page">',
      '  <h3 class="ep-ptitle">Customer Portal — Q4 status report</h3>',
      '  <p class="ep-ptext">Where the Customer Portal stands this quarter. The progress bars come live from Jira, so this page is current whenever someone opens it.</p>',
      '  <h4 class="ep-ph2">Epics this quarter</h4>',
      '  <div class="d-app ep-grid"><span class="d-app-tag">' + TAG + '</span>',
      '    <div class="ep-col">' + epic('CP-1', 'wi') + epic('CP-19', 'wi') + '</div>',
      '    <div class="ep-col">' + epic('CP-26', 'wi') + epic('CP-10', 'sp') + '</div>',
      '  </div>',
      '  <h4 class="ep-ph2">Help centre and beta</h4>',
      '  <div class="d-app ep-grid"><span class="d-app-tag">' + TAG + '</span>',
      '    <div class="ep-macro">',
      '      <div class="ep-head"><div class="ep-name"><span class="ep-title">Help articles approved</span><span class="ep-cap">below this page</span></div></div>',
      '      ' + bar(pc) + countRow(pc, 'pg', 'labelled "approved"'),
      '      ' + footer({ source: 'Confluence', time: T.time.pages || '15:59', refresh: 'pages', extra: pageToggle }) + pageList,
      '    </div>',
      '    <div class="ep-macro">',
      '      <div class="ep-head"><span class="ep-title">Beta customer interviews</span>' + loz('On track', 'green') + '</div>',
      '      <div class="ep-bar ep-single is-green" aria-hidden="true"><i style="width:58%"></i></div>',
      '      <div class="ep-counts"><span class="ep-num"><b class="ep-pct">58' + NB + '%</b><span>7 of 12 steps done</span></span><span class="ep-live" title="This progress is entered by hand. The date shows when it was last changed.">Updated 4 Oct 2026</span></div>',
      '      <p class="ep-note">Next: three enterprise customers in week 42.</p>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  // ════════════════════════════════════════════════════════════
  // Tab 2: the settings dialog of the five macros, with preview
  // ════════════════════════════════════════════════════════════
  var MENU = [
    { key: 'bar', title: 'Progress Bar', desc: 'A progress bar you set by hand, for work that is not tracked in Jira.', color: '#0F788C',
      icon: '<rect x="5" y="10.5" width="14" height="3" rx="1.5" fill="#fff" opacity=".45"/><rect x="5" y="10.5" width="8" height="3" rx="1.5" fill="#fff"/>' },
    { key: 'list', title: 'Progress List', desc: 'Several Jira epics as a list of progress bars, for roadmaps and status pages.', color: '#20845B',
      icon: '<rect x="6" y="7" width="12" height="2" rx="1" fill="#fff"/><rect x="6" y="11" width="9" height="2" rx="1" fill="#fff"/><rect x="6" y="15" width="11" height="2" rx="1" fill="#fff"/>' },
    { key: 'jira', title: 'Jira Progress', desc: 'Live progress of a Jira project, release, saved filter or JQL search.', color: '#1D7AFC',
      icon: '<path d="M6 7h12l-4.5 5.5V17l-3 1.5v-6Z" fill="#fff"/>' },
    { key: 'epic', title: 'Epic Progress', desc: 'Live progress of a Jira epic, from the status of its work items.', color: '#192F54',
      icon: '<rect x="5.5" y="8.5" width="13" height="3" rx="1.5" fill="#fff" opacity=".35"/><rect x="5.5" y="8.5" width="8" height="3" rx="1.5" fill="#4ED49A"/><rect x="5.5" y="13" width="13" height="3" rx="1.5" fill="#fff" opacity=".35"/><rect x="5.5" y="13" width="5" height="3" rx="1.5" fill="#fff"/>' },
    { key: 'pages', title: 'Page Progress', desc: 'How many pages carry a label such as "approved", for documentation reviews.', color: '#E27E00',
      icon: '<path d="M8 5.5h6l3 3v10H8Z" fill="#fff"/><rect x="10" y="11" width="5" height="1.4" rx=".7" fill="#E27E00"/><rect x="10" y="14" width="4" height="1.4" rx=".7" fill="#E27E00"/>' }
  ];
  function menuEntry(key) { return MENU.filter(function (m) { return m.key === key; })[0]; }

  var LEADS = {
    'bar': 'A progress bar you set by hand, for anything that is not tracked in Jira: a migration, a hiring plan, a checklist.',
    'epic': 'Shows how far one Jira epic has come, live from its work items. Every reader sees the numbers their own Jira permissions allow.',
    'jira': 'Shows the progress of a Jira project, a release, a saved filter or a JQL search, live from Jira. Every reader sees the numbers their own Jira permissions allow.',
    'list': 'Shows several epics as a list of progress bars, for example on a roadmap or status page. Every reader sees the numbers their own Jira permissions allow.',
    'pages': 'Shows how many pages carry a label, for example how many pages of a manual are approved. Pages a reader cannot open are not counted for them.'
  };
  var UNIT_CHOICES = [{ v: 'wi', l: 'Work items (recommended): every work item counts once' }, { v: 'sp', l: 'Story points: bigger work items weigh more' }];
  var UNIT_TIP = 'Work items: "12 of 20 done". Story points: the estimates are added up, so a big story counts more than a small one. Work items without an estimate are shown separately.';
  var SHARE_TIP = 'Saves the current numbers with date and time in the app. Everyone who can see this page then sees this snapshot, also without Jira. It changes when an editor updates it, and, if you keep it up to date (below), when an editor opens the page. Untick it to remove the snapshot: it is deleted when an editor next opens the published page. A snapshot whose macro nobody opens for 120 days is deleted too.';
  var SHARE_WHAT_TIP = 'A snapshot keeps no person fields: no assignees and no account IDs, not even of the person who publishes it, so its list of open work items has no assignee column. Titles and names are kept as your team wrote them in Jira, also if they contain names of people. You decide what to publish, and editors of the page can remove the snapshot at any time.';
  var KEEP_TIP = 'When someone who can edit this page opens it and the snapshot is older than 15 minutes, ' + APP + ' reads the numbers again from Jira with that person’s own permissions and updates the snapshot. Automatic updates refresh the numbers of what an editor published; new epics, work items or names appear only when an editor updates the snapshot by hand. Reading a snapshot never causes a Jira request; "View live" reads Jira with the reader’s own permissions. Turn it off to keep the snapshot as it is until someone clicks "Update snapshot".';

  function startForms() {
    var shareDefaults = { share: false, shareWhat: 'nums', keepFresh: true };
    return {
      'epic': Object.assign({ theEpic: 'CP-1', widen: false, countIn: 'wi', title: '', withStatus: true, withOpen: true }, shareDefaults),
      'jira': Object.assign({ what: 'proj', proj: 'CP', relProj: 'CP', rel: 'p30', filt: 'beta', query: 'beta', noSubs: true, countIn: 'wi', title: '', withOpen: true }, shareDefaults),
      'list': Object.assign({ which: 'mine', picks: ['CP-1', 'CP-26', 'CP-19'], proj: 'CP', parentPick: 'CP-100', withDone: false, query: 'roadmap', countIn: 'wi', title: 'Roadmap Q4', order: 'asis', withTotal: true }, shareDefaults),
      'pages': { where: 'below', otherSpace: '', doneTag: 'approved', onlyTag: '', title: '', withMissing: true },
      'bar': { entry: 'pct', pct: '40', sDone: '3', sTotal: '5', title: 'Website relaunch', look: 'a', note: '', withDate: true }
    };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function pageLabel(input) {
    return String(input || '').trim().split(/\s+/).join('-').toLowerCase();
  }
  function labelCharactersOk(label) {
    var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789_-';
    return label.length > 0 && label.length <= 100 && Array.from(label).every(function (letter) { return alphabet.includes(letter); });
  }
  function enteredPercent(input) {
    var typed = String(input).replace(/,/, '.'), sign = typed.indexOf('%');
    if (sign !== -1) typed = typed.slice(0, sign) + typed.slice(sign + 1);
    return typed.trim().length && Number.isFinite(Number(typed)) ? Number(typed) : null;
  }
  function stepAmount(input) { return { digits: digitsOnly(input), amount: Number(input) }; }
  function digitsOnly(input) {
    var typed = String(input).trim();
    return typed.length > 0 && Array.from(typed).every(function (letter) { return '0123456789'.includes(letter); });
  }
  var FORM_MESSAGES = {
    rel: 'Choose a release.', picks: 'Add at least one epic.',
    missingLabel: 'Enter the label that marks a page as done, for example approved.',
    labelAlphabet: 'Labels use lower-case letters, numbers, - and _ only.',
    sameLabel: 'Use a different label than the "done" label, or leave this empty.',
    otherSpace: 'Choose a space.', total: 'Enter the number of steps (1–1000).',
    done: 'Enter how many steps are done (0 or more).', excess: 'Done steps cannot be more than the total.',
    percent: 'Enter a number from 0 to 100.'
  };
  function fieldErrs(mode, form) {
    var checks = [];
    switch (mode) {
      case 'jira': checks.push(['rel', form.what === 'rel' && !form.rel, 'rel']); break;
      case 'list': checks.push(['picks', form.which === 'mine' && form.picks.length === 0, 'picks']); break;
      case 'pages':
        var doneLabel = pageLabel(form.doneTag), scopeLabel = pageLabel(form.onlyTag);
        checks.push(['doneTag', !doneLabel, 'missingLabel']);
        checks.push(['doneTag', !!doneLabel && !labelCharactersOk(doneLabel), 'labelAlphabet']);
        checks.push(['onlyTag', !!scopeLabel && !labelCharactersOk(scopeLabel), 'labelAlphabet']);
        checks.push(['onlyTag', !!scopeLabel && scopeLabel === doneLabel, 'sameLabel']);
        checks.push(['otherSpace', form.where === 'elsewhere' && !form.otherSpace, 'otherSpace']);
        break;
      case 'bar':
        if (form.entry !== 'stp') {
          var percent = enteredPercent(form.pct);
          checks.push(['pct', percent === null || !(percent >= 0 && percent <= 100), 'percent']);
          break;
        }
        var entered = { total: stepAmount(form.sTotal), done: stepAmount(form.sDone) };
        checks.push(['sTotal', !entered.total.digits || entered.total.amount < 1 || entered.total.amount > 1000, 'total']);
        checks.push(['sDone', !entered.done.digits, 'done']);
        checks.push(['sDone', entered.done.digits && entered.total.digits && entered.done.amount > entered.total.amount, 'excess']);
        break;
    }
    var messages = {};
    checks.forEach(function (check) { if (check[1]) messages[check[0]] = FORM_MESSAGES[check[2]]; });
    return messages;
  }

  // ── Form controls ──
  function capRow(id, label, helpText, required) {
    // Radio groups get a plain caption, so clicking it does not pick the first option
    var cap = id.indexOf('ep-r-') === 0 ? '<span class="ep-flabel-t">' + esc(label) + '</span>' : '<label for="' + id + '">' + esc(label) + (required ? ' *' : '') + '</label>';
    return '<div class="ep-flabel">' + cap + (helpText ? help(helpText, 'About ' + label) : '') + '</div>';
  }
  function field(id, label, o, control) {
    var attrs = ' id="' + id + '-msg" data-msg="' + id + '" data-hint="' + esc(o.hint || '') + '"';
    var msg = o.error ? '<p class="ep-ferr"' + attrs + '>' + esc(o.error) + '</p>'
      : o.hint ? '<p class="ep-fhint"' + attrs + '>' + esc(o.hint) + '</p>' : '<p class="ep-fhint"' + attrs + ' hidden></p>';
    return '<div class="ep-field">' + capRow(id, label, o.help, o.required) + control + msg + '</div>';
  }
  function section(title, body) { return '<div class="ep-sec"><h4 class="ep-sec-title">' + esc(title) + '</h4>' + body + '</div>'; }
  function radios(name, key, options, value, label) {
    return '<div class="ep-radios" role="radiogroup" aria-label="' + esc(label) + '">' + options.map(function (o) {
      var id = 'ep-r-' + name + '-' + o.v;
      return '<label class="ep-radio" for="' + id + '" data-opt="' + name + '-' + o.v + '"><input type="radio" id="' + id + '" name="ep-r-' + name + '" value="' + o.v + '"' + (o.v === value ? ' checked' : '') + ' data-f="' + key + '" data-fid="' + id + '"><span>' + esc(o.l) + '</span></label>';
    }).join('') + '</div>';
  }
  function check(key, checked, label, tip) {
    var id = 'ep-c-' + key;
    return '<div class="ep-check-row"><label class="ep-check" for="' + id + '"><input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + ' data-f="' + key + '" data-fid="' + id + '"><span>' + esc(label) + '</span></label>' + (tip ? help(tip, 'About this option') : '') + '</div>';
  }
  function select(id, key, options, value, placeholder, err) {
    return '<select class="d-select ep-sel" id="' + id + '" data-f="' + key + '" data-fid="' + id + '"' + (err ? ' aria-invalid="true"' : '') + ' aria-describedby="' + id + '-msg">' +
      (placeholder ? '<option value=""' + (value ? '' : ' selected') + '>' + esc(placeholder) + '</option>' : '') +
      options.map(function (o) { return '<option value="' + esc(o.v) + '"' + (o.v === value ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select>';
  }
  function textInput(id, key, value, placeholder, err, mono) {
    return '<input class="d-input ep-in' + (mono ? ' is-mono' : '') + '" id="' + id + '" type="text" value="' + esc(value) + '" placeholder="' + esc(placeholder) + '" data-ft="' + key + '" data-fid="' + id + '"' + (err ? ' aria-invalid="true"' : '') + ' aria-describedby="' + id + '-msg" autocomplete="off" spellcheck="false">';
  }
  function epicPickText(k) { var e = EPICS[k]; return k + ' · ' + e.name + ' (Epic, ' + e.status + ')'; }
  function projOpts() { return PROJECTS.map(function (p) { return { v: p.key, l: p.name + ' (' + p.key + ')' }; }); }

  function shareBlock(f) {
    var body = check('share', f.share, 'Publish a snapshot for people without Jira access', SHARE_TIP);
    if (f.share) {
      body += '<div class="ep-field">' + capRow('ep-r-share-nums', 'What the snapshot shows', SHARE_WHAT_TIP) +
        radios('share', 'shareWhat', [{ v: 'nums', l: 'Progress only: name, percent and counts (recommended)' }, { v: 'full', l: 'Progress and work items: also statuses, dates and the open work items' }], f.shareWhat, 'What the snapshot shows') + '</div>' +
        check('keepFresh', f.keepFresh, 'Keep the snapshot up to date when page editors open the page (at most every 15 minutes)', KEEP_TIP) +
        '<p class="ep-fhint">After saving, publish the page and click "Publish snapshot" below the macro. Only people who can edit this page and see the work items in Jira can publish or update the snapshot.</p>';
    }
    return section('Readers without Jira access', body);
  }
  function countBlock(f) {
    return section('Count', '<div class="ep-field">' + capRow('ep-r-count-wi', 'Count by', UNIT_TIP) + radios('count', 'countIn', UNIT_CHOICES, f.countIn, 'Count by') + '</div>');
  }
  function titleRow(f, placeholder, hint) {
    return field('ep-title', 'Title', { help: 'Shown above the bar. Leave it empty to use the name from Jira.', hint: hint }, textInput('ep-title', 'title', f.title, placeholder));
  }

  function fieldsEpic(f, err) {
    return section('Which epic',
        field('ep-epic', 'Epic', { required: true, help: 'The macro counts the work items directly under this epic, like Jira’s own child-issue progress.', hint: 'Type part of the name or the key (for example PL-42), or paste a link to the epic.' },
          select('ep-epic', 'theEpic', PICK_EPICS.map(function (k) { return { v: k, l: epicPickText(k) }; }), f.theEpic)) +
        check('widen', f.widen, 'Also find other work items, for example an initiative or a story with sub-tasks')) +
      countBlock(f) +
      section('Show', titleRow(f, 'Name of the epic', 'Optional. Empty: the name of the epic.') +
        check('withStatus', f.withStatus, 'Status and due date of the epic') +
        check('withOpen', f.withOpen, 'A button that lists the open work items ("Show 8 open work items")')) +
      shareBlock(f);
  }
  function fieldsJira(f, err) {
    var src = radios('src', 'what', [{ v: 'proj', l: 'A project' }, { v: 'rel', l: 'A release (fix version)' }, { v: 'filt', l: 'A saved filter' }, { v: 'q', l: 'A JQL search (for experts)' }], f.what, 'What to count');
    var pick = '';
    if (f.what === 'proj') pick = field('ep-proj', 'Project', { required: true, help: 'All work items of this project are counted.' }, select('ep-proj', 'proj', projOpts(), f.proj));
    if (f.what === 'rel') {
      var rel = (RELEASES[f.relProj] || []).map(function (r) { return { v: r.id, l: r.name + (r.released ? ' · released' : '') + ' · ' + day(r.date) }; });
      pick = field('ep-vproj', 'Project of the release', { required: true, help: 'First choose the project, then one of its releases.' }, select('ep-vproj', 'relProj', projOpts(), f.relProj)) +
        field('ep-ver', 'Release', { required: true, error: err.rel, help: 'All work items with this fix version are counted. Unreleased versions are listed first.' }, select('ep-ver', 'rel', rel, f.rel, 'Choose a release', err.rel));
    }
    if (f.what === 'filt') pick = field('ep-filter', 'Saved filter', { required: true, help: 'Readers need permission to see the filter in Jira, otherwise the macro tells them it is not shared with them.', hint: 'Your starred filters are listed first. Type to search all filters you can see.' },
      select('ep-filter', 'filt', FILTERS.map(function (x) { return { v: x.id, l: x.name + (x.fav ? ' ★' : '') }; }), f.filt));
    if (f.what === 'q') pick = field('ep-jql', 'JQL', { required: true, help: 'Any JQL that works in Jira’s search. Each reader runs it with their own Jira permissions.', hint: 'Tip: build the search in Jira first, then copy the JQL here. A sort order (ORDER BY) is ignored. In this demo, pick one of two examples.' },
      '<select class="d-select ep-sel is-mono" id="ep-jql" data-f="query" data-fid="ep-jql" aria-describedby="ep-jql-msg">' + JQLS.map(function (j) { return '<option value="' + j.id + '"' + (j.id === f.query ? ' selected' : '') + '>' + esc(j.q) + '</option>'; }).join('') + '</select>');
    return section('What to count', src + pick + check('noSubs', f.noSubs, 'Leave out sub-tasks (otherwise a story and its sub-tasks count separately)')) +
      countBlock(f) +
      section('Show', titleRow(f, 'Name from Jira', 'Optional. Empty: the name of the project, release or filter.') +
        check('withOpen', f.withOpen, 'A button that lists the open work items')) +
      shareBlock(f);
  }
  function fieldsList(f, err) {
    var modes = radios('which', 'which', [{ v: 'mine', l: 'Epics I choose' }, { v: 'proj', l: 'All epics of a project' }, { v: 'kids', l: 'The children of a work item, for example the epics of an initiative' }, { v: 'q', l: 'Work items from a JQL search (for experts)' }], f.which, 'Which epics');
    var pick = '';
    if (f.which === 'mine') {
      var rest = PICK_EPICS.filter(function (k) { return f.picks.indexOf(k) === -1; });
      var chips = f.picks.map(function (k) { return '<span class="ep-chip">' + k + ' · ' + esc(EPICS[k].name) + '<button type="button" data-unpick="' + k + '" data-fid="unpick-' + k + '" aria-label="Remove ' + k + '">×</button></span>'; }).join('');
      pick = field('ep-add', 'Epics', { required: true, error: err.picks, help: 'Type part of a name or a key, or paste a link. Each row counts the work items directly under that epic.', hint: 'Up to 20. The list shows them in the order you add them.' },
        '<div class="ep-multi' + (err.picks ? ' is-err' : '') + '">' + chips +
        '<select class="ep-multi-add" id="ep-add" data-pick data-fid="ep-add" aria-describedby="ep-add-msg"><option value="">Add epics</option>' + rest.map(function (k) { return '<option value="' + k + '">' + esc(epicPickText(k)) + '</option>'; }).join('') + '</select></div>');
    }
    if (f.which === 'proj') pick = field('ep-lproj', 'Project', { required: true, help: 'Lists the epics of this project in Jira’s order (rank).' }, select('ep-lproj', 'proj', projOpts(), f.proj));
    if (f.which === 'kids') pick = field('ep-parent', 'Parent work item', { required: true, help: 'Lists the work items directly under it, for example the epics of an initiative, each with its own progress.' },
      select('ep-parent', 'parentPick', PARENTS.map(function (p) { return { v: p.key, l: p.key + ' · ' + p.name + ' (Initiative, In Progress)' }; }), f.parentPick));
    if (f.which === 'proj' || f.which === 'kids') pick += check('withDone', f.withDone, 'Include epics that are already done');
    if (f.which === 'q') pick = field('ep-ljql', 'JQL', { required: true, help: 'For example issuetype = Epic AND fixVersion = "2.0" ORDER BY rank.', hint: 'Each result becomes a row; its children are counted. The order of your JQL is kept. In this demo, pick one of two examples.' },
      '<select class="d-select ep-sel is-mono" id="ep-ljql" data-f="query" data-fid="ep-ljql" aria-describedby="ep-ljql-msg">' + LIST_JQL.map(function (j) { return '<option value="' + j.id + '"' + (j.id === f.query ? ' selected' : '') + '>' + esc(j.q) + '</option>'; }).join('') + '</select>');
    return section('Which epics', modes + pick) + countBlock(f) +
      section('Show', titleRow(f, 'Roadmap Q4', 'Optional, shown above the list.') +
        field('ep-sort', 'Order', { help: 'Least progress first puts the epics that need attention at the top.' }, select('ep-sort', 'order', [{ v: 'asis', l: 'As chosen (or in Jira’s order)' }, { v: 'least', l: 'Least progress first' }, { v: 'soon', l: 'Earliest due date first' }], f.order)) +
        check('withTotal', f.withTotal, 'An overall row below the list')) +
      shareBlock(f);
  }
  function doneHint(f) {
    var n = pageLabel(f.doneTag);
    return f.doneTag && n !== f.doneTag ? 'Confluence labels are lower case without spaces, so this counts pages labelled "' + n + '".' : 'A page counts as done when it has this label, for example approved.';
  }
  function fieldsPages(f, err) {
    var scope = radios('where', 'where', [{ v: 'below', l: 'Pages below this page' }, { v: 'here', l: 'All pages in this space' }, { v: 'elsewhere', l: 'All pages in another space' }], f.where, 'Which pages');
    if (f.where === 'elsewhere') scope += field('ep-space', 'Space', { required: true, error: err.otherSpace, help: 'Only spaces you can open are listed.' }, select('ep-space', 'otherSpace', SPACES.map(function (s) { return { v: s.key, l: s.name + ' (' + s.key + ')' }; }), f.otherSpace, 'Search spaces', err.otherSpace));
    return section('Which pages', scope) +
      section('Labels',
        field('ep-done', '"Done" label', { required: true, error: err.doneTag, hint: doneHint(f), help: 'Add labels at the bottom of a page, or with the label icon in the page header. Labels are lower case without spaces.' }, textInput('ep-done', 'doneTag', f.doneTag, 'approved', err.doneTag)) +
        field('ep-total', 'Only count pages with this label', { error: err.onlyTag, hint: 'Optional. Empty: all pages in scope count, for example to leave out meeting notes.', help: 'Useful when only some pages need a review, for example pages labelled doc.' }, textInput('ep-total', 'onlyTag', f.onlyTag, 'doc', err.onlyTag))) +
      section('Show', titleRow(f, 'Documentation review', 'Optional. Empty: Pages labelled "approved".') +
        check('withMissing', f.withMissing, 'A button that lists the pages without the label'));
  }
  function fieldsBar(f, err) {
    var input = radios('entry', 'entry', [{ v: 'pct', l: 'As a percentage' }, { v: 'stp', l: 'As steps, for example 3 of 5 milestones' }], f.entry, 'Progress');
    if (f.entry === 'stp') {
      input += '<div class="ep-two">' +
        field('ep-sdone', 'Steps done', { required: true, error: err.sDone, help: 'How many steps are finished. The bar shows the share of done steps.' }, textInput('ep-sdone', 'sDone', f.sDone, '3', err.sDone)) +
        field('ep-stotal', 'Total steps', { required: true, error: err.sTotal, help: 'How many steps there are in total, for example the number of milestones.' }, textInput('ep-stotal', 'sTotal', f.sTotal, '5', err.sTotal)) + '</div>';
    } else {
      input += field('ep-pct', 'Progress in %', { required: true, error: err.pct, hint: 'A number from 0 to 100, for example 40.', help: 'The share that is done. Decimals are allowed; the bar shows whole percent.' }, textInput('ep-pct', 'pct', f.pct, '40', err.pct));
    }
    return section('Progress', input) +
      section('Look',
        field('ep-btitle', 'Title', { hint: 'Optional, for example Website relaunch.', help: 'Shown above the bar.' }, textInput('ep-btitle', 'title', f.title, 'Website relaunch')) +
        field('ep-color', 'Status colour', { help: 'You decide the status; the bar does not guess it from the number, because 30 % can be perfectly on track. On track, at risk and off track also show a label.' },
          select('ep-color', 'look', [{ v: 'a', l: 'Automatic: blue, green when it reaches 100 %' }, { v: 'ok', l: 'On track (green)' }, { v: 'risk', l: 'At risk (yellow)' }, { v: 'off', l: 'Off track (red)' }, { v: 'plain', l: 'Neutral (blue, no status label)' }], f.look)) +
        field('ep-bnote', 'Note under the bar', { hint: 'Optional, for example Next milestone: beta on 15 November.', help: 'A short line of text below the bar.' }, textInput('ep-bnote', 'note', f.note, 'Next milestone: beta on 15 November')) +
        check('withDate', f.withDate, 'Show when the value was last changed ("Updated 4 Oct 2026"), so readers know how fresh it is'));
  }

  // ── Preview (precomputed sample numbers, or the bar from the inputs) ──
  var PREVIEW_TIME = '16:05';
  function jiraSrc(f) {
    if (f.what === 'proj') { var p = PROJECTS.filter(function (x) { return x.key === f.proj; })[0]; return { d: p, name: p.name, caption: 'Project ' + p.key }; }
    if (f.what === 'rel') { var r = (RELEASES[f.relProj] || []).filter(function (x) { return x.id === f.rel; })[0]; return r ? { d: r, name: r.name, caption: 'Jira release · ' + f.relProj, release: r } : null; }
    if (f.what === 'filt') { var fl = FILTERS.filter(function (x) { return x.id === f.filt; })[0]; return { d: fl, name: fl.name, caption: 'Saved filter' }; }
    var j = JQLS.filter(function (x) { return x.id === f.query; })[0];
    return { d: j, name: '', jql: j.q };
  }
  function jiraNums(src, f) {
    var d = src.d, subs = f.noSubs ? [0, 0, 0] : d.subs;
    if (f.countIn === 'sp') return cnt(add(d.pts, [0, 0, 0, subs[0] + subs[1] + subs[2]]), d.flagged);
    return cnt(add(d.c, subs), d.flagged);
  }
  function jiraMacro(f, foot) {
    var src = jiraSrc(f), c = jiraNums(src, f);
    var head;
    if (src.jql) head = '<span class="ep-title">' + esc(f.title || 'JQL search') + '</span><code class="ep-code" title="The JQL this macro counts. Each reader runs it with their own Jira permissions.">' + esc(src.jql) + '</code>';
    else head = '<span class="ep-a">' + esc(f.title || src.name) + '</span><span class="ep-cap">' + esc(src.caption) + '</span>';
    var rel = src.release ? '<div class="ep-tags">' + (src.release.released ? loz('Released', 'green') : loz('Unreleased', 'blue')) + dueLoz(src.release.date, src.release.released, 'Release') + '</div>' : '';
    return '<div class="ep-macro"><div class="ep-head"><div class="ep-name">' + head + '</div>' + rel + '</div>' +
      (tot(c) ? bar(c) + countRow(c, f.countIn) : infoBox('No work items to count yet', 'The project has no work items yet, or none you can see.')) + foot + '</div>';
  }
  function listPicks(f) {
    var keys;
    if (f.which === 'mine') keys = f.picks.slice();
    else if (f.which === 'proj') keys = RANK[f.proj].filter(function (k) { return f.withDone || EPICS[k].status !== 'Done'; });
    else if (f.which === 'kids') keys = PARENTS.filter(function (p) { return p.key === f.parentPick; })[0].kids.filter(function (k) { return f.withDone || EPICS[k].status !== 'Done'; });
    else keys = LIST_JQL.filter(function (j) { return j.id === f.query; })[0].keys.slice();
    return keys;
  }
  function orderRows(rows, how) {
    var r = rows.map(function (x, i) { x.i = i; return x; });
    if (how === 'least') r.sort(function (a, b) { return (completedPercent(a.c.d, tot(a.c)) - completedPercent(b.c.d, tot(b.c))) || a.i - b.i; });
    if (how === 'soon') r.sort(function (a, b) { return (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || a.i - b.i; });
    return r;
  }
  function pageNums(f) {
    var list = f.where === 'below' ? PAGES.children : f.where === 'here' ? PAGES.space : PAGES[f.otherSpace] || [];
    var dl = pageLabel(f.doneTag), tl = pageLabel(f.onlyTag);
    var scope = list.filter(function (p) { return !tl || p[1].split(' ').indexOf(tl) !== -1; });
    var done = scope.filter(function (p) { return p[1].split(' ').indexOf(dl) !== -1; }).length;
    return { d: done, p: 0, o: scope.length - done, dl: dl, tl: tl };
  }
  function pageMacro(f, foot) {
    var c = pageNums(f);
    var where = f.where === 'below' ? 'below this page' : f.where === 'here' ? 'in this space' : 'in the space ' + (SPACES.filter(function (s) { return s.key === f.otherSpace; })[0] || {}).name;
    var body = tot(c) ? bar(c) + countRow(c, 'pg', 'labelled "' + c.dl + '"')
      : infoBox('No pages found', f.where === 'below' ? 'This page has no child pages yet. Create child pages, or choose "All pages in this space" in the settings.' : 'There are no pages ' + (c.tl ? 'labelled "' + c.tl + '" ' : '') + where + ' that you can open.');
    return '<div class="ep-macro"><div class="ep-head"><div class="ep-name"><span class="ep-title">' + esc(f.title || 'Pages labelled "' + c.dl + '"') + '</span><span class="ep-cap">' + esc((c.tl ? 'pages labelled "' + c.tl + '" ' : '') + where) + '</span></div></div>' + body + foot + '</div>';
  }
  function barMacro(f) {
    var v;
    v = { pct: completedPercent(Number(f.sDone), Number(f.sTotal)), d: Number(f.sDone), t: Number(f.sTotal) };
    if (f.entry !== 'stp') v.pct = Math.trunc(enteredPercent(f.pct));
    var appearances = { ok: ['green', 'On track'], risk: ['yellow', 'At risk'], off: ['red', 'Off track'], plain: ['blue', ''] };
    var appearance = f.look === 'a' ? (v.pct === 100 ? ['green', 'Done'] : ['blue', '']) : appearances[f.look];
    var color = appearance[0], status = appearance[1] ? [appearance[1], color] : null;
    var w = v.pct === 0 ? 0 : Math.max(2, v.pct);
    return '<div class="ep-macro">' + (f.title || status ? '<div class="ep-head"><span class="ep-title">' + esc(f.title) + '</span>' + (status ? loz(status[0], status[1]) : '') + '</div>' : '') +
      '<div class="ep-bar ep-single is-' + color + '" aria-hidden="true"><i style="width:' + w + '%"></i></div>' +
      '<div class="ep-counts"><span class="ep-num"><b class="ep-pct">' + v.pct + NB + '%</b>' + (f.entry === 'stp' ? '<span>' + v.d + ' of ' + plural(v.t, 'step', 'steps') + ' done</span>' : '') + '</span>' +
      (f.withDate ? '<span class="ep-live" title="This progress is entered by hand. The date shows when it was last changed.">Updated ' + day(TODAY) + '</span>' : '') + '</div>' +
      (f.note ? '<p class="ep-note">' + esc(f.note) + '</p>' : '') + '</div>';
  }
  function previewHtml(m, f) {
    var ok = Object.keys(fieldErrs(m, f)).length === 0;
    if (m === 'bar') return ok ? barMacro(f) : '<p class="ep-muted">Enter the progress above to see the bar.</p>';
    if (!ok) return '<p class="ep-muted">The preview appears as soon as the required fields (*) are filled in.</p>';
    var previewFoot = { time: PREVIEW_TIME, source: 'Jira', jiraLink: 'Open in Jira' };
    if (m === 'pages') Object.assign(previewFoot, { source: 'Confluence', jiraLink: '' });
    if (m === 'list') previewFoot.jiraLink = 'Open the list in Jira';
    var foot = footer(previewFoot);
    var singleViews = { epic: function () { return epicMacro(f.theEpic, { foot: foot, withStatus: f.withStatus, title: f.title, unit: f.countIn }); },
      jira: function () { return jiraMacro(f, foot); }, pages: function () { return pageMacro(f, foot); } };
    if (singleViews[m]) return singleViews[m]();
    var rows = orderRows(listPicks(f).map(function (k) { return rowOf(k, f.countIn); }), f.order);
    var emptyText = { mine: 'None of the chosen epics is available to you.', proj: 'The project has no open epics. Tick "Include done epics" in the settings to see finished ones.', kids: 'The work item has no children (or none that are open).', q: 'The JQL returns no work items for you.' }[f.which];
    return listMacro(rows, { unit: f.countIn, title: f.title, links: true, total: f.withTotal, foot: foot, emptyText: emptyText });
  }

  function renderSettings(S) {
    var C = S.s2, m = C.macro, f = C.f[m], info = menuEntry(m);
    var errs = C.flagErrs ? fieldErrs(m, f) : {};
    var form = { 'epic': fieldsEpic, 'jira': fieldsJira, 'list': fieldsList, 'pages': fieldsPages, 'bar': fieldsBar }[m](f, errs);
    var invalid = C.flagErrs && Object.keys(errs).length > 0;
    var menu = '<div class="ep-menu" role="group" aria-label="Macros in the / menu"><div class="ep-menu-q">/progress</div><ul>' + MENU.map(function (x) {
      return '<li><button type="button" class="ep-menu-item" data-macro="' + x.key + '" data-fid="menu-' + x.key + '" aria-pressed="' + (x.key === m) + '">' +
        '<svg class="ep-micon" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="' + x.color + '"/>' + x.icon + '</svg>' +
        '<span><b>' + x.title + '</b><small>' + esc(x.desc) + '</small></span></button></li>';
    }).join('') + '</ul></div>';
    return [
      '<div class="d-context"><span>Spaces</span><span class="d-sep">/</span><span>Customer Portal</span><span class="d-sep">/</span><span>Q4 status report</span><span class="d-sep">/</span><b>Editing</b><span class="d-faint ep-ctx-right">Type /progress to add a macro</span></div>',
      '<div class="ep-cfg">',
      menu,
      '  <section class="ep-dialog d-app" aria-label="' + info.title + ' settings"><span class="d-app-tag">' + TAG + '</span>',
      '    <div class="ep-dlg-head"><h3>' + info.title + '</h3><button type="button" class="ep-x" data-cfg="cancel" aria-label="Close the settings without saving" title="Closes the settings without saving.">×</button></div>',
      '    <p class="ep-lead">' + esc(LEADS[m]) + '</p>',
      '    <div class="ep-dlg-body' + (m === 'list' ? ' is-stacked' : '') + '">',
      '      <div class="ep-form">' + form + '</div>',
      '      <div class="ep-prev"><div class="ep-prev-head"><b>Preview</b><span>' + (m === 'bar' ? 'This is how the bar looks on the page.' : 'Live data, exactly as the macro shows it to you on the page.') + '</span></div>',
      '        <div class="ep-prev-box" data-live="preview" data-step="preview">' + previewHtml(m, f) + '</div>',
      invalid ? '        <p class="ep-ferr" role="alert" data-live="formerr">Fill in the fields marked above to save.</p>' : '',
      '        <div class="ep-dlg-actions"><button type="button" class="d-btn is-subtle" data-cfg="cancel" data-fid="cfg-cancel" title="Closes the settings without saving.">Cancel</button><button type="button" class="d-btn is-primary" data-cfg="save" data-fid="cfg-save" title="Checks the settings and saves them on the macro. Publish the page to show the change to readers.">Save</button></div>',
      '      </div>',
      '    </div>',
      '  </section>',
      '</div>'
    ].join('\n');
  }

  // ════════════════════════════════════════════════════════════
  // Tab 3: published snapshot, editor with Jira vs reader without
  // ════════════════════════════════════════════════════════════
  var T3_START = 14 * 60 + 5;
  var T3_KEYS = ['CP-41', 'CP-19', 'CP-10', 'CP-1', 'CP-26'];
  var CP41_DONE = { name: EPICS['CP-41'].name, status: 'Done', due: '2026-09-30', c: [5, 0, 0], pts: [13, 0, 0, 0] };
  function t3Rows(step) { return T3_KEYS.map(function (k) { return rowOf(k, 'wi', k === 'CP-41' && step > 0 ? CP41_DONE : null); }); }
  function stamp(mins) { return day(TODAY) + ', ' + clock(T3_START + mins); }

  var SNAP_TIPS = {
    live: 'Shows the current numbers from Jira instead of the snapshot, loaded with your own Jira permissions. Needs access to these work items in Jira. Editors of the page can update or remove the snapshot there.',
    back: 'Shows the published snapshot again, as readers without Jira access see it.',
    publish: 'Saves the numbers you see now, with date and time, for people without Jira access. They then see this snapshot instead of a notice. It changes when an editor updates it, or, if the macro keeps it up to date, when an editor opens the page and it is older than 15 minutes.',
    update: 'Replaces the snapshot with the current numbers from Jira, read with your Jira permissions. Everyone who can see this page then sees the new numbers.',
    remove: 'Deletes the snapshot. Needs edit permission on this page, not Jira access or a subscription. People without Jira access then see a notice instead of numbers again.'
  };
  function stampTip(byVisit) {
    return (byVisit
      ? APP + ' updated this snapshot automatically at this time, when an editor of this page opened it: the numbers were read from Jira with that editor’s own permissions.'
      : 'An editor of this page who can see the work items in Jira published these numbers at this time, read with their own Jira permissions.') +
      ' When an editor opens the page and the snapshot is older than 15 minutes, its numbers are updated the same way. Automatic updates refresh the numbers of what an editor published; new epics, work items or names appear only when an editor updates the snapshot by hand.' +
      ' Everyone who can see the page sees this snapshot, also without Jira access. Reading a snapshot never causes a Jira request; "View live" reads Jira with the reader’s own permissions.';
  }
  function snapBtn(action, label, primary) {
    return '<button type="button" class="ep-sbtn' + (primary ? ' is-default' : '') + '" data-snap="' + action + '" data-fid="snap-' + action + '" title="' + esc(SNAP_TIPS[action]) + '">' + label + '</button>';
  }

  function renderSnapshot(S) {
    var T = S.s3, now = T3_START + T.mins, snap = T.shot, editor = T.viewer === 'editor';
    var macro;
    var viewSnapshot = snap && (!editor || !T.editorLive);
    if (!editor && !snap) {
      macro = msgBox('info', 'This progress comes from Jira, which you cannot open', APP + ' shows Jira progress only to people who can see the work items in Jira, and your account has no access to Jira on this site.', 'If you need to see it, ask your Jira admin for access.') +
        '<p class="ep-small">No snapshot has been published for this macro yet. Someone who can edit this page and see the work items in Jira can publish one.</p>';
    } else if (viewSnapshot) {
      var label = '<span class="ep-live" title="' + esc(stampTip(snap.byVisit)) + '" tabindex="0">Snapshot · ' + stamp(snap.mins) + ' · ' + (snap.byVisit ? 'updated automatically' : 'published') + '</span>';
      var buttons = !editor && T.readerLive ? '' : snapBtn('live', 'View live');
      var bar3 = '<div class="ep-foot ep-snapbar" data-step="snapbar">' + label + buttons + '</div>';
      macro = (!editor && T.readerLive ? msgBox('info', 'Live numbers need access to Jira', APP + ': You don’t have access to Jira on this site, so live numbers aren’t available. This page shows the published snapshot.', 'If you need the live numbers, ask your Jira admin for access.') : '') +
        listMacro(t3Rows(snap.step), { unit: 'wi', title: 'Customer Portal epics', links: false, total: true, foot: bar3 });
    } else {
      var foot = footer({ source: 'Jira', time: clock(now), refresh: 't3', jiraLink: 'Open the list in Jira' });
      var sbar = snap
        ? '<div class="ep-foot ep-snapbar"><span class="ep-sub">Live numbers. Readers see the snapshot of ' + stamp(snap.mins) + '.</span>' + snapBtn('back', 'Back to the snapshot') + snapBtn('update', 'Update snapshot') + snapBtn('remove', 'Remove snapshot') + '</div>'
        : '<div class="ep-foot ep-snapbar"><span class="ep-sub">No snapshot yet: people without Jira access see a notice instead of numbers.</span>' + snapBtn('publish', 'Publish snapshot', true) + '</div>';
      macro = listMacro(t3Rows(T.step), { unit: 'wi', title: 'Customer Portal epics', links: true, total: true, foot: foot }) + sbar;
    }
    return [
      '<div class="d-context"><span>Spaces</span><span class="d-sep">/</span><span>Customer Portal</span><span class="d-sep">/</span><b>Steering committee update</b></div>',
      '<div class="ep-viewas" role="group" aria-label="Demo controls">',
      '  <span class="ep-viewas-tag">Demo</span><span class="ep-viewas-label">See this page as</span>',
      '  <div class="ep-seg">',
      '    <button type="button" data-viewer="editor" data-fid="viewer-editor" aria-pressed="' + editor + '">Editor with Jira access</button>',
      '    <button type="button" data-viewer="reader" data-fid="viewer-reader" aria-pressed="' + !editor + '">Reader without Jira access</button>',
      '  </div>',
      '  <button type="button" class="ep-later" data-later data-fid="later" title="Demo: the same person opens the page again 20 minutes later. Meanwhile one epic was finished in Jira.">',
      '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>Open the page again 20 minutes later</button>',
      '</div>',
      '<div class="ep-page">',
      '  <h3 class="ep-ptitle">Customer Portal — Steering committee update</h3>',
      '  <p class="ep-ptext">Summary for the steering committee. Not everyone in the committee uses Jira, so the numbers below are shared as a snapshot with its date.</p>',
      '  <div class="d-app ep-one"><span class="d-app-tag">' + TAG + '</span>' + macro + '</div>',
      '</div>'
    ].join('\n');
  }

  // ── Mount ──
  D.mount(root, {
    id: 'ep',
    title: APP,
    tabs: [
      { id: 'page', label: 'Status page' },
      { id: 'settings', label: 'Settings' },
      { id: 'snapshot', label: 'Snapshot' }
    ],
    initialState: function () {
      return {
        s1: { open: {}, time: {}, cp19: false, pages: false },
        s2: { macro: 'jira', f: startForms(), saved: startForms(), flagErrs: false },
        s3: { viewer: 'editor', mins: 0, step: 0, shot: null, editorLive: false, readerLive: false },
        flags: {}
      };
    },
    afterRender: function (tab) {
      // On phones the / menu is a row that scrolls sideways: keep the open macro in view
      if (tab !== 'settings') return;
      var item = root.querySelector('.ep-menu-item[aria-pressed="true"]'), list = item && item.closest('ul');
      if (list && list.scrollWidth > list.clientWidth) list.scrollLeft = Math.max(0, item.parentNode.offsetLeft - 8);
    },
    render: function (tab, S) {
      return ({ settings: renderSettings, snapshot: renderSnapshot }[tab] || renderStatus)(S);
    },
    steps: {
      page: [
        { text: 'click <strong>Show 5 open work items</strong> under CP-1 to see what is still open.', target: '[data-open="CP-1"]', done: function (S) { return S.flags.open; } },
        { text: 'click <strong>Refresh</strong> on CP-19. Its last work item was just finished in Jira.', target: '[data-refresh="CP-19"]', done: function (S) { return S.s1.cp19; } },
        { text: 'click <strong>Show 2 pages without "approved"</strong> to see which help articles are missing. This macro needs no Jira.', target: '[data-open="pages"]', done: function (S) { return S.flags.pages; } }
      ],
      settings: [
        { text: 'under <strong>What to count</strong>, choose <strong>A release (fix version)</strong>. The preview follows.', target: '[data-opt="src-rel"]', done: function (S) { return S.flags.release; } },
        { text: 'switch <strong>Count by</strong> to <strong>Story points</strong>.', target: '[data-opt="count-sp"]', done: function (S) { return S.flags.points; } },
        { text: 'click <strong>Save</strong>. The dialog checks the settings first.', target: '[data-cfg="save"]', done: function (S) { return S.flags.saved; } }
      ],
      snapshot: [
        { text: 'as the editor, click <strong>Publish snapshot</strong> below the list. This list shares progress and work items.', target: '[data-snap="publish"]', done: function (S) { return S.flags.published; } },
        { text: 'switch the view to <strong>Reader without Jira access</strong>.', target: '[data-viewer="reader"]', done: function (S) { return S.flags.reader; } },
        { text: 'as the reader, click <strong>View live</strong>.', target: '[data-snap="live"]', done: function (S) { return S.flags.readerLive; } }
      ]
    },
    doneText: {
      page: '<strong>That’s a live status page.</strong> Every reader sees the numbers their own Jira permissions allow, and 100 % appears only when everything is done.',
      settings: '<strong>Saved on the macro.</strong> Publish the page to show the change to readers. Try the other macros in the /progress menu: each has its own settings and preview.',
      snapshot: '<strong>The snapshot stays on the page.</strong> Reading it made no Jira request. Switch back to the editor and click <strong>Open the page again 20 minutes later</strong>: an editor’s visit updates the numbers with that editor’s Jira permissions.'
    },
    setup: function (api) {
      var S = function () { return api.state(); };

      // Tab 1
      api.on('click', '[data-open]', function (el) {
        var T = S().s1, k = el.dataset.open;
        if (k === 'pages') { T.pages = !T.pages; if (T.pages) S().flags.pages = true; }
        else { T.open[k] = !T.open[k]; if (T.open[k]) S().flags.open = true; }
        api.update();
      });
      api.on('click', '[data-refresh]', function (el) {
        var k = el.dataset.refresh;
        if (k === 't3') { api.toast('Loaded the latest numbers from Jira'); return; }
        var T = S().s1;
        T.time[k] = '16:02';
        if (k === 'pages') T.pages = false; else T.open[k] = false;
        if (k === 'CP-19') T.cp19 = true;
        api.update();
        api.toast(k === 'pages' ? 'Counted the pages again' : k === 'CP-19' ? 'CP-19: every work item is done' : 'Loaded the latest numbers from Jira');
      });
      api.on('click', '[data-jira]', function () { api.toast('In the app, this opens these work items in Jira'); });

      // Tab 2
      api.on('click', '[data-macro]', function (el) {
        var C = S().s2;
        C.macro = el.dataset.macro; C.flagErrs = false;
        api.update();
      });
      api.on('click', '[data-unpick]', function (el) {
        var f = S().s2.f['list'];
        f.picks = f.picks.filter(function (k) { return k !== el.dataset.unpick; });
        api.update();
      });
      api.on('change', '[data-pick]', function (el) {
        var f = S().s2.f['list'];
        if (el.value && f.picks.length < 20) f.picks.push(el.value);
        api.update();
        var again = api.el('[data-pick]'); if (again) again.focus();
      });
      api.on('change', '[data-f]', function (el) {
        var S0 = S(), C = S0.s2, f = C.f[C.macro], k = el.dataset.f;
        var v = el.type === 'checkbox' ? el.checked : el.value;
        f[k] = v;
        if (C.macro === 'jira' && k === 'what') {
          f.noSubs = v === 'proj' || v === 'rel';
          if (v === 'rel') S0.flags.release = true;
        }
        if (C.macro === 'jira' && k === 'relProj') f.rel = '';
        if (k === 'countIn' && v === 'sp') S0.flags.points = true;
        api.update();
      });
      api.on('input', '[data-ft]', function (el) {
        // Text fields update the preview and their hint without re-rendering the field
        var C = S().s2, m = C.macro, f = C.f[m], k = el.dataset.ft;
        f[k] = el.value;
        var errs = C.flagErrs ? fieldErrs(m, f) : {};
        var box = api.el('[data-live="preview"]');
        if (box) box.innerHTML = previewHtml(m, f);
        var formErr = api.el('[data-live="formerr"]');
        if (formErr) formErr.hidden = Object.keys(errs).length === 0;
        root.querySelectorAll('[data-ft]').forEach(function (inp) {
          var msg = api.el('[data-msg="' + inp.id + '"]');
          var key = inp.dataset.ft, e = errs[key];
          if (e) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
          if (!msg) return;
          if (e) { msg.className = 'ep-ferr'; msg.textContent = e; msg.hidden = false; }
          else if (key === 'doneTag') { msg.className = 'ep-fhint'; msg.textContent = doneHint(f); msg.hidden = false; }
          else if (msg.classList.contains('ep-ferr')) { msg.className = 'ep-fhint'; msg.textContent = msg.dataset.hint || ''; msg.hidden = !msg.dataset.hint; }
        });
      });
      api.on('click', '[data-cfg]', function (el) {
        var S0 = S(), C = S0.s2, m = C.macro;
        if (el.dataset.cfg === 'cancel') {
          C.f[m] = clone(C.saved[m]); C.flagErrs = false;
          api.update(); api.toast('Closed without saving');
          return;
        }
        if (Object.keys(fieldErrs(m, C.f[m])).length) { C.flagErrs = true; api.update(); return; }
        C.saved[m] = clone(C.f[m]); C.flagErrs = false; S0.flags.saved = true;
        api.update(); api.toast('Saved. Publish the page to show the change to readers.');
      });

      // Tab 3
      api.on('click', '[data-viewer]', function (el) {
        var T = S().s3;
        T.viewer = el.dataset.viewer; T.editorLive = false; T.readerLive = false;
        if (T.viewer === 'reader') S().flags.reader = true;
        api.update();
      });
      api.on('click', '[data-snap]', function (el) {
        var S0 = S(), T = S0.s3, a = el.dataset.snap;
        if (a === 'publish' || a === 'update') {
          T.shot = { step: T.step, mins: T.mins, byVisit: false }; T.editorLive = false;
          S0.flags.published = true;
          api.update(); api.toast(a === 'publish' ? 'Snapshot published' : 'Snapshot updated');
          return;
        }
        if (a === 'remove') { T.shot = null; T.editorLive = false; api.update(); api.toast('Snapshot removed'); return; }
        if (a === 'back') { T.editorLive = false; api.update(); return; }
        if (a === 'live') {
          if (T.viewer === 'editor') T.editorLive = true;
          else { T.readerLive = true; S0.flags.readerLive = true; }
          api.update();
        }
      });
      api.on('click', '[data-later]', function () {
        var T = S().s3;
        T.mins += 20; T.step = 1; T.editorLive = false; T.readerLive = false;
        var msg;
        if (!T.shot) msg = T.viewer === 'editor' ? '20 minutes later: live numbers as the page opens' : 'Reader’s visit: still no snapshot, so a notice instead of numbers';
        else if (T.viewer === 'editor') {
          var changed = T.shot.step !== T.step;
          T.shot = { step: T.step, mins: T.mins, byVisit: true };
          msg = changed ? 'Editor’s visit: snapshot updated with their Jira permissions' : 'Editor’s visit: snapshot checked, nothing changed';
        } else msg = 'Reader’s visit: no Jira request, the snapshot stays';
        api.update(); api.toast(msg);
      });
    }
  });
})();
