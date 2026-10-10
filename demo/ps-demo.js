/* ============================================================
   ps-demo.js — interactive demo for Priority Scoring
   Sample data and fixed behavior only; written for the website,
   not taken from the app. Scores use the public RICE, WSJF and
   ICE formulas and the dimension weights described in the
   documentation. Board Health values are precomputed sample
   numbers. The Rovo chat is recreated with fixed answers.
   ============================================================ */
(function () {
  'use strict';
  var root = document.querySelector('[data-demo="ps"]');
  if (!root || !window.JBDemo) return;
  var D = window.JBDemo, esc = D.esc;

  // Each row is a demo slider: key, caption, initial value, minimum, maximum, tick, weight toggle.
  var INPUT_ROWS = {
    rice: [['r', 'Reach', 10, 1, 100, 1, true], ['i', 'Impact', 5, 1, 10, 1, true],
      ['c', 'Confidence', 80, 10, 100, 10, true], ['e', 'Effort', 5, 1, 20, 1, false]],
    wsjf: [['bv', 'Business Value', 5, 1, 10, 1, true], ['tc', 'Time Criticality', 5, 1, 10, 1, true],
      ['rr', 'Risk Reduction', 3, 1, 10, 1, true], ['js', 'Job Size', 5, 1, 10, 1, false]],
    ice: [['i', 'Impact', 5, 1, 10, 1, true], ['c', 'Confidence', 5, 1, 10, 1, true], ['e', 'Ease', 5, 1, 10, 1, true]]
  };
  var BAR_CEILINGS = new Map([['rice', 100], ['wsjf', 30], ['ice', 1000]]);
  var COLOR_START = { rice: [3, 10], wsjf: [2, 5], ice: [20, 50] };
  var COLOR_LIMITS = { rice: [20, 50], wsjf: [5, 15], ice: [100, 500] };
  var DENOMINATORS = { rice: 'Effort', wsjf: 'Job Size' };
  function controlsFor(framework) {
    return INPUT_ROWS[framework].map(function (row) {
      return { id: row[0], caption: row[1], initial: row[2], minimum: row[3], maximum: row[4], tick: row[5], weighted: row[6] };
    });
  }
  function frameworkLabel(framework) { return framework.toUpperCase(); }
  function scoreTitle(framework) { return frameworkLabel(framework) + (framework === 'ice' ? ' Score' : ' score'); }
  var ORDER = ['rice', 'wsjf', 'ice'];
  var PEOPLE = { 'Jonas Weber': '#1868DB', 'Maya Fischer': '#6E5DC6', 'Sofia Rossi': '#C9372C', 'Tom Becker': '#1F845A' };
  var MODES = [
    ['suggest', 'Suggest only — Rovo suggests scores, you apply them manually'],
    ['confirm', 'Confirm — Rovo asks in chat, you confirm each score'],
    ['auto', 'Auto — Rovo applies scores directly (bulk operations enabled)']
  ];
  var MODE_NOTE = {
    suggest: ['info', 'Rovo suggests scores in text — you apply the values manually via the sliders in the Jira issue view. No automatic writes.'],
    confirm: ['info', 'Rovo asks in chat before applying — you confirm each score individually before it is written.'],
    auto: ['warn', 'In Auto mode Rovo skips the chat confirmation — scores are applied after you approve the native Atlassian security dialog. Atlassian always shows this dialog for write actions; it is a platform-level safeguard and cannot be disabled.']
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // rice: [reach, impact, confidence, effort] · wsjf: [bv, tc, rr, js] · ice: [i, c, e]
  // due: days from today (negative = overdue)
  var ISSUES = [
    ['CHK-32', 'Address autocomplete', 'Story', 'In Progress', null, 'Maya Fischer', [90, 5, 80, 4], [8, 6, 3, 5], [8, 8, 6]],
    ['CHK-24', 'Show delivery date before payment', 'Story', 'To Do', null, 'Jonas Weber', [60, 7, 80, 4], [7, 8, 2, 3], [7, 7, 7]],
    ['CHK-23', 'Cookie banner covers the pay button', 'Bug', 'In Progress', -5, 'Sofia Rossi', [50, 6, 100, 5], [6, 9, 6, 2], [6, 9, 9]],
    ['CHK-17', 'Apple Pay and Google Pay on the web', 'Story', 'To Do', null, 'Maya Fischer', [70, 5, 80, 6], [9, 5, 3, 8], [9, 6, 3]],
    ['CHK-19', 'Save cart across devices', 'Story', 'To Do', null, 'Jonas Weber', [54, 8, 70, 7], [6, 3, 2, 6], [7, 5, 4]],
    ['CHK-27', 'PayPal Express in the cart', 'Story', 'To Do', 3, 'Tom Becker', [40, 8, 50, 4], [7, 7, 1, 4], [8, 4, 6]],
    ['CHK-29', 'Guest checkout without an account', 'Story', 'In Review', null, 'Sofia Rossi', [30, 6, 80, 4], [8, 6, 4, 4], [7, 8, 8]],
    ['CHK-14', 'Show shipping costs earlier', 'Story', 'To Do', null, 'Tom Becker', [45, 4, 90, 6], [5, 4, 2, 2], [5, 8, 9]],
    ['CHK-31', 'Remember the last payment method', 'Story', 'To Do', null, 'Maya Fischer', [25, 5, 80, 5], [4, 3, 1, 3], [5, 7, 7]],
    ['CHK-12', 'Discount code field on mobile', 'Task', 'To Do', 12, 'Jonas Weber', [20, 4, 70, 4], [3, 5, 1, 2], [4, 6, 8]],
    ['CHK-35', 'Order summary in the confirmation email', 'Task', 'To Do', null, 'Tom Becker', [15, 3, 90, 5], [3, 2, 2, 2], [3, 8, 9]],
    ['CHK-38', 'Animated success screen', 'Story', 'To Do', null, 'Sofia Rossi', [10, 2, 50, 5], [2, 1, 1, 5], [2, 5, 4]],
    ['CHK-21', 'Clear message when a card is declined', 'Story', 'To Do', null, 'Maya Fischer', null, null, null],
    ['CHK-36', 'Split payment between two cards', 'Story', 'To Do', null, '', null, null, null],
    ['CHK-37', 'Invoice download as PDF', 'Task', 'To Do', null, 'Jonas Weber', null, null, null],
    ['CHK-40', 'Retry payment after a timeout', 'Bug', 'To Do', -2, 'Tom Becker', null, null, null]
  ];
  var KEYS = { rice: ['r', 'i', 'c', 'e'], wsjf: ['bv', 'tc', 'rr', 'js'], ice: ['i', 'c', 'e'] };

  // What the recreated Rovo chat suggests for CHK-21
  var ROVO = {
    rice: { vals: { r: 40, i: 6, c: 80, e: 4 }, why: [
      ['Reach: 40', 'About 12% of card payments are declined, so many buyers see this message every quarter.'],
      ['Impact: 6', 'A clear reason and a next step keep many of them from abandoning the order.'],
      ['Confidence: 80%', 'Around 300 support tickets a month confirm the problem; the uplift is an estimate.'],
      ['Effort: 4', 'Mapping the decline codes to plain-language messages takes about four person-weeks.']] },
    wsjf: { vals: { js: 3, rr: 5, bv: 7, tc: 6 }, why: [
      ['Business Value: 7', 'Fewer abandoned orders at the last step.'],
      ['Time Criticality: 6', 'The holiday season starts in six weeks.'],
      ['Risk Reduction: 5', 'Fewer support tickets and chargebacks.'],
      ['Job Size: 3', 'Small: one screen and a list of messages.']] },
    ice: { vals: { i: 7, c: 8, e: 6 }, why: [
      ['Impact: 7', 'Affects every declined payment.'],
      ['Confidence: 8', 'Support tickets confirm the problem.'],
      ['Ease: 6', 'Text changes plus a mapping of decline codes.']] }
  };

  // Precomputed sample Board Health for project CHK (16 open issues, four
  // criteria). "after" = once CHK-21 has a score in any framework.
  var HEALTH = {
    before: { score: 77, grade: 'Good', tone: 'blue', tiles: [['Missing Description', 3, 81, 5], ['No Story Points', 6, 63, 9], ['Unscored', 4, 75, 6], ['Overdue', 2, 88, 3]],
      rovo: [['missing descriptions', 3], ['missing story points', 6], ['unscored issues', 4], ['overdue issues', 2]] },
    after: { score: 78, grade: 'Good', tone: 'blue', tiles: [['Missing Description', 3, 81, 5], ['No Story Points', 6, 63, 9], ['Unscored', 3, 81, 5], ['Overdue', 2, 88, 3]],
      rovo: [['missing descriptions', 3], ['missing story points', 6], ['unscored issues', 3], ['overdue issues', 2]] }
  };
  var TOTAL = 16;

  var API = null;

  function initialState() {
    var weights = {}, thr = {}, thrUi = {};
    ORDER.forEach(function (fw) {
      weights[fw] = {};
      controlsFor(fw).forEach(function (d) { if (d.weighted) weights[fw][d.id] = 1; });
      thr[fw] = { low: COLOR_START[fw][0], high: COLOR_START[fw][1] };
      thrUi[fw] = { low: COLOR_START[fw][0], high: COLOR_START[fw][1] };
    });
    var issues = ISSUES.map(function (r) {
      var it = { key: r[0], summary: r[1], type: r[2], status: r[3], due: r[4], who: r[5], dims: {}, val: {} };
      ORDER.forEach(function (fw, n) {
        var v = r[6 + n];
        it.dims[fw] = v ? KEYS[fw].reduce(function (o, k, i) { o[k] = v[i]; return o; }, {}) : null;
        it.val[fw] = v ? calc(fw, it.dims[fw], weights[fw]) : null;
      });
      return it;
    });
    return {
      issues: issues, weights: weights, thr: thr, thrUi: thrUi,
      fw: 'rice',
      rank: { by: 'score', dir: -1, who: '', size: 25, page: 1 },
      csv: false, refreshing: false,
      edit: null,            // { fw, vals, touched }
      trail: {},             // fw → audit trail open on the issue
      history: {},           // fw → [{ date, val, rovo }]
      rovo: { open: false, msgs: [], busy: false, fresh: false },
      mode: 'confirm', bulk: 10, comments: false, audit: false, auditOff: false,
      flash: null, flags: {}
    };
  }

  // ── Public formulas, with the documented dimension weights ──
  function calc(fw, v, w) {
    if (!v) return null;
    w = w || {};
    var g = function (k) { return w[k] || 1; }, x;
    if (fw === 'rice') x = v.e > 0 ? (v.r * g('r') * v.i * g('i') * (v.c / 100) * g('c')) / v.e : 0;
    else if (fw === 'wsjf') x = v.js > 0 ? (v.bv * g('bv') + v.tc * g('tc') + v.rr * g('rr')) / v.js : 0;
    else x = v.i * g('i') * v.c * g('c') * v.e * g('e');
    return Math.round(x * 10) / 10;
  }
  function tone(S, fw, x) { return D.tone(x, S.thr[fw].low, S.thr[fw].high); }
  function fmt(x) { return String(Math.round(x * 10) / 10); }
  function issue(S, key) { return S.issues.filter(function (i) { return i.key === key; })[0]; }
  function anyScore(it) { return ORDER.some(function (fw) { return it.val[fw] !== null; }); }
  function health(S) { return anyScore(issue(S, 'CHK-21')) ? HEALTH.after : HEALTH.before; }
  function pct(x, top) { return Math.max(0, Math.min(100, x / top * 100)); }
  function today() { var d = new Date(); return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function scoreName(fw) { return frameworkLabel(fw) + ' Score'; }

  function scoreBlock(S, fw, x, withLabel) {
    var t = tone(S, fw, x);
    return '<div class="ps-score">' + D.bar(pct(x, BAR_CEILINGS.get(fw)), t) +
      '<div class="ps-score-row">' + D.loz(fmt(x), t) + (withLabel ? '<span class="ps-subtlest">' + scoreName(fw) + '</span>' : '') + '</div></div>';
  }
  function dueLoz(d) {
    if (d === null || d === undefined) return '<span class="ps-subtlest">—</span>';
    if (d < 0) return D.loz(-d + 'd overdue', 'red');
    if (d === 0) return D.loz('Today', 'red');
    if (d <= 7) return D.loz(d + 'd', 'yellow');
    return D.loz('11-' + (8 + d), 'blue');
  }
  function note(kind, text) {
    var icon = kind === 'warn'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#E06C00" d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#1868DB"/><path fill="#fff" d="M11 10h2v7h-2zM11 7h2v2h-2z"/></svg>';
    return '<div class="ps-note is-' + kind + '">' + icon + '<span>' + text + '</span></div>';
  }
  function check(on) {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (on ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>') + '</svg>';
  }

  // ── Tab 1: issue view ──
  function renderIssue(S) {
    var it = issue(S, 'CHK-21');
    var fields = ORDER.map(function (fw) {
      var name = 'Priority Scoring — ' + frameworkLabel(fw), body;
      if (S.edit && S.edit.fw === fw) {
        body = '<div class="d-pop ps-editor" role="group" aria-label="Edit ' + name + '">' +
          '<div data-live="ed-score">' + scoreBlock(S, fw, calc(fw, S.edit.vals, S.weights[fw]), true) + '</div>' +
          controlsFor(fw).map(function (d) {
            var v = S.edit.vals[d.id], w = d.weighted ? S.weights[fw][d.id] : 1;
            return '<div class="ps-dim"><div class="ps-dim-head"><label for="ps-d-' + d.id + '">' + d.caption +
              (w > 1 ? ' <span class="ps-subtlest">×' + w + '</span>' : '') + '</label><span class="ps-subtlest" data-live="v-' + d.id + '">' + v + '</span></div>' +
              '<input class="d-range" type="range" id="ps-d-' + d.id + '" min="' + d.minimum + '" max="' + d.maximum + '" step="' + d.tick + '" value="' + v + '" data-dim="' + d.id + '" data-fid="dim-' + d.id + '" style="--p:' + ((v - d.minimum) / (d.maximum - d.minimum) * 100) + '%"></div>';
          }).join('') +
          '<div class="ps-editor-actions">' +
          '<button type="button" class="d-btn is-icon ps-jira-btn" data-save="' + fw + '" data-fid="save-' + fw + '" title="Save" aria-label="Save">' + check(true) + '</button>' +
          '<button type="button" class="d-btn is-icon ps-jira-btn" data-cancel data-fid="cancel" title="Cancel" aria-label="Cancel">' + check(false) + '</button>' +
          '</div></div>';
      } else {
        var x = it.val[fw];
        body = '<button type="button" class="ps-field-btn d-field-edit" data-edit="' + fw + '" data-fid="edit-' + fw + '" aria-label="Edit ' + name + '">' +
          (x === null ? '<span class="ps-subtlest">Not scored</span>' : scoreBlock(S, fw, x, false)) + '</button>';
        if (x !== null && S.audit) body += renderTrail(S, fw);
      }
      return '<div class="d-field-name">' + name + '</div><div class="d-field-val">' + body + '</div>';
    }).join('');

    var main = S.rovo.open ? renderRovo(S) : [
      '    <p class="d-sub">When a card payment is declined, buyers only see “Payment failed”. Show the reason and what to do next.</p>',
      '    <div class="d-h3">Acceptance criteria</div>',
      '    <ul class="ps-ac"><li>The message names the reason in plain language.</li><li>It suggests a next step, for example another card or PayPal.</li><li>Works for the ten most common decline codes.</li></ul>',
      '    <div class="ps-rovo-cta">',
      '      <div><div class="d-h3" style="margin:0">Not sure what to enter?</div><div class="d-sub">Ask the Priority Scoring agent in Rovo for a suggestion with reasons.</div></div>',
      '      <button type="button" class="d-btn ps-rovo-btn" data-rovo-open data-fid="rovo-open">' + agentIcon(16) + 'Ask Rovo</button>',
      '    </div>'
    ].join('\n');

    return [
      '<div class="d-context"><span>Projects</span><span class="d-sep">/</span><span>Checkout</span><span class="d-sep">/</span><b>CHK-21</b></div>',
      '<div class="ps-issue">',
      '  <div class="ps-main">',
      '    <h3 class="d-h1">Clear message when a card is declined</h3>',
      main,
      '  </div>',
      '  <aside class="ps-side">',
      '    <div class="d-h3">Details</div>',
      '    <div class="d-fields" style="margin-bottom:22px">',
      '      <div class="d-field-name">Assignee</div><div class="d-field-val">' + D.avatar('Maya Fischer', PEOPLE['Maya Fischer']) + 'Maya Fischer</div>',
      '      <div class="d-field-name">Status</div><div class="d-field-val"><span class="d-status cat-todo is-small">To Do</span></div>',
      '    </div>',
      '    <div class="d-app"><span class="d-app-tag">Priority Scoring</span><div class="d-fields ps-fields">' + fields + '</div></div>',
      '  </aside>',
      '</div>'
    ].join('\n');
  }

  function renderTrail(S, fw) {
    var open = !!S.trail[fw], list = S.history[fw] || [];
    var html = '<button type="button" class="d-btn is-subtle is-compact ps-trail-btn" data-trail="' + fw + '" data-fid="trail-' + fw + '" aria-expanded="' + open + '">' + (open ? '▾ Hide audit trail' : '▸ Audit trail') + '</button>';
    if (!open) return html;
    if (!list.length) return html + '<div class="ps-trail ps-subtlest d-small">No history recorded yet.</div>';
    var rows = [];
    for (var n = 0; n < Math.min(10, list.length); n++) {
      var entry = list[n], change = '', previous = list[n + 1];
      if (previous) {
        var difference = Number((entry.val - previous.val).toFixed(1));
        if (difference === 0) change = '<span class="ps-subtlest">–</span>';
        else change = '<span class="' + (difference > 0 ? 'ps-up' : 'ps-down') + '">' +
          (difference > 0 ? '↑ +' : '↓ ') + difference + '</span>';
      }
      rows.push('<div class="ps-trail-row d-small"><span class="ps-subtlest">' + entry.date + '</span><b>' + fmt(entry.val) + '</b>' +
        change + (entry.rovo ? '<span class="ps-subtlest">via Rovo</span>' : '') + '</div>');
    }
    return html + '<div class="ps-trail">' + rows.join('') + '</div>';
  }

  function agentIcon(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true"><path fill="#6A9A23" d="M12 1.5 21.1 6.75v10.5L12 22.5 2.9 17.25V6.75z"/><circle cx="11" cy="11" r="3.6" fill="none" stroke="#fff" stroke-width="2"/><path d="m13.6 13.6 3.2 3.2" stroke="#172B4D" stroke-width="2.4" stroke-linecap="round"/></svg>';
  }

  function renderRovo(S) {
    var R = S.rovo, waiting = false;
    var msgs = R.msgs.map(function (m, n) {
      if (m.who === 'me') return '<div class="ps-msg is-me">' + esc(m.text) + '</div>';
      if (m.who === 'tool') return renderTool(S, m, n);
      if (m.ask && !m.answered) waiting = true;
      return '<div class="ps-msg is-bot">' + m.html + (m.ask && !m.answered ? '<div class="ps-msg-actions">' +
        '<button type="button" class="ps-chip" data-reply="yes" data-fid="reply-yes">Yes, apply it</button>' +
        '<button type="button" class="ps-chip" data-reply="no" data-fid="reply-no">No</button></div>' : '') + '</div>';
    }).join('');
    var tool = R.msgs.some(function (m) { return m.who === 'tool' && !m.state; });
    var starters = (R.busy || waiting || tool) ? '' : '<div class="ps-starters">' +
      ORDER.map(function (fw) { return '<button type="button" class="ps-chip" data-ask="' + fw + '" data-fid="ask-' + fw + '">Suggest a' + (fw === 'ice' ? 'n' : '') + ' ' + frameworkLabel(fw) + ' score for CHK-21</button>'; }).join('') +
      '<button type="button" class="ps-chip" data-ask="health" data-fid="ask-health">How healthy is my backlog in project CHK?</button></div>';
    var empty = R.fresh ? 'New chat. The agent reads the apply mode when a chat starts. Pick a question; in your Jira you type it in your own words.'
      : 'Pick a question. In your Jira you type it in your own words.';
    return [
      '<div class="ps-rovo d-pop">',
      '  <div class="ps-rovo-head">' + agentIcon(20) + '<b>Priority Scoring</b><span class="d-small d-faint">Rovo agent · chat recreated for this demo</span>',
      '    <button type="button" class="d-icon-btn" data-rovo-close title="Close the chat" aria-label="Close the chat" style="margin-left:auto"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
      '  <div class="ps-msgs" aria-live="polite">' + (msgs || '<p class="d-sub">' + empty + '</p>') + (R.busy ? '<div class="ps-msg is-bot ps-typing" aria-label="Rovo is writing"><i></i><i></i><i></i></div>' : '') + '</div>',
      starters,
      '  <p class="d-help">Apply mode: <b>' + ({ suggest: 'Suggest only', confirm: 'Confirm', auto: 'Auto' })[S.mode] + '</b> (tab 3, Settings). Needs Atlassian Rovo on your site.</p>',
      '</div>'
    ].join('\n');
  }

  // Atlassian's own confirmation for write actions (recreated)
  function renderTool(S, m, n) {
    var fw = m.fw, x = calc(fw, ROVO[fw].vals, S.weights[fw]);
    var dims = controlsFor(fw).map(function (d) { return d.caption + ' ' + ROVO[fw].vals[d.id]; }).join(', ');
    if (m.state) {
      return '<div class="ps-tool is-done"><span class="ps-tool-icon" aria-hidden="true">' + toolIcon() + '</span><span>' +
        (m.state === 'ok' ? 'Used <b>Apply Priority Score</b>' : '<b>Apply Priority Score</b> cancelled') + '</span></div>';
    }
    return '<div class="ps-tool" role="group" aria-label="Rovo asks to use a tool">' +
      '<div class="ps-tool-head"><span class="ps-tool-icon" aria-hidden="true">' + toolIcon() + '</span>Use the following tools</div>' +
      '<div class="ps-tool-body"><label class="ps-tool-item"><input type="checkbox" checked data-tool-pick data-fid="tool-pick-' + n + '"> <b>Apply Priority Score</b></label>' +
      '<ul><li>Applies the ' + scoreTitle(fw) + ' ' + fmt(x) + ' to <code>CHK-21</code>: ' + dims + '.</li>' +
      (S.comments ? '<li>Writes the reasoning as a comment on <code>CHK-21</code>.</li>' : '') + '</ul></div>' +
      '<div class="ps-tool-foot"><button type="button" class="d-btn is-primary is-compact" data-tool="ok" data-fid="tool-ok">Confirm selected</button>' +
      '<button type="button" class="d-btn is-compact" data-tool="cancel" data-fid="tool-cancel">Cancel</button></div></div>';
  }
  function toolIcon() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/></svg>';
  }

  function suggestion(fw) {
    var R = ROVO[fw], x = calc(fw, R.vals, null);
    return '<p>Suggested ' + scoreTitle(fw) + ' for <code>CHK-21</code>: <b>' + fmt(x) + '</b></p><ul>' +
      R.why.map(function (w) { return '<li><b>' + esc(w[0]) + '</b> – ' + esc(w[1]) + '</li>'; }).join('') + '</ul>';
  }
  function healthAnswer(S) {
    var H = health(S);
    return '<p>Board Health of <b>CHK</b>: <b>' + H.score + ' / 100</b> (' + H.grade + '), ' + TOTAL + ' open issues analysed.</p><ul>' +
      H.rovo.map(function (r) { return '<li>' + r[0] + ': <b>' + r[1] + '</b></li>'; }).join('') + '</ul>';
  }

  // ── Tab 2: app page, Dashboard tab ──
  function appNav(active) {
    return '<div class="ps-appnav" role="group" aria-label="Priority Scoring pages">' + ['Dashboard', 'Activity', 'Portfolio', 'Settings', 'Import'].map(function (p) {
      return '<button type="button" class="d-btn ' + (p === active ? 'is-primary' : 'is-subtle') + '" data-page="' + p + '"' + (p === active ? ' aria-current="page"' : '') + '>' + p + '</button>';
    }).join('') + '</div>';
  }

  function sortRows(rows, by, dir) {
    var val = function (r) {
      if (by === 'score') return r.x;
      if (by === 'due') return r.it.due;
      if (by === 'sprint') return null;
      return r.it[by] || null;
    };
    return rows.slice().sort(function (a, b) {
      var va = val(a), vb = val(b);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))) * dir;
    });
  }

  function renderRanking(S) {
    var fw = S.fw, H = health(S), Rk = S.rank;
    var all = S.issues.map(function (i) { return { it: i, x: i.val[fw] }; });
    var withScore = all.filter(function (r) { return r.x !== null; });
    var avg = withScore.length ? Math.round(withScore.reduce(function (a, r) { return a + r.x; }, 0) / withScore.length * 10) / 10 : 0;
    var rows = all.filter(function (r) { return !Rk.who || (Rk.who === '__none' ? !r.it.who : r.it.who === Rk.who); });
    var scored = rows.filter(function (r) { return r.x !== null; }).length;
    var sorted = sortRows(rows, Rk.by, Rk.dir);
    var pages = Math.max(1, Math.ceil(sorted.length / Rk.size));
    if (Rk.page > pages) Rk.page = pages;
    var from = (Rk.page - 1) * Rk.size;
    var t0 = S.thr[fw];

    var tiles = H.tiles.map(function (t) {
      var tt = t[2] >= 100 ? 'green' : t[2] >= 70 ? 'yellow' : 'red';
      return '<div class="ps-tile is-' + tt + '"><div class="ps-tile-label">' + t[0] + '</div><div class="ps-tile-num"><b>' + t[1] + '</b> / ' + TOTAL + '</div>' +
        D.bar(t[2], tt) + '<div class="ps-tile-foot"><b class="ps-ok-' + tt + '">' + t[2] + '% ok</b>' + (t[3] > 0 ? '<span>−' + t[3] + ' score pts</span>' : '') + '</div></div>';
    }).join('');

    var body = sorted.slice(from, from + Rk.size).map(function (r, n) {
      var it = r.it, sum = Array.from(it.summary).slice(0, 41).join('');
      if (sum.length === 41) sum = sum.slice(0, -1) + '…';
      return '<tr' + (S.flash === it.key ? ' class="is-flash"' : '') + '><td class="ps-subtlest d-small">' + (from + n + 1) + '</td><td><span class="ps-key">' + it.key + '</span></td><td>' + esc(sum) + '</td>' +
        '<td class="d-hide-sm d-small">' + it.type + '</td><td class="d-hide-sm d-small">' + it.status + '</td><td class="d-hide-sm ps-subtlest">—</td><td class="d-hide-sm">' + dueLoz(it.due) + '</td>' +
        '<td>' + (r.x === null ? '<span class="ps-subtlest d-small">Not scored</span>' : '<div class="ps-cell-score"><span class="ps-cell-loz">' + D.loz(fmt(r.x), D.tone(r.x, t0.low, t0.high)) + '</span>' + D.bar(pct(r.x, BAR_CEILINGS.get(fw)), D.tone(r.x, t0.low, t0.high), ' style="height:6px"') + '</div>') + '</td></tr>';
    }).join('');

    var head = [['#', null], ['Key', 'key'], ['Summary', null], ['Type', 'type', 1], ['Status', 'status', 1], ['Sprint', 'sprint', 1], ['Due', 'due', 1], [scoreName(fw), 'score']].map(function (h) {
      var cls = h[2] ? ' class="d-hide-sm"' : '';
      if (!h[1]) return '<th' + cls + '>' + h[0] + '</th>';
      var on = Rk.by === h[1];
      return '<th' + cls + (on ? ' aria-sort="' + (Rk.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" class="d-sort" data-sort="' + h[1] + '">' + h[0] + (on ? (Rk.dir > 0 ? ' ▲' : ' ▼') : '') + '</button></th>';
    }).join('');

    var pager = pages > 1 ? '<div class="ps-pager" role="group" aria-label="Pages">' +
      '<button type="button" class="d-btn is-subtle is-compact" data-pg="' + (Rk.page - 1) + '"' + (Rk.page === 1 ? ' disabled' : '') + ' aria-label="Previous page">‹</button>' +
      Array.apply(null, { length: pages }).map(function (_, i) {
        return '<button type="button" class="d-btn is-compact ' + (Rk.page === i + 1 ? 'is-selected' : 'is-subtle') + '" data-pg="' + (i + 1) + '"' + (Rk.page === i + 1 ? ' aria-current="page"' : '') + '>' + (i + 1) + '</button>';
      }).join('') +
      '<button type="button" class="d-btn is-subtle is-compact" data-pg="' + (Rk.page + 1) + '"' + (Rk.page === pages ? ' disabled' : '') + ' aria-label="Next page">›</button></div>' : '';

    // CSV: every open issue of the project, in score order (not the filter or page)
    var csv = '';
    if (S.csv) {
      var q = function (s) { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      var lines = ['Key,Summary,Type,Status,' + scoreName(fw)].concat(sortRows(all, 'score', -1).map(function (r) {
        return [r.it.key, r.it.summary, r.it.type, r.it.status, r.x === null ? '' : fmt(r.x)].map(q).join(',');
      }));
      csv = '<section class="ps-card ps-csv" data-csvbox><div class="d-h3">CSV Export</div><p class="d-help" style="margin:0 0 8px">Select all text below (Ctrl+A / Cmd+A inside the field) and copy to clipboard.</p>' +
        '<textarea class="d-input" readonly rows="6" aria-label="CSV Export">' + esc(lines.join('\n')) + '</textarea></section>';
    }

    var names = Object.keys(PEOPLE).sort();
    var whoOpts = '<option value="">All assignees</option>' + names.map(function (p) { return '<option' + (Rk.who === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') +
      '<option value="__none"' + (Rk.who === '__none' ? ' selected' : '') + '>Unassigned</option>';

    return [
      '<div class="d-context"><span>Apps</span><span class="d-sep">/</span><b>Priority Scoring for Jira</b></div>',
      '<div class="ps-dash d-app"><span class="d-app-tag">Priority Scoring</span>',
      appNav('Dashboard'),
      '  <div class="ps-toolbar">',
      '    <div><label class="d-label" for="ps-proj">Project</label><select class="d-select" id="ps-proj" disabled title="The demo has one sample project"><option>Checkout (CHK)</option></select></div>',
      '    <div><label class="d-label" for="ps-fw">Scoring Framework</label><select class="d-select" id="ps-fw" data-fw data-fid="fw">' + ORDER.map(function (f) { return '<option value="' + f + '"' + (f === fw ? ' selected' : '') + '>' + scoreName(f) + '</option>'; }).join('') + '</select></div>',
      '    <div class="ps-toolbar-btns"><button type="button" class="d-btn is-subtle" data-refresh data-fid="refresh"' + (S.refreshing ? ' disabled' : '') + '>' + (S.refreshing ? 'Refreshing…' : 'Refresh') + '</button>' +
        '<button type="button" class="d-btn is-subtle" data-csv data-fid="csv">' + (S.csv ? 'Close CSV' : 'Export CSV') + '</button>' +
        '<button type="button" class="d-btn is-subtle" data-criteria data-fid="criteria">Health Criteria…</button></div>',
      '  </div>',
      '  <section class="ps-health">',
      S.refreshing ? '    <p class="d-sub" style="margin:0">Calculating health score...</p>' : [
        '    <div class="ps-health-head"><span class="d-small ps-subtlest">BOARD HEALTH</span><div><b class="ps-big">' + H.score + '</b> <span class="ps-subtlest">/ 100</span></div>' + D.loz(H.grade, H.tone) + '</div>',
        '    ' + D.bar(H.score, H.tone, ' style="height:12px;border-radius:6px"'),
        '    <div class="d-small ps-subtlest" style="margin-top:6px">' + TOTAL + ' open issues analysed · checked 0 min ago</div>',
        '    <div class="ps-tiles">' + tiles + '</div>'
      ].join('\n'),
      '  </section>',
      '  <div class="ps-rank-head"><div class="ps-rank-title"><b class="d-h2" style="margin:0">Priority Ranking</b> <span class="d-small ps-subtlest">' + scored + ' scored · ' + (rows.length - scored) + ' unscored · avg ' + fmt(avg) + '</span></div>',
      '    <div class="ps-rank-ctl"><select class="d-select" id="ps-who" data-who data-fid="who" aria-label="Filter by assignee">' + whoOpts + '</select>' +
        '<select class="d-select" id="ps-size" data-size data-fid="size" aria-label="Rows per page">' + [10, 25, 50, 100].map(function (n) { return '<option' + (Rk.size === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div></div>',
      '  <div class="d-table-wrap"><table class="d-table ps-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>',
      pager,
      csv,
      '</div>'
    ].join('\n');
  }

  // ── Tab 3: app page, Settings tab ──
  function renderSettings(S) {
    var fw = S.fw, W = S.weights[fw], U = S.thrUi[fw];
    var custom = controlsFor(fw).some(function (d) { return d.weighted && W[d.id] !== 1; });
    var weights = controlsFor(fw).filter(function (d) { return d.weighted; }).map(function (d) {
      var w = W[d.id];
      return '<div class="ps-set"><div class="ps-set-head"><label for="ps-w-' + d.id + '">' + d.caption + '</label><span class="' + (w > 1 ? 'ps-brand' : 'ps-subtlest') + '" data-live="w-' + d.id + '">×' + w + '</span></div>' +
        '<input class="d-range" type="range" min="1" max="5" step="1" id="ps-w-' + d.id + '" value="' + w + '" data-w="' + d.id + '" data-fid="w-' + d.id + '" style="--p:' + ((w - 1) / 4 * 100) + '%" aria-valuetext="times ' + w + '"></div>';
    }).join('');
    var invalid = U.low >= U.high;
    var mn = MODE_NOTE[S.mode];

    return [
      '<div class="d-context"><span>Apps</span><span class="d-sep">/</span><b>Priority Scoring for Jira</b><span class="d-faint d-hide-sm" style="margin-left:auto">Changes: Jira admins only</span></div>',
      '<div class="ps-dash d-app"><span class="d-app-tag">Priority Scoring</span>',
      appNav('Settings'),
      '<div class="ps-settings">',
      '  <div class="ps-set-col">',
      '    <section class="ps-card">',
      '      <div class="d-h3" style="margin:0">Rovo Agent — Apply Mode</div>',
      '      <p class="d-help" style="margin:2px 0 14px">Changes save automatically. Open a new Rovo Chat for the agent to pick up updated settings.</p>',
      '      <label class="d-label" for="ps-mode">Mode</label>',
      '      <select class="d-select" id="ps-mode" data-mode data-fid="mode" style="width:100%">' + MODES.map(function (o) {
        return '<option value="' + o[0] + '"' + (S.mode === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>',
      S.mode === 'auto' ? '      <div class="ps-set" style="margin-top:14px"><div class="ps-set-head"><label for="ps-bulk">Bulk Limit</label><span class="ps-subtlest" data-live="bulk">max. ' + S.bulk + ' issues at once</span></div>' +
        '<input class="d-range" type="range" id="ps-bulk" min="1" max="50" step="1" value="' + S.bulk + '" data-bulk data-fid="bulk" style="--p:' + ((S.bulk - 1) / 49 * 100) + '%"></div>' : '',
      '      ' + note(mn[0], mn[1]),
      '      <hr class="ps-hr">',
      '      <div class="d-label">Issue Comments</div>',
      '      <label class="ps-check"><input type="checkbox" data-comments data-fid="comments"' + (S.comments ? ' checked' : '') + '> Write Rovo reasoning to issue comments (opt-in)</label>',
      '      <p class="d-help">When Rovo applies a score, it adds a comment to the issue explaining why those dimension values were chosen.</p>',
      '    </section>',
      '    <section class="ps-card">',
      '      <div class="d-h3" style="margin:0">Score Audit Trail</div>',
      '      <p class="d-help" style="margin:2px 0 10px">When enabled, one audit entry per day is recorded for each issue — including whether the score was set manually or via Rovo. Visible on the issue field. Disabled by default.</p>',
      '      <label class="ps-check" style="margin:0"><input type="checkbox" data-audit data-fid="audit"' + (S.audit ? ' checked' : '') + '> ' + (S.audit ? 'Enabled — audit trail is active' : 'Disabled — no audit data recorded') + '</label>',
      S.auditOff && !S.audit ? '      ' + note('warn', 'Audit trail disabled. No new entries will be recorded. Existing entries expire after 90 days and will not be refreshed — enable again to resume tracking.') : '',
      '    </section>',
      '  </div>',
      '  <div class="ps-set-col">',
      '    <section class="ps-card">',
      '      <div class="d-h3" style="margin:0">Dimension Weights — ' + scoreName(fw) + '</div>',
      '      <p class="d-help" style="margin:2px 0 4px">Adjust how much each dimension influences the final score. Weight ×1 = standard (default) · ×2 = twice as much influence · ×5 = five times.' + (DENOMINATORS[fw] ? ' ' + DENOMINATORS[fw] + ' (denominator) is fixed — weighting it would produce confusing results.' : '') + '</p>',
      custom ? '      <p class="d-help ps-warn-text" style="margin:0 0 4px">Custom weights are active. Existing scores will reflect the new weights on next save. Adjust your thresholds below to match the new score range.</p>' : '',
      weights,
      custom ? '      <button type="button" class="d-btn is-subtle is-compact" data-wreset data-fid="wreset">Reset all weights to ×1</button>' : '',
      '    </section>',
      '    <section class="ps-card">',
      '      <div class="d-h3" style="margin:0">Score Thresholds — ' + scoreName(fw) + '</div>',
      '      <p class="d-help" style="margin:2px 0 4px">Colour bands for the priority column: 🔴 below low · 🟡 between · 🟢 above high.</p>',
      '      <div class="ps-set"><div class="ps-set-head"><label for="ps-low">Low (🔴 below this)</label><span class="ps-subtlest" data-live="thr-low">' + U.low + '</span></div>' +
        '<input class="d-range" type="range" id="ps-low" min="0" max="' + COLOR_LIMITS[fw][0] + '" step="1" value="' + U.low + '" data-thr="low" data-fid="low" style="--p:' + (U.low / COLOR_LIMITS[fw][0] * 100) + '%"></div>',
      '      <div class="ps-set"><div class="ps-set-head"><label for="ps-high">High (🟢 above this)</label><span class="ps-subtlest" data-live="thr-high">' + U.high + '</span></div>' +
        '<input class="d-range" type="range" id="ps-high" min="1" max="' + COLOR_LIMITS[fw][1] + '" step="1" value="' + U.high + '" data-thr="high" data-fid="high" style="--p:' + ((U.high - 1) / (COLOR_LIMITS[fw][1] - 1) * 100) + '%"></div>',
      '      <div data-live="thr-err">' + (invalid ? note('warn', 'Low threshold must be less than high threshold.') : '') + '</div>',
      '    </section>',
      '  </div>',
      '</div>',
      '</div>'
    ].join('\n');
  }

  // ── Actions shared by the Rovo chat ──
  function applyRovo(S, fw) {
    var it = issue(S, 'CHK-21');
    it.dims[fw] = Object.assign({}, ROVO[fw].vals);
    it.val[fw] = calc(fw, it.dims[fw], S.weights[fw]);
    record(S, fw, it.val[fw], true);
    S.flash = 'CHK-21';
    return it.val[fw];
  }
  function record(S, framework, value, fromChat) {
    if (S.audit) {
      var entry = { val: value, rovo: fromChat, date: today() };
      var older = (S.history[framework] || []).filter(function (item) { return item.date !== entry.date; });
      S.history[framework] = [entry].concat(older);
    }
  }
  function botSay(S, html, extra) {
    var m = Object.assign({ who: 'bot', html: html }, extra || {});
    S.rovo.msgs.push(m);
    if (S.rovo.msgs.length > 8) S.rovo.msgs = S.rovo.msgs.slice(-8);
    return m;
  }

  // ── Mount ──
  D.mount(root, {
    id: 'ps',
    title: 'Priority Scoring',
    tabs: [
      { id: 'score', label: 'Score an issue' },
      { id: 'rank', label: 'Ranking & Board Health' },
      { id: 'settings', label: 'Settings' }
    ],
    initialState: initialState,
    render: function (tab, S) {
      return ({ rank: renderRanking, settings: renderSettings }[tab] || renderIssue)(S);
    },
    afterRender: function (tab, S) {
      if (tab === 'rank') S.flash = null;
      var list = root.querySelector('.ps-msgs');
      if (list) list.scrollTop = list.scrollHeight;
    },
    steps: {
      score: [
        { text: 'click <strong>Priority Scoring — RICE</strong> and drag the sliders. The score changes while you drag.', target: '[data-edit="rice"], #ps-d-r', done: function (S) { return S.flags.moved; } },
        { text: 'save the score with the <strong>check mark</strong>.', target: '[data-save="rice"]', done: function (S) { return S.flags.saved; } },
        { text: 'click <strong>Ask Rovo</strong> and ask for a WSJF score. Confirm it to apply it.', target: '[data-rovo-open], [data-ask="wsjf"], [data-reply="yes"], [data-tool="ok"]', done: function (S) { return S.flags.rovo; } }
      ],
      rank: [
        { text: 'find <strong>CHK-21</strong> in the ranking, then switch the framework to <strong>WSJF Score</strong>. The order changes.', target: '#ps-fw', done: function (S) { return S.flags.fw; } },
        { text: 'filter the ranking by an assignee.', target: '#ps-who', done: function (S) { return S.flags.who; } },
        { text: 'click <strong>Export CSV</strong>. You get CSV text to copy.', target: '[data-csv]', done: function (S) { return S.flags.csv; } }
      ],
      settings: [
        { text: 'switch the Rovo apply mode to <strong>Auto</strong>. The bulk limit appears.', target: '#ps-mode', done: function (S) { return S.flags.mode; } },
        { text: 'give a dimension a weight of <strong>×3</strong>.', target: '[data-w]', done: function (S) { return S.flags.weight; } },
        { text: 'turn on the <strong>Score Audit Trail</strong>.', target: '[data-audit]', done: function (S) { return S.flags.audit; } }
      ]
    },
    doneText: {
      score: '<strong>That’s scoring.</strong> The three fields sit on the issue, so the team scores where the work is.',
      get rank() {
        return API && anyScore(issue(API.state(), 'CHK-21'))
          ? '<strong>The open issues you can see, ranked.</strong> Scoring CHK-21 lowered the Unscored count.'
          : '<strong>The open issues you can see, ranked.</strong> Score CHK-21 in tab 1 and Unscored drops to 3.';
      },
      settings: '<strong>Saved for the whole site.</strong> Only Jira admins can change it. In tab 1, the next save uses the weight and lands in the audit trail.'
    },
    setup: function (api) {
      API = api;
      var S = function () { return api.state(); };
      var dimOf = function (fw, k) { return controlsFor(fw).filter(function (x) { return x.id === k; })[0]; };

      // Issue fields
      api.on('click', '[data-edit]', function (el) {
        var fw = el.dataset.edit, it = issue(S(), 'CHK-21'), vals = {};
        controlsFor(fw).forEach(function (d) { vals[d.id] = it.dims[fw] ? it.dims[fw][d.id] : d.initial; });
        S().edit = { fw: fw, vals: vals, touched: false };
        api.update();
        var first = api.el('[data-dim]'); if (first) first.focus();
      });
      api.on('input', '[data-dim]', function (el) {
        var E = S().edit, fw = E.fw, d = dimOf(fw, el.dataset.dim);
        E.vals[d.id] = +el.value;
        el.style.setProperty('--p', ((+el.value - d.minimum) / (d.maximum - d.minimum) * 100) + '%');
        api.el('[data-live="v-' + d.id + '"]').textContent = el.value;
        api.el('[data-live="ed-score"]').innerHTML = scoreBlock(S(), fw, calc(fw, E.vals, S().weights[fw]), true);
        if (!E.touched) {
          E.touched = true;
          if (fw === 'rice') { S().flags.moved = true; api.refreshHint(); }
        }
      });
      api.on('click', '[data-save]', function () {
        var E = S().edit, fw = E.fw, it = issue(S(), 'CHK-21');
        S().edit = null;
        if (!E.touched) { api.update(); focusField(fw); api.toast('Nothing changed, so the field keeps its value'); return; }
        it.dims[fw] = Object.assign({}, E.vals);
        it.val[fw] = calc(fw, it.dims[fw], S().weights[fw]);
        record(S(), fw, it.val[fw], false);
        if (fw === 'rice') S().flags.saved = true;
        S().flash = 'CHK-21';
        api.update();
        focusField(fw);
        api.toast(frameworkLabel(fw) + ' score saved: ' + fmt(it.val[fw]));
      });
      api.on('click', '[data-cancel]', function () { var fw = S().edit && S().edit.fw; S().edit = null; api.update(); if (fw) focusField(fw); });
      // keyboard users land on the field they just edited
      function focusField(fw) { var f = api.el('[data-edit="' + fw + '"]'); if (f) f.focus({ preventScroll: true }); }
      api.on('click', '[data-trail]', function (el) { var t = S().trail; t[el.dataset.trail] = !t[el.dataset.trail]; api.update(); });

      // Rovo (recreated)
      api.on('click', '[data-rovo-open]', function () { S().rovo.open = true; api.update(); var c = api.el('[data-ask="wsjf"]'); if (c) c.focus(); });
      api.on('click', '[data-rovo-close]', function () { S().rovo.open = false; api.update(); });
      api.on('click', '[data-ask]', function (el) {
        var R = S().rovo, q = el.dataset.ask;
        R.msgs.push({ who: 'me', text: el.textContent });
        R.busy = true; R.fresh = false; api.update();
        var asked = S();   // Reset replaces the state; a late answer must not land in the new one
        setTimeout(function () {
          var St = S();
          if (St !== asked) return;
          St.rovo.busy = false;
          if (q === 'health') {
            botSay(St, healthAnswer(St));
          } else if (St.mode === 'suggest') {
            botSay(St, suggestion(q) + '<p>Open the issue in Jira and adjust the sliders in the custom field to apply these values.</p>');
            St.flags.rovo = true;
          } else if (St.mode === 'confirm') {
            botSay(St, suggestion(q) + '<p>Shall I apply this score to <code>CHK-21</code>?</p>', { ask: q });
          } else {
            botSay(St, suggestion(q));
            St.rovo.msgs.push({ who: 'tool', fw: q, state: null });
          }
          api.update();
        }, 900);
      });
      api.on('click', '[data-reply]', function (el) {
        var R = S().rovo, last = R.msgs.filter(function (m) { return m.ask && !m.answered; }).pop();
        if (!last) return;
        last.answered = true;
        var yes = el.dataset.reply === 'yes';
        R.msgs.push({ who: 'me', text: yes ? 'Yes, apply it' : 'No' });
        if (yes) R.msgs.push({ who: 'tool', fw: last.ask, state: null });
        else { botSay(S(), '<p>OK, nothing was changed on <code>CHK-21</code>.</p>'); S().flags.rovo = true; }
        api.update();
      });
      api.on('change', '[data-tool-pick]', function (el) {
        var ok = api.el('[data-tool="ok"]'); if (ok) ok.disabled = !el.checked;
      });
      api.on('click', '[data-tool]', function (el) {
        var St = S(), m = St.rovo.msgs.filter(function (x) { return x.who === 'tool' && !x.state; }).pop();
        if (!m) return;
        m.state = el.dataset.tool;
        St.flags.rovo = true;
        if (m.state === 'ok') {
          var x = applyRovo(St, m.fw);
          botSay(St, '<p>' + scoreTitle(m.fw) + ' of ' + fmt(x) + ' set on <code>CHK-21</code> ✓' + (St.comments ? ' The reasoning is in a comment on the issue.' : '') + '</p>');
          api.update();
          api.toast('Rovo applied the ' + scoreTitle(m.fw));
        } else {
          botSay(St, '<p>Cancelled. Nothing was changed.</p>');
          api.update();
        }
      });

      // App page navigation (Activity, Portfolio and Import are not in the demo)
      api.on('click', '[data-page]', function (el) {
        var p = el.dataset.page;
        if (p === 'Dashboard') api.go('rank', true);
        else if (p === 'Settings') api.go('settings', true);
        else api.toast(p + ' is not part of this demo. See the screenshots below.');
      });

      // Ranking
      api.on('change', '[data-fw]', function (el) {
        S().fw = el.value; S().rank.page = 1; if (el.value !== 'rice') S().flags.fw = true; api.update();
      });
      api.on('change', '[data-who]', function (el) { S().rank.who = el.value; S().rank.page = 1; if (el.value) S().flags.who = true; api.update(); });
      api.on('change', '[data-size]', function (el) { S().rank.size = +el.value; S().rank.page = 1; api.update(); });
      api.on('click', '[data-sort]', function (el) {
        var Rk = S().rank, k = el.dataset.sort;
        if (Rk.by === k) Rk.dir = -Rk.dir; else { Rk.by = k; Rk.dir = k === 'score' ? -1 : 1; }
        api.update();
      });
      api.on('click', '[data-pg]', function (el) { S().rank.page = +el.dataset.pg; api.update(); });
      api.on('click', '[data-csv]', function () {
        S().csv = !S().csv; S().flags.csv = true; api.update();
        var box = api.el('[data-csvbox]'); if (box && box.scrollIntoView) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      api.on('click', '[data-refresh]', function () {
        S().refreshing = true; api.update();
        setTimeout(function () { S().refreshing = false; api.update(); api.toast('Board Health recalculated'); }, 700);
      });
      api.on('click', '[data-criteria]', function () { api.toast('In the app: pick the criteria per project, or SCRUM or KANBAN Defaults'); });

      // Settings
      api.on('change', '[data-mode]', function (el) {
        var St = S();
        St.mode = el.value;
        if (el.value === 'auto') St.flags.mode = true;
        // A new chat picks up the new mode
        St.rovo.msgs = []; St.rovo.busy = false; St.rovo.fresh = true;
        api.update();
      });
      api.on('change', '[data-comments]', function (el) { S().comments = el.checked; });
      api.on('change', '[data-audit]', function (el) {
        S().audit = el.checked; S().auditOff = !el.checked; if (el.checked) S().flags.audit = true; api.update();
      });
      api.on('input', '[data-bulk]', function (el) {
        S().bulk = +el.value; el.style.setProperty('--p', ((el.value - 1) / 49 * 100) + '%');
        api.el('[data-live="bulk"]').textContent = 'max. ' + el.value + ' issues at once';
      });
      api.on('input', '[data-w]', function (el) {
        var w = +el.value, k = el.dataset.w;
        S().weights[S().fw][k] = w;
        el.style.setProperty('--p', ((w - 1) / 4 * 100) + '%');
        el.setAttribute('aria-valuetext', 'times ' + w);
        var lab = api.el('[data-live="w-' + k + '"]'); lab.textContent = '×' + w; lab.className = w > 1 ? 'ps-brand' : 'ps-subtlest';
        if (w !== 1 && !S().flags.weight) { S().flags.weight = true; api.refreshHint(); }
      });
      api.on('change', '[data-w]', function () { api.update(); });
      api.on('click', '[data-wreset]', function () {
        var W = S().weights[S().fw]; Object.keys(W).forEach(function (k) { W[k] = 1; }); api.update();
      });
      api.on('input', '[data-thr]', function (el) {
        var fw = S().fw, U = S().thrUi[fw], which = el.dataset.thr, v = +el.value;
        U[which] = v;
        el.style.setProperty('--p', (which === 'low' ? v / COLOR_LIMITS[fw][0] : (v - 1) / (COLOR_LIMITS[fw][1] - 1)) * 100 + '%');
        api.el('[data-live="thr-' + which + '"]').textContent = v;
        var bad = U.low >= U.high;
        if (!bad) S().thr[fw] = { low: U.low, high: U.high };
        api.el('[data-live="thr-err"]').innerHTML = bad ? note('warn', 'Low threshold must be less than high threshold.') : '';
      });
    }
  });
})();
