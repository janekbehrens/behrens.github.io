/* ============================================================
   tc-demo.js — interactive demo for Team Capacity for Jira
   Sample data and fixed behavior only; written for the website,
   not taken from the app. The rules shown here are the ones the
   documentation describes: load divided by capacity in percent,
   Over > 100 %, Near >= 85 %, Free < 50 % by default, unassigned
   work outside the team total, Pro settings only with a license.
   Loads, issue counts and hours are fixed sample numbers.
   ============================================================ */
(function () {
  'use strict';
  var root = document.querySelector('[data-demo="tc"]');
  if (!root || !window.JBDemo) return;
  var D = window.JBDemo, esc = D.esc;

  var LISTING = 'https://marketplace.atlassian.com/apps/2392093081/team-capacity-sprint-workload-resource-planning-for-jira';
  var LABEL = { red: 'Overloaded', amber: 'Near capacity', green: 'On track', blue: 'Has capacity', grey: '—' };
  var LIMITS = { over: 100, near: 85, free: 50 };

  // Each work tuple is [points, open points, issues, open issues].
  // Captions and member order are fixed parts of this website fixture.
  var SPRINT_LIST = [
    { id: 24, name: "Sprint 24", state: "active", memberOrder: ["a", "c", "e", "b", "d", "f"], samples: [
      {"name": "Priya Raman", "detail": "7 issues · 2 done", "id": "a", "work": [26, 22, 7, 5], "hours": 31.5, "n": 7, "done": 2},
      {"name": "Ruby Ellison", "detail": "4 issues · 1 done", "id": "b", "work": [12, 9, 4, 3], "hours": 14, "n": 4, "done": 1},
      {"name": "Marcus Hale", "detail": "5 issues · 2 done", "id": "c", "work": [19, 14, 5, 3], "hours": 21, "n": 5, "done": 2},
      {"name": "Daniel Okafor", "detail": "4 issues · 2 done", "id": "d", "work": [11, 8, 4, 2], "hours": 12.5, "n": 4, "done": 2},
      {"name": "Emma Whitfield", "detail": "5 issues · 3 done", "id": "e", "work": [14, 8, 5, 2], "hours": 17, "n": 5, "done": 3},
      {"name": "Tom Ashby", "detail": "3 issues · 2 done", "id": "f", "work": [6, 3, 3, 1], "hours": 6.5, "n": 3, "done": 2},
    ], unassigned: {"name": "Unassigned", "detail": "3 issues", "id": "none", "work": [8, 8, 3, 3], "hours": 0, "n": 3, "done": 0} },
    { id: 25, name: "Sprint 25", state: "future", memberOrder: ["c", "a", "e", "f", "d", "b"], samples: [
      {"name": "Priya Raman", "detail": "5 issues", "id": "a", "work": [18, 18, 5, 5], "hours": 0, "n": 5, "done": 0},
      {"name": "Ruby Ellison", "detail": "3 issues", "id": "b", "work": [9, 9, 3, 3], "hours": 0, "n": 3, "done": 0},
      {"name": "Marcus Hale", "detail": "6 issues", "id": "c", "work": [21, 21, 6, 6], "hours": 0, "n": 6, "done": 0},
      {"name": "Daniel Okafor", "detail": "3 issues", "id": "d", "work": [10, 10, 3, 3], "hours": 0, "n": 3, "done": 0},
      {"name": "Emma Whitfield", "detail": "5 issues", "id": "e", "work": [16, 16, 5, 5], "hours": 0, "n": 5, "done": 0},
      {"name": "Tom Ashby", "detail": "4 issues", "id": "f", "work": [12, 12, 4, 4], "hours": 0, "n": 4, "done": 0},
    ], unassigned: {"name": "Unassigned", "detail": "4 issues", "id": "none", "work": [13, 13, 4, 4], "hours": 0, "n": 4, "done": 0} },
    { id: 23, name: "Sprint 23", state: "closed", memberOrder: ["a", "c", "e", "b", "d", "f"], samples: [
      {"name": "Priya Raman", "detail": "6 issues · 6 done", "id": "a", "work": [22, 0, 6, 0], "hours": 38.5, "n": 6, "done": 6},
      {"name": "Ruby Ellison", "detail": "2 issues · 2 done", "id": "b", "work": [8, 0, 2, 0], "hours": 15, "n": 2, "done": 2},
      {"name": "Marcus Hale", "detail": "4 issues · 4 done", "id": "c", "work": [18, 0, 4, 0], "hours": 30, "n": 4, "done": 4},
      {"name": "Daniel Okafor", "detail": "3 issues · 3 done", "id": "d", "work": [8, 0, 3, 0], "hours": 14, "n": 3, "done": 3},
      {"name": "Emma Whitfield", "detail": "4 issues · 4 done", "id": "e", "work": [15, 0, 4, 0], "hours": 26.5, "n": 4, "done": 4},
      {"name": "Tom Ashby", "detail": "3 issues · 3 done", "id": "f", "work": [8, 0, 3, 0], "hours": 12.5, "n": 3, "done": 3},
    ], unassigned: null },
    { id: 22, name: "Sprint 22", state: "closed", memberOrder: ["a", "c", "e", "f", "d", "b"], samples: [
      {"name": "Priya Raman", "detail": "5 issues · 5 done", "id": "a", "work": [20, 0, 5, 0], "hours": 33, "n": 5, "done": 5},
      {"name": "Ruby Ellison", "detail": "3 issues · 3 done", "id": "b", "work": [9, 0, 3, 0], "hours": 16.5, "n": 3, "done": 3},
      {"name": "Marcus Hale", "detail": "5 issues · 5 done", "id": "c", "work": [17, 0, 5, 0], "hours": 27, "n": 5, "done": 5},
      {"name": "Daniel Okafor", "detail": "3 issues · 3 done", "id": "d", "work": [10, 0, 3, 0], "hours": 15, "n": 3, "done": 3},
      {"name": "Emma Whitfield", "detail": "4 issues · 4 done", "id": "e", "work": [16, 0, 4, 0], "hours": 25.5, "n": 4, "done": 4},
      {"name": "Tom Ashby", "detail": "4 issues · 4 done", "id": "f", "work": [11, 0, 4, 0], "hours": 18, "n": 4, "done": 4},
    ], unassigned: null },
    { id: 21, name: "Sprint 21", state: "closed", memberOrder: ["a", "e", "c", "d", "f", "b"], samples: [
      {"name": "Priya Raman", "detail": "6 issues · 6 done", "id": "a", "work": [23, 0, 6, 0], "hours": 40, "n": 6, "done": 6},
      {"name": "Ruby Ellison", "detail": "2 issues · 2 done", "id": "b", "work": [7, 0, 2, 0], "hours": 12, "n": 2, "done": 2},
      {"name": "Marcus Hale", "detail": "4 issues · 4 done", "id": "c", "work": [15, 0, 4, 0], "hours": 24.5, "n": 4, "done": 4},
      {"name": "Daniel Okafor", "detail": "4 issues · 4 done", "id": "d", "work": [12, 0, 4, 0], "hours": 19, "n": 4, "done": 4},
      {"name": "Emma Whitfield", "detail": "5 issues · 5 done", "id": "e", "work": [18, 0, 5, 0], "hours": 29, "n": 5, "done": 5},
      {"name": "Tom Ashby", "detail": "3 issues · 3 done", "id": "f", "work": [9, 0, 3, 0], "hours": 14.5, "n": 3, "done": 3},
    ], unassigned: null },
    { id: 20, name: "Sprint 20", state: "closed", memberOrder: ["c", "a", "e", "b", "d", "f"], samples: [
      {"name": "Priya Raman", "detail": "5 issues · 5 done", "id": "a", "work": [18, 0, 5, 0], "hours": 30.5, "n": 5, "done": 5},
      {"name": "Ruby Ellison", "detail": "3 issues · 3 done", "id": "b", "work": [10, 0, 3, 0], "hours": 17, "n": 3, "done": 3},
      {"name": "Marcus Hale", "detail": "5 issues · 5 done", "id": "c", "work": [19, 0, 5, 0], "hours": 31, "n": 5, "done": 5},
      {"name": "Daniel Okafor", "detail": "3 issues · 3 done", "id": "d", "work": [9, 0, 3, 0], "hours": 13.5, "n": 3, "done": 3},
      {"name": "Emma Whitfield", "detail": "4 issues · 4 done", "id": "e", "work": [13, 0, 4, 0], "hours": 21, "n": 4, "done": 4},
      {"name": "Tom Ashby", "detail": "2 issues · 2 done", "id": "f", "work": [7, 0, 2, 0], "hours": 11, "n": 2, "done": 2},
    ], unassigned: null },
    { id: 19, name: "Sprint 19", state: "closed", memberOrder: ["a", "c", "e", "d", "f", "b"], samples: [
      {"name": "Priya Raman", "detail": "6 issues · 6 done", "id": "a", "work": [21, 0, 6, 0], "hours": 35, "n": 6, "done": 6},
      {"name": "Ruby Ellison", "detail": "2 issues · 2 done", "id": "b", "work": [8, 0, 2, 0], "hours": 13.5, "n": 2, "done": 2},
      {"name": "Marcus Hale", "detail": "4 issues · 4 done", "id": "c", "work": [16, 0, 4, 0], "hours": 26, "n": 4, "done": 4},
      {"name": "Daniel Okafor", "detail": "3 issues · 3 done", "id": "d", "work": [11, 0, 3, 0], "hours": 17.5, "n": 3, "done": 3},
      {"name": "Emma Whitfield", "detail": "4 issues · 4 done", "id": "e", "work": [14, 0, 4, 0], "hours": 23, "n": 4, "done": 4},
      {"name": "Tom Ashby", "detail": "3 issues · 3 done", "id": "f", "work": [10, 0, 3, 0], "hours": 16, "n": 3, "done": 3},
    ], unassigned: null },
    { id: 18, name: "Sprint 18", state: "closed", memberOrder: ["c", "a", "e", "f", "d", "b"], samples: [
      {"name": "Priya Raman", "detail": "5 issues · 5 done", "id": "a", "work": [17, 0, 5, 0], "hours": 28, "n": 5, "done": 5},
      {"name": "Ruby Ellison", "detail": "2 issues · 2 done", "id": "b", "work": [6, 0, 2, 0], "hours": 10, "n": 2, "done": 2},
      {"name": "Marcus Hale", "detail": "6 issues · 6 done", "id": "c", "work": [20, 0, 6, 0], "hours": 33.5, "n": 6, "done": 6},
      {"name": "Daniel Okafor", "detail": "2 issues · 2 done", "id": "d", "work": [8, 0, 2, 0], "hours": 12, "n": 2, "done": 2},
      {"name": "Emma Whitfield", "detail": "4 issues · 4 done", "id": "e", "work": [15, 0, 4, 0], "hours": 24, "n": 4, "done": 4},
      {"name": "Tom Ashby", "detail": "4 issues · 4 done", "id": "f", "work": [12, 0, 4, 0], "hours": 19.5, "n": 4, "done": 4},
    ], unassigned: null },
    { id: 17, name: "Sprint 17", state: "closed", memberOrder: ["a", "c", "e", "d", "b", "f"], samples: [
      {"name": "Priya Raman", "detail": "5 issues · 5 done", "id": "a", "work": [19, 0, 5, 0], "hours": 31, "n": 5, "done": 5},
      {"name": "Ruby Ellison", "detail": "3 issues · 3 done", "id": "b", "work": [9, 0, 3, 0], "hours": 15.5, "n": 3, "done": 3},
      {"name": "Marcus Hale", "detail": "4 issues · 4 done", "id": "c", "work": [14, 0, 4, 0], "hours": 22, "n": 4, "done": 4},
      {"name": "Daniel Okafor", "detail": "3 issues · 3 done", "id": "d", "work": [10, 0, 3, 0], "hours": 16, "n": 3, "done": 3},
      {"name": "Emma Whitfield", "detail": "3 issues · 3 done", "id": "e", "work": [12, 0, 3, 0], "hours": 19.5, "n": 3, "done": 3},
      {"name": "Tom Ashby", "detail": "3 issues · 3 done", "id": "f", "work": [8, 0, 3, 0], "hours": 13, "n": 3, "done": 3},
    ], unassigned: null },
    { id: 16, name: "Sprint 16", state: "closed", memberOrder: ["a", "c", "e", "d", "f", "b"], samples: [
      {"name": "Priya Raman", "detail": "4 issues · 4 done", "id": "a", "work": [16, 0, 4, 0], "hours": 26.5, "n": 4, "done": 4},
      {"name": "Ruby Ellison", "detail": "2 issues · 2 done", "id": "b", "work": [5, 0, 2, 0], "hours": 8.5, "n": 2, "done": 2},
      {"name": "Marcus Hale", "detail": "4 issues · 4 done", "id": "c", "work": [13, 0, 4, 0], "hours": 21, "n": 4, "done": 4},
      {"name": "Daniel Okafor", "detail": "2 issues · 2 done", "id": "d", "work": [7, 0, 2, 0], "hours": 11.5, "n": 2, "done": 2},
      {"name": "Emma Whitfield", "detail": "3 issues · 3 done", "id": "e", "work": [11, 0, 3, 0], "hours": 18, "n": 3, "done": 3},
      {"name": "Tom Ashby", "detail": "2 issues · 2 done", "id": "f", "work": [6, 0, 2, 0], "hours": 10, "n": 2, "done": 2},
    ], unassigned: null },
  ];
  var ACTIVE = 24;

  function sprintById(id) {
    for (var i = 0; i < SPRINT_LIST.length; i++) if (SPRINT_LIST[i].id === id) return SPRINT_LIST[i];
    return SPRINT_LIST[0];
  }
  function copyObj(o) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = o[k]; }); return r; }
  function draftOf(saved) {
    return { board: 'loy', sprint: saved.sprint, mode: saved.mode, cap: String(saved.cap), per: copyObj(saved.per),
      excl: saved.excl, over: String(saved.over), near: String(saved.near), free: String(saved.free) };
  }

  function initialState() {
    var saved = { sprint: '', mode: 'points', cap: 20, per: { b: 10, d: 12 }, excl: false, over: 100, near: 85, free: 50 };
    return {
      plan: 'pro',
      saved: saved,
      draft: draftOf(saved),
      members: false,
      view: null,
      readLabel: readStamp(true),
      csv: false,
      flash: {},
      flags: {}
    };
  }

  function settings(state) {
    var saved = state.saved;
    var enhanced = state.plan === 'pro';
    var ordered = [saved.free, saved.near, saved.over];
    var usable = ordered.every(function (value, index) {
      return value > 0 && (index === 0 || value >= ordered[index - 1]);
    });
    var boundaries = enhanced && usable ? saved : LIMITS;
    return {
      mode: saved.mode, cap: saved.cap,
      per: enhanced ? saved.per : {}, excl: enhanced && saved.excl,
      free: boundaries.free, near: boundaries.near, over: boundaries.over
    };
  }
  function shownSprint(state) {
    return state.view ?? (Number(state.saved.sprint) || ACTIVE);
  }

  // The fixture already holds both total and remaining work in each unit.
  // Capacity edits only need the public load / capacity percentage calculation.
  function heat(state, sprintId) {
    var options = settings(state), sprint = sprintById(sprintId);
    var workColumn = options.mode === 'count' ? 2 : 0;
    if (options.excl) workColumn++;
    var total = 0, capacity = 0, overloaded = 0;
    var assessed = [], withoutCapacity = [];
    function displaySample(sample, limit) {
      var load = sample.work[workColumn];
      var exactPercent = limit > 0 ? 100 * load / limit : null;
      var band = 'grey';
      var percent = null;
      if (exactPercent !== null) {
        percent = Math.round(exactPercent);
        var ranges = [
          ['red', exactPercent > options.over],
          ['amber', exactPercent >= options.near],
          ['blue', exactPercent < options.free],
          ['green', true]
        ];
        band = ranges.find(function (range) { return range[1]; })[0];
      }
      var width = percent === null ? (load ? 100 : 0) : Math.min(100, percent);
      return Object.assign({}, sample, { load: load, cap: limit, percent: percent, status: band, width: width });
    }
    sprint.samples.forEach(function (sample) {
      var limit = options.per[sample.id] ?? options.cap;
      var row = displaySample(sample, limit);
      total += row.load;
      capacity += limit;
      if (row.status === 'red') overloaded++;
      (row.percent === null ? withoutCapacity : assessed).push(row);
    });
    assessed.sort(function (left, right) { return right.percent - left.percent; });
    capacity = Number(capacity.toFixed(1));
    var team = null;
    if (capacity > 0) team = Math.round(total * 100 / capacity);
    return {
      sprint: sprint,
      unit: options.mode === 'count' ? 'issues' : 'points',
      rows: assessed.concat(withoutCapacity),
      none: sprint.unassigned ? displaySample(sprint.unassigned, null) : null,
      team: team,
      count: sprint.samples.length,
      over: overloaded,
      capTotal: capacity,
      total: total
    };
  }

  function snapshot(S) {
    var H = heat(S, shownSprint(S)), m = {};
    H.rows.concat(H.none ? [H.none] : []).forEach(function (r) { m[r.id] = r.status + '|' + r.load + '|' + r.cap; });
    return m;
  }
  function markChanges(S, before) {
    var after = snapshot(S);
    S.flash = {};
    Object.keys(after).forEach(function (k) { if (before[k] !== after[k]) S.flash[k] = true; });
  }

  // Two fixed freshness states: the initial example is 45 minutes old;
  // Refresh, a sprint switch and Save show a freshly read timestamp.
  function readStamp(stale) {
    var date = new Date();
    if (stale) date.setMinutes(date.getMinutes() - 45);
    var time = new Intl.DateTimeFormat(undefined, { minute: '2-digit', hour: '2-digit' }).format(date);
    return 'Updated ' + time + (stale ? ' · 45 min ago' : '');
  }

  function markup(tag, attributes, content) {
    var opening = '<' + tag;
    Object.entries(attributes).forEach(function (attribute) {
      opening += ' ' + attribute[0] + '="' + esc(attribute[1]) + '"';
    });
    opening += '>';
    return tag === 'input' ? opening : opening + (content || '') + '</' + tag + '>';
  }
  function numberField(value, attributes) {
    return markup('input', Object.assign({ value: value, inputmode: 'numeric', class: 'tcs-input', step: 1, type: 'number', min: 0 }, attributes));
  }

  // ── Markup ──
  var ICON_REFRESH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 9 9 9"/></svg>';
  var ICON_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var PRO = ' <span class="tcs-badge">PRO</span>';

  function context(S, crumbs) {
    var pro = S.plan === 'pro';
    return '<div class="d-context tcs-context"><span class="tcs-breadcrumbs">' + crumbs + '</span>' +
      '<span class="tcs-plans" role="group" aria-label="Plan shown in the demo"><span class="tcs-plan-caption">Plan</span>' +
      '<button type="button" data-plan="pro" data-fid="plan-pro" aria-pressed="' + pro + '" title="Show the demo with a Pro license">Pro</button>' +
      '<button type="button" data-plan="free" data-fid="plan-free" aria-pressed="' + !pro + '" title="Show the demo without a license (Free)">Free</button></span></div>';
  }

  function sampleRow(state, row, unit) {
    var value = '<b>' + row.load + '</b> ' + unit;
    if (row.percent !== null) value = row.load + '/' + row.cap + ' <b>' + row.percent + '%</b>';
    var swatch = row.width ? '<span style="inline-size:' + row.width + '%"></span>' : '';
    var description = LABEL[row.status];
    var title = esc(row.name + ' — ' + description);
    var accessible = row.status === 'grey' ? '' : '<span class="tcs-accessible"> · ' + description + '</span>';
    return [
      '<div class="tcs-person tcs-' + row.status + (state.flash[row.id] ? ' tcs-flash' : '') + '">',
      '<div class="tcs-identity" title="' + title + '"><strong>' + esc(row.name) + '</strong><small>' + row.detail + '</small></div>',
      '<div aria-hidden="true" class="tcs-meter">' + swatch + '</div>',
      '<div class="tcs-value">' + value + accessible + '</div>',
      '</div>'
    ].join('');
  }

  function heatmap(S, key) {
    var sid = shownSprint(S), H = heat(S, sid), pro = S.plan === 'pro';
    var options = SPRINT_LIST.map(function (s) {
      return '<option value="' + s.id + '"' + (s.id === sid ? ' selected' : '') + '>' + esc(s.name) + ' (' + s.state + ')</option>';
    }).join('');
    var rows = H.rows.map(function (r) { return sampleRow(S, r, H.unit); }).join('') + (H.none ? sampleRow(S, H.none, H.unit) : '');
    var summary = H.count + ' people · <b>' + H.total + '</b>/<b>' + H.capTotal + '</b> ' + H.unit;
    summary += ' (<b>' + (H.team === null ? '—' : H.team + '%') + '</b>)';
    summary += H.over ? ' · ' + markup('b', { class: 'tcs-over-count' }, H.over + ' overloaded') : '';
    var timestamp = markup('span', { title: 'These numbers were read from Jira at this time. They do not update on their own — use Refresh.', class: 'tcs-timestamp' }, S.readLabel);
    return [
      '<div class="tcs-heatmap">',
      '  <div class="tcs-heatmap-title">',
      '    <select class="tcs-sprint-menu" data-view-sprint data-fid="vs-' + key + '" title="Switch sprint" aria-label="Switch sprint">' + options + '</select>',
      markup('div', { class: 'tcs-totals' }, summary),
      '  </div>',
      '  <div class="tcs-people">' + rows + '</div>',
      '  <div class="tcs-footer">',
      '    <div class="tcs-key" aria-hidden="true"><span><i class="tcs-red"></i>Overloaded</span><span><i class="tcs-amber"></i>Near capacity</span><span><i class="tcs-green"></i>On track</span><span><i class="tcs-blue"></i>Has capacity</span></div>',
      '    <div class="tcs-tools">',
      timestamp,
      '      <button type="button" class="tcs-button" data-refresh data-fid="refresh-' + key + '" title="Read the current numbers from Jira">Refresh</button>',
      pro ? '      <button type="button" class="tcs-button" data-csv data-fid="csv-' + key + '">Export CSV</button>'
          : '      <button type="button" class="tcs-button" disabled title="Upgrade to export estimate vs. actual as CSV">Export CSV' + PRO + '</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function gadget(S, key) {
    return '<section class="d-gadget d-app tcs-gadget" aria-label="Team Capacity gadget"><span class="d-app-tag">Team Capacity</span>' +
      '<div class="d-gadget-head"><div class="d-gadget-title">Team Capacity</div>' +
      '<button type="button" class="d-icon-btn" data-refresh data-fid="grefresh-' + key + '" title="Refresh" aria-label="Refresh this gadget">' + ICON_REFRESH + '</button>' +
      '<button type="button" class="d-icon-btn" data-edit data-fid="gedit-' + key + '" title="Edit" aria-label="Edit this gadget">' + ICON_EDIT + '</button></div>' +
      '<div class="d-gadget-body">' + heatmap(S, key) + '</div></section>';
  }
  function gadgetWithCsv(S, key) {
    return '<div class="tcs-gadget-wrap">' + gadget(S, key) + csvPreview(S) + '</div>';
  }

  function quoteCell(v) {
    var t = v === null || v === undefined ? '' : String(v);
    if (t.indexOf(',') < 0 && t.indexOf('"') < 0) return t;
    return '"' + t.split('"').join('""') + '"';
  }
  function csvPreview(S) {
    if (!S.csv || S.plan !== 'pro') return '';
    var H = heat(S, shownSprint(S)), u = H.unit;
    var head = ['Person', 'Load (' + u + ')', 'Capacity (' + u + ')', 'Utilization %', 'Status', 'Issues', 'Done', 'Time spent (h)', 'Sprint', 'Sprint state'];
    var lines = H.rows.concat(H.none ? [H.none] : []).map(function (r) {
      return [r.name, r.load, r.cap === null ? '' : r.cap, r.percent === null ? '' : r.percent, LABEL[r.status], r.n, r.done, r.hours, H.sprint.name, H.sprint.state];
    });
    var file = 'team-capacity-' + H.sprint.name.toLowerCase().split(' ').join('-') + '.csv';
    var text = [head].concat(lines).map(function (l) { return l.map(quoteCell).join(','); }).join('\n');
    var num = { 1: 1, 2: 1, 3: 1, 5: 1, 6: 1, 7: 1 };
    return [
      '<section class="tcs-export" aria-label="Exported CSV file" data-csv-box>',
      '  <div class="tcs-export-title"><span class="tcs-export-icon" aria-hidden="true">CSV</span><b>' + esc(file) + '</b>',
      '    <span class="d-faint d-small d-hide-sm">Opens in Excel or Google Sheets</span>',
      '    <button type="button" class="d-icon-btn" data-csv-close data-fid="csv-close" title="Close" aria-label="Close the CSV preview"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
      '  <div class="d-table-wrap"><table class="d-table tcs-export-table"><thead><tr>' + head.map(function (h, i) { return '<th' + (num[i] ? ' class="tcs-number"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        lines.map(function (l) { return '<tr>' + l.map(function (v, i) { return '<td' + (num[i] ? ' class="tcs-number"' : '') + '>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>',
      '  <details class="tcs-raw"><summary>Show the file as text</summary><pre>' + esc(text) + '</pre></details>',
      '  <p class="tcs-export-note">In Jira the file downloads straight away. The demo shows it here instead.</p>',
      '</section>'
    ].join('\n');
  }

  function membersOf(state) {
    var sprint = sprintById(Number(state.draft.sprint) || ACTIVE);
    return sprint.memberOrder.map(function (id) {
      return sprint.samples.find(function (sample) { return sample.id === id; });
    });
  }

  function form(S, part) {
    var d = S.draft, pro = S.plan === 'pro', off = pro ? '' : ' tcs-disabled', dis = pro ? '' : ' disabled';
    var upLink = '<a href="' + LISTING + '" target="_blank" rel="noopener">Upgrade</a>';
    var sprintOpts = '<option value="">Active sprint (auto)</option>' + SPRINT_LIST.map(function (s) {
      return '<option value="' + s.id + '"' + (String(s.id) === String(d.sprint) ? ' selected' : '') + '>' + esc(s.name) + ' (' + s.state + ')</option>';
    }).join('');

    var board = '<div class="tcs-control"><label for="tcd-board">Board</label>' +
      '<select id="tcd-board" class="tcs-input" data-f="board" data-fid="f-board"><option value="">Select a board…</option><option value="loy"' + (d.board === 'loy' ? ' selected' : '') + '>LOY board (Loyalty)</option></select></div>';
    var sprint = '<div class="tcs-control"><label for="tcd-fsprint">Sprint</label>' +
      '<select id="tcd-fsprint" class="tcs-input" data-f="sprint" data-fid="f-sprint">' + sprintOpts + '</select>' +
      '<div class="tcs-help">Leave on “auto” to always show the board\'s active sprint.</div></div>';
    var mode = '<div class="tcs-control"><label for="tcd-mode">Measure workload by</label>' +
      '<select id="tcd-mode" class="tcs-input" data-f="mode" data-fid="f-mode">' +
      '<option value="points"' + (d.mode === 'points' ? ' selected' : '') + '>Board estimate (story points / time)</option>' +
      '<option value="count"' + (d.mode === 'count' ? ' selected' : '') + '>Issue count</option></select></div>';
    var cap = '<div class="tcs-control"><label for="tcd-cap">Capacity per person</label>' +
      numberField(d.cap, { id: 'tcd-cap', 'data-fid': 'f-cap', 'data-f': 'cap' }) +
      '<div class="tcs-help">Default capacity for everyone, in the unit above (points, hours or issues per sprint).</div></div>';

    var list = '';
    if (pro && S.members) {
      list = '<div class="tcs-members">' + membersOf(S).map(function (m) {
        var v = d.per[m.id];
        return '<div class="tcs-member"><label for="tcd-m-' + m.id + '">' + esc(m.name) + '</label>' +
          '<input id="tcd-m-' + m.id + '" class="tcs-input" type="number" min="0" step="1" inputmode="numeric" placeholder="default" data-per="' + m.id + '" data-fid="per-' + m.id + '" value="' + (v === undefined ? '' : esc(v)) + '"></div>';
      }).join('') + '</div>';
    }
    var per = '<div class="tcs-control' + off + '" role="group" aria-labelledby="tcd-per-l"><div class="tcs-label" id="tcd-per-l">Per-person capacity' + (pro ? '' : PRO) + '</div>' + list +
      '<button type="button" class="tcs-button" data-members data-fid="f-members"' + dis + '>Load team members…</button>' +
      '<div class="tcs-help">' + (pro ? 'Override the default for individuals — e.g. lower it for part-time or vacation.' : upLink + ' to set individual capacities (part-time, vacation).') + '</div></div>';
    var excl = '<div class="tcs-control' + off + '"><label class="tcs-check"><input type="checkbox" data-excl data-fid="f-excl"' + (pro && d.excl ? ' checked' : '') + dis + '> Count only unfinished work' + (pro ? '' : PRO) + '</label>' +
      '<div class="tcs-help">' + (pro ? 'Excludes Done issues so the bar shows remaining load.' : upLink + ' to track remaining load and export CSV.') + '</div></div>';
    function th(key, color, label, aria) {
      var swatch = markup('i', { 'aria-hidden': 'true', class: 'tcs-' + color });
      var input = numberField(d[key], { 'aria-label': aria, 'data-th': key, 'data-fid': 'th-' + key, min: 1, step: 5 });
      if (!pro) input = input.replace('<input ', '<input disabled ');
      return markup('label', { class: 'tcs-boundary' }, swatch + label + ' ' + input + '%');
    }

    var ths = '<div class="tcs-control' + off + '" role="group" aria-labelledby="tcd-th-l"><div class="tcs-label" id="tcd-th-l">Thresholds (% of capacity)' + (pro ? '' : PRO) + '</div><div class="tcs-boundaries">' +
      th('over', 'red', 'Over &gt;', 'Overloaded above, in percent of capacity') + th('near', 'amber', 'Near ≥', 'Near capacity from, in percent of capacity') + th('free', 'blue', 'Free &lt;', 'Has capacity below, in percent of capacity') + '</div></div>';
    var save = '<div class="tcs-submit"><button type="button" class="tcs-save" data-save data-fid="f-save">Save</button></div>';

    if (part === 'remaining') return '<div class="tcs-settings">' + mode + cap + excl + save + '</div>';
    return '<div class="tcs-settings">' + board + sprint + mode + cap + per + excl + ths + save + '</div>';
  }

  var CRUMB = '<span>Dashboards</span><span class="d-sep">/</span><b>Sprint planning — Loyalty &amp; Checkout</b>';

  function renderHeat(S) {
    return [
      context(S, CRUMB),
      '<div class="tcs-canvas">',
      '  <h3 class="d-h1 tcs-dashboard-title">Sprint planning — Loyalty &amp; Checkout</h3>',
      gadgetWithCsv(S, 'h'),
      '</div>'
    ].join('\n');
  }
  function renderCap(S) {
    return [
      context(S, CRUMB + '<span class="d-sep d-hide-sm">/</span><span class="d-hide-sm">Team Capacity: Edit</span>'),
      '<div class="tcs-columns">',
      '  <section class="d-gadget d-app tcs-gadget tcs-edit" aria-label="Team Capacity settings"><span class="d-app-tag">Team Capacity</span>',
      '    <div class="d-gadget-head"><div class="d-gadget-title">Team Capacity <span class="tcs-mode-badge">Edit</span></div></div>',
      '    <div class="d-gadget-body">' + form(S, 'all') + '</div>',
      '  </section>',
      '  <div class="tcs-preview-column">' + gadgetWithCsv(S, 'c') + '</div>',
      '</div>'
    ].join('\n');
  }
  function renderRemaining(S) {
    return [
      context(S, CRUMB + '<span class="d-sep d-hide-sm">/</span><span class="d-hide-sm">Team Capacity: Edit</span>'),
      '<div class="tcs-canvas"><div class="tcs-stack">',
      '  <section class="tcs-settings-excerpt d-app" aria-label="Part of the Team Capacity settings"><span class="d-app-tag">Team Capacity</span>',
      '    <p class="tcs-excerpt-caption">Part of the gadget\'s settings</p>',
      form(S, 'remaining'),
      '  </section>',
      gadgetWithCsv(S, 'r'),
      '</div></div>'
    ].join('\n');
  }

  // ── Mount ──
  var API = null;
  function isFree() { return API && API.state().plan === 'free'; }
  function proStep(text, target, done) {
    return {
      get text() { return isFree() ? 'this step needs <strong>Pro</strong>. Switch the plan to <strong>Pro</strong> at the top right of the demo.' : text; },
      get target() { return isFree() ? '[data-plan="pro"]' : target; },
      done: done
    };
  }

  D.mount(root, {
    id: 'tc',
    title: 'Team Capacity',
    tabs: [
      { id: 'heat', label: 'Capacity heatmap' },
      { id: 'cap', label: 'Per-person capacity' },
      { id: 'rem', label: 'Remaining work' }
    ],
    initialState: initialState,
    render: function (tab, S) {
      if (S.lastTab !== tab) {
        // Opening the settings reloads the gadget: it shows the configured sprint again
        if (S.lastTab && tab !== 'heat') S.view = null;
        if (S.lastTab) S.csv = false;
        S.lastTab = tab;
      }
      if (tab === 'cap') return renderCap(S);
      if (tab === 'rem') return renderRemaining(S);
      return renderHeat(S);
    },
    afterRender: function (tab, S) {
      S.flash = {};
      if (S.scrollCsv) {
        S.scrollCsv = false;
        var box = root.querySelector('[data-csv-box]');
        if (box && box.scrollIntoView) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    },
    steps: {
      heat: [
        { text: 'click <strong>Refresh</strong>. The gadget does not reload on its own; the footer says how old the numbers are.', target: '.tcs-footer [data-refresh]', done: function (S) { return S.flags.refresh; } },
        { text: 'open the sprint menu and pick <strong>Sprint 23 (closed)</strong>, for example for the retro.', target: '[data-view-sprint]', done: function (S) { return S.flags.sprint; } },
        proStep('click <strong>Export CSV</strong> (Pro) for estimate vs. actual per person.', '[data-csv]', function (S) { return S.flags.csv; })
      ],
      cap: [
        proStep('click <strong>Load team members…</strong> (Pro). It lists the people with issues in the selected sprint.', '[data-members]', function (S) { return S.flags.members; }),
        proStep('enter <strong>16</strong> next to Marcus Hale: he moves to four days a week.', '[data-per="c"]', function (S) { return S.flags.per; }),
        proStep('click <strong>Save</strong>. The heatmap on the right uses the new capacity.', '[data-save]', function (S) { return S.flags.perSaved; })
      ],
      rem: [
        proStep('tick <strong>Count only unfinished work</strong> (Pro). Until now, done work still fills the bars.', '[data-excl]', function (S) { return S.flags.excl; }),
        proStep('click <strong>Save</strong>. Each bar now shows the work that is still open.', '[data-save]', function (S) { return S.flags.exclSaved; })
      ]
    },
    doneText: {
      heat: '<strong>That’s the heatmap.</strong> Unassigned work has its own grey row and is not part of the team total. A sprint switch is not saved: after a reload the gadget shows the sprint set in Edit.',
      cap: '<strong>Saved.</strong> A person’s capacity applies to every sprint until you change it. The app does not read leave or holidays, so for time off you enter the lower number yourself.',
      rem: '<strong>Remaining load.</strong> Done issues are left out of every bar and the team total. Also try <strong>Issue count</strong>: every issue counts as 1, and capacity, also per person, is then in issues per sprint.'
    },
    setup: function (api) {
      API = api;
      var S = function () { return api.state(); };

      // Demo plan (Free shows what the gadget does without a license)
      api.on('click', '[data-plan]', function (el) {
        var s = S(), plan = el.dataset.plan;
        if (s.plan === plan) return;
        var before = snapshot(s);
        s.plan = plan;
        s.draft = draftOf(s.saved);
        s.members = false;
        if (plan === 'free') s.csv = false;
        markChanges(s, before);
        api.update();
        api.toast(plan === 'pro' ? 'Showing the Pro plan' : 'Showing the Free plan');
      });

      // Heatmap
      api.on('change', '[data-view-sprint]', function (el) {
        var s = S();
        s.view = +el.value;
        s.readLabel = readStamp(false);
        if (s.view !== (s.saved.sprint ? +s.saved.sprint : ACTIVE)) s.flags.sprint = true;
        api.update();
      });
      api.on('click', '[data-refresh]', function () {
        var s = S();
        s.readLabel = readStamp(false);
        s.flags.refresh = true;
        api.update();
        api.toast('Read again from Jira');
      });
      api.on('click', '[data-csv]', function () {
        var s = S();
        s.csv = true; s.flags.csv = true; s.scrollCsv = true;
        api.update();
      });
      api.on('click', '[data-csv-close]', function () { S().csv = false; api.update(); });
      api.on('click', '[data-edit]', function () {
        if (api.tab() !== 'cap') api.go('cap');
        var b = api.el('#tcd-board'); if (b) b.focus();
      });

      // Settings form (a draft until Save, like the gadget's Edit view)
      api.on('change', '[data-f]', function (el) { S().draft[el.dataset.f] = el.value; api.refreshHint(); });
      api.on('input', '[data-f="cap"]', function (el) { S().draft.cap = el.value; });
      api.on('input', '[data-th]', function (el) { S().draft[el.dataset.th] = el.value; });
      api.on('input', '[data-per]', function (input) {
        var state = S();
        var overrides = Object.assign({}, state.draft.per);
        delete overrides[input.dataset.per];
        if (input.valueAsNumber >= 0) overrides[input.dataset.per] = input.valueAsNumber;
        state.draft.per = overrides;
        state.flags.per = true;
        api.refreshHint();
      });
      api.on('change', '[data-excl]', function (el) {
        var s = S();
        s.draft.excl = el.checked;
        if (el.checked) s.flags.excl = true;
        api.refreshHint();
      });
      api.on('click', '[data-members]', function () {
        var s = S();
        if (!s.draft.board) { var b = api.el('#tcd-board'); if (b) b.focus(); return; }
        s.members = true; s.flags.members = true;
        api.update();
      });
      api.on('click', '[data-save]', function () {
        var s = S(), draft = s.draft;
        if (!draft.board) {
          api.el('#tcd-board').focus();
          return;
        }
        var before = snapshot(s);
        var next = { per: {}, excl: false };
        ['mode', 'sprint'].forEach(function (key) { next[key] = draft[key]; });
        next.cap = +draft.cap || 0;
        Object.entries(LIMITS).forEach(function (entry) {
          var candidate = Number(draft[entry[0]]);
          var useEdit = s.plan === 'pro' && candidate > 0 && Number.isFinite(candidate);
          next[entry[0]] = useEdit ? candidate : entry[1];
        });
        if (s.plan === 'pro') {
          Object.assign(next.per, draft.per);
          next.excl = Boolean(draft.excl);
          var ids = Object.keys(Object.assign({}, s.saved.per, next.per));
          var perChanged = ids.some(function (id) { return next.per[id] !== s.saved.per[id]; });
          if (perChanged && s.flags.per) s.flags.perSaved = true;
          if (next.excl) s.flags.exclSaved = true;
        }
        s.saved = next;
        s.draft = draftOf(next);
        s.view = null;
        s.readLabel = readStamp(false);
        markChanges(s, before);
        api.update();
        api.toast('Saved');
      });
    }
  });
})();
