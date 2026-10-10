/* ============================================================
   vpt-demo.js — interactive demo for Visual Progress Tracker
   Sample data and fixed behavior only; written for the website,
   not taken from the app. The rules shown here are the ones the
   documentation describes: every status is worth what the status
   mapping says (unknown statuses count 0%). Group memberships and
   status tallies are stored sample answers; public averages produce
   the displayed percentages, and the bars turn red,
   yellow or green at the two color thresholds.
   ============================================================ */
(function () {
  'use strict';
  var root = document.querySelector('[data-demo="vpt"]');
  if (!root || !window.JBDemo) return;
  var D = window.JBDemo, esc = D.esc;

  var ISSUE_STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];
  var CAT = { 'To Do': 'todo', 'Selected for Development': 'todo', 'In Progress': 'prog', 'In Review': 'prog', 'Done': 'done' };
  // In the sample workflow only "Done" is in Jira's Done category.
  function finished(status) { return status === 'Done'; }
  var START_MAP = [['To Do', 0], ['Backlog', 0], ['Selected for Development', 25], ['In Progress', 50], ['In Review', 75], ['Done', 100], ['Closed', 100]];
  var START_THR = { low: 34, high: 67 };

  // Epics of the sample project, newest first
  var EPICS = [
    { key: 'MOB-50', name: 'Live tracking', status: 'In Progress' },
    { key: 'MOB-29', name: 'Store launch', status: 'To Do' },
    { key: 'MOB-25', name: 'Accessibility', status: 'In Progress' },
    { key: 'MOB-5', name: 'Payments', status: 'In Progress' },
    { key: 'MOB-3', name: 'Android release', status: 'In Progress' }
  ];
  var CALCS = [
    { v: 'bySub', label: 'Progress Bar (Subtasks)', help: 'Averages the status progress of subtasks/child issues per item.' },
    { v: 'byStatus', label: 'Progress Bar (Status)', help: 'Maps each issue workflow status to a progress % (configure in Admin).' },
    { v: 'byHand', label: 'Progress Bar (Manual)', help: 'Reads each issue’s Manual Progress Bar value; uses the status mapping if that field is not found.' }
  ];
  var OV_JQL = [
    { v: '', label: '(no filter)' },
    { v: 'fv', label: 'fixVersion = "Mobile App 5.0"' },
    { v: 'bug', label: 'type = Bug' },
    { v: 'emma', label: 'assignee = "Emma Clarke"' },
    { v: 'open', label: 'statusCategory != Done' }
  ];
  var EP_JQL = {
    epic: [{ v: '', label: '(no filter)' }, { v: 'inprog', label: 'status = "In Progress"' }],
    assignee: [{ v: '', label: '(no filter)' }, { v: 'story', label: 'type = Story' }, { v: 'bug', label: 'type = Bug' }]
  };
  var ROWS = ['10', '25', '50'];
  var MANUAL_CHOICES = [0, 10, 25, 50, 75, 100];

  var rowId = 0;
  function mapRows(pairs) { return pairs.map(function (p) { return { id: 'r' + (rowId++), name: p[0], v: p[1] }; }); }
  function copyRows(rows) { return rows.map(function (r) { return { id: r.id, name: r.name, v: r.v }; }); }
  function byValue(rows) {
    return rows.map(function (r, i) { return [r, i]; })
      .sort(function (a, b) { return a[0].v - b[0].v || a[1] - b[1]; })
      .map(function (x) { return x[0]; });
  }

  function initialState() {
    return {
      map: mapRows(START_MAP),
      draft: null,
      addName: '', addVal: '',
      mapMsg: null,
      thr: { low: START_THR.low, high: START_THR.high },
      thrDraft: null,
      thrMsg: null,
      atab: 'guide',
      recalc: { view: 'idle', next: null },
      issue: { status: 'In Progress', manual: 30, editing: false, draft: 30, details: false },
      subs: [
        { key: 'MOB-55', summary: 'Courier location API endpoint', status: 'Done' },
        { key: 'MOB-56', summary: 'Location updates every five seconds', status: 'Done' },
        { key: 'MOB-57', summary: 'Animated courier pin', status: 'Done' },
        { key: 'MOB-58', summary: 'Battery test on Android', status: 'To Do' }
      ],
      issues: [
        { key: 'MOB-39', summary: 'Android 15 edge-to-edge layout', type: 'Task', status: 'In Progress', manual: 60, subs: ['Done', 'In Progress'], epic: 'Android release', who: 'Liam Ortiz', pts: 3, fv: true },
        { key: 'MOB-30', summary: 'App Store screenshots and preview video', type: 'Task', status: 'In Progress', manual: 40, subs: ['Done', 'To Do', 'To Do'], epic: 'Store launch', who: 'Sofia Rossi', pts: 2, fv: true },
        { key: 'MOB-17', summary: 'Apple Pay at checkout', type: 'Story', status: 'Done', manual: 100, subs: ['Done', 'Done'], epic: 'Payments', who: 'Emma Clarke', pts: 5, fv: true },
        { key: 'MOB-13', summary: 'Arrival time estimate', type: 'Story', status: 'Done', manual: 100, subs: ['Done', 'Done', 'Done'], epic: 'Live tracking', who: 'Noah Becker', pts: 8, fv: true },
        { key: 'MOB-34', summary: 'Beta test with 200 customers', type: 'Task', status: 'To Do', manual: null, subs: [], epic: 'Store launch', who: 'Sofia Rossi', pts: 3, fv: true },
        { key: 'MOB-28', summary: 'Colour contrast of buttons', type: 'Bug', status: 'Done', manual: 100, subs: [], epic: 'Accessibility', who: 'Liam Ortiz', pts: 1, fv: true },
        { key: 'MOB-16', summary: 'Courier call and chat buttons', type: 'Story', status: 'Selected for Development', manual: 10, subs: ['To Do', 'To Do'], epic: 'Live tracking', who: 'Emma Clarke', pts: 5, fv: false },
        { key: 'MOB-35', summary: 'Crash when the basket is empty', type: 'Bug', status: 'Done', manual: 100, subs: [], epic: 'Payments', who: 'Noah Becker', pts: 2, fv: true },
        { key: 'MOB-40', summary: 'Dark mode for the order screen', type: 'Story', status: 'To Do', manual: 0, subs: ['To Do', 'To Do', 'To Do'], epic: 'Accessibility', who: 'Sofia Rossi', pts: 5, fv: false },
        { key: 'MOB-54', summary: 'Live courier location on the map', type: 'Story', live: true, epic: 'Live tracking', who: 'Emma Clarke', pts: 5, fv: true },
        { key: 'MOB-42', summary: 'Push notification when the order arrives', type: 'Story', status: 'In Review', manual: 80, subs: ['Done', 'In Review'], epic: 'Live tracking', who: 'Noah Becker', pts: 3, fv: true },
        { key: 'MOB-45', summary: 'Tip the courier after delivery', type: 'Story', status: 'In Progress', manual: 20, subs: ['Done', 'To Do', 'To Do', 'To Do'], epic: 'Payments', who: 'Liam Ortiz', pts: 5, fv: false }
      ],
      ov: { calc: 'byStatus', jql: '', rows: '25', sort: { k: 'progress', d: -1 }, page: 1, open: false, d: null, flash: false },
      ep: { group: 'epic', measure: 'count', jql: '', rows: '10', sort: { k: 'progress', d: -1 }, open: false, d: null, flash: false },
      flags: {}
    };
  }

  // ── Calculations (documented behavior, sample data) ──
  function pctFor(rows, status) {
    for (var i = 0; i < rows.length; i++) if (rows[i].name === status) return rows[i].v;
    var low = status.toLowerCase();
    for (var j = 0; j < rows.length; j++) if (rows[j].name.toLowerCase() === low) return rows[j].v;
    return 0;
  }
  function statusPct(S, status) { return pctFor(S.map, status); }
  function childPct(S, status) { return finished(status) ? 100 : pctFor(S.map, status); }
  function avg(values) {
    var sum = 0;
    for (var value of values) sum += value;
    return values.length === 0 ? null : Math.round(sum / values.length);
  }
  function tone(S, v) { return D.tone(v, S.thr.low, S.thr.high); }
  function liveIssue(S, it) {
    if (!it.live) return it;
    return Object.assign({}, it, { status: S.issue.status, manual: S.issue.manual, subs: S.subs.map(function (s) { return s.status; }) });
  }
  function progressOf(S, it, calc) {
    if (calc === 'byStatus') return statusPct(S, it.status);
    if (calc === 'bySub') return it.subs.length ? avg(it.subs.map(function (st) { return childPct(S, st); })) : null;
    return it.manual === null || it.manual === undefined ? null : it.manual;
  }
  function ovMatches(it, f) {
    if (f === 'fv') return it.fv;
    if (f === 'bug') return it.type === 'Bug';
    if (f === 'emma') return it.who === 'Emma Clarke';
    if (f === 'open') return !finished(it.status);
    return true;
  }
  // All names in this sample already fit the table columns.
  function sliderPercent(input) {
    var number = parseInt(input, 10);
    if (!(number > 0)) return 0;
    return number > 100 ? 100 : number;
  }
  function nextRunDate() {
    return new Date(Date.now() + 7 * 864e5).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  function labelOf(list, v) { return list.filter(function (o) { return o.v === v; })[0].label; }

  // ── Small markup helpers ──
  function barLoz(S, v, after) {
    if (v === null) return '<span class="d-faint">—</span>';
    var t = tone(S, v);
    return '<div class="vpt-field">' + D.bar(v, t) + '<div class="vpt-field-row">' + D.loz(v + '%', t) + (after || '') + '</div></div>';
  }
  function statusSelect(value, list, attrs, small) {
    return '<select class="d-status cat-' + CAT[value] + (small ? ' is-small' : '') + '" ' + attrs + '>' +
      list.map(function (s) { return '<option' + (s === value ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') +
      '</select>';
  }
  function info(text) {
    return '<span class="vpt-info" tabindex="0" role="img" aria-label="' + esc(text) + '" title="' + esc(text) + '">i</span>';
  }
  function gear(name, open) {
    return '<button type="button" class="d-icon-btn" data-gear="' + name + '" aria-expanded="' + (open ? 'true' : 'false') + '" title="Configure" aria-label="Configure this gadget">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>';
  }
  function options(list, value) {
    return list.map(function (o) { return '<option value="' + esc(o.v) + '"' + (o.v === value ? ' selected' : '') + '>' + esc(o.label) + '</option>'; }).join('');
  }
  function rowsOptions(value) { return options(ROWS.map(function (r) { return { v: r, label: r }; }), value); }
  function msg(kind, text, extra) {
    var icon = kind === 'ok' ? '✓' : kind === 'err' ? '!' : 'i';
    var role = kind === 'err' ? ' role="alert"' : kind === 'ok' ? ' role="status"' : '';
    return '<div class="vpt-msg is-' + kind + '"' + role + '><span class="vpt-msg-icon" aria-hidden="true">' + icon + '</span><div>' + text + (extra || '') + '</div></div>';
  }
  function sortHead(sort, key, label, attr, cls) {
    var on = sort.k === key;
    var arrow = on ? (sort.d > 0 ? ' ▲' : ' ▼') : '';
    return '<th class="' + (cls || '') + '" aria-sort="' + (on ? (sort.d > 0 ? 'ascending' : 'descending') : 'none') + '"><button type="button" class="d-sort" ' + attr + '="' + key + '" data-fid="' + attr + '-' + key + '">' + label + arrow + '</button></th>';
  }
  function sortRows(list, order, valueOf) {
    return list.slice().sort(function (first, second) {
      var left = valueOf(first, order.k), right = valueOf(second, order.k);
      if (left === right) return 0;
      return left > right ? order.d : -order.d;
    });
  }

  // ── Tab 1: issue view ──
  function renderIssue(S) {
    var I = S.issue;
    var childVals = S.subs.map(function (s) { return childPct(S, s.status); });
    var subPct = avg(childVals);
    var doneCount = childVals.filter(function (v) { return v === 100; }).length;

    var subRows = S.subs.map(function (s, i) {
      return '<tr><td><span class="d-key">' + s.key + '</span></td><td>' + esc(s.summary) + '</td>' +
        '<td class="vpt-sub-status">' + statusSelect(s.status, ISSUE_STATUSES, 'data-sub="' + i + '" data-fid="sub-' + i + '" aria-label="Status of ' + s.key + '"', true) + '</td></tr>';
    }).join('');

    var details = I.details ? '<ul class="vpt-children">' + S.subs.map(function (s, i) {
      return '<li>' + D.loz(childVals[i] + '%', tone(S, childVals[i])) + '<span>' + s.key + ' - ' + esc(s.status) + '</span></li>';
    }).join('') + '</ul>' : '';

    var manual;
    if (I.editing) {
      var t = tone(S, I.draft);
      manual = '<div class="d-pop vpt-editor" role="group" aria-label="Edit manual progress">' +
        '<div class="vpt-field">' + D.bar(I.draft, t, ' data-live="mbar"') + '<div class="vpt-field-row"><span data-live="mloz">' + D.loz(I.draft + '%', t) + '</span></div></div>' +
        '<input class="d-range" type="range" min="0" max="100" step="5" value="' + I.draft + '" data-range="manual" data-fid="mrange" aria-label="Manual progress in percent" aria-valuetext="' + I.draft + ' percent" style="--p:' + I.draft + '%">' +
        '<div class="vpt-presets">' + MANUAL_CHOICES.map(function (p) {
          return '<button type="button" class="d-btn is-compact ' + (I.draft === p ? 'is-selected' : 'is-subtle') + '" data-preset="' + p + '" data-fid="preset-' + p + '">' + p + '%</button>';
        }).join('') + '</div>' +
        '<div class="vpt-editor-actions">' +
        '<button type="button" class="d-btn is-icon" data-manual="save" data-fid="msave" title="Save" aria-label="Save manual progress"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg></button>' +
        '<button type="button" class="d-btn is-icon" data-manual="cancel" title="Cancel" aria-label="Cancel"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div></div>';
    } else {
      manual = '<button type="button" class="vpt-manual-btn d-field-edit" data-manual="edit" data-fid="medit" aria-label="Edit manual progress, currently ' + I.manual + ' percent">' + barLoz(S, I.manual) + '</button>';
    }

    return [
      '<div class="d-context"><span>Projects</span><span class="d-sep">/</span><span>Mobile App</span><span class="d-sep">/</span><b>MOB-54</b></div>',
      '<div class="vpt-issue">',
      '  <div class="vpt-main">',
      '    <h3 class="d-h1">Live courier location on the map</h3>',
      '    <p class="d-sub vpt-desc">Customers see where their courier is while the order is on its way. The position updates every five seconds.</p>',
      '    <div class="vpt-subtasks">',
      '      <div class="d-h3">Subtasks</div>',
      '      <div class="d-table-wrap"><table class="d-table"><thead><tr><th>Work</th><th>Summary</th><th>Status</th></tr></thead><tbody>' + subRows + '</tbody></table></div>',
      '    </div>',
      '  </div>',
      '  <aside class="vpt-side">',
      '    <div class="vpt-status-row">' + statusSelect(I.status, ISSUE_STATUSES, 'data-issue-status data-fid="istatus" aria-label="Issue status"') + '</div>',
      '    <div class="vpt-details">',
      '      <div class="d-h3">Details</div>',
      '      <div class="d-fields">',
      '        <div class="d-field-name">Assignee</div><div class="d-field-val">' + D.avatar('Emma Clarke', '#1F845A') + 'Emma Clarke</div>',
      '        <div class="d-field-name">Story Points</div><div class="d-field-val"><span class="d-loz is-grey">5</span></div>',
      '      </div>',
      '      <div class="d-app vpt-appfields"><span class="d-app-tag">Visual Progress Tracker</span>',
      '        <div class="d-fields">',
      '          <div class="d-field-name">Status progress ' + info('Follows the issue status. A Jira admin sets what each status is worth.') + '</div>',
      '          <div class="d-field-val">' + barLoz(S, statusPct(S, I.status)) + '</div>',
      '          <div class="d-field-name">Subtask progress ' + info('The average of the subtasks’ status progress; a done subtask counts 100%. Without subtasks it uses the child issues.') + '</div>',
      '          <div class="d-field-val">' + barLoz(S, subPct, (I.details ? '<span class="d-small d-faint">' + doneCount + '/' + S.subs.length + ' done</span>' : '') +
        '<button type="button" class="d-btn is-subtle is-compact" data-details data-fid="details" aria-expanded="' + (I.details ? 'true' : 'false') + '">' + (I.details ? 'Hide' : 'Details') + '</button>') + details + '</div>',
      '          <div class="d-field-name">Manual progress ' + info('You set it yourself: slider in 5% steps or a quick button, saved with the check mark.') + '</div>',
      '          <div class="d-field-val">' + manual + '</div>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </aside>',
      '</div>'
    ].join('\n');
  }

  // ── Tab 2: dashboard gadgets ──
  function renderOverview(S) {
    var O = S.ov;
    var all = S.issues.map(function (it) { return liveIssue(S, it); })
      .filter(function (it) { return ovMatches(it, O.jql); })
      .map(function (it) { return { it: it, p: progressOf(S, it, O.calc) }; });
    var vals = all.map(function (r) { return r.p; }).filter(function (v) { return v !== null; });
    var mean = vals.length ? avg(vals) : 0;
    var sorted = sortRows(all, O.sort, function (r, k) {
      if (k === 'progress') return r.p === null ? -1 : r.p;
      if (k === 'summary') return r.it.summary.toLowerCase();
      return r.it[k];
    });
    var per = Number(O.rows), pages = Math.ceil(sorted.length / Number(O.rows)) || 1;
    O.page = Math.min(O.page, pages);
    var shown = sorted.slice((O.page - 1) * per, O.page * per);

    var pop = '';
    if (O.open) {
      var d = O.d;
      pop = '<div class="d-pop vpt-config">' +
        '<div class="d-h2">Configure Progress Dashboard</div>' +
        '<label class="d-label" for="vpt-ov-project">Project</label>' +
        '<select class="d-select" id="vpt-ov-project" data-fid="ov-project"><option>Mobile App (MOB)</option></select>' +
        '<label class="d-label" for="vpt-calc">Progress Calculation</label>' +
        '<select class="d-select" id="vpt-calc" data-ovd="calc" data-fid="ov-calc">' + options(CALCS, d.calc) + '</select>' +
        '<div class="d-help">' + esc(labelOf(CALCS.map(function (c) { return { v: c.v, label: c.help }; }), d.calc)) + '</div>' +
        '<label class="d-label" for="vpt-jql">Additional JQL Filter (optional)</label>' +
        '<select class="d-select vpt-jql" id="vpt-jql" data-ovd="jql" data-fid="ov-jql">' + options(OV_JQL, d.jql) + '</select>' +
        '<div class="d-help">In the app you type any JQL. The demo offers a few examples.</div>' +
        '<label class="d-label" for="vpt-ov-rows">Rows per Page</label>' +
        '<select class="d-select" id="vpt-ov-rows" data-ovd="rows" data-fid="ov-rows">' + rowsOptions(d.rows) + '</select>' +
        '<div class="vpt-config-actions"><button type="button" class="d-btn is-primary" data-ov-save data-fid="ov-save">Save Configuration</button></div>' +
        '<div class="d-help">Select a project and click Save to see the progress overview.</div>' +
        '</div>';
    }

    var body;
    if (!all.length) {
      body = msg('info', 'No issues found for project MOB.');
    } else {
      body = '<div class="d-table-wrap"><table class="d-table vpt-ov-table"><thead><tr>' +
        sortHead(O.sort, 'key', 'Key', 'data-ovsort') + sortHead(O.sort, 'summary', 'Summary', 'data-ovsort') +
        sortHead(O.sort, 'type', 'Type', 'data-ovsort', 'd-hide-sm') + sortHead(O.sort, 'status', 'Status', 'data-ovsort', 'd-hide-sm') +
        sortHead(O.sort, 'progress', 'Progress', 'data-ovsort', 'vpt-col-progress') +
        '</tr></thead><tbody>' + shown.map(function (r) {
          var t = tone(S, r.p);
          var cls = (r.it.live ? 'vpt-live-row' : '') + (O.flash ? ' is-flash' : '');
          return '<tr class="' + cls + '"><td><span class="d-key">' + r.it.key + '</span></td><td>' + esc(r.it.summary) + '</td><td class="d-hide-sm">' + r.it.type + '</td><td class="d-hide-sm">' + esc(r.it.status) + '</td>' +
            '<td>' + (r.p === null ? '<span class="d-faint d-small">—</span>' : '<div class="d-cell-bar"><span class="d-num">' + r.p + '%</span>' + D.bar(r.p, t) + '</div>') + '</td></tr>';
        }).join('') + '</tbody></table></div>' + pager(O.page, pages, 'ov');
    }
    O.flash = false;

    return [
      '  <section class="d-gadget d-app vpt-ov" aria-label="Progress Tracker Overview gadget"><span class="d-app-tag">Visual Progress Tracker</span>',
      '    <div class="d-gadget-head"><div class="d-gadget-title">Progress Tracker Overview</div>' + gear('ov', O.open) + '</div>',
      '    <div class="d-gadget-body">',
      pop,
      '      <div class="vpt-summary"><b>MOB Overview:</b>' + D.bar(mean, tone(S, mean)) + '<b>' + mean + '%</b>' +
        '<span class="vpt-sumline"><span class="d-faint">(' + all.length + ' issues | ' + labelOf(CALCS, O.calc) + ')</span>' +
        '<button type="button" class="d-btn is-compact" data-refresh="ov" data-fid="ov-refresh">Refresh</button><span class="d-faint d-small">just now</span></span></div>',
      body,
      '    </div>',
      '  </section>'
    ].join('\n');
  }

  function pager(page, pages, name) {
    if (pages < 2) return '';
    var out = '<nav class="vpt-pages" aria-label="Pages">';
    out += '<button type="button" class="d-btn is-subtle is-compact" data-page="' + name + ':' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + ' aria-label="Previous page">‹</button>';
    for (var i = 1; i <= pages; i++) {
      out += '<button type="button" class="d-btn is-compact ' + (i === page ? 'is-selected' : 'is-subtle') + '" data-page="' + name + ':' + i + '" data-fid="' + name + '-page-' + i + '"' + (i === page ? ' aria-current="page"' : '') + '>' + i + '</button>';
    }
    out += '<button type="button" class="d-btn is-subtle is-compact" data-page="' + name + ':' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + ' aria-label="Next page">›</button>';
    return out + '</nav>';
  }

  // Fixed group membership and tallies for the sample options. The final flag marks MOB-54.
  // Status columns: To Do, Selected for Development, In Progress, In Review, Done.
  var GROUP_SAMPLES = {
    "epic:": [
      ["Live tracking", 4, 1, 8, 21, [0, 1, 0, 1, 1], [0, 5, 0, 3, 8], true],
      ["Store launch", 2, 0, 0, 5, [1, 0, 1, 0, 0], [3, 0, 2, 0, 0], false],
      ["Accessibility", 2, 1, 1, 6, [1, 0, 0, 0, 1], [5, 0, 0, 0, 1], false],
      ["Payments", 3, 2, 7, 12, [0, 0, 1, 0, 2], [0, 0, 5, 0, 7], false],
      ["Android release", 1, 0, 0, 3, [0, 0, 1, 0, 0], [0, 0, 3, 0, 0], false]
    ],
    "assignee:": [
      ["Liam Ortiz", 3, 1, 1, 9, [0, 0, 2, 0, 1], [0, 0, 8, 0, 1], false],
      ["Sofia Rossi", 3, 0, 0, 10, [2, 0, 1, 0, 0], [8, 0, 2, 0, 0], false],
      ["Emma Clarke", 3, 1, 5, 15, [0, 1, 0, 0, 1], [0, 5, 0, 0, 5], true],
      ["Noah Becker", 3, 2, 10, 13, [0, 0, 0, 1, 2], [0, 0, 0, 3, 10], false]
    ],
    "assignee:story": [
      ["Emma Clarke", 3, 1, 5, 15, [0, 1, 0, 0, 1], [0, 5, 0, 0, 5], true],
      ["Noah Becker", 2, 1, 8, 11, [0, 0, 0, 1, 1], [0, 0, 0, 3, 8], false],
      ["Sofia Rossi", 1, 0, 0, 5, [1, 0, 0, 0, 0], [5, 0, 0, 0, 0], false],
      ["Liam Ortiz", 1, 0, 0, 5, [0, 0, 1, 0, 0], [0, 0, 5, 0, 0], false]
    ],
    "assignee:bug": [
      ["Liam Ortiz", 1, 1, 1, 1, [0, 0, 0, 0, 1], [0, 0, 0, 0, 1], false],
      ["Noah Becker", 1, 1, 2, 2, [0, 0, 0, 0, 1], [0, 0, 0, 0, 2], false]
    ],
  };
  GROUP_SAMPLES['epic:inprog'] = [0, 2, 3, 4].map(function (index) { return GROUP_SAMPLES['epic:'][index]; });
  function demoGroups(S) {
    var points = S.ep.measure === 'points';
    var samples = GROUP_SAMPLES[S.ep.group + ':' + S.ep.jql] || [];
    var todo = childPct(S, 'To Do'), selected = childPct(S, 'Selected for Development');
    var active = childPct(S, 'In Progress'), review = childPct(S, 'In Review');
    return samples.map(function (row) {
      var tally = row[points ? 6 : 5];
      var numerator = tally[0] * todo + tally[1] * selected + tally[2] * active + tally[3] * review + tally[4] * 100;
      var liveWeight = row[7] ? (points ? 5 : 1) : 0;
      numerator += liveWeight * childPct(S, S.issue.status);
      var isLiveDone = row[7] && S.issue.status === 'Done';
      return { name: row[0], link: S.ep.group === 'epic', total: row[1],
        done: row[2] + (isLiveDone ? 1 : 0), pDone: row[3] + (isLiveDone ? 5 : 0), pTotal: row[4],
        progress: Math.round(numerator / row[points ? 4 : 1]) };
    });
  }

  function renderEpic(S) {
    var E = S.ep, pts = E.measure === 'points';
    var groups = demoGroups(S);
    var withP = groups.filter(function (g) { return g.progress !== null; });
    var mean = withP.length ? avg(withP.map(function (g) { return g.progress; })) : 0;
    var sorted = sortRows(groups, E.sort, function (g, k) {
      if (k === 'name') return g.name.toLowerCase();
      if (k === 'done') return pts ? g.pDone : g.done;
      return g.progress === null ? -1 : g.progress;
    });
    var per = +E.rows;
    var shown = sorted.slice(0, per);

    var pop = '';
    if (E.open) {
      var d = E.d;
      pop = '<div class="d-pop vpt-config">' +
        '<div class="d-h2">Configure Epic Progress</div>' +
        '<label class="d-label" for="vpt-ep-project">Project</label>' +
        '<select class="d-select" id="vpt-ep-project" data-fid="ep-project"><option>Mobile App (MOB)</option></select>' +
        '<label class="d-label" for="vpt-group">Group by</label>' +
        '<select class="d-select" id="vpt-group" data-epd="group" data-fid="ep-group">' + options([{ v: 'epic', label: 'Epic' }, { v: 'assignee', label: 'Assignee' }], d.group) + '</select>' +
        '<div class="d-help">' + (d.group === 'epic' ? 'One progress bar per epic, calculated from its child issues.' : 'One progress bar per assignee, calculated from their issues.') + '</div>' +
        '<label class="d-label" for="vpt-measure">Progress metric</label>' +
        '<select class="d-select" id="vpt-measure" data-epd="measure" data-fid="ep-measure">' + options([{ v: 'count', label: 'Issue count' }, { v: 'points', label: 'Story points' }], d.measure) + '</select>' +
        '<div class="d-help">' + (d.measure === 'points' ? 'Weights each issue by its story point estimate. Falls back to issue count if no story points field exists.' : 'Every issue counts equally.') + '</div>' +
        '<label class="d-label" for="vpt-ep-jql">Additional JQL Filter (optional)</label>' +
        '<select class="d-select vpt-jql" id="vpt-ep-jql" data-epd="jql" data-fid="ep-jql">' + options(EP_JQL[d.group], d.jql) + '</select>' +
        '<div class="d-help">' + (d.group === 'epic' ? 'Applies to the epics.' : 'Applies to the issues.') + ' The demo offers a few examples.</div>' +
        '<label class="d-label" for="vpt-ep-rows">Rows per Page</label>' +
        '<select class="d-select" id="vpt-ep-rows" data-epd="rows" data-fid="ep-rows">' + rowsOptions(d.rows) + '</select>' +
        '<div class="vpt-config-actions"><button type="button" class="d-btn is-primary" data-ep-save data-fid="ep-save">Save Configuration</button></div>' +
        '<div class="d-help">Select a project and click Save to see epic progress.</div>' +
        '</div>';
    }

    var body;
    if (!groups.length) {
      body = msg('info', E.group === 'epic' ? 'No epics found in project MOB. Create epics or adjust the JQL filter.' : 'No issues found in project MOB.');
    } else {
      body = '<div class="d-table-wrap"><table class="d-table vpt-ep-table"><thead><tr>' +
        sortHead(E.sort, 'name', E.group === 'epic' ? 'Epic' : 'Assignee', 'data-epsort') +
        sortHead(E.sort, 'done', 'Done', 'data-epsort') +
        sortHead(E.sort, 'progress', 'Progress', 'data-epsort', 'vpt-col-progress') +
        '</tr></thead><tbody>' + shown.map(function (g) {
          var doneTxt = g.total ? (pts ? g.pDone + '/' + g.pTotal + ' pts' : g.done + '/' + g.total) : '<span class="d-faint">no issues</span>';
          return '<tr' + (E.flash ? ' class="is-flash"' : '') + '><td>' + (g.link ? '<span class="d-key">' + esc(g.name) + '</span>' : esc(g.name)) + '</td><td class="d-small">' + doneTxt + '</td>' +
            '<td>' + (g.progress === null ? '<span class="d-faint d-small">—</span>' : '<div class="d-cell-bar"><span class="d-num">' + g.progress + '%</span>' + D.bar(g.progress, tone(S, g.progress)) + '</div>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    E.flash = false;

    return [
      '  <section class="d-gadget d-app vpt-ep" aria-label="Epic Progress Tracker gadget"><span class="d-app-tag">Visual Progress Tracker</span>',
      '    <div class="d-gadget-head"><div class="d-gadget-title">Epic Progress Tracker</div>' + gear('ep', E.open) + '</div>',
      '    <div class="d-gadget-body">',
      pop,
      '      <div class="vpt-summary"><b>MOB:</b>' + D.bar(mean, tone(S, mean)) + '<b>' + mean + '%</b>' +
        '<span class="vpt-sumline"><span class="d-faint">(' + groups.length + (E.group === 'epic' ? ' epics' : ' assignees') + ' | ' + (pts ? 'story points' : 'issue count') + ')</span>' +
        '<button type="button" class="d-btn is-compact" data-refresh="ep" data-fid="ep-refresh">Refresh</button><span class="d-faint d-small">just now</span></span></div>',
      body,
      '    </div>',
      '  </section>'
    ].join('\n');
  }

  function renderDashboard(S) {
    return [
      '<div class="d-context"><span>Dashboards</span><span class="d-sep">/</span><b>Mobile App 5.0</b></div>',
      '<div class="vpt-dash">',
      renderOverview(S),
      renderEpic(S),
      '</div>'
    ].join('\n');
  }

  // ── Tab 3: the app's page in the Apps menu ──
  function renderRecalc(S) {
    var R = S.recalc;
    if (R.view === 'busy') return msg('info', 'Recalculating progress field values...');
    var dismiss = ' <button type="button" class="d-btn is-subtle is-compact" data-recalc="dismiss" data-fid="rc-dismiss">Dismiss</button>';
    if (R.view === 'done') return msg('ok', 'Field values synced: 37 issues updated.', dismiss);
    if (R.view === 'cooldown') return msg('info', 'Recalculation is limited to once every 7 days to keep resource usage low. Next run available: ' + R.next + '.', ' <button type="button" class="d-btn is-subtle is-compact" data-recalc="dismiss" data-fid="rc-dismiss">Dismiss</button>');
    return '<div class="vpt-recalc">' + (R.next ? '<div class="d-small d-faint">Next recalculation available: ' + R.next + '</div>' : '') +
      '<div class="vpt-recalc-row"><button type="button" class="d-btn is-subtle" data-recalc="run" data-fid="rc-run">Recalculate All Fields</button>' +
      '<span class="d-small d-faint">Syncs Status and Subtask progress fields. Manual fields are user-set.</span></div></div>';
  }

  function renderGuide(S) {
    function type(name, v, note, text) {
      var t = tone(S, v);
      return '<div class="vpt-type"><div class="d-h3">' + name + '</div>' + D.bar(v, t) +
        '<div class="vpt-field-row">' + D.loz(v + '%', t) + (note ? '<span class="d-small d-faint">' + note + '</span>' : '') + '</div><p class="d-sub">' + text + '</p></div>';
    }
    return [
      '<h3 class="d-h2">Setup in 2 Minutes</h3>',
      '<div class="vpt-guide">',
      '  <div><b>Step 1: Create the Fields</b><p>Go to Jira Settings (gear icon) &gt; Work items &gt; Fields. Click "Create field" and search for "Progress Bar". You will see three field types from Visual Progress Tracker.</p></div>',
      '  <div><b>Step 2: Add Fields to Your Issue Screen</b><p>Go to your Project &gt; Settings &gt; Work items &gt; Screens and add your new progress bar field(s).</p></div>',
      '  <div><b>Done!</b><p>Open any issue to see the progress bar. It also shows in list views with color-coded indicators.</p></div>',
      '</div>',
      '<h3 class="d-h2">Field Types</h3>',
      '<div class="vpt-types">',
      type('Progress Bar (Manual)', 50, '', 'Team members set progress manually using a slider or quick buttons.'),
      type('Progress Bar (Status)', 75, 'In Review', 'Automatically maps the issue workflow status to a progress percentage. Configure the mapping in the "Status Mapping" tab.'),
      type('Progress Bar (Subtasks)', 33, '1/3 done', 'Averages the status progress of subtasks or child issues. Supports the full hierarchy: Subtask &gt; Story &gt; Epic.'),
      '</div>'
    ].join('\n');
  }

  function renderMapping(S) {
    var rows = byValue(S.draft || S.map);
    var list = rows.map(function (r) {
      return '<div class="vpt-map-row"><span class="vpt-map-name">' + esc(r.name) + '</span>' +
        '<input class="d-input is-num" inputmode="numeric" placeholder="0-100" value="' + r.v + '" data-map="' + r.id + '" data-name="' + esc(r.name) + '" data-fid="map-' + r.id + '" aria-label="Progress for status ' + esc(r.name) + ' in percent">' +
        '<span class="vpt-map-loz" data-live="loz-' + r.id + '">' + D.loz(r.v + '%', tone(S, r.v)) + '</span>' +
        '<button type="button" class="d-btn is-subtle is-compact" data-remove="' + r.id + '" data-fid="rm-' + r.id + '" aria-label="Remove ' + esc(r.name) + '">Remove</button></div>';
    }).join('');
    return [
      '<h3 class="d-h2">Status-to-Progress Mapping</h3>',
      '<p class="d-sub">Define what percentage each workflow status represents. The "Progress Bar (Status)" field uses these values to auto-calculate progress.</p>',
      msg('info', 'Make sure your status names match exactly with your Jira workflow. Common statuses: To Do, In Progress, In Review, Done. The mapping is case-insensitive as a fallback.'),
      S.mapMsg ? msg(S.mapMsg.ok ? 'ok' : 'err', esc(S.mapMsg.text)) : '',
      '<div class="vpt-map">' + list + '</div>',
      '<div class="vpt-add">',
      '  <input class="d-input" placeholder="Status name (e.g. In Review)" value="' + esc(S.addName) + '" data-add="name" data-fid="add-name" aria-label="New status name">',
      '  <input class="d-input is-num" placeholder="%" inputmode="numeric" value="' + esc(S.addVal) + '" data-add="val" data-fid="add-val" aria-label="Progress for the new status in percent">',
      '  <button type="button" class="d-btn is-subtle is-compact" data-add-btn data-fid="add-btn">+ Add</button>',
      '</div>',
      '<button type="button" class="d-btn is-primary vpt-save" data-map-save data-fid="map-save">Save Mapping</button>'
    ].join('\n');
  }

  function previewBars(thr) {
    return [[20, 'red'], [50, 'yellow'], [100, 'green']].map(function (p) {
      return '<div class="vpt-prev">' + D.bar(p[0], D.tone(p[0], thr.low, thr.high)) + D.loz(p[0] + '%', p[1]) + '</div>';
    }).join('');
  }

  function renderColors(S) {
    var thr = S.thrDraft || S.thr;
    return [
      '<h3 class="d-h2">Color Thresholds</h3>',
      '<p class="d-sub">Define when progress bar colors change. These apply to all progress bar fields.</p>',
      S.thrMsg ? msg(S.thrMsg.ok ? 'ok' : 'err', esc(S.thrMsg.text)) : '',
      '<div class="vpt-thr">',
      '  <div class="vpt-thr-row">' + D.loz('Red', 'red') + '<span>0% to</span><input class="d-input is-num" inputmode="numeric" value="' + thr.low + '" data-thr="low" data-fid="thr-low" aria-label="Red ends at percent"><span>% (exclusive)</span></div>',
      '  <div class="vpt-thr-row">' + D.loz('Yellow', 'yellow') + '<span data-live="thr-from">' + thr.low + '% to</span><input class="d-input is-num" inputmode="numeric" value="' + thr.high + '" data-thr="high" data-fid="thr-high" aria-label="Yellow ends at percent"><span>% (exclusive)</span></div>',
      '  <div class="vpt-thr-row">' + D.loz('Green', 'green') + '<span data-live="thr-green">' + thr.high + '% to 100%</span></div>',
      '</div>',
      '<div class="d-h3 vpt-prev-head">Preview</div>',
      '<div class="vpt-preview" data-live="preview">' + previewBars(thr) + '</div>',
      '<button type="button" class="d-btn is-primary vpt-save" data-thr-save data-fid="thr-save">Save Settings</button>'
    ].join('\n');
  }

  function renderAdmin(S) {
    var tabs = [['guide', 'Setup Guide'], ['mapping', 'Status Mapping'], ['settings', 'Color Settings']].map(function (t) {
      var on = S.atab === t[0];
      return '<button type="button" class="d-btn ' + (on ? 'is-primary' : 'is-subtle') + '" data-atab="' + t[0] + '" data-fid="atab-' + t[0] + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + t[1] + '</button>';
    }).join('');
    var section = S.atab === 'mapping' ? renderMapping(S) : S.atab === 'settings' ? renderColors(S) : renderGuide(S);
    return [
      '<div class="d-context"><span>Apps</span><span class="d-sep">/</span><b>Visual Progress Tracker</b><span class="d-faint vpt-ctx-right d-hide-sm">Only Jira admins can save</span></div>',
      '<div class="vpt-admin">',
      '  <div class="d-app vpt-adminpage"><span class="d-app-tag">Visual Progress Tracker</span>',
      '    <h3 class="d-h1">Visual Progress Tracker</h3>',
      '    <p class="d-sub vpt-admin-lead">Add beautiful progress bars to your Jira issues. Configure your settings below or follow the setup guide to get started.</p>',
      renderRecalc(S),
      '    <div class="vpt-atabs"><div class="vpt-atabs-list" role="group" aria-label="Settings sections">' + tabs + '</div>' +
        '<a class="d-btn is-subtle" href="visual-progress-tracker-docs.html" target="_blank" rel="noopener">Documentation</a></div>',
      '    <div class="vpt-asection">' + section + '</div>',
      '  </div>',
      S.atab === 'settings' ? '  <p class="vpt-demo-note">Note: Jira list view columns keep fixed colors (red below 34%, yellow below 67%). The thresholds change the bars on the issue and in both gadgets.</p>' : '',
      '</div>'
    ].join('\n');
  }

  // ── Mount ──
  D.mount(root, {
    id: 'vpt',
    title: 'Visual Progress Tracker',
    tabs: [
      { id: 'issue', label: 'Issue view' },
      { id: 'dash', label: 'Dashboard gadgets' },
      { id: 'admin', label: 'Admin settings' }
    ],
    initialState: initialState,
    render: function (tab, S) {
      if (tab === 'dash') return renderDashboard(S);
      if (tab === 'admin') return renderAdmin(S);
      return renderIssue(S);
    },
    steps: {
      issue: [
        { text: 'move the issue to <strong>In Review</strong> with the status button. Status progress follows.', target: '[data-issue-status]', done: function (S) { return S.flags.status; } },
        { text: 'set the subtask <strong>Battery test on Android</strong> to Done. Subtask progress reaches 100%.', target: '[data-sub="3"]', done: function (S) { return S.flags.sub; } },
        { text: 'click <strong>Manual progress</strong>, pick a value and save it with the check mark.', target: '[data-manual="edit"], [data-manual="save"]', done: function (S) { return S.flags.manual; } }
      ],
      dash: [
        { text: 'open the settings of <strong>Progress Tracker Overview</strong> (pencil), switch <strong>Progress Calculation</strong> to Subtasks and click <strong>Save Configuration</strong>.', target: '[data-gear="ov"][aria-expanded="false"], #vpt-calc', done: function (S) { return S.flags.calc; } },
        { text: 'add a JQL filter, for example <strong>fixVersion = "Mobile App 5.0"</strong>, and save.', target: '[data-gear="ov"][aria-expanded="false"], #vpt-jql', done: function (S) { return S.flags.jql; } },
        { text: 'switch the <strong>Epic Progress Tracker</strong> to <strong>Story points</strong> or group it by <strong>Assignee</strong>.', target: '[data-gear="ep"][aria-expanded="false"], #vpt-measure', done: function (S) { return S.flags.epic; } }
      ],
      admin: [
        { text: 'open <strong>Status Mapping</strong>, change <strong>In Progress</strong> from 50% and click <strong>Save Mapping</strong>.', target: '[data-atab="mapping"][aria-pressed="false"], [data-name="In Progress"], [data-map-save]', done: function (S) { return S.flags.map; } },
        { text: 'open <strong>Color Settings</strong>, set the yellow threshold to <strong>80</strong> and click <strong>Save Settings</strong>.', target: '[data-atab="settings"][aria-pressed="false"], [data-thr="high"]', done: function (S) { return S.flags.thr; } }
      ]
    },
    doneText: {
      issue: '<strong>That’s the issue view.</strong> All three bars are custom fields, so they also show up as columns in Jira list views.',
      dash: '<strong>Both gadgets use the same status mapping and colors.</strong> Changes in the issue view show up here too (MOB-54).',
      admin: '<strong>Saved.</strong> Go back to the issue view or the gadgets: their bars now use your values.'
    },
    setup: function (api) {
      var S = function () { return api.state(); };

      // Issue view
      api.on('change', '[data-issue-status]', function (el) {
        S().issue.status = el.value; S().flags.status = S().flags.status || el.value !== 'In Progress'; api.update();
      });
      api.on('change', '[data-sub]', function (el) {
        var i = +el.dataset.sub; S().subs[i].status = el.value; if (i === 3 || el.value !== 'Done') S().flags.sub = true; api.update();
      });
      api.on('click', '[data-details]', function () { S().issue.details = !S().issue.details; api.update(); });
      api.on('click', '[data-manual]', function (el) {
        var I = S().issue, a = el.dataset.manual;
        if (a === 'edit') { I.editing = true; I.draft = I.manual; api.update(); var r = api.el('[data-range="manual"]'); if (r) r.focus(); }
        if (a === 'cancel') { I.editing = false; api.update(); var b = api.el('[data-manual="edit"]'); if (b) b.focus(); }
        if (a === 'save') { I.manual = I.draft; I.editing = false; S().flags.manual = true; api.update(); var c = api.el('[data-manual="edit"]'); if (c) c.focus(); }
      });
      api.on('click', '[data-preset]', function (el) { S().issue.draft = +el.dataset.preset; api.update(); });
      api.on('input', '[data-range="manual"]', function (el) {
        // live update while dragging, without re-rendering the slider
        var v = +el.value, t = tone(S(), v);
        S().issue.draft = v;
        el.style.setProperty('--p', v + '%');
        el.setAttribute('aria-valuetext', v + ' percent');
        var b = api.el('[data-live="mbar"]'); b.className = 'd-bar is-' + t; b.firstChild.style.width = v + '%';
        api.el('[data-live="mloz"]').innerHTML = D.loz(v + '%', t);
        root.querySelectorAll('[data-preset]').forEach(function (p) {
          p.classList.toggle('is-selected', +p.dataset.preset === v); p.classList.toggle('is-subtle', +p.dataset.preset !== v);
        });
      });

      // Dashboard gadgets
      api.on('click', '[data-gear]', function (el) {
        var g = el.dataset.gear === 'ov' ? S().ov : S().ep;
        g.open = !g.open;
        g.d = el.dataset.gear === 'ov' ? { calc: g.calc, jql: g.jql, rows: g.rows } : { group: g.group, measure: g.measure, jql: g.jql, rows: g.rows };
        api.update();
      });
      api.on('change', '[data-ovd]', function (el) { S().ov.d[el.dataset.ovd] = el.value; api.update(); });
      api.on('change', '[data-epd]', function (el) {
        var d = S().ep.d;
        d[el.dataset.epd] = el.value;
        if (el.dataset.epd === 'group' && !EP_JQL[d.group].some(function (o) { return o.v === d.jql; })) d.jql = '';
        api.update();
      });
      api.on('click', '[data-ov-save]', function () {
        var O = S().ov, d = O.d;
        if (d.calc !== O.calc) S().flags.calc = true;
        if (d.jql && d.jql !== O.jql) S().flags.jql = true;
        O.calc = d.calc; O.jql = d.jql; O.rows = d.rows; O.page = 1; O.open = false;
        api.update();
        var g = api.el('[data-gear="ov"]'); if (g) g.focus();
      });
      api.on('click', '[data-ep-save]', function () {
        var E = S().ep, d = E.d;
        if (d.group !== E.group || d.measure !== E.measure) S().flags.epic = true;
        E.group = d.group; E.measure = d.measure; E.jql = d.jql; E.rows = d.rows; E.open = false;
        api.update();
        var g = api.el('[data-gear="ep"]'); if (g) g.focus();
      });
      function resort(G, k) {
        if (G.sort.k === k) G.sort.d = -G.sort.d; else G.sort = { k: k, d: -1 };
      }
      api.on('click', '[data-ovsort]', function (el) { resort(S().ov, el.dataset.ovsort); api.update(); });
      api.on('click', '[data-epsort]', function (el) { resort(S().ep, el.dataset.epsort); api.update(); });
      api.on('click', '[data-page]', function (el) {
        var p = el.dataset.page.split(':');
        S()[p[0]].page = +p[1]; api.update();
      });
      api.on('click', '[data-refresh]', function (el) { S()[el.dataset.refresh].flash = true; api.update(); });

      // Admin page
      api.on('click', '[data-atab]', function (el) {
        var S0 = S();
        if (S0.atab !== el.dataset.atab) {
          // like leaving a tab in the app: unsaved edits are dropped
          S0.atab = el.dataset.atab; S0.draft = null; S0.thrDraft = null; S0.mapMsg = null; S0.thrMsg = null; S0.addName = ''; S0.addVal = '';
        }
        api.update();
      });
      api.on('click', '[data-recalc]', function (el) {
        var R = S().recalc;
        if (el.dataset.recalc === 'dismiss') { R.view = 'idle'; api.update(); return; }
        if (R.next) { R.view = 'cooldown'; api.update(); return; }
        R.view = 'busy'; api.update();
        setTimeout(function () { R.view = 'done'; R.next = nextRunDate(); api.update(); }, 900);
      });
      // a new edit hides the last save message, without re-rendering the field being typed in
      function dropMsg() { var m = api.el('.vpt-asection .vpt-msg.is-ok, .vpt-asection .vpt-msg.is-err'); if (m) m.remove(); }
      function draft() { var S0 = S(); if (!S0.draft) S0.draft = copyRows(S0.map); return S0.draft; }
      function rowById(id) { return draft().filter(function (r) { return r.id === id; })[0]; }
      api.on('input', '[data-map]', function (el) {
        var r = rowById(el.dataset.map); if (!r) return;
        r.v = sliderPercent(el.value);
        // like the app: the field only ever holds a whole number from 0 to 100
        if (el.value !== '' && el.value !== String(r.v)) el.value = String(r.v);
        S().mapMsg = null; dropMsg();
        var live = api.el('[data-live="loz-' + r.id + '"]');
        if (live) live.innerHTML = D.loz(r.v + '%', tone(S(), r.v));
      });
      api.on('click', '[data-remove]', function (el) {
        var S0 = S(); S0.draft = draft().filter(function (r) { return r.id !== el.dataset.remove; }); S0.mapMsg = null; api.update();
        var save = api.el('[data-map-save]'); if (save && !api.el('[data-remove]')) save.focus();
      });
      api.on('input', '[data-add]', function (el) { if (el.dataset.add === 'name') S().addName = el.value; else S().addVal = el.value; });
      api.on('click', '[data-add-btn]', function () {
        var S0 = S(), name = S0.addName.trim();
        if (!name || S0.addVal === '') return;
        var v = sliderPercent(S0.addVal);
        var rows = draft(), same = rows.filter(function (r) { return r.name === name; })[0];
        if (same) same.v = v; else rows.push({ id: 'r' + (rowId++), name: name, v: v });
        S0.addName = ''; S0.addVal = ''; S0.mapMsg = null;
        api.update();
      });
      api.on('click', '[data-map-save]', function () {
        var S0 = S(), rows = copyRows(S0.draft || S0.map);
        var start = START_MAP.map(function (p) { return p[0] + '=' + p[1]; }).sort().join('|');
        var now = rows.map(function (r) { return r.name + '=' + r.v; }).sort().join('|');
        S0.map = rows; S0.draft = null;
        if (now !== start) S0.flags.map = true;
        S0.mapMsg = { ok: true, text: 'Status mapping saved successfully!' };
        api.update();
      });
      api.on('input', '[data-thr]', function (el) {
        var S0 = S();
        if (!S0.thrDraft) S0.thrDraft = { low: S0.thr.low, high: S0.thr.high };
        S0.thrDraft[el.dataset.thr] = parseInt(el.value, 10) || START_THR[el.dataset.thr];
        S0.thrMsg = null; dropMsg();
        var d = S0.thrDraft;
        api.el('[data-live="thr-from"]').textContent = d.low + '% to';
        api.el('[data-live="thr-green"]').textContent = d.high + '% to 100%';
        api.el('[data-live="preview"]').innerHTML = previewBars(d);
      });
      api.on('click', '[data-thr-save]', function () {
        var S0 = S(), d = S0.thrDraft || S0.thr;
        if (d.low < 1 || d.low > 99 || d.high < 1 || d.high > 99) { S0.thrMsg = { ok: false, text: 'Thresholds must be between 1 and 99.' }; api.update(); return; }
        if (d.low >= d.high) { S0.thrMsg = { ok: false, text: 'Red threshold must be lower than the Yellow threshold.' }; api.update(); return; }
        if (d.low !== S0.thr.low || d.high !== S0.thr.high) S0.flags.thr = true;
        S0.thr = { low: d.low, high: d.high }; S0.thrDraft = null;
        S0.thrMsg = { ok: true, text: 'Settings saved successfully!' };
        api.update();
      });
    }
  });
})();
