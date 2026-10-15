/* ============================================================
   dora-demo.js: website demo of "DevOps Metrics for Jira"
   Built for the website from scratch. Every number below is
   invented sample data (project "Storefront"); the clicks lead
   to fixed states. The one rule worked out live is the 4-week
   median line of the trend chart, as described in the docs.
   ============================================================ */
(function () {
  'use strict';
  var host = document.querySelector('[data-demo="dora"]');
  if (!host || !window.JBDemo) return;
  var J = window.JBDemo;
  var esc = J.esc;

  /* ---------- markup helper: h('div.a.b', {attr: v}, child, child…) ---------- */
  var EMPTY_TAGS = { input: 1, br: 1 };
  function h(spec, attrs) {
    var parts = spec.split('.');
    var tag = parts.shift();
    var html = '<' + tag;
    var cn = parts.join(' ');
    if (attrs && attrs['class']) cn = (cn ? cn + ' ' : '') + attrs['class'];
    if (cn) html += ' class="' + cn + '"';
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (k === 'class' || v === false || v === null || v === undefined) return;
        html += v === true ? ' ' + k : ' ' + k + '="' + esc(String(v)) + '"';
      });
    }
    html += '>';
    if (EMPTY_TAGS[tag]) return html;
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      html += Array.isArray(c) ? c.join('') : c;
    }
    return html + '</' + tag + '>';
  }

  /* ---------- sample data: 54 weeks, 2025-W40 … 2026-W41 ---------- */
  var WEEK_KEYS = [];
  for (var wn = 40; wn < 94; wn++) {
    var isNext = wn > 52;
    WEEK_KEYS.push((isNext ? '2026' : '2025') + '-W' + ('0' + (isNext ? wn - 52 : wn)).slice(-2));
  }
  var DAY = 864e5;
  var FIRST_MONDAY = Date.UTC(2025, 8, 29); // Monday of 2025-W40
  var SHIPPED = [1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,1,3,1,1,2,2,1,2,1,2,2,2,1,2,2,1,1,2,2,1,2,2,1,2,2,1,2,2,2,1,2,2,1,2,2,1,0];
  var BROKE = [0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0];
  var LEAD_H = [122.6,101.3,101.7,84.3,101.5,98.4,95.1,90.0,128.8,82.1,108.7,94.2,96.6,89.7,78.0,100.8,112.1,108.1,62.6,88.9,74.7,96.8,88.5,87.7,97.9,92.0,90.8,76.4,73.3,64.1,73.0,75.0,75.0,80.2,84.1,75.1,72.5,71.7,72.6,66.9,86.2,71.3,92.6,64.0,72.8,67.7,77.2,62.5,72.9,73.4,70.6,66.0,84.5,61.8];
  var FIX_H = [13.4,null,11.0,8.5,14.9,null,7.0,11.7,13.8,13.3,null,13.4,11.6,12.8,null,9.8,13.5,12.9,12.4,null,10.5,7.6,12.6,null,8.0,10.1,7.9,14.1,null,11.6,12.7,9.0,null,12.2,7.0,10.4,8.3,null,10.5,10.9,9.7,null,9.6,8.9,12.6,10.8,null,8.9,11.9,10.0,null,12.3,10.6,null];
  var INCIDENTS = [1,0,2,1,1,0,1,2,1,1,0,2,1,1,0,1,2,1,1,0,2,1,1,0,1,2,1,1,0,2,1,1,0,1,2,1,1,0,2,1,1,0,1,2,1,1,0,2,1,1,0,1,1,0];
  var CLOSED = [10,11,10,9,10,10,11,11,9,10,8,8,9,11,13,9,8,11,9,9,11,13,10,11,10,12,10,8,11,11,12,9,10,11,9,11,12,12,9,11,11,13,12,11,10,12,9,10,12,10,9,11,14,2];

  // Precomputed per period: tiles, monthly values and the AI split.
  var RANGES = [
    { id: "30", label: "Last 30 days", lo: 48, hi: 53, foot: "Based on 58 completed issues · 8 releases",
      tiles: {"df":{"v":"1.6/wk","b":"high","s":"Your team ships about 1.6 times per week. That's in the High performer range.","n":8,"d":"−9%","up":false,"good":false},"lt":{"v":"3 d","b":"high","s":"Half of all issues go from \"in progress\" to \"done\" within 3 d. That's in the High performer range.","n":58,"d":"+2%","up":true,"good":false},"fr":{"v":"13%","b":"elite","s":"13% of releases caused problems — about 1 in 8 releases needed a fix. That's in the Elite performer range.","n":8,"d":"−12%","up":false,"good":true},"tr":{"v":"11.3 h","b":"high","s":"When something breaks, it's typically fixed within 11.3 h. That's in the High performer range. Based on only 4 incidents — treat as directional.","n":4,"d":"+4%","up":true,"good":false}},
      months: {"k":["26-09","26-10"],"df":[1.75,0.5],"ndf":[7,1],"lt":[71.75,73.15],"nlt":[42,16],"fr":[0.143,0.0],"nfr":[7,1],"tr":[11.9,10.6],"ntr":[3,1]},
      split: {"share":"53%","ai":31,"done":58,"aiCount":31,"otherCount":27,"aiLead":"2.6 d","otherLead":"3.4 d","ratio":0.76} },
    { id: "90", label: "Last 90 days", lo: 40, hi: 53, foot: "Based on 146 completed issues · 22 releases",
      tiles: {"df":{"v":"1.7/wk","b":"high","s":"Your team ships about 1.7 times per week. That's in the High performer range.","n":22,"d":"+5%","up":true,"good":true},"lt":{"v":"3 d","b":"high","s":"Half of all issues go from \"in progress\" to \"done\" within 3 d. That's in the High performer range.","n":146,"d":"−2%","up":false,"good":true},"fr":{"v":"9%","b":"elite","s":"9% of releases caused problems — about 1 in 11 releases needed a fix. That's in the Elite performer range.","n":22,"d":"−36%","up":false,"good":true},"tr":{"v":"10.3 h","b":"high","s":"When something breaks, it's typically fixed within 10.3 h. That's in the High performer range.","n":12,"d":"−4%","up":false,"good":true}},
      months: {"k":["26-07","26-08","26-09","26-10"],"df":[1.75,1.75,1.75,0.5],"ndf":[7,7,7,1],"lt":[78.75,70.25,71.75,73.15],"nlt":[47,41,42,16],"fr":[0.0,0.143,0.143,0.0],"nfr":[7,7,7,1],"tr":[9.6,10.8,11.9,10.6],"ntr":[4,4,3,1]},
      split: {"share":"53%","ai":77,"done":146,"aiCount":77,"otherCount":69,"aiLead":"2.7 d","otherLead":"3.3 d","ratio":0.82} },
    { id: "180", label: "Last 6 months", lo: 27, hi: 53, foot: "Based on 282 completed issues · 43 releases",
      tiles: {"df":{"v":"1.7/wk","b":"high","s":"Your team ships about 1.7 times per week. That's in the High performer range.","n":43,"d":"+19%","up":true,"good":true},"lt":{"v":"3 d","b":"high","s":"Half of all issues go from \"in progress\" to \"done\" within 3 d. That's in the High performer range.","n":282,"d":"−23%","up":false,"good":true},"fr":{"v":"12%","b":"elite","s":"12% of releases caused problems — about 1 in 9 releases needed a fix. That's in the Elite performer range.","n":43,"d":"−16%","up":false,"good":true},"tr":{"v":"10.6 h","b":"high","s":"When something breaks, it's typically fixed within 10.6 h. That's in the High performer range.","n":25,"d":"−9%","up":false,"good":true}},
      months: {"k":["26-04","26-05","26-06","26-07","26-08","26-09","26-10"],"df":[1.75,1.5,1.75,1.6,1.75,1.75,0.5],"ndf":[7,6,7,8,7,7,1],"lt":[73.15,77.6,72.55,71.3,70.25,71.75,73.15],"nlt":[42,39,44,58,41,42,16],"fr":[0.143,0.167,0.0,0.125,0.143,0.143,0.0],"nfr":[7,6,7,8,7,7,1],"tr":[12.7,9.0,10.4,9.65,10.8,11.9,10.6],"ntr":[4,4,4,5,4,3,1]},
      split: {"share":"53%","ai":149,"done":282,"aiCount":149,"otherCount":133,"aiLead":"2.8 d","otherLead":"3.4 d","ratio":0.82} },
    { id: "365", label: "Last 12 months", lo: 0, hi: 53, foot: "Based on 555 completed issues · 80 releases · 7 excluded",
      tiles: {"df":{"v":"1.5/wk","b":"high","s":"Your team ships about 1.5 times per week. That's in the High performer range.","n":80,"nh":true},"lt":{"v":"3.5 d","b":"high","s":"Half of all issues go from \"in progress\" to \"done\" within 3.5 d. That's in the High performer range.","n":548,"nh":true},"fr":{"v":"13%","b":"elite","s":"13% of releases caused problems — about 1 in 8 releases needed a fix. That's in the Elite performer range.","n":80,"nh":true},"tr":{"v":"10.9 h","b":"high","s":"When something breaks, it's typically fixed within 10.9 h. That's in the High performer range.","n":52,"nh":true}},
      months: {"k":["25-10","25-11","25-12","26-01","26-02","26-03","26-04","26-05","26-06","26-07","26-08","26-09","26-10"],"df":[1.2,1.25,1.25,1.2,1.75,1.5,1.8,1.5,1.75,1.6,1.75,1.75,0.5],"ndf":[6,5,5,6,7,6,9,6,7,8,7,7,1],"lt":[101.5,96.75,95.4,100.8,81.8,90.25,73.3,77.6,72.55,71.3,70.25,71.75,73.15],"nlt":[50,41,35,52,42,43,52,39,44,58,41,42,16],"fr":[0.167,0.2,0.0,0.167,0.143,0.167,0.111,0.167,0.0,0.125,0.143,0.143,0.0],"nfr":[6,5,5,6,7,6,9,6,7,8,7,7,1],"tr":[12.2,11.7,13.3,12.85,10.5,10.1,12.15,9.0,10.4,9.65,10.8,11.9,10.6],"ntr":[5,4,4,5,4,4,5,4,4,5,4,3,1]},
      split: {"share":"32%","ai":177,"done":555,"aiCount":177,"otherCount":371,"aiLead":"2.9 d","otherLead":"3.9 d","ratio":0.74} }
  ];
  var ROLLOUT = { days: 182, label: '6 Apr 2026',
    cards: {"df":{"d":"+19%","before":"1.4/wk","after":"1.7/wk"},"lt":{"d":"−23%","before":"3.9 d","after":"3 d"},"fr":{"d":"−16%","before":"14%","after":"12%"},"tr":{"d":"−9%","before":"11.6 h","after":"10.6 h"}} };
  var EVENTS = [
    { t: Date.UTC(2026, 1, 2, 12), label: 'New CI pipeline' },
    { t: Date.UTC(2026, 3, 6, 12), label: 'AI rollout' }
  ];
  var TODAY = '2026-10-05';

  /* ---------- metric texts (as in the app) and benchmark cuts ---------- */
  var KEYS = ['df', 'lt', 'fr', 'tr'];
  // cuts: [band, upper edge] from zero upwards (public DORA™ clusters)
  var METRIC = {
    df: { name: 'Deployment frequency', short: 'Deploy freq', unit: 'deployments', kind: 'rate',
      cuts: [['low', 0.25], ['medium', 1], ['high', 7], ['elite', Infinity]],
      what: 'How often your team ships something to users. Frequent, small releases mean faster feedback and lower risk per change.',
      how: 'We count Jira versions marked as <b>released</b> (with a release date), bucketed by week. Versions without a release date are listed in the data-quality details.' },
    lt: { name: 'Lead time for changes', short: 'Lead time', unit: 'issues', kind: 'hours',
      cuts: [['elite', 24], ['high', 168], ['medium', 720], ['low', Infinity]],
      what: 'How long a piece of work takes from the moment someone starts it to the moment it’s done. Shorter lead time means ideas reach users faster.',
      how: 'Median (P50) time from an issue’s <b>first transition into “In progress”</b> to its <b>last transition into “Done”</b>, over all issues completed in the period. Issues that never passed through “In progress” are excluded and counted in the footnote.' },
    fr: { name: 'Change failure rate', short: 'Failure rate', unit: 'releases', kind: 'share',
      cuts: [['elite', 0.15], ['high', 0.30], ['medium', 0.45], ['low', Infinity]],
      what: 'Out of everything you released, how much caused a problem that needed fixing. Lower is better — it measures stability, not speed.',
      how: 'Share of releases with at least one <b>bug raised within 14 days</b> that is linked to the release via fix/affected version — or, if your team doesn’t fill versions on bugs, raised within 14 days after it. The method mix is shown in the data-quality details.' },
    tr: { name: 'Time to restore', short: 'Restore time', unit: 'incidents', kind: 'hours',
      cuts: [['elite', 1], ['high', 24], ['medium', 168], ['low', Infinity]],
      what: 'When something does break, how quickly you get back to normal. Fast recovery limits the damage of any single failure.',
      how: 'Median time from an incident-type issue being <b>created</b> to it being <b>resolved</b>, for incidents resolved in the period. You choose which issue types count as incidents (default: bugs/incidents).' }
  };
  var BAND_NAME = { elite: 'Elite', high: 'High', medium: 'Medium', low: 'Low' };
  var BENCH_TEXT = 'Benchmark bands follow the DORA™ research (the classic Elite/High/Medium/Low clusters, last published 2024 — still the industry-standard yardstick). Your numbers are approximated from Jira work items, not from CI/CD pipelines; treat bands as orientation, not an audit.';
  var NO_HISTORY = 'The stored history does not reach back to the start of the previous period, so there is nothing to compare this value with yet.';
  var VERDICT = 'Since your AI rollout on ' + ROLLOUT.label + ', deployment frequency and lead time improved while stability stayed flat. That pattern is consistent with a positive AI impact on delivery speed without a stability trade-off.';
  var PRO_NOTE = h('span.d-ctx-note', null, 'Pro features on, as in the trial');

  // Projects the setup wizard can pick (what a look at the last 90 days would find)
  var PROJECTS = [
    { key: 'DATA', name: 'Data Platform', releases: 0, done: 14, onlySubtasks: true,
      statuses: [['To Do', 'new'], ['In Progress', 'indeterminate'], ['Done', 'done']], types: ['Epic', 'Story', 'Task', 'Bug'] },
    { key: 'DS', name: 'Design System', teamManaged: true, releases: 0, done: 0,
      statuses: [['To Do', 'new'], ['In Progress', 'indeterminate'], ['Done', 'done']], types: ['Epic', 'Task', 'Bug'] },
    { key: 'MOB', name: 'Mobile App', releases: 2, done: 61,
      statuses: [['To Do', 'new'], ['In Progress', 'indeterminate'], ['In Review', 'indeterminate'], ['Released', 'done'], ['Done', 'done']], types: ['Epic', 'Story', 'Task', 'Bug'] },
    { key: 'STORE', name: 'Storefront', releases: 22, done: 146,
      statuses: [['Backlog', 'new'], ['In Progress', 'indeterminate'], ['In Review', 'indeterminate'], ['Deployed', 'done'], ['Done', 'done']], types: ['Epic', 'Story', 'Task', 'Bug', 'Incident'] },
    { key: 'SUP', name: 'Support Desk', teamManaged: true, releases: 0, done: 88,
      statuses: [['To Do', 'new'], ['In Progress', 'indeterminate'], ['Waiting for customer', 'indeterminate'], ['Done', 'done']], types: ['Task', 'Bug', 'Incident'] }
  ];
  var DEFAULT_INCIDENT_TYPES = { Bug: 1, Incident: 1 };

  function freshState() {
    return {
      views: {
        overview: { span: '30', pane: 'overview', metric: 'lt', bucket: 'week', bands: true },
        trends: { span: '365', pane: 'trends', metric: 'lt', bucket: 'week', bands: true }
      },
      dialog: null,
      wiz: {
        page: 1, picked: [], deploy: null, doneStatus: null, incident: null, subtasks: false, more: false,
        rollout: '', labels: ['ai-assisted', 'copilot', 'rovo'], signals: { app: true, labels: true, types: true },
        aiTypes: [], pins: [], pinDate: '', pinText: '', saved: false, pct: 0
      },
      seen: {}
    };
  }

  /* ---------- value formatting (what the gadget shows) ---------- */
  function r1(x) { return Math.round(x * 10) / 10; }
  function tenth(x) { return String(r1(x)); }
  function percent(ratio) { return (ratio * 100).toFixed(0) + '%'; }
  function missing(v) { return v === null || v === undefined; }
  var WEEKS_PER_MONTH = 365.25 / 7 / 12;
  // The sample values never drop below one hour, so hours and days are enough here.
  var SHOW = {
    share: percent,
    rate: function (v) { return v > 0 && v < 1 ? tenth(v * WEEKS_PER_MONTH) + '/mo' : tenth(v) + '/wk'; },
    hours: function (v) { return v >= 48 ? tenth(v / 24) + ' d' : tenth(v) + ' h'; }
  };
  function shown(key, v) { return missing(v) ? '—' : SHOW[METRIC[key].kind](v); }
  function spanById(id) {
    for (var i = 0; i < RANGES.length; i++) if (RANGES[i].id === id) return RANGES[i];
    return RANGES[0];
  }

  /* ---------- series for the small lines and the trend chart ---------- */
  var WEEKLY = { df: SHIPPED, lt: LEAD_H, tr: FIX_H };
  var WEEKLY_N = { df: SHIPPED, lt: CLOSED, fr: SHIPPED, tr: INCIDENTS };
  function weekValue(key, i) {
    if (WEEKLY[key]) return WEEKLY[key][i];
    return SHIPPED[i] > 0 ? BROKE[i] / SHIPPED[i] : null; // failure share of that week
  }
  function weekCount(key, i) { return WEEKLY_N[key][i]; }
  function weeklyPoints(key, span) {
    var list = [];
    for (var i = span.lo; i <= span.hi; i++) {
      list.push({ id: WEEK_KEYS[i], tick: WEEK_KEYS[i].split('-')[1], t: FIRST_MONDAY + i * 7 * DAY, v: weekValue(key, i), n: weekCount(key, i) });
    }
    return list;
  }
  function monthlyPoints(key, span) {
    var m = span.months;
    return m.k.map(function (k, i) {
      var parts = k.split('-');
      return { id: '20' + k, tick: k, t: Date.UTC(2000 + Number(parts[0]), Number(parts[1]) - 1, 15), v: m[key][i], n: m['n' + key][i] };
    });
  }
  // Documented smoothing: median of the current and the three previous weeks
  function fourWeekMedian(values) {
    return values.map(function (v, i) {
      var win = values.slice(Math.max(0, i - 3), i + 1).filter(function (x) { return !missing(x); });
      if (!win.length) return null;
      win.sort(function (a, b) { return a - b; });
      var last = win.length - 1;
      return (win[Math.floor(last / 2)] + win[Math.ceil(last / 2)]) / 2;
    });
  }
  // Contiguous stretches without gaps: [[index, value], …]
  function stretches(values) {
    var out = [], cur = null;
    values.forEach(function (v, i) {
      if (missing(v)) { cur = null; return; }
      if (!cur) { cur = []; out.push(cur); }
      cur.push([i, v]);
    });
    return out;
  }

  /* ---------- small trend line under each number (markup string) ---------- */
  function miniLine(values, w, ht) {
    var lo = Infinity, hi = -Infinity, end = -1, count = 0;
    values.forEach(function (v, i) {
      if (missing(v)) return;
      count += 1; end = i;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    });
    var frame = h('svg.dv-spark-svg', { width: w, height: ht, viewBox: [0, 0, w, ht].join(' '), 'aria-hidden': 'true', focusable: 'false' }, '{{}}');
    if (count < 2) return frame.replace('{{}}', '');
    var edge = 2.5, spread = hi - lo || 1, stepX = (w - edge * 2) / Math.max(1, values.length - 1);
    var at = function (i, v) { return [r1(edge + stepX * i), r1(ht - edge - (ht - edge * 2) * (v - lo) / spread)]; };
    var marks = stretches(values).map(function (s) {
      return h('polyline', { points: s.map(function (q) { return at(q[0], q[1]).join(' '); }).join(' ') });
    }).join('');
    var tip = at(end, values[end]);
    return frame.replace('{{}}', marks + h('circle', { cx: tip[0], cy: tip[1], r: 2.5 }));
  }

  /* ---------- trend chart, drawn with DOM calls after each render ---------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function svgNode(tag, attrs, parent, text) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }
  var STEPS = {
    hours: [1, 2, 3, 4, 6, 12, 24, 48, 72, 96, 168, 336, 720, 1440],
    rate: [0.25, 0.5, 1, 2, 5, 10, 20, 50],
    share: [0.05, 0.1, 0.2, 0.25, 0.5]
  };
  // y axis: a step from the metric's list, at most five intervals
  function yScale(key, peak) {
    var kind = METRIC[key].kind;
    var need = peak > 0 ? peak * 1.25 : 1;
    if (kind === 'share') need = need > 1 ? 1 : need < 0.25 ? 0.25 : need; // a share never tops 100 %
    var list = STEPS[kind];
    var fits = list.filter(function (st) { return need / st <= 5 + 1e-9; });
    var step = fits.length ? fits[0] : list[list.length - 1];
    var parts = Math.max(1, Math.ceil(need / step - 1e-9));
    return { step: step, parts: parts, top: step * parts };
  }
  function yLabel(key, v, step) {
    switch (METRIC[key].kind) {
      case 'share': return percent(v);
      case 'rate': return tenth(v);
      default: return !v ? '0' : step >= 24 ? tenth(v / 24) + 'd' : tenth(v) + 'h';
    }
  }
  // Position of a timestamp between the points (fractional index), or null outside
  function indexAt(t, pts) {
    if (pts.length < 2 || t < pts[0].t || t > pts[pts.length - 1].t) return null;
    for (var i = 0; i < pts.length - 1; i++) {
      if (t <= pts[i + 1].t) return i + (t - pts[i].t) / (pts[i + 1].t - pts[i].t);
    }
    return pts.length - 1;
  }

  function paintTrend(box, cfg) {
    box.textContent = '';
    var width = Math.max(240, Math.floor(box.clientWidth || 640));
    var height = width < 560 ? 230 : 256;
    var pad = { left: 40, right: 16, top: 14, bottom: 42 };
    var plotW = width - pad.left - pad.right, plotH = height - pad.top - pad.bottom;
    var key = cfg.key, pts = cfg.points, last = pts.length - 1;
    var peak = 0;
    pts.forEach(function (p) { if (p.v !== null && p.v > peak) peak = p.v; });
    var sc = yScale(key, peak);
    var xPos = function (f) { return pad.left + (last > 0 ? plotW * f / last : plotW / 2); };
    var yPos = function (v) { return pad.top + plotH * (1 - Math.min(v, sc.top) / sc.top); };

    var svg = svgNode('svg', { 'class': 'dv-plot', width: width, height: height, viewBox: '0 0 ' + width + ' ' + height, role: 'img', 'aria-label': METRIC[key].name + ' trend chart' }, box);

    if (cfg.bands) {
      var zone = svgNode('g', { 'class': 'dv-zones' }, svg), from = 0;
      METRIC[key].cuts.forEach(function (c) {
        var lo = from, hi = Math.min(c[1], sc.top);
        from = c[1];
        if (lo >= sc.top || hi <= lo) return;
        var top = yPos(hi), bottom = yPos(lo);
        svgNode('rect', { x: pad.left, y: r1(top), width: plotW, height: r1(bottom - top), 'class': 'dv-zone is-' + c[0] }, zone);
        if (bottom - top >= 16) {
          svgNode('text', { x: pad.left + plotW - 6, y: r1(top + 12), 'text-anchor': 'end', 'class': 'dv-zone-name is-' + c[0] }, zone, c[0].toUpperCase());
        }
      });
    }

    var axis = svgNode('g', { 'class': 'dv-axis' }, svg);
    for (var k = 0; k <= sc.parts; k++) {
      var val = k * sc.step, y = r1(yPos(val));
      svgNode('line', { x1: pad.left, x2: pad.left + plotW, y1: y, y2: y, 'class': 'dv-grid' }, axis);
      svgNode('text', { x: pad.left - 7, y: y, dy: '0.32em', 'text-anchor': 'end' }, axis, yLabel(key, val, sc.step));
    }
    var room = Math.max(2, Math.floor(plotW / 58)); // about one week label per 58 px
    var every = Math.ceil(pts.length / room) || 1;
    pts.forEach(function (p, i) {
      if ((last - i) % every !== 0) return;
      svgNode('text', { x: r1(xPos(i)), y: pad.top + plotH + 15, 'text-anchor': 'middle' }, axis, p.tick);
    });

    var marks = svgNode('g', { 'class': 'dv-events' }, svg), reach = -Infinity;
    cfg.events.forEach(function (ev) {
      var f = indexAt(ev.t, pts);
      if (f === null) return;
      var x = xPos(f);
      svgNode('line', { x1: r1(x), x2: r1(x), y1: pad.top, y2: pad.top + plotH, 'class': 'dv-event' }, marks);
      var label = svgNode('text', { x: r1(x + 5), y: pad.top + 11, 'class': 'dv-event-name' }, marks, ev.label);
      var lw = label.getComputedTextLength ? label.getComputedTextLength() : ev.label.length * 5;
      var left = x + 5;
      if (left + lw > pad.left + plotW) { label.setAttribute('x', r1(x - 5)); label.setAttribute('text-anchor', 'end'); left = x - 5 - lw; }
      if (left < reach + 6) label.setAttribute('y', pad.top + 24);
      reach = Math.max(reach, left + lw);
    });

    var lines = svgNode('g', { 'class': 'dv-series' }, svg);
    function polyline(values, cn) {
      stretches(values).forEach(function (s) {
        if (s.length < 2) return;
        svgNode('polyline', { points: s.map(function (q) { return r1(xPos(q[0])) + ',' + r1(yPos(q[1])); }).join(' '), 'class': cn }, lines);
      });
    }
    var raw = pts.map(function (p) { return p.v; });
    if (cfg.median) polyline(fourWeekMedian(raw), 'dv-median');
    polyline(raw, 'dv-raw');
    pts.forEach(function (p, i) {
      if (p.v === null || p.v === undefined) return;
      var dot = svgNode('circle', { cx: r1(xPos(i)), cy: r1(yPos(p.v)), r: 2.75, 'class': 'dv-dot' }, lines);
      svgNode('title', {}, dot, p.id + ' — ' + shown(key, p.v) + ' (n=' + p.n + ')');
    });
    svgNode('text', { x: pad.left, y: height - 7, 'class': 'dv-caption' }, svg, cfg.caption);
  }

  /* ---------- Overview gadget ---------- */
  function deltaBadge(t) {
    if (t.d) return h('span', { 'class': 'dv-trend ' + (t.good ? 'is-better' : 'is-worse'), title: 'vs previous period' }, (t.up ? '▲ ' : '▼ ') + t.d);
    if (t.nh) return h('span.dv-trend.is-flat', { title: NO_HISTORY }, '— not enough history for a comparison');
    return '';
  }
  function band(b) { return h('span', { 'class': 'dv-band is-' + b }, BAND_NAME[b]); }

  function metricTile(key, span) {
    var t = span.tiles[key], m = METRIC[key];
    return h('article.dv-metric', null,
      h('header.dv-metric-top', null,
        h('h4.dv-metric-name', null, m.name),
        h('button.dv-explain', { type: 'button', 'data-tap': 'explain', 'data-m': key, 'data-fid': 'explain-' + key, title: 'What is this and how is it calculated?', 'aria-label': 'Explain ' + m.name }, 'ⓘ')),
      h('p.dv-figure', null, h('span.dv-number', null, t.v), band(t.b), deltaBadge(t)),
      h('p.dv-says', null, esc(t.s)),
      h('div.dv-spark', null, miniLine(weeklyPoints(key, span).map(function (p) { return p.v; }), 120, 30)));
  }

  function dialogMarkup(where, S) {
    var d = S.dialog;
    if (!d || d.where !== where) return '';
    var title, body;
    if (d.kind === 'explain') {
      var m = METRIC[d.m], t = spanById(S.views[where].span).tiles[d.m];
      title = m.name;
      body = h('h5', null, 'What is this?') + h('p', null, m.what) +
        h('h5', null, 'How we calculate it') + h('p', null, m.how) +
        h('p.dv-fine', null, 'In this period: based on n=' + t.n + ' ' + m.unit + '.') +
        h('p.dv-fine', null, BENCH_TEXT);
    } else {
      title = 'Data quality';
      body = h('h5', null, 'Excluded from the last full analysis') +
        h('ul', null,
          h('li', null, '<b>7</b> never transitioned into “In progress” (lead time not measurable)'),
          h('li', null, '<b>2</b> sub-tasks (excluded by default — enable in Advanced settings)'),
          h('li', null, '<b>2</b> released versions without a release date (not counted as deployments)')) +
        h('h5', null, 'Change-failure attribution') +
        h('p.dv-small', null, '9 bug(s) matched a release via fix/affected version · 3 matched by time (created ≤ 14 days after a release) · 2 could not be attributed.') +
        h('p.dv-fine', null, 'Tip: teams that set the <i>affected version</i> on bugs get the most accurate change failure rate.') +
        h('p.dv-fine', null, 'Tip: teams that mark Jira versions as <b>released</b> get the most accurate deployment frequency.');
    }
    return h('div.dv-scrim', { 'data-tap': 'scrim' },
      h('div.dv-dialog', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dv-dialog-title' },
        h('div.dv-dialog-bar', null,
          h('h4', { id: 'dv-dialog-title' }, title),
          h('button.dv-close', { type: 'button', 'data-tap': 'close', 'data-fid': 'close', 'aria-label': 'Close' }, '✕')),
        body));
  }

  function overviewGadget(where, S) {
    var v = S.views[where], span = spanById(v.span);
    var periodSelect = h('select.dv-select', { id: 'dv-span-' + where, 'data-pick': 'span', 'data-fid': 'span', 'aria-label': 'Period' },
      RANGES.map(function (p) { return h('option', { value: p.id, selected: p.id === v.span }, p.label); }));
    var top = h('div.dv-top', null,
      h('div.dv-top-left', null, h('strong.dv-project', null, 'Storefront'), periodSelect),
      h('div.dv-top-right', null, h('span.dv-stamp', null, 'Data updated just now'),
        h('button.dv-ghost', { type: 'button', 'data-tap': 'refresh', title: 'Refresh data', 'aria-label': 'Refresh data' }, '↻')));
    var panes = [['overview', 'Overview'], ['trends', 'Trends'], ['ai', 'AI Impact']];
    var tabs = h('div.dv-panes', { role: 'tablist', 'aria-label': 'Gadget views' }, panes.map(function (p) {
      var on = v.pane === p[0];
      return h('button.dv-pane', { type: 'button', role: 'tab', 'aria-selected': String(on), 'class': on ? 'is-current' : '', 'data-tap': 'pane', 'data-v': p[0], 'data-fid': 'pane-' + p[0] }, p[1]);
    }));
    var content;
    if (v.pane === 'trends') content = trendsPane(v);
    else if (v.pane === 'ai') content = impactPane(span);
    else content = h('div.dv-metrics', null, KEYS.map(function (k) { return metricTile(k, span); }));
    var bottom = h('div.dv-bottom', null,
      h('div.dv-bottom-left', null, h('span.dv-note', null, span.foot),
        h('button.dv-ghost.dv-small', { type: 'button', 'data-tap': 'details', 'data-fid': 'details' }, 'Details')),
      h('div.dv-bottom-right', null,
        h('button.dv-plain', { type: 'button', 'data-tap': 'export', 'data-x': 'csv' }, 'CSV'),
        h('button.dv-plain', { type: 'button', 'data-tap': 'export', 'data-x': 'png' }, 'PNG'),
        h('button.dv-plain', { type: 'button', 'data-tap': 'export', 'data-x': 'text' }, 'Copy as text')));
    return h('section.d-gadget.d-app.dv-gadget', { 'aria-label': 'DevOps Metrics — Overview gadget' },
      h('span.d-app-tag', null, 'DevOps Metrics'),
      dialogMarkup(where, S),
      h('div.d-gadget-head', null, h('div.d-gadget-title', null, 'DevOps Metrics — Overview')),
      h('div.dv-ui', null, top, tabs, content, bottom));
  }

  function toggleGroup(action, options, current, label) {
    return h('div.dv-toggle', { role: 'group', 'aria-label': label }, options.map(function (o) {
      var on = o[0] === current;
      return h('button', { type: 'button', 'class': on ? 'is-current' : '', 'aria-pressed': String(on), 'data-tap': action, 'data-m': o[0], 'data-fid': action + '-' + o[0] }, o[1]);
    }));
  }
  function trendsPane(v) {
    return h('div.dv-controls', null,
      toggleGroup('metric', KEYS.map(function (k) { return [k, METRIC[k].short]; }), v.metric, 'Metric'),
      h('div.dv-controls-right', null,
        toggleGroup('bucket', [['week', 'Weekly'], ['month', 'Monthly']], v.bucket, 'Buckets'),
        h('label.dv-tick-box', null, h('input', { type: 'checkbox', 'data-pick': 'bands', 'data-fid': 'bands', checked: v.bands }), ' Benchmarks'))) +
      h('div.dv-chart', { 'data-chart': true });
  }

  function impactPane(span) {
    var cards = KEYS.map(function (k) {
      var c = ROLLOUT.cards[k];
      return h('div.dv-compare', null,
        h('div.dv-metric-name', null, METRIC[k].name),
        h('div', null, h('b.dv-change', null, c.d), h('span.dv-note', null, ' (' + c.before + ' → ' + c.after + ')')),
        h('div.dv-note', null, ROLLOUT.days + ' days before vs after'));
    });
    var g = span.split;
    var split = [['AI-involved', g.aiLead, g.aiCount, g.ratio, 'is-ai'], ['Other issues', g.otherLead, g.otherCount, 1, 'is-rest']].map(function (r) {
      return h('div.dv-split-row', null,
        h('span.dv-split-name', null, r[0]),
        h('span.dv-split-track', null,
          h('span', { 'class': 'dv-split-bar ' + r[4], style: 'width:calc((100% - 64px) * ' + r[3] + ')', title: r[0] + ': ' + r[1] + ' median (n=' + r[2] + ')' }),
          h('span.dv-split-val', null, h('b', null, r[1]), h('small', null, 'n=' + r[2]))));
    });
    return h('div.dv-verdict', null, VERDICT) +
      h('div.dv-compares', null, cards) +
      h('div.dv-split', null,
        h('div.dv-metric-name', null, 'AI-involved vs other issues (current period)'),
        h('p.dv-small', null, g.share + ' of completed issues had AI involvement (' + g.ai + ' of ' + g.done + ').'),
        h('div.dv-split-rows', { role: 'img', 'aria-label': 'Median lead time, AI-involved vs other issues' }, split),
        h('p.dv-note', null, 'Median lead time: AI-involved ' + g.aiLead + ' vs ' + g.otherLead + ' for the rest — AI-involved work ships faster.'),
        h('p.dv-footnote', null, 'Detected via app-account activity (Rovo, Automation, bots) and your configured labels/issue types — a proxy, not telemetry. Always aggregated, never per person.'));
  }

  function metricCard() {
    var span = spanById('90'), t = span.tiles.lt;
    return h('section.d-gadget.d-app.dv-gadget', { 'aria-label': 'DevOps Metric Card gadget' },
      h('span.d-app-tag', null, 'DevOps Metrics'),
      h('div.d-gadget-head', null, h('div.d-gadget-title', null, 'DevOps Metric Card')),
      h('div.dv-ui.dv-card', null,
        h('div.dv-card-name', null, METRIC.lt.name),
        h('div.dv-card-number', null, t.v),
        h('div.dv-card-row', null, band(t.b), deltaBadge(t)),
        h('div.dv-card-spark', null, miniLine(weeklyPoints('lt', span).map(function (p) { return p.v; }), 230, 42)),
        h('p.dv-card-says', null, esc(t.s)),
        h('p.dv-card-meta', null, 'Storefront · updated 2 min ago · last 90 days')));
  }

  function strip(trail) {
    return h('div.d-context', null, h('span', null, 'Dashboards'), h('span.d-sep', null, '/'), trail, PRO_NOTE);
  }
  function overviewScreen(S) {
    return strip(h('b', null, 'Delivery')) + h('div.dv-board.is-pair', null, overviewGadget('overview', S), metricCard());
  }
  function trendsScreen(S) {
    return strip(h('b', null, 'Delivery')) + h('div.dv-board', null, overviewGadget('trends', S));
  }

  /* ---------- gadget settings: the setup wizard ---------- */
  function chosen(W) {
    for (var i = 0; i < PROJECTS.length; i++) if (W.picked.indexOf(PROJECTS[i].key) >= 0) return PROJECTS[i];
    return null;
  }
  function releasesFit(p) { return !p || p.releases >= 3; }

  function setupScreen(S) {
    var W = S.wiz, p = chosen(W);
    if (W.saved) return savedScreen(W, p);
    var crumbs = h('ol.dv-crumbs', null, ['Project', 'Deployments', 'AI rollout'].map(function (name, i) {
      return h('li', { 'class': W.page === i + 1 ? 'is-current' : '', 'aria-current': W.page === i + 1 ? 'step' : false }, (i + 1) + '. ' + name);
    }));
    var page = W.page === 1 ? projectPage(W, p) : W.page === 2 ? deployPage(W, p) : rolloutPage(W, p);
    var forward;
    if (W.page === 1) {
      forward = h('button.dv-blue', { type: 'button', 'data-tap': 'next', 'data-fid': 'next', 'data-cue': W.picked.length ? 'pick' : false, disabled: !W.picked.length }, 'Next');
    } else if (W.page === 2) {
      forward = h('button.dv-plain', { type: 'button', 'data-tap': 'finish', 'data-fid': 'finish-rec', 'data-cue': 'finish', title: 'Apply the recommended deployment definition and defaults, skip step 3, done.' }, 'Use recommended settings') +
        h('button.dv-blue', { type: 'button', 'data-tap': 'next', 'data-fid': 'next' }, 'Next');
    } else {
      forward = h('button.dv-blue', { type: 'button', 'data-tap': 'finish', 'data-fid': 'finish-save', 'data-cue': 'finish' }, 'Save');
    }
    var nav = h('div.dv-nav', null,
      h('div', null, W.page > 1 ? h('button.dv-plain', { type: 'button', 'data-tap': 'back', 'data-fid': 'back' }, 'Back') : ''),
      h('div.dv-nav-right', null, forward));
    var head = h('div.dv-wiz-head', null, h('strong.dv-project', null, 'Set up DORA™ metrics'), h('span.dv-note', null, '~1 minute'));
    return settingsFrame(head + crumbs + page + nav +
      h('p.dv-footnote', null, 'You can change everything later — reopen this dialog any time via the gadget’s ••• / pencil menu.'), false);
  }

  function savedScreen(W, p) {
    var pct = Math.min(100, Math.round(W.pct));
    var card = h('div.dv-busy', null,
      h('b', null, 'Analyzing your project history…'),
      h('span.dv-note', null, 'First run reads up to 12 months of completed issues. This happens once — afterwards the gadget loads instantly from precomputed data.'),
      h('div.dv-meter', { role: 'progressbar', 'aria-label': 'Analysis progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) },
        h('span', { style: 'width:' + Math.max(3, pct) + '%' })),
      h('span.dv-note', null, pct + '%'));
    var next = '';
    if (pct >= 100) {
      var nothing = p.done === 0 || (p.onlySubtasks && !W.subtasks);
      var msg = nothing
        ? esc(p.name) + ' has no finished work the gadget can count, so in your Jira it stays empty and names the reason. Pick another project.'
        : p.key === 'STORE'
          ? 'In your Jira the tiles now fill with Storefront’s numbers, as in the first tab.'
          : 'In your Jira the tiles now fill with ' + esc(p.name) + '’s numbers. The first tab shows the sample project Storefront.';
      next = h('div.dv-outcome', null, h('span', null, msg),
        h('button.d-btn.is-primary.is-compact', { type: 'button', 'data-goto': 'overview' }, 'See the Overview →'));
    }
    return settingsFrame(card, true) + next;
  }

  function settingsFrame(inner, closed) {
    var trail = closed ? h('b', null, 'Delivery') : h('span', null, 'Delivery') + h('span.d-sep', null, '/') + h('b', null, 'Edit gadget');
    return strip(trail) + h('div.dv-board', null,
      h('section.d-gadget.d-app.dv-gadget', { 'aria-label': 'DevOps Metrics — Overview gadget' + (closed ? '' : ' settings') },
        h('span.d-app-tag', null, 'DevOps Metrics'),
        h('div.d-gadget-head', null, h('div.d-gadget-title', null, 'DevOps Metrics — Overview')),
        h('div.dv-ui.dv-wizard', null, inner)));
  }

  function checkRow(attrs, labelHtml, cn) {
    return h('label', { 'class': 'dv-option' + (cn ? ' ' + cn : '') }, h('input', attrs), ' ', labelHtml);
  }

  function projectPage(W, p) {
    var rows = PROJECTS.map(function (q) {
      return checkRow({ type: 'checkbox', 'data-pick': 'project', 'data-k': q.key, 'data-fid': 'project-' + q.key, checked: W.picked.indexOf(q.key) >= 0 },
        h('span', null, esc(q.name)) + ' ' + h('span.dv-note', null, q.key + (q.teamManaged ? ' · team-managed' : '')));
    });
    var warning = '';
    if (p && p.done === 0) {
      warning = h('div.dv-alert', null, '<b>This project has no completed issues in the last 90 days.</b><br>DevOps Metrics is built from finished work, so the gadget would stay empty. Pick a project where your team closes issues.');
    } else if (p && p.onlySubtasks) {
      warning = h('div.dv-alert', null, '<b>All ' + p.done + ' issues completed here in the last 90 days are sub-tasks.</b><br>Sub-tasks are excluded by default, so the gadget would stay empty. Tick <b>Include sub-tasks in lead time &amp; throughput</b> in the next step.');
    }
    return h('fieldset.dv-group', null,
      h('legend', null, 'Projects'),
      h('span.dv-hint', null, 'Pick up to 10 projects — multiple projects are combined into one view.'),
      h('div.dv-list', { 'data-cue': W.picked.length ? false : 'pick' }, rows)) + warning;
  }

  function deployPage(W, p) {
    var preferReleases = releasesFit(p);
    function choice(value, title, help, isRecommended) {
      var on = W.deploy === value;
      return h('label', { 'class': 'dv-choice' + (on ? ' is-current' : '') },
        h('span.dv-choice-title', null,
          h('input', { type: 'radio', name: 'dv-deploy', value: value, 'data-pick': 'deploy', 'data-fid': 'deploy-' + value, checked: on }),
          ' ', h('b', null, title), isRecommended ? ' ' + h('span.dv-ok', null, 'Recommended ✓') : ''),
        h('span.dv-hint.dv-choice-help', null, help));
    }
    var found = p.releases > 0
      ? 'We found <b>' + p.releases + (p.releases === 1 ? ' release' : ' releases') + '</b> in the last 90 days ✓'
      : 'No recent releases found in this project — consider the status option below.';
    var html = h('fieldset.dv-group', null,
      h('legend', null, 'What counts as a deployment?'),
      choice('releases', 'Releases (Jira versions marked as released)', found, preferReleases),
      choice('status', 'Issues reaching a status', 'Every issue that first reaches the status(es) below counts as one deployment — for teams that don’t maintain releases.', !preferReleases));
    if (W.deploy === 'status') {
      html += h('fieldset.dv-group.dv-inset', null,
        h('legend.dv-small', null, 'Statuses that mean “deployed”'),
        h('div.dv-list', null, p.statuses.map(function (s, i) {
          return checkRow({ type: 'checkbox', 'data-pick': 'status', 'data-i': i, 'data-fid': 'status-' + i, checked: W.doneStatus[i] }, esc(s[0]) + ' ' + h('span.dv-note', null, '(' + s[1] + ')'), 'dv-small');
        })));
    }
    var more = h('button.dv-disclose', { type: 'button', 'data-tap': 'more', 'data-fid': 'more', 'aria-expanded': String(W.more), 'data-cue': W.more ? false : 'adv' },
      h('span', { 'aria-hidden': 'true' }, W.more ? '▾' : '▸'), ' Advanced');
    if (W.more) {
      more += h('div.dv-more', null,
        h('fieldset.dv-group', null,
          h('legend.dv-small', null, 'Issue types that count as incidents (for Time to restore)'),
          h('div.dv-list', null, p.types.map(function (t, i) {
            return checkRow({ type: 'checkbox', 'data-pick': 'incident', 'data-i': i, 'data-fid': 'incident-' + i, checked: W.incident[i] }, esc(t), 'dv-small');
          }))),
        checkRow({ type: 'checkbox', 'data-pick': 'subtasks', 'data-fid': 'subtasks', checked: W.subtasks }, 'Include sub-tasks in lead time &amp; throughput', 'dv-small'),
        h('p.dv-hint', null, 'Change failure rate links bugs to releases via fix/affected version, falling back to “raised within 14 days of the release”. Lead time runs from the first “In progress” to the last “Done” transition.'));
    }
    return html + h('div.dv-advanced', null, more);
  }

  function rolloutPage(W, p) {
    var labelChips = W.labels.map(function (l, i) {
      return h('span.dv-chip', null, esc(l), h('button', { type: 'button', 'data-tap': 'drop-label', 'data-i': i, 'data-fid': 'drop-label-' + i, 'aria-label': 'Remove ' + l }, '✕'));
    });
    function signal(k, label, help) {
      return checkRow({ type: 'checkbox', 'data-pick': 'signal', 'data-k': k, 'data-fid': 'signal-' + k, checked: W.signals[k] }, h('span', null, label + ' ' + h('span.dv-note', null, '— ' + help)), 'dv-small');
    }
    var pins = W.pins.map(function (m, i) {
      return h('span.dv-chip', null, esc(m.date) + ' · ' + esc(m.label), h('button', { type: 'button', 'data-tap': 'drop-pin', 'data-i': i, 'data-fid': 'drop-pin-' + i, 'aria-label': 'Remove marker' }, '✕'));
    });
    return h('div.dv-group', null,
        h('label.dv-label', { 'for': 'dv-rollout' }, 'AI rollout date ', h('span.dv-note', null, '(optional — skip if unsure)')),
        h('span.dv-hint', null, 'When did your team start using AI tools (Copilot, Rovo, Claude, Cursor…)? Powers the before/after comparison in the AI Impact tab.'),
        h('input.dv-field', { type: 'date', id: 'dv-rollout', 'data-type': 'rollout', 'data-fid': 'rollout', max: TODAY, value: W.rollout })) +
      h('div.dv-group', null,
        h('label.dv-label.dv-small', { 'for': 'dv-new-label' }, 'Labels that mark AI-assisted issues'),
        h('div', null, labelChips),
        h('input.dv-field.dv-narrow', { type: 'text', id: 'dv-new-label', 'data-type': 'label', 'data-fid': 'new-label', placeholder: 'Add label + Enter', autocomplete: 'off' })) +
      h('fieldset.dv-group', null,
        h('legend.dv-small', null, 'AI signals to use'),
        signal('app', 'App-account activity', 'Rovo agents, Automation, bots touching the issue'),
        signal('labels', 'Labels', 'the list above'),
        signal('types', 'Issue types', 'pick below if your team has an “AI task” type'),
        h('div.dv-list.dv-small', null, p.types.map(function (t, i) {
          return checkRow({ type: 'checkbox', 'data-pick': 'ai-type', 'data-i': i, 'data-fid': 'ai-type-' + i, checked: W.aiTypes.indexOf(i) >= 0 }, esc(t));
        }))) +
      h('div.dv-group', null,
        h('span.dv-label.dv-small', { id: 'dv-pins-label' }, 'Extra chart markers ', h('span.dv-note', null, '(e.g. “New CI pipeline”, max 5)')),
        h('div', null, pins),
        h('div.dv-pin-row', { role: 'group', 'aria-labelledby': 'dv-pins-label' },
          h('input.dv-field', { type: 'date', 'data-type': 'pin-date', 'data-fid': 'pin-date', max: TODAY, 'aria-label': 'Marker date', value: W.pinDate }),
          h('input.dv-field.dv-narrow', { type: 'text', 'data-type': 'pin-text', 'data-fid': 'pin-text', placeholder: 'Label', maxlength: '24', 'aria-label': 'Marker label', value: W.pinText }),
          h('button.dv-plain.dv-small', { type: 'button', 'data-tap': 'add-pin', 'data-fid': 'add-pin' }, 'Add')));
  }

  /* ---------- mount ---------- */
  var api = null;
  var resizeWait = null;

  function paintCharts(where, S) {
    if (where === 'setup' || !api) return;
    var v = S.views[where];
    if (v.pane !== 'trends') return;
    var box = api.el('[data-chart]');
    if (!box) return;
    var span = spanById(v.span), monthly = v.bucket === 'month';
    var m = METRIC[v.metric];
    var narrow = (box.clientWidth || 0) < 560;
    var caption = narrow
      ? m.short + ' · ' + (monthly ? 'monthly' : 'weekly') + (monthly ? '' : ' · dashed: 4-week median')
      : m.name + ' · solid: ' + (monthly ? 'monthly value' : 'weekly value') + (monthly ? '' : ' · dashed: 4-week median') + ' · hover points for n';
    paintTrend(box, {
      key: v.metric,
      points: monthly ? monthlyPoints(v.metric, span) : weeklyPoints(v.metric, span),
      median: !monthly,
      events: EVENTS,
      bands: v.bands,
      caption: caption
    });
  }

  J.mount(host, {
    id: 'dora',
    title: 'DevOps Metrics',
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'trends', label: 'Trends & AI' },
      { id: 'setup', label: 'Setup' }
    ],
    initialState: freshState,
    render: function (tab, S) {
      if (S.dialog && S.dialog.where !== tab) S.dialog = null;
      if (tab === 'setup') return setupScreen(S);
      return tab === 'trends' ? trendsScreen(S) : overviewScreen(S);
    },
    afterRender: paintCharts,
    steps: {
      overview: [
        { text: 'switch the period to <strong>Last 6 months</strong>. Values, bands and arrows follow.', target: '#dv-span-overview', done: function (S) { return S.seen.span; } },
        { text: 'click <strong>ⓘ</strong> on <strong>Lead time for changes</strong>: what it means and how it is calculated.', target: '[data-tap="close"], [data-tap="explain"][data-m="lt"]', done: function (S) { return S.seen.explain; } },
        { text: 'close the explanation, then click <strong>Details</strong> next to the footnote: what was left out and how bugs were matched to releases.', target: '[data-tap="close"], [data-tap="details"]', done: function (S) { return S.seen.details; } }
      ],
      trends: [
        { text: 'switch the chart to <strong>Deploy freq</strong>. The orange lines mark a new CI pipeline and the AI rollout.', target: '[data-tap="metric"][data-m="df"]', done: function (S) { return S.seen.metric; } },
        { text: 'open the gadget’s <strong>AI Impact</strong> tab: ' + ROLLOUT.days + ' days before vs ' + ROLLOUT.days + ' days after the rollout.', target: '[data-tap="pane"][data-v="ai"]', done: function (S) { return S.seen.impact; } },
        { text: 'change the period. The before/after cards stay; the AI-involved split below follows the period.', target: '#dv-span-trends', done: function (S) { return S.seen.impactSpan; } }
      ],
      setup: [
        { text: 'tick a project and click <strong>Next</strong>. Try <strong>Support Desk</strong> too: without releases the wizard recommends <strong>Issues reaching a status</strong>.', target: '[data-cue="pick"]', done: function (S) { return S.seen.page2; } },
        { text: 'open <strong>Advanced</strong> (Pro): incident types and sub-tasks.', target: '[data-cue="adv"]', done: function (S) { return S.seen.more; } },
        { text: 'click <strong>Use recommended settings</strong>, or go on to step 3 (AI rollout, Pro) and click <strong>Save</strong>.', target: '[data-cue="finish"], [data-tap="next"]', done: function (S) { return S.seen.saved; } }
      ]
    },
    doneText: {
      overview: '<strong>That’s the Overview.</strong> Every number has a band, a sentence and its calculation. On <em>Last 12 months</em> the arrows give way to “not enough history”: the first analysis reads 12 months.',
      trends: '<strong>Before and after, equally long.</strong> Both sides last as long as the time since the rollout, at most a year.',
      setup: '<strong>Set up in about a minute.</strong> Everything has a recommended value, and you can change it later.'
    },
    setup: function (a) {
      api = a;
      function S() { return api.state(); }
      function view() { return S().views[api.tab()]; }
      function wiz() { return S().wiz; }
      function focusFid(fid) { var n = fid && api.el('[data-fid="' + fid + '"]'); if (n) n.focus(); }

      function openDialog(kind, m, from) {
        S().dialog = { where: api.tab(), kind: kind, m: m, from: from };
        api.update();
        focusFid('close');
      }
      function closeDialog() {
        var d = S().dialog;
        if (!d) return;
        S().dialog = null;
        api.update();
        focusFid(d.from);
      }
      function prepareWizard() {
        var w = wiz(), p = chosen(w);
        if (!p) return;
        if (!w.deploy) w.deploy = releasesFit(p) ? 'releases' : 'status';
        w.doneStatus = p.statuses.map(function (s) { return s[1] === 'done'; });
        w.incident = p.types.map(function (t) { return !!DEFAULT_INCIDENT_TYPES[t]; });
        w.aiTypes = [];
      }
      function addLabel(input) {
        var w = wiz(), v = input.value.trim().toLowerCase();
        if (!v || w.labels.indexOf(v) >= 0 || w.labels.length >= 10) return;
        w.labels.push(v);
        api.update();
        focusFid('new-label');
      }
      function startAnalysis() {
        var state = S(), w = state.wiz;
        w.saved = true; w.pct = 4; state.seen.saved = true;
        api.update();
        var timer = setInterval(function () {
          if (api.state() !== state) { clearInterval(timer); return; }
          w.pct = Math.min(100, w.pct + 8 + Math.random() * 7);
          if (w.pct >= 100) clearInterval(timer);
          if (api.tab() === 'setup') api.update();
        }, 240);
      }

      var TAP = {
        pane: function (el) {
          view().pane = el.dataset.v;
          if (api.tab() === 'trends' && el.dataset.v === 'ai') S().seen.impact = true;
          api.update();
        },
        metric: function (el) {
          view().metric = el.dataset.m;
          if (el.dataset.m !== 'lt') S().seen.metric = true;
          api.update();
        },
        bucket: function (el) { view().bucket = el.dataset.m; api.update(); },
        explain: function (el) {
          if (el.dataset.m === 'lt') S().seen.explain = true;
          openDialog('explain', el.dataset.m, 'explain-' + el.dataset.m);
        },
        details: function () {
          if (api.tab() === 'overview') S().seen.details = true;
          openDialog('details', null, 'details');
        },
        close: closeDialog,
        scrim: function (el, e) { if (e.target === el) closeDialog(); },
        refresh: function () { api.toast('Data refreshed. At most once per project every 10 minutes'); },
        'export': function (el) {
          var x = el.dataset.x, pane = view() ? view().pane : 'overview';
          api.toast(x === 'csv' ? 'In your Jira: a CSV with one row per week'
            : x === 'png' ? (pane === 'trends' ? 'In your Jira: this chart as a PNG' : 'In your Jira: a report image of the four tiles')
              : 'In your Jira: a Markdown summary to paste');
        },
        next: function () {
          var w = wiz();
          if (!w.picked.length) return;
          w.page += 1;
          if (w.page === 2) S().seen.page2 = true;
          api.update();
        },
        back: function () { wiz().page -= 1; api.update(); },
        more: function () { var w = wiz(); w.more = !w.more; if (w.more) S().seen.more = true; api.update(); },
        finish: startAnalysis,
        'drop-label': function (el) { wiz().labels.splice(Number(el.dataset.i), 1); api.update(); focusFid('new-label'); },
        'add-pin': function () {
          var w = wiz(), text = w.pinText.trim();
          if (!(w.pinDate && text)) { api.toast('Pick a date and type a label first'); return; }
          if (w.pins.length >= 5) { api.toast('At most 5 markers'); return; }
          w.pins.push({ date: w.pinDate, label: text });
          w.pinDate = ''; w.pinText = '';
          api.update();
        },
        'drop-pin': function (el) { wiz().pins.splice(Number(el.dataset.i), 1); api.update(); }
      };
      var PICK = {
        span: function (el) {
          view().span = el.value;
          if (api.tab() === 'overview' && el.value !== '30') S().seen.span = true;
          if (api.tab() === 'trends' && view().pane === 'ai') S().seen.impactSpan = true;
          api.update();
        },
        bands: function (el) { view().bands = el.checked; api.update(); },
        project: function (el) {
          var w = wiz(), k = el.dataset.k, at = w.picked.indexOf(k);
          if (el.checked && at < 0) w.picked.push(k);
          if (!el.checked && at >= 0) w.picked.splice(at, 1);
          prepareWizard();
          api.update();
        },
        deploy: function (el) { wiz().deploy = el.value; api.update(); },
        status: function (el) { wiz().doneStatus[Number(el.dataset.i)] = el.checked; },
        incident: function (el) { wiz().incident[Number(el.dataset.i)] = el.checked; },
        subtasks: function (el) { wiz().subtasks = el.checked; },
        signal: function (el) { wiz().signals[el.dataset.k] = el.checked; },
        'ai-type': function (el) {
          var list = wiz().aiTypes, i = Number(el.dataset.i), at = list.indexOf(i);
          if (el.checked && at < 0) list.push(i);
          if (!el.checked && at >= 0) list.splice(at, 1);
        }
      };
      var TYPE = {
        rollout: function (el) { wiz().rollout = el.value; },
        'pin-date': function (el) { wiz().pinDate = el.value; },
        'pin-text': function (el) { wiz().pinText = el.value; }
      };

      api.on('click', '[data-tap]', function (el, e) { var fn = TAP[el.dataset.tap]; if (fn) fn(el, e); });
      api.on('change', '[data-pick]', function (el) { var fn = PICK[el.dataset.pick]; if (fn) fn(el); });
      api.on('input', '[data-type]', function (el) { var fn = TYPE[el.dataset.type]; if (fn) fn(el); });

      host.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && S().dialog) { e.preventDefault(); closeDialog(); return; }
        if (e.key === 'Enter' && e.target && e.target.getAttribute && e.target.getAttribute('data-type') === 'label') {
          e.preventDefault();
          addLabel(e.target);
        }
      });
      var knownWidth = host.clientWidth;
      window.addEventListener('resize', function () {
        clearTimeout(resizeWait);
        resizeWait = setTimeout(function () {
          if (host.clientWidth === knownWidth) return;
          knownWidth = host.clientWidth;
          if (api.tab() !== 'setup') api.update();
        }, 180);
      });
    }
  });
})();
