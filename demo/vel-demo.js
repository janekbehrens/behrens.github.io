/* ============================================================
   vel-demo.js — interactive demo for Velocity Chart for Jira
   Sample data and fixed behavior only; written for the website,
   not taken from the app. Per sprint the sample data holds the
   committed work and the work per current status; the demo adds
   up the ticked statuses and takes the averages described in the
   documentation (mean of the completed bars, mean of the
   per-sprint say/do values).
   ============================================================ */
(function () {
  'use strict';
  var root = document.querySelector('[data-demo="vel"]');
  if (!root || !window.JBDemo) return;
  var D = window.JBDemo, esc = D.esc;

  var INK = {
    planned: '#bec6d2', delivered: '#37ad7c', mean: '#705bbd',
    guides: '#e2e5eb', muted: '#69768c', strong: '#20324e'
  };

  var STATUSES = [['Done', 'done'], ['In Progress', 'indeterminate'], ['In Review', 'indeterminate'], ['Ready for release', 'indeterminate'], ['To Do', 'new']];
  var BOARD_DONE = ['Done']; // the boards' Done column (the only status in Jira's Done category here)
  var BOARDS = [
    { id: 'checkout', name: 'Checkout board', project: 'Checkout' },
    { id: 'mobile', name: 'Mobile App board', project: 'Mobile App' },
    { id: 'payments', name: 'Payments board', project: 'Payments' },
    { id: 'platform', name: 'Platform board', project: 'Platform' },
    { id: 'search', name: 'Search board', project: 'Search', tm: true },
    { id: 'webstore', name: 'Web Store board', project: 'Web Store' }
  ];
  var FIELDS = [['sp', 'Story Points'], ['effort', 'Effort (days)']];

  // Closed sprints per board, oldest first:
  // [name, committed points, committed issues, committed effort, committed sub-tasks,
  //  points per current status, issues per status, effort per status, sub-tasks per status]
  // (status order as in STATUSES). Sample sub-tasks carry no estimates, so they only
  // change the Issue count.
  var SPRINTS = {
    checkout: [
      ['Sprint 41',31,12,28,6,[22,1,2,5,2],[8,1,1,2,1],[20,1,2,4.5,2],[6,0,0,0,0]],
      ['Sprint 42',23,9,20,5,[16,1,2,2,2],[6,1,1,1,1],[14,1,1.5,1.5,2],[5,0,0,0,0]],
      ['Sprint 43',36,14,25.5,7,[36,0,0,3,0],[14,0,0,1,0],[25.5,0,0,2,0],[6,0,0,0,1]],
      ['Sprint 44',29,11,21,4,[23,1,1,3,1],[9,1,1,1,1],[16.5,0.5,0.5,2,1.5],[4,0,0,0,0]],
      ['Sprint 45',26,10,21,7,[21,1,0,3,1],[8,1,0,1,1],[17,1,0,2.5,1],[6,0,0,0,1]],
      ['Sprint 46',30,11,27,8,[27,1,1,3,1],[10,1,1,1,1],[24.5,1,1,2.5,1],[8,0,0,0,0]],
      ['Sprint 47',24,9,22,3,[21,2,2,0,2],[8,1,1,0,1],[19.5,2,2,0,2],[2,0,0,0,1]],
      ['Sprint 48',28,10,22.5,6,[24,2,2,0,1],[9,1,1,0,1],[19.5,1.5,1.5,0,1],[5,0,0,0,1]],
      ['Sprint 49',31,12,28,8,[24,1,1,2,3],[8,1,1,1,1],[21.5,1,1,2,2.5],[7,0,0,0,1]],
      ['Sprint 50',28,11,24.5,7,[28,0,0,0,0],[10,0,0,0,1],[24.5,0,0,0,0],[6,0,0,0,1]],
      ['Sprint 51',35,13,28,5,[32,1,1,3,1],[12,1,1,1,1],[26,1,1,2.5,1],[4,0,0,0,1]],
      ['Sprint 52',25,9,21.5,4,[24,1,1,0,1],[9,1,1,0,1],[20.5,1,1,0,1],[4,0,0,0,0]],
    ],
    mobile: [
      ['App Sprint 3',32,12,29,3,[30,1,1,0,1],[11,1,1,0,1],[27,1,1,0,1],[1,1,0,0,1]],
      ['App Sprint 4',38,14,35.5,3,[37,1,0,3,1],[13,1,0,1,1],[34.5,1,0,3,1],[2,0,0,0,1]],
      ['App Sprint 5',24,9,21,3,[20,1,2,0,3],[7,1,1,0,1],[17.5,1,2,0,2.5],[3,0,0,0,0]],
      ['App Sprint 6',32,12,27,6,[32,1,0,0,1],[12,1,0,0,1],[27,1,0,0,1],[4,1,0,0,1]],
      ['App Sprint 7',26,10,19.5,3,[23,1,1,3,1],[9,1,1,1,1],[17.5,1,1,2.5,1],[3,0,0,0,0]],
      ['App Sprint 8',33,12,26,6,[32,0,0,0,1],[12,0,0,0,1],[25,0,0,0,1],[4,1,0,0,1]],
      ['App Sprint 9',23,9,20,4,[23,0,0,0,0],[9,0,0,0,0],[20,0,0,0,0],[4,0,0,0,0]],
      ['App Sprint 10',24,9,17,6,[16,3,1,2,3],[6,1,1,1,1],[11.5,2,0.5,1.5,2],[5,0,0,0,1]],
      ['App Sprint 11',25,9,21.5,6,[19,1,1,3,1],[7,1,1,1,1],[16.5,1,1,2.5,1],[6,0,0,0,0]],
      ['App Sprint 12',31,11,23.5,3,[31,0,0,0,0],[12,0,0,0,0],[23.5,0,0,0,0],[1,1,0,0,1]],
      ['App Sprint 13',28,11,21,5,[27,1,0,2,1],[10,1,0,1,1],[20.5,1,0,1.5,1],[3,1,0,0,1]],
      ['App Sprint 14',30,11,28,8,[22,3,3,2,3],[8,1,1,1,1],[20.5,3,3,2,3],[8,0,0,0,0]],
    ],
    payments: [
      ['Sprint 12',31,12,22.5,4,[27,2,1,2,2],[10,1,1,1,1],[19.5,1.5,0.5,1.5,1.5],[2,1,0,0,1]],
      ['Sprint 13',33,12,25,6,[30,2,1,0,3],[11,1,1,0,1],[22.5,1.5,1,0,2.5],[6,0,0,0,0]],
      ['Sprint 14',32,12,24.5,6,[29,2,1,0,2],[11,1,1,0,1],[22,1.5,1,0,1.5],[5,0,0,0,1]],
      ['Sprint 15',30,11,24,5,[21,1,0,8,1],[8,1,0,3,1],[17,1,0,6.5,1],[4,0,0,0,1]],
      ['Sprint 16',34,13,25,8,[32,0,1,0,1],[12,0,1,0,1],[23.5,0,0.5,0,1],[8,0,0,0,0]],
      ['Sprint 17',33,13,25,7,[23,1,1,7,1],[8,1,1,2,1],[17.5,1,1,5.5,1],[6,0,0,0,1]],
      ['Sprint 18',31,12,23.5,7,[20,5,1,0,5],[8,2,1,0,2],[15,4,1,0,4],[7,0,0,0,0]],
      ['Sprint 19',29,10,27.5,7,[29,0,0,0,0],[11,0,0,0,0],[27.5,0,0,0,0],[6,0,0,0,1]],
      ['Sprint 20',35,13,27,3,[23,1,1,8,2],[9,1,1,3,1],[17.5,1,1,6,1.5],[1,1,0,0,1]],
      ['Sprint 21',33,13,26.5,4,[31,1,0,0,1],[11,1,0,0,1],[25,1,0,0,1],[3,0,0,0,1]],
      ['Sprint 22',34,13,24,7,[22,3,1,8,2],[8,1,1,3,1],[15.5,2,0.5,5.5,1.5],[5,1,0,0,1]],
      ['Sprint 23',36,13,34,6,[33,2,1,0,1],[12,1,1,0,1],[31,2,1,0,1],[5,0,0,0,1]],
    ],
    platform: [
      ['Sprint 6',20,7,15.5,4,[19,0,1,0,0],[7,0,1,0,0],[15,0,1,0,0],[4,0,0,0,0]],
      ['Sprint 7',22,8,19,4,[21,0,1,1,0],[7,0,1,1,0],[18,0,1,1,0],[3,0,0,0,1]],
      ['Sprint 8',21,7,18,3,[19,1,1,1,1],[7,1,1,1,1],[16.5,1,1,1,1],[2,0,0,0,1]],
      ['Sprint 9',20,7,16,6,[21,1,0,0,1],[8,1,0,0,1],[17,1,0,0,1],[6,0,0,0,0]],
      ['Sprint 10',21,8,15,6,[20,1,2,0,1],[8,1,1,0,1],[14.5,0.5,1.5,0,0.5],[6,0,0,0,0]],
      ['Sprint 11',22,8,19,8,[19,1,0,2,1],[7,1,0,1,1],[16,1,0,1.5,1],[8,0,0,0,0]],
      ['Sprint 12',20,8,15.5,3,[21,0,0,0,0],[8,0,0,0,0],[16.5,0,0,0,0],[1,1,0,0,1]],
      ['Sprint 13',21,8,17,5,[13,4,1,0,3],[5,1,1,0,1],[10.5,3,1,0,2.5],[3,1,0,0,1]],
      ['Sprint 14',21,8,18,7,[20,0,0,1,0],[7,0,0,1,0],[17,0,0,1,0],[7,0,0,0,0]],
      ['Sprint 15',22,8,16,6,[21,1,0,0,2],[7,1,0,0,1],[15,0.5,0,0,1.5],[6,0,0,0,0]],
      ['Sprint 16',20,8,14.5,4,[20,0,0,0,1],[8,0,0,0,1],[14.5,0,0,0,0.5],[3,0,0,0,1]],
      ['Sprint 17',21,8,17.5,7,[19,0,0,2,0],[7,0,0,1,0],[16,0,0,1.5,0],[7,0,0,0,0]],
    ],
    search: [
      ['Sprint 29',15,6,14,4,[12,1,0,1,2],[5,1,0,1,1],[11,1,0,1,2],[4,0,0,0,0]],
      ['Sprint 30',17,6,15,3,[16,0,0,0,1],[6,0,0,0,1],[14,0,0,0,1],[2,0,0,0,1]],
      ['Sprint 31',16,6,13.5,8,[14,1,1,0,1],[6,1,1,0,1],[11.5,1,1,0,1],[6,1,0,0,1]],
      ['Sprint 32',16,6,15,6,[14,0,0,2,0],[5,0,0,1,0],[13,0,0,2,0],[5,0,0,0,1]],
      ['Sprint 33',17,6,14.5,6,[16,1,0,0,1],[6,1,0,0,1],[13.5,1,0,0,1],[4,1,0,0,1]],
      ['Sprint 34',23,9,18,6,[20,0,0,3,0],[7,0,0,1,1],[15.5,0,0,2.5,0],[6,0,0,0,0]],
      ['Sprint 35',22,8,20,6,[15,2,3,0,3],[5,1,1,0,1],[13.5,2,2.5,0,2.5],[5,0,0,0,1]],
      ['Sprint 36',26,10,21,6,[24,1,1,0,1],[9,1,1,0,1],[19.5,1,1,0,1],[5,0,0,0,1]],
      ['Sprint 37',27,10,24,4,[25,1,0,2,1],[9,1,0,1,1],[22,1,0,2,1],[3,0,0,0,1]],
      ['Sprint 38',29,11,21,3,[26,1,0,0,2],[10,1,0,0,1],[18.5,0.5,0,0,2],[2,0,0,0,1]],
      ['Sprint 39',28,10,21,6,[26,0,0,3,1],[10,0,0,1,1],[19.5,0,0,2,0.5],[4,1,0,0,1]],
      ['Sprint 40',30,11,26,5,[29,1,0,0,1],[11,1,0,0,1],[25,1,0,0,1],[5,0,0,0,0]],
    ],
    webstore: [
      ['Web Store Sprint 18 (Spring)',33,12,23.5,3,[25,3,2,2,4],[9,1,1,1,2],[18,2,1.5,1.5,3],[2,0,0,0,1]],
      ['Web Store Sprint 19 (Spring)',25,9,23,4,[24,0,0,2,1],[9,0,0,1,1],[22,0,0,2,1],[3,0,0,0,1]],
      ['Web Store Sprint 20 (Spring)',33,12,26,4,[29,0,0,5,0],[11,0,0,2,0],[23,0,0,4,0],[3,0,0,0,1]],
      ['Web Store Sprint 21 (Spring)',23,9,17.5,6,[23,0,0,0,0],[9,0,0,0,0],[17.5,0,0,0,0],[6,0,0,0,0]],
      ['Web Store Sprint 22 (Spring)',29,11,24,7,[22,3,2,2,2],[8,1,1,1,1],[18.5,2.5,1.5,1.5,1.5],[6,0,0,0,1]],
      ['Web Store Sprint 23 (Spring)',28,10,22.5,3,[24,1,1,0,3],[9,1,1,0,1],[19.5,1,1,0,2.5],[3,0,0,0,0]],
      ['Web Store Sprint 24 (Summer)',36,13,27.5,3,[28,2,2,5,2],[10,1,1,1,1],[21.5,1.5,1.5,4,1.5],[3,0,0,0,0]],
      ['Web Store Sprint 25 (Summer)',31,11,27.5,7,[28,2,1,0,1],[11,1,1,0,1],[25,2,1,0,1],[6,0,0,0,1]],
      ['Web Store Sprint 26 (Summer)',30,11,24.5,7,[21,3,2,0,4],[8,1,1,0,1],[17.5,2.5,1.5,0,3.5],[7,0,0,0,0]],
      ['Web Store Sprint 27 (Summer)',26,10,23.5,6,[21,1,0,2,2],[8,1,0,1,1],[19,1,0,2,2],[6,0,0,0,0]],
      ['Web Store Sprint 28 (Summer)',22,8,16.5,3,[21,0,0,0,1],[8,0,0,0,1],[15.5,0,0,0,1],[3,0,0,0,0]],
      ['Web Store Sprint 29 (Summer)',29,10,20.5,6,[21,3,1,0,4],[8,1,1,0,2],[15,2,0.5,0,3],[6,0,0,0,0]],
    ],
  };

  function boardById(id) { return BOARDS.filter(function (b) { return b.id === id; })[0]; }
  function copyCfg(c) { return { boards: c.boards.slice(), count: c.count, labels: c.labels, est: c.est, field: c.field, done: c.done ? c.done.slice() : null, subtasks: c.subtasks }; }

  function initialState() {
    var cfg = { boards: ['payments'], count: 10, labels: 'full', est: 'points', field: 'sp', done: null, subtasks: false };
    return { cfg: cfg, draft: copyCfg(cfg), editing: false, lastTab: null, exp: { csv: false, svg: false }, refreshing: false, saveMsg: '', flags: {} };
  }

  // Axis captions belong to the fixture, rather than a sprint-name parser.
  var CAPTIONS = {
    checkout: [['Sprint 41','41'],['Sprint 42','42'],['Sprint 43','43'],['Sprint 44','44'],['Sprint 45','45'],['Sprint 46','46'],['Sprint 47','47'],['Sprint 48','48'],['Sprint 49','49'],['Sprint 50','50'],['Sprint 51','51'],['Sprint 52','52']],
    mobile: [['App Sprint 3','3'],['App Sprint 4','4'],['App Sprint 5','5'],['App Sprint 6','6'],['App Sprint 7','7'],['App Sprint 8','8'],['App Sprint 9','9'],['App Sprint 10','10'],['App Sprint 11','11'],['App Sprint 12','12'],['App Sprint 13','13'],['App Sprint 14','14']],
    payments: [['Sprint 12','12'],['Sprint 13','13'],['Sprint 14','14'],['Sprint 15','15'],['Sprint 16','16'],['Sprint 17','17'],['Sprint 18','18'],['Sprint 19','19'],['Sprint 20','20'],['Sprint 21','21'],['Sprint 22','22'],['Sprint 23','23']],
    platform: [['Sprint 6','6'],['Sprint 7','7'],['Sprint 8','8'],['Sprint 9','9'],['Sprint 10','10'],['Sprint 11','11'],['Sprint 12','12'],['Sprint 13','13'],['Sprint 14','14'],['Sprint 15','15'],['Sprint 16','16'],['Sprint 17','17']],
    search: [['Sprint 29','29'],['Sprint 30','30'],['Sprint 31','31'],['Sprint 32','32'],['Sprint 33','33'],['Sprint 34','34'],['Sprint 35','35'],['Sprint 36','36'],['Sprint 37','37'],['Sprint 38','38'],['Sprint 39','39'],['Sprint 40','40']],
    webstore: [['Web Store Sprin…','18'],['Web Store Sprin…','19'],['Web Store Sprin…','20'],['Web Store Sprin…','21'],['Web Store Sprin…','22'],['Web Store Sprin…','23'],['Web Store Sprin…','24'],['Web Store Sprin…','25'],['Web Store Sprin…','26'],['Web Store Sprin…','27'],['Web Store Sprin…','28'],['Web Store Sprin…','29']]
  };

  // Only fixture totals and the documented arithmetic mean are needed here.
  function r1(x) { return Math.round(x * 10) / 10; }
  function fmt(x) { return String(r1(x)); }
  function doneNames(c) { return c.done && c.done.length ? c.done : BOARD_DONE; }
  function series(id, c) {
    var column = 1;
    if (c.est === 'field' && c.field === 'effort') column = 3;
    if (c.est === 'count') column = 2;
    var selected = doneNames(c);
    var rows = [], completedTotal = 0, percentageTotal = 0;
    var fixture = SPRINTS[id];
    var start = Math.max(0, fixture.length - c.count);
    for (var index = start; index < fixture.length; index++) {
      var sample = fixture[index];
      var planned = sample[column], delivered = 0;
      var includeChildren = column === 2 && c.subtasks;
      if (includeChildren) planned += sample[4];
      selected.forEach(function (name) {
        var position = STATUSES.findIndex(function (item) { return item[0] === name; });
        if (position < 0) return;
        delivered += sample[column + 4][position];
        if (includeChildren) delivered += sample[8][position];
      });
      var percentage = Math.round((delivered / planned) * 100);
      rows.push({ name: sample[0], committed: planned, completed: delivered, pct: percentage, captions: CAPTIONS[id][index] });
      completedTotal += delivered;
      percentageTotal += percentage;
    }
    return { rows: rows, avg: r1(completedTotal / rows.length), sayDo: Math.round(percentageTotal / rows.length), unit: column === 2 ? 'issues' : 'pts' };
  }

  function svgElement(tag, properties, content) {
    var attributes = Object.entries(properties).map(function (entry) {
      return entry[0] + '="' + esc(entry[1]) + '"';
    }).join(' ');
    return '<' + tag + ' ' + attributes + '>' + (content || '') + '</' + tag + '>';
  }

  // A local coordinate system per sprint keeps bars, captions and values together.
  function chartSvg(se, opts) {
    var span = opts.w - 58, depth = opts.h - 74;
    var baseline = opts.h - 52;
    var largest = 1;
    se.rows.forEach(function (row) { largest = Math.max(largest, row.committed, row.completed); });
    var ceiling = [5,10,15,20,30,40,50,60,80,100,150,200].find(function (limit) { return limit >= largest * 1.07; }) || largest * 1.2;
    var lift = function (value) { return depth * value / ceiling; };
    var cell = span / se.rows.length;
    var thickness = Math.min(24, (cell - 8) / 3);
    var layers = [];
    for (var tick = 0; tick < 6; tick++) {
      var amount = ceiling * tick / 5, level = baseline - lift(amount);
      layers.push(svgElement('path', { d: 'M42 ' + level + ' h' + span, stroke: INK.guides, fill: 'none' }));
      layers.push(svgElement('text', { x: 31, y: level, 'dominant-baseline': 'middle', 'text-anchor': 'end', fill: INK.muted, 'font-size': 10.5 }, fmt(amount)));
    }
    se.rows.forEach(function (row, index) {
      var center = 42 + cell * (index + 0.5), marks = [];
      [['committed', -thickness - 2, INK.planned], ['completed', 2, INK.delivered]].forEach(function (bar) {
        var value = row[bar[0]], height = lift(value);
        var box = { x: bar[1], y: -height, height: height, width: thickness, rx: 1.8, fill: bar[2], class: 'vcd-column' };
        if (!opts.plain) box['data-tip'] = row.name + ' — ' + bar[0] + ' ' + fmt(value);
        marks.push(svgElement('rect', box));
        if (value > 0 && (bar[0] === 'completed' || value !== row.completed)) {
          marks.push(svgElement('text', { x: bar[1] + thickness / 2, y: -height - 6, fill: opts.plain ? INK.strong : INK.muted, 'text-anchor': 'middle', 'font-size': bar[0] === 'completed' ? 10.5 : 9.5, 'font-weight': bar[0] === 'completed' ? 600 : 400 }, fmt(value)));
        }
      });
      var caption = { transform: 'translate(7 16) rotate(-28)', 'text-anchor': 'end', fill: INK.muted, 'font-size': 10.5 };
      if (!opts.plain) caption['data-tip'] = row.name;
      marks.push(svgElement('text', caption, esc(row.captions[opts.labels === 'numbers' ? 1 : 0])));
      layers.push(svgElement('g', { transform: 'translate(' + center + ' ' + baseline + ')' }, marks.join('')));
    });
    if (se.avg) {
      var meanLevel = baseline - lift(se.avg);
      layers.push(svgElement('path', { stroke: INK.mean, fill: 'none', d: 'M42 ' + meanLevel + ' h' + span, 'stroke-dasharray': '6 3', 'stroke-width': 1.7 }));
    }
    var frame = { viewBox: '0 0 ' + opts.w + ' ' + opts.h, width: '100%', role: 'img' };
    if (opts.plain) {
      frame.xmlns = 'http://www.w3.org/2000/svg';
      frame.style = 'background: white';
      frame['aria-label'] = 'Exported chart';
    } else {
      frame.height = opts.h;
      frame.tabindex = 0;
      frame['aria-label'] = 'Sprint velocity chart for ' + opts.board + '. Use the arrow keys to read each sprint.';
    }
    return svgElement('svg', frame, layers.join(''));
  }

  // ── Gadget view ──
  function legend() {
    return '<div class="vcd-key"><span><i class="vcd-chip" style="background:' + INK.planned + '"></i>Committed</span>' +
      '<span><i class="vcd-chip" style="background:' + INK.delivered + '"></i>Completed</span>' +
      '<span><i class="vcd-chip is-line" style="background:' + INK.mean + '"></i>Avg velocity</span></div>';
  }
  function boardSection(id, c, multi) {
    var b = boardById(id), se = series(id, c);
    return '<div class="vcd-panel"><div class="vcd-metrics"><span class="vcd-heading">' + esc(b.name) + '</span>' +
      '<span class="vcd-metric">Avg velocity <b>' + fmt(se.avg) + '</b> <span class="vcd-muted">' + se.unit + '</span></span>' +
      (se.sayDo !== null ? '<span class="vcd-metric">Say/Do <b>' + se.sayDo + '%</b></span>' : '') + '</div>' +
      '<div class="vcd-plot" data-chart="' + id + '" data-h="' + (multi ? 190 : 240) + '"></div>' +
      (multi ? '' : '<div class="vcd-caption">' + se.rows.length + ' closed sprint' + (se.rows.length === 1 ? '' : 's') + ' · committed = scope at sprint start</div>') +
      '</div>';
  }
  function pencil(open) {
    return '<button type="button" class="d-icon-btn" data-edit-toggle aria-expanded="' + (open ? 'true' : 'false') + '" title="Edit this gadget" aria-label="Edit this gadget">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>';
  }
  function gadget(S, opts) {
    var c = S.cfg, multi = c.boards.length > 1, body;
    if (opts.edit && S.editing) {
      body = form(S, ['head', 'boards', 'count', 'labels', 'est', 'done', 'subtasks']);
    } else {
      body = legend() + c.boards.map(function (id) { return boardSection(id, c, multi); }).join('') +
        '<div class="vcd-toolbar"><div>' +
        '<button type="button" class="vcd-button" data-export="csv" data-fid="exp-csv">Export CSV</button>' +
        '<button type="button" class="vcd-button" data-export="svg" data-fid="exp-svg">Download SVG</button></div>' +
        '<button type="button" class="vcd-button" data-refresh data-fid="refresh"' + (S.refreshing ? ' disabled' : '') + '>' + (S.refreshing ? 'Refreshing…' : 'Refresh') + '</button></div>';
    }
    return '<div class="d-app vcd-gadget-wrap"><span class="d-app-tag">Velocity Chart</span><section class="d-gadget vcd-gadget vcd-theme">' +
      '<div class="d-gadget-head"><div class="d-gadget-title">Velocity Chart</div>' + (opts.edit ? pencil(S.editing) : '') + '</div>' +
      '<div class="d-gadget-body">' + body + '</div></section></div>';
  }

  // ── Export (what the files contain) ──
  function csvText(c) {
    var lines = ['Board,Sprint,Committed,Completed,Say/Do %'];
    var cell = function (v) { var s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    c.boards.forEach(function (id) {
      series(id, c).rows.forEach(function (s) {
        lines.push([boardById(id).name, s.name, fmt(s.committed), fmt(s.completed), s.pct === null ? '' : s.pct].map(cell).join(','));
      });
    });
    return lines.join('\n');
  }
  function fileName(name) { return 'velocity-' + name.replace(/[^A-Za-z0-9_-]+/g, '_') + '.svg'; }
  function exportPanels(S) {
    var c = S.cfg, out = [];
    var close = function (k) { return '<button type="button" class="d-icon-btn" data-export-close="' + k + '" title="Close" aria-label="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'; };
    if (S.exp.csv) {
      out.push('<div class="d-pop vcd-export-card"><div class="vcd-export-title"><span class="vcd-file-icon" aria-hidden="true">csv</span><label for="vel-csv">velocity.csv</label>' + close('csv') + '</div>' +
        '<textarea id="vel-csv" class="vcd-csv" readonly rows="8" data-fid="csv-text">' + esc(csvText(c)) + '</textarea>' +
        '<p class="vcd-export-note">One file for all boards of the gadget, UTF-8, opens in Excel and Google Sheets. In your Jira the browser downloads it.</p></div>');
    }
    if (S.exp.svg) {
      var exportHeight = c.boards.length === 1 ? 240 : 190;
      out.push('<div class="d-pop vcd-export-card"><div class="vcd-export-title"><span>One SVG per chart, with a white background</span>' + close('svg') + '</div><div class="vcd-pictures">' +
        c.boards.map(function (id) {
          var b = boardById(id);
          return '<figure><div class="vcd-picture">' + chartSvg(series(id, c), { w: 480, h: exportHeight, labels: c.labels, plain: true }) + '</div><figcaption>' + esc(fileName(b.name)) + '</figcaption></figure>';
        }).join('') + '</div><p class="vcd-export-note">In your Jira the browser downloads these files.</p></div>');
    }
    return out.length ? '<div class="vcd-exports">' + out.join('') + '</div>' : '';
  }

  // ── Edit form (the gadget's settings) ──
  function form(S, parts) {
    var d = S.draft, h = [];
    if (parts.indexOf('head') !== -1) h.push('<div class="vcd-settings-title"><span class="vcd-heading">Configure Velocity Chart</span><a href="velocity-chart-docs.html#config" target="_blank" rel="noopener">Documentation &amp; help ↗</a></div>');
    if (parts.indexOf('boards') !== -1) {
      h.push('<fieldset class="vcd-control"><legend>Boards</legend><div class="vcd-help vcd-intro">Pick up to 4 boards to compare in one gadget.</div>' +
        '<div class="vcd-choices vcd-board-picker" data-n="' + d.boards.length + '">' + BOARDS.map(function (b) {
          return '<label class="vcd-choice"><input type="checkbox" data-board="' + b.id + '" data-fid="b-' + b.id + '"' + (d.boards.indexOf(b.id) !== -1 ? ' checked' : '') + '> <span>' + esc(b.name) + '</span><small>— ' + esc(b.project) + (b.tm ? ' · team-managed' : '') + '</small></label>';
        }).join('') + '</div></fieldset>');
    }
    if (parts.indexOf('count') !== -1) {
      h.push('<div class="vcd-control"><label for="vel-count">Sprints to show</label><input class="vcd-input" type="number" id="vel-count" min="1" max="20" value="' + esc(d.count) + '" data-count data-fid="count"><div class="vcd-help">Last N closed sprints (max 20).</div></div>');
    }
    if (parts.indexOf('labels') !== -1) {
      h.push('<div class="vcd-control"><label for="vel-labels">Sprint labels</label><select class="vcd-select" id="vel-labels" data-labels data-fid="labels">' +
        [['full', 'Full name'], ['numbers', 'Numbers only']].map(function (o) { return '<option value="' + o[0] + '"' + (d.labels === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
        '</select><div class="vcd-help">Long names are shortened on the axis; hover a label for the full name.</div></div>');
    }
    if (parts.indexOf('est') !== -1) {
      h.push('<div class="vcd-control"><label for="vel-est">Estimation</label><select class="vcd-select" id="vel-est" data-est data-v="' + d.est + '" data-fid="est">' +
        [['points', 'Story Points (board default)'], ['count', 'Issue count'], ['field', 'Custom numeric field']].map(function (o) { return '<option value="' + o[0] + '"' + (d.est === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
        (d.est === 'field' ? '<select class="vcd-select" id="vel-field" data-field data-fid="field" aria-label="Custom numeric field" style="margin-top:6px">' +
          FIELDS.map(function (f) { return '<option value="' + f[0] + '"' + (d.field === f[0] ? ' selected' : '') + '>' + f[1] + '</option>'; }).join('') + '</select>' : '') + '</div>');
    }
    if (parts.indexOf('done') !== -1) {
      var names = doneNames(d);
      h.push('<fieldset class="vcd-control"><legend>Count as “Done”</legend><div class="vcd-help vcd-intro">Choose exactly which statuses count as completed. Defaults to your board\'s Done column.</div>' +
        '<div class="vcd-choices">' + STATUSES.map(function (st, i) {
          return '<label class="vcd-choice"><input type="checkbox" data-done="' + esc(st[0]) + '" data-fid="d-' + i + '"' + (names.indexOf(st[0]) !== -1 ? ' checked' : '') + '> ' + esc(st[0]) + ' <small>(' + st[1] + ')</small></label>';
        }).join('') + '</div></fieldset>');
    }
    if (parts.indexOf('subtasks') !== -1) {
      h.push('<div class="vcd-control"><label class="vcd-choice vcd-strong-choice"><input type="checkbox" data-subtasks data-fid="subtasks"' + (d.subtasks ? ' checked' : '') + '> Include sub-tasks</label></div>');
    }
    h.push('<div class="vcd-submit"><button type="button" class="vcd-button is-primary" data-save data-fid="save">Save</button><span class="vcd-help" data-save-msg>' + esc(S.saveMsg || 'Board estimates with: Story Points') + '</span></div>');
    return '<div class="vcd-settings">' + h.join('') + '</div>';
  }

  // ── Tabs ──
  function context() {
    return '<div class="d-context"><span>Dashboards</span><span class="d-sep">/</span><b>Release planning</b>' +
      '<span class="d-ctx-note">Pro features on, as in the trial</span></div>';
  }
  function renderGadgetTab(S) {
    return context() + '<div class="vcd-dashboard">' + gadget(S, { edit: true }) + (S.editing ? '' : exportPanels(S)) + '</div>';
  }
  function renderSplit(S, parts) {
    return context() + '<div class="vcd-workspace">' +
      '<section class="d-app vcd-theme vcd-settings-card"><span class="d-app-tag">Velocity Chart</span>' + form(S, parts) + '</section>' +
      '<div class="vcd-preview">' + gadget(S, { edit: false }) + exportPanels(S) + '</div></div>';
  }

  // ── Tooltips on the bars ──
  function tipFor(chart) {
    var t = chart.querySelector('.vcd-tooltip');
    if (!t) { t = document.createElement('div'); t.className = 'vcd-tooltip'; t.setAttribute('role', 'status'); chart.appendChild(t); }
    return t;
  }
  function showTip(chart, target, text) {
    var t = tipFor(chart), cr = chart.getBoundingClientRect(), r = target.getBoundingClientRect();
    t.textContent = text;
    t.style.left = Math.min(Math.max(r.left + r.width / 2 - cr.left, 60), cr.width - 60) + 'px';
    t.style.top = (r.top - cr.top) + 'px';
    t.classList.add('is-on');
  }
  function hideTips() { root.querySelectorAll('.vcd-tooltip.is-on').forEach(function (t) { t.classList.remove('is-on'); }); }

  function drawCharts(S) {
    root.querySelectorAll('.vcd-plot[data-chart]').forEach(function (el) {
      var w = Math.max(280, Math.floor(el.clientWidth || 480));
      el.innerHTML = chartSvg(series(el.dataset.chart, S.cfg), { w: w, h: +el.dataset.h, labels: S.cfg.labels, board: boardById(el.dataset.chart).name });
    });
  }

  var api = D.mount(root, {
    id: 'vel',
    title: 'Velocity Chart',
    tabs: [
      { id: 'chart', label: 'Velocity chart' },
      { id: 'done', label: 'Definition of Done' },
      { id: 'compare', label: 'Compare & export' }
    ],
    initialState: initialState,
    render: function (tab, S) {
      if (S.lastTab !== tab) { S.lastTab = tab; S.draft = copyCfg(S.cfg); S.editing = false; S.exp = { csv: false, svg: false }; S.saveMsg = ''; }
      if (tab === 'done') return renderSplit(S, ['head', 'est', 'done', 'subtasks']);
      if (tab === 'compare') return renderSplit(S, ['head', 'boards']);
      return renderGadgetTab(S);
    },
    afterRender: function (tab, S) { drawCharts(S); },
    steps: {
      chart: [
        { text: 'point at a bar, or tap it, to see its value.', target: '.vcd-plot', done: function (S) { return !!S.flags.tip; } },
        { text: 'click the <strong>pencil</strong> and change <strong>Sprints to show</strong>, for example to 5.', target: '[data-edit-toggle][aria-expanded="false"], #vel-count',
          done: function (S) { return S.cfg.count !== 10 || (S.editing && String(S.draft.count) !== '10'); } },
        { text: 'click <strong>Save</strong>. The bars, Avg velocity and Say/Do follow.', target: '[data-save], [data-edit-toggle][aria-expanded="false"]', done: function (S) { return S.cfg.count !== 10; } }
      ],
      done: [
        { text: 'tick <strong>Ready for release</strong> under Count as “Done”, then click <strong>Save</strong>.', target: '[data-done="Ready for release"]:not(:checked), [data-save]',
          done: function (S) { return doneNames(S.cfg).indexOf('Ready for release') !== -1; } },
        { text: 'switch <strong>Estimation</strong> to <strong>Issue count</strong> and click <strong>Save</strong>.', target: '#vel-est[data-v="points"], [data-save]',
          done: function (S) { return S.cfg.est !== 'points'; } }
      ],
      compare: [
        { text: 'tick one or two more boards, for example <strong>Search board</strong>, and click <strong>Save</strong>.', target: '.vcd-board-picker[data-n="1"], [data-save]',
          done: function (S) { return S.cfg.boards.length > 1; } },
        { text: 'click <strong>Export CSV</strong>.', target: '[data-export="csv"]', done: function (S) { return !!S.flags.csv; } },
        { text: 'click <strong>Download SVG</strong>.', target: '[data-export="svg"]', done: function (S) { return !!S.flags.svg; } }
      ]
    },
    doneText: {
      chart: '<strong>That’s the gadget.</strong> Avg velocity is the mean of the green bars, Say/Do the average of completed ÷ committed per sprint.',
      done: '<strong>Same sprints, your definition.</strong> Completed counts the statuses you tick. In your Jira these are Pro settings.',
      compare: '<strong>Several teams, one yardstick.</strong> All boards share the estimation and Definition of Done. Compare and export are Pro.'
    },
    setup: function (a) {
      var S = function () { return a.state(); };
      var narrow = function () { return window.matchMedia && window.matchMedia('(max-width: 900px)').matches; };

      // Edit mode on the gadget (tab 1)
      a.on('click', '[data-edit-toggle]', function () {
        var s = S(); s.editing = !s.editing; s.draft = copyCfg(s.cfg); s.saveMsg = ''; s.exp = { csv: false, svg: false };
        a.update();
        var first = a.el(s.editing ? '#vel-count' : '[data-edit-toggle]'); if (first) { first.focus({ preventScroll: true }); if (s.editing && first.select) first.select(); }
      });

      // Form fields
      a.on('input', '[data-count]', function (el) { S().draft.count = el.value; a.refreshHint(); });
      a.on('change', '[data-labels]', function (el) { S().draft.labels = el.value; });
      a.on('change', '[data-est]', function (el) { S().draft.est = el.value; a.update(); });
      a.on('change', '[data-field]', function (el) { S().draft.field = el.value; });
      a.on('change', '[data-subtasks]', function (el) { S().draft.subtasks = el.checked; });
      a.on('change', '[data-done]', function () {
        var list = Array.prototype.slice.call(root.querySelectorAll('[data-done]:checked')).map(function (i) { return i.dataset.done; });
        S().draft.done = list;
        a.refreshHint();
      });
      a.on('change', '[data-board]', function (el) {
        var box = el.closest('.vcd-choices');
        var picked = new Set(S().draft.boards);
        if (el.checked) picked.add(el.dataset.board);
        else picked.delete(el.dataset.board);
        if (picked.size === 5) {
          var displaced = BOARDS.find(function (board) { return board.id !== el.dataset.board && picked.has(board.id); });
          picked.delete(displaced.id);
          box.querySelector('[data-board="' + displaced.id + '"]').checked = false;
          a.toast('Up to 4 boards per gadget');
        }
        S().draft.boards = BOARDS.filter(function (board) { return picked.has(board.id); }).map(function (board) { return board.id; });
        box.dataset.n = picked.size;
        a.refreshHint();
      });

      a.on('click', '[data-save]', function () {
        var s = S(), d = s.draft;
        if (!d.boards.length) {
          s.saveMsg = 'Pick at least one board.';
          var m = a.el('[data-save-msg]'); if (m) m.textContent = s.saveMsg;
          return;
        }
        var requested = Number.parseInt(d.count, 10);
        var same = function (x, y) { return x.slice().sort().join('|') === y.slice().sort().join('|'); };
        var cfg = copyCfg(d), subOn = d.subtasks && !s.cfg.subtasks;
        cfg.count = 7;
        if (!Number.isNaN(requested)) {
          cfg.count = requested;
          if (requested < 1) cfg.count = 1;
          if (requested > 20) cfg.count = 20;
        }
        if (!cfg.done || !cfg.done.length || same(cfg.done, BOARD_DONE)) cfg.done = null;
        cfg.boards = BOARDS.map(function (b) { return b.id; }).filter(function (id) { return d.boards.indexOf(id) !== -1; });
        s.cfg = cfg; s.draft = copyCfg(cfg); s.saveMsg = ''; s.exp = { csv: false, svg: false };
        var wasEditing = s.editing;
        s.editing = false;
        a.update();
        if (subOn && cfg.est !== 'count') a.toast('Sample sub-tasks have no estimates');
        else if (!wasEditing) a.toast('Saved');
        var g = a.el('.vcd-gadget');
        if (g && (wasEditing || narrow())) g.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });

      // Gadget buttons
      a.on('click', '[data-refresh]', function () {
        var s = S(); if (s.refreshing) return;
        s.refreshing = true; a.update();
        setTimeout(function () { s.refreshing = false; a.update(); a.toast('Recalculated just now'); }, 700);
      });
      a.on('click', '[data-export]', function (el) {
        var s = S(), k = el.dataset.export;
        s.exp[k] = true; s.flags[k] = true;
        a.update();
        var f = a.el(k === 'csv' ? '#vel-csv' : '.vcd-pictures');
        if (f) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      a.on('click', '[data-export-close]', function (el) { S().exp[el.dataset.exportClose] = false; a.update(); });

      // Tap on a bar (touch) shows its value
      a.on('click', '[data-tip]', function (el) {
        var chart = el.closest('.vcd-plot'); if (!chart) return;
        showTip(chart, el, el.getAttribute('data-tip'));
        if (!S().flags.tip) { S().flags.tip = true; a.refreshHint(); }
      });
    }
  });
  if (!api) return;

  // Hover and keyboard for the bar values (outside the click/input/change dispatch)
  root.addEventListener('mouseover', function (e) {
    var el = e.target.closest && e.target.closest('.vcd-plot [data-tip]');
    if (!el) return;
    showTip(el.closest('.vcd-plot'), el, el.getAttribute('data-tip'));
    var s = api.state(); if (!s.flags.tip) { s.flags.tip = true; api.refreshHint(); }
  });
  root.addEventListener('mouseout', function (e) {
    var el = e.target.closest && e.target.closest('.vcd-plot [data-tip]');
    if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) hideTips();
  });
  function keyTip(svg, idx) {
    var bars = svg.querySelectorAll('rect[data-tip]'), n = bars.length / 2;
    idx = Math.max(0, Math.min(n - 1, idx));
    svg.dataset.idx = String(idx);
    var a = bars[idx * 2], b = bars[idx * 2 + 1];
    var chart = svg.closest('.vcd-plot'), top = a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b;
    showTip(chart, top, a.getAttribute('data-tip') + '\n' + b.getAttribute('data-tip'));
  }
  root.addEventListener('focusin', function (e) {
    var svg = e.target.closest && e.target.closest('.vcd-plot svg');
    if (!svg) return;
    keyTip(svg, svg.dataset.idx ? +svg.dataset.idx : svg.querySelectorAll('rect[data-tip]').length / 2 - 1);
    var s = api.state(); if (!s.flags.tip) { s.flags.tip = true; api.refreshHint(); }
  });
  root.addEventListener('focusout', function (e) { if (e.target.closest && e.target.closest('.vcd-plot svg')) hideTips(); });
  root.addEventListener('keydown', function (e) {
    var svg = e.target.closest && e.target.closest('.vcd-plot svg');
    if (!svg) return;
    var i = +(svg.dataset.idx || 0), n = svg.querySelectorAll('rect[data-tip]').length / 2;
    if (e.key === 'ArrowRight') i++; else if (e.key === 'ArrowLeft') i--; else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = n - 1; else return;
    e.preventDefault();
    keyTip(svg, i);
  });

  // Redraw the charts at the new width
  var rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { hideTips(); drawCharts(api.state()); }, 150);
  });
})();
