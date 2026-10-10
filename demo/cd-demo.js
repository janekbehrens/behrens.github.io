/* ============================================================
   cd-demo.js — interactive demo for CodeDoc AI for Confluence
   Sample data and fixed behavior only; written for the website,
   not taken from the app. The sync block sample choices have
   stored answers; no repository extraction
   or provider integration runs here. The AI page is a
   precomputed sample: nothing is sent to an AI provider, and the
   numbers of files, tokens and credits are fixed sample values.
   ============================================================ */
(function () {
  'use strict';
  var root = document.querySelector('[data-demo="cd"]');
  if (!root || !window.JBDemo) return;
  var D = window.JBDemo, esc = D.esc;

  // ── Small building blocks ──
  var ICON = {
    refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/></svg>',
    plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    pencil: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>',
    git: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7M18 10.5c0 4-6 3-10.5 6"/></svg>',
    block: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1868DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><polyline points="8 12 11 15 16 9"/></svg>'
  };
  function q(text, label) {
    return '<span class="cd-q" tabindex="0" role="img" title="' + esc(text) + '" aria-label="' + esc((label || 'About this field') + ': ' + text) + '">?</span>';
  }
  function fieldLabel(id, text, help, required) {
    return '<div class="cd-lbl"><label for="' + id + '">' + esc(text) + (required ? ' *' : '') + '</label>' + (help ? q(help, 'About ' + text) : '') + '</div>';
  }
  function pill(text, tone) { return '<span class="cd-pill is-' + tone + '">' + esc(text) + '</span>'; }
  function loz(text, tone) { return '<span class="d-loz is-' + tone + '">' + esc(text) + '</span>'; }
  function sel(id, opts, value, extra) {
    return '<select class="d-select" id="' + id + '" data-fid="' + id + '"' + (extra || '') + '>' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + (o[2] ? ' disabled' : '') + '>' + esc(o[1]) + '</option>';
    }).join('') + '</select>';
  }
  function msg(tone, title, body) {
    return '<div class="cd-msg is-' + tone + '" role="' + (tone === 'error' || tone === 'warning' ? 'alert' : 'status') + '">' +
      (title ? '<b>' + esc(title) + '</b>' : '') + body + '</div>';
  }
  function next(on) { return on ? ' data-next="1"' : ''; }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }

  // Timers stop when the demo was reset in the meantime.
  var API = null;
  function later(S, fn, ms) {
    setTimeout(function () { if (API && API.state() === S) fn(); }, ms);
  }
  function refresh(tab) {
    if (!API) return;
    if (!tab || API.tab() === tab) API.update(); else API.refreshHint();
  }

  // ============================================================
  // Sample repository: helm/examples (the push in the demo is made up)
  // ============================================================
  var REPO = 'helm/examples';
  var SAMPLE_LINK = 'https://github.com/helm/examples/blob/main/charts/hello-world/Chart.yaml';
  var CHART = 'charts/hello-world/Chart.yaml';
  var FILES = [
    '.github/workflows/lint-test.yaml', '.gitignore', 'CODEOWNERS', 'LICENSE', 'README.md', 'ct.yaml',
    'charts/hello-world/.helmignore', CHART, 'charts/hello-world/README.md',
    'charts/hello-world/templates/NOTES.txt', 'charts/hello-world/templates/_helpers.tpl',
    'charts/hello-world/templates/deployment.yaml', 'charts/hello-world/templates/service.yaml',
    'charts/hello-world/templates/serviceaccount.yaml', 'charts/hello-world/values.yaml'
  ];
  var COMMON = ['README.md', CHART, 'charts/hello-world/values.yaml'];

  function chartText(rev) {
    return ['apiVersion: v2', 'name: hello-world', 'description: A Helm chart for Kubernetes', 'type: application',
      'version: ' + (rev ? '0.2.0' : '0.1.0'), 'appVersion: "' + (rev ? '1.17.0' : '1.16.0') + '"'].join('\n');
  }
  var CONTENT = {
    'charts/hello-world/Chart.yaml': {
      kind: 'yaml',
      text: function (rev) { return chartText(rev); }
    },
    'charts/hello-world/values.yaml': {
      kind: 'yaml',
      text: function () { return ['replicaCount: 1', '', 'image:', '  repository: nginx', '  pullPolicy: IfNotPresent', '  tag: ""', '', 'service:', '  type: ClusterIP', '  port: 80'].join('\n'); }
    },
    'README.md': {
      kind: 'md',
      text: function () {
        return ['# Helm examples', '', 'Example charts that show how a Helm chart is built.', '', '## Installation', '', 'Install the sample chart into your cluster:', '',
          '```console', 'helm install hello-world ./charts/hello-world', '```', '', '## Configuration', '', 'All settings are in `charts/hello-world/values.yaml`.'].join('\n');
      }
    },
    'charts/hello-world/templates/service.yaml': {
      kind: 'tpl',
      text: function () {
        return ['apiVersion: v1', 'kind: Service', 'metadata:', '  name: {{ include "hello-world.fullname" . }}', 'spec:', '  type: {{ .Values.service.type }}',
          '  ports:', '    - port: {{ .Values.service.port }}', '      targetPort: http', '      protocol: TCP', '      name: http', '  selector:',
          '    {{- include "hello-world.selectorLabels" . | nindent 4 }}'].join('\n');
      }
    },
    'charts/hello-world/templates/deployment.yaml': {
      kind: 'tpl',
      text: function () {
        return ['apiVersion: apps/v1', 'kind: Deployment', 'metadata:', '  name: {{ include "hello-world.fullname" . }}', 'spec:', '  replicas: {{ .Values.replicaCount }}',
          '  selector:', '    matchLabels:', '      {{- include "hello-world.selectorLabels" . | nindent 6 }}', '  template:', '    spec:', '      containers:',
          '        - name: {{ .Chart.Name }}', '          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"',
          '          imagePullPolicy: {{ .Values.image.pullPolicy }}', '          ports:', '            - name: http', '              containerPort: 80'].join('\n');
      }
    }
  };

  var KINDS = [
    ['keys', 'Value(s) from a YAML or JSON file, e.g. a version number'],
    ['md', 'Section of a Markdown file, e.g. "Installation" from the README'],
    ['log', 'Latest entry of a CHANGELOG file'],
    ['whole', 'Whole file (Markdown formatted, other files as code)'],
    ['snip', 'Code snippet between two marker comments (follows the code when lines move)'],
    ['span', 'Line range of any file, shown as code'],
    ['re', 'Text found by a regular expression, e.g. the base image in a Dockerfile']
  ];
  var KIND_SHORT = { keys: 'value', re: 'regex match', md: 'Markdown section', log: 'latest changelog entry', snip: 'code snippet', span: 'line range', whole: 'whole file' };
  var HOW_OFTEN = [['day', 'Daily'], ['week', 'Weekly'], ['git', 'On every push to the branch'], ['hand', 'Only manually ("Update now")']];
  var OFTEN_SHORT = { day: 'daily', week: 'weekly', git: 'on every push', hand: 'manually' };
  var OFTEN_HINT = {
    day: 'CodeDoc checks the file once a day and changes the page only when the content changed.',
    week: 'CodeDoc checks the file once a week and changes the page only when the content changed.',
    git: 'Needs the CodeDoc webhook in your repository (CodeDoc → Settings → Webhook). Without it, choose Daily.',
    hand: 'The block changes only when a CodeDoc Job Operator clicks "Update now" on the page.'
  };
  var KIND_HINT = {
    keys: 'One key path per line, for example image.tag. Optional label: Version = image.tag. Use [0] for list items and * for all entries (services.*.image.tag). Several values are shown as a table.',
    re: 'The first group in parentheses is shown, for example ^FROM\\s+(\\S+). Several matches are shown as a table.',
    md: 'Everything below this heading up to the next heading of the same level. Write the heading without the # characters.',
    log: 'Shows the newest release entry with its heading. An "Unreleased" entry is skipped.',
    snip: 'Mark the code in the file with two comment lines, for example # codedoc:start install and # codedoc:end install, and enter install here. AsciiDoc tags (tag::install[] … end::install[]) and [START install] … [END install] work too.',
    span: 'For example 10-25, or 42 for a single line. Shown as a code block. If lines are added above, the block shows other lines; a snippet does not have this problem.',
    whole: 'Markdown files are shown formatted, other files as a code block. Long files are cut after 20,000 characters.'
  };
  var KIND_FIELD = { keys: 'keyText', re: 'expr', md: 'head', snip: 'snipName', span: 'spanText' };
  var NEEDED = {
    repo: 'Choose a repository.', path: 'Enter the path of the file.', keyText: 'Enter at least one key path.', expr: 'Enter a regular expression.',
    head: 'Enter the heading of the section.', snipName: 'Enter the name of the snippet.', spanText: 'Enter a line range such as 10-25.'
  };

  // File suggestions and preview answers belong only to this sample repository.
  var SAMPLE_MODES = {
    '.github/workflows/lint-test.yaml': 'keys', 'ct.yaml': 'keys',
    'charts/hello-world/Chart.yaml': 'keys', 'charts/hello-world/values.yaml': 'keys',
    'charts/hello-world/templates/deployment.yaml': 'keys',
    'charts/hello-world/templates/service.yaml': 'keys',
    'charts/hello-world/templates/serviceaccount.yaml': 'keys',
    'README.md': 'md', 'charts/hello-world/README.md': 'md'
  };
  function sampleMode(path) { return SAMPLE_MODES[path] || 'whole'; }
  function looksYaml(path) { return SAMPLE_MODES[path] === 'keys'; }
  function looksMd(path) { return SAMPLE_MODES[path] === 'md'; }
  function show(value) { return value == null ? '' : String(value); }
  function codeHtml(text, numbers) {
    var rows = text.split('\n').map(function (line) { return '<li>' + (esc(line) || ' ') + '</li>'; });
    return '<div class="cd-code' + (numbers === false ? ' no-num' : '') + '"><ol>' + rows.join('') + '</ol></div>';
  }
  function sampleKeys(path, rev) {
    if (path === CHART) return [
      ['apiVersion', 'v2'], ['name', 'hello-world'], ['description', 'A Helm chart for Kubernetes'],
      ['type', 'application'], ['version', rev ? '0.2.0' : '0.1.0'], ['appVersion', rev ? '1.17.0' : '1.16.0']
    ];
    if (path === 'charts/hello-world/values.yaml') return [
      ['replicaCount', 1], ['image.repository', 'nginx'], ['image.pullPolicy', 'IfNotPresent'],
      ['image.tag', ''], ['service.type', 'ClusterIP'], ['service.port', 80]
    ];
    return [];
  }
  var README_HEADINGS = [['Helm examples', 1], ['Installation', 2], ['Configuration', 2]].map(function (row) {
    return { text: row[0], depth: row[1] };
  });
  var INSTALL_SAMPLE = '<p>Install the sample chart into your cluster:</p>' +
    codeHtml('helm install hello-world ./charts/hello-world', false);
  var CONFIG_SAMPLE = '<p>All settings are in <code>charts/hello-world/values.yaml</code>.</p>';
  function sampleHeading(text, depth, shift) {
    return '<div class="cd-md-h is-h' + (depth + (shift ? 1 : 0)) + '">' + text + '</div>';
  }
  function readmeSample(part, shift) {
    if (part === 'Configuration') return CONFIG_SAMPLE;
    if (part === 'Installation') return INSTALL_SAMPLE;
    return '<p>Example charts that show how a Helm chart is built.</p>' +
      sampleHeading('Installation', 2, shift) + INSTALL_SAMPLE + sampleHeading('Configuration', 2, shift) + CONFIG_SAMPLE;
  }
  function demoAnswerMissing(choice, available) {
    return { error: 'Sample data: this demo has no result for "' + choice + '".',
      hint: 'Try one of the sample choices: ' + available + '.' };
  }
  function sampleProblem(message, advice) {
    var result = { error: message };
    if (advice) result.hint = advice;
    return result;
  }
  function yamlProblem() {
    return sampleProblem('The file is not valid YAML or JSON.',
      'Key paths only work with YAML or JSON files. For other files choose a regular expression, a line range or the whole file.');
  }
  function fileProblem(path, branch) {
    return sampleProblem('Could not read ' + path + ' on branch ' + (branch || 'main') + ': the file or the branch does not exist (HTTP 404).',
      'Check the file path and the branch in the block settings. Paths are case-sensitive; copy the path from your Git provider (the part after the branch name).');
  }
  function sampleValuePreview(config, revision) {
    var answers = new Map(sampleKeys(config.path, revision)), picked = [];
    // Labels decorate stored answers. Dots, brackets and wildcards are never interpreted.
    for (var entry of config.keyText.split('\n')) {
      var request = entry.trim().split(/\s*=\s*/);
      var choice = request.pop(), caption = request.join('=');
      if (!choice && !caption) continue;
      if (!answers.has(choice)) return demoAnswerMissing(choice, Array.from(answers.keys()).join(', '));
      picked.push([caption || choice, show(answers.get(choice)), caption]);
    }
    if (picked.length < 2) {
      var value = picked[0];
      return { html: value ? '<p>' + (value[2] ? '<strong>' + esc(value[2]) + ': </strong>' : '') +
        '<code>' + (esc(value[1]) || '—') + '</code></p>' : sampleTable([], ['Key', 'Value']) };
    }
    return { html: sampleTable(picked, ['Key', 'Value']) };
  }
  function sampleTable(rows, titles) {
    var cells = rows.map(function (row) {
      return '<tr><td>' + esc(row[0]) + '</td><td>' + (row[1] === '' ? '' : '<code>' + esc(row[1]) + '</code>') + '</td></tr>';
    });
    return '<div class="d-table-wrap"><table class="cd-table"><thead><tr><th>' + titles[0] + '</th><th>' + titles[1] +
      '</th></tr></thead><tbody>' + cells.join('') + '</tbody></table></div>';
  }
  function samplePattern(config, revision) {
    var examples = new Map();
    if (config.path === CHART) {
      var version = revision ? '0.2.0' : '0.1.0', app = revision ? '1.17.0' : '1.16.0';
      examples.set('^version: (.*)', version);
      examples.set('^version:\\s+(\\S+)', version);
      examples.set('^appVersion: "(.*)"', app);
      examples.set('^appVersion:\\s+"?([^"\\s]+)"?', app);
      examples.set('^name: (.*)', 'hello-world');
    }
    if (config.path === 'charts/hello-world/values.yaml') {
      examples.set('^  repository: (.*)', 'nginx');
      examples.set('nginx', 'nginx');
    }
    if (examples.has(config.expr)) return { html: '<p><code>' + esc(examples.get(config.expr)) + '</code></p>' };
    if (config.expr.length > 200) return sampleProblem('The regular expression is longer than 200 characters.');
    if (config.expr === '^FROM\\s+(\\S+)') return sampleProblem('The regular expression matched nothing in the file.',
      'The expression runs line by line (^ and $ match line starts and ends). The first group in parentheses is shown.');
    return demoAnswerMissing(config.expr, Array.from(examples.keys()).join(', ') || 'Whole file');
  }
  var LINE_ADVICE = 'Enter a line range such as 10-25, or a single line such as 42.';
  function sampleLines(config, text) {
    var endpoints = config.spanText.trim().split('-');
    var valid = endpoints.length < 3 && endpoints.every(function (part) { return /^[0-9]+$/.test(part.trim()); });
    var start = Number(endpoints[0]), stop = endpoints.length === 1 ? start : Number(endpoints[1]);
    if (!valid || start === 0 || stop < start) return sampleProblem('The line range must look like "10-25".', LINE_ADVICE);
    var lines = text.split('\n');
    if (start > lines.length) return sampleProblem('The file has only ' + lines.length + ' lines.', LINE_ADVICE);
    // A local text preview of the selected sample, with no file access or sync rules.
    var excerpt = lines.filter(function (_, index) { return index >= start - 1 && index < stop; });
    return { html: codeHtml(excerpt.join('\n')) };
  }
  function samplePreview(config, revision) {
    var sample = CONTENT[config.path];
    if (!FILES.includes(config.path) || (config.branch && config.branch !== 'main')) return fileProblem(config.path, config.branch);
    if (!sample) return sampleProblem('Sample data: this demo has no content for ' + config.path + '.',
      'Choose Chart.yaml, values.yaml, README.md or one of the two templates (deployment.yaml, service.yaml).');
    switch (config.kind) {
      case 'keys': return sample.kind === 'yaml' ? sampleValuePreview(config, revision) : yamlProblem();
      case 're': return samplePattern(config, revision);
      case 'md':
        if (config.path !== 'README.md') return sampleProblem('Heading "' + config.head.trim() + '" was not found in the file. The file has no headings.',
          'Enter the heading text without the # characters, as it appears in the file.');
        var heading = config.head.trim().toLowerCase();
        var selected = README_HEADINGS.find(function (item) { return item.text.toLowerCase().startsWith(heading); });
        if (!selected) return sampleProblem('Heading "' + config.head.trim() + '" was not found in the file. Headings in the file: Helm examples, Installation, Configuration.',
          'Enter the heading text without the # characters, as it appears in the file.');
        return { html: readmeSample(selected.text, config.shift) };
      case 'log':
        // The existing README preview has this fixed first entry; the other samples have no headings.
        return config.path === 'README.md' ? { html: sampleHeading('Installation', 2, config.shift) + INSTALL_SAMPLE } : sampleProblem('The changelog has no headings.');
      case 'snip': return sampleProblem('Snippet "' + config.snipName.trim() + '" was not found in the file. The file has no snippet markers yet.',
        'Mark the code in the file with two comment lines, e.g. "# codedoc:start install" and "# codedoc:end install", and enter install as the snippet name. AsciiDoc tags (tag::install[]) work too.');
      case 'span': return sampleLines(config, sample.text(revision));
      default: return { html: config.path === 'README.md' ? sampleHeading('Helm examples', 1, config.shift) + readmeSample('Helm examples', config.shift) : codeHtml(sample.text(revision)) };
    }
  }
  function sourceText(c) { return REPO + ' · ' + c.path + ' (' + (c.branch || 'main') + ')'; }
  function sourceLine(c) {
    return '<p class="cd-src"><em>Synced by CodeDoc from <span class="cd-fakelink" title="Opens the file in GitHub (not in this demo)">' + esc(sourceText(c)) + '</span></em></p>';
  }

  // ============================================================
  // Tab 1 · Sync block
  // ============================================================
  function blankDialog() {
    return { link: SAMPLE_LINK, linkMsg: null, repo: '', path: '', branch: '', kind: 'keys', keyText: '', expr: '', head: '', snipName: '', spanText: '', shift: false,
      often: 'day', offers: null, preview: null, markGaps: false };
  }
  function settingsOf(f) {
    return { repo: f.repo, path: f.path.trim(), branch: f.branch.trim(), kind: f.kind, keyText: f.keyText, expr: f.expr, head: f.head, snipName: f.snipName, spanText: f.spanText, shift: f.shift, often: f.often };
  }
  function sigOf(c) { return JSON.stringify(c); }
  function gapsOf(f) {
    var list = [];
    if (!f.repo) list.push('repo');
    if (!f.path.trim()) list.push('path');
    var k = KIND_FIELD[f.kind];
    if (k && !String(f[k] || '').trim()) list.push(k);
    return list;
  }

  function renderSync(S) {
    var B = S.sb, stage = B.stage;
    var ctx = '<div class="d-context cd-ctx"><span>Spaces</span><span class="d-sep">/</span><span>Platform</span><span class="d-sep">/</span><b>hello-world — Service Runbook</b>' +
      (stage === 'view' ? '' : '<span class="cd-ctx-tag">Editing</span>') +
      (stage === 'editor' ? '<button type="button" class="d-btn is-primary is-compact cd-ctx-btn" data-publish' + next(true) + '>Publish</button>' : '') + '</div>';
    if (stage === 'dialog') return ctx + '<div class="cd-pad">' + renderDialog(S) + '</div>';

    var slot;
    if (stage === 'edit' || stage === 'menu') {
      slot = '<button type="button" class="cd-slash" data-slash data-fid="slash"' + next(stage === 'edit') + '>Type <kbd>/</kbd> to insert a block…</button>' +
        (stage === 'menu' ? '<div class="d-pop cd-menu" role="menu" aria-label="Insert a block">' +
          '<div class="cd-menu-q">' + ICON.search + '<span>/codedoc</span></div>' +
          '<div class="d-app cd-menu-app"><span class="d-app-tag">CodeDoc</span><button type="button" class="cd-menu-item" role="menuitem" data-insert data-fid="insert"' + next(true) + '>' + ICON.block +
          '<span><b>CodeDoc Sync Block</b><span>Keeps a value, table or section from a file in your Git repository up to date on this page.</span></span></button></div></div>' : '');
    } else {
      slot = blockHtml(S);
    }
    return ctx + '<div class="cd-sync">' +
      '<div class="cd-page">' +
      '<h3 class="cd-page-title">hello-world — Service Runbook</h3>' +
      '<p class="d-sub cd-page-intro">How to run and release the hello-world service.</p>' +
      '<h4 class="cd-page-h">Current release</h4>' + slot +
      '<h4 class="cd-page-h cd-page-later">Rollback</h4><p class="d-sub">Roll back with <code>helm rollback hello-world</code>, then check the pods.</p>' +
      '</div>' + renderRepoCard(S) + '</div>';
  }

  function blockHtml(S) {
    var B = S.sb, c = B.cfg, editing = B.stage === 'editor';
    var body = B.content ? B.content.html : '';
    var inner = '';
    if (editing) {
      inner = (body ? '<div class="cd-block-body">' + body + sourceLine(c) + '</div>' : '<p>The content appears here after you save the settings (pencil icon).</p>') +
        '<div class="cd-status"><span class="cd-brand" title="Kept up to date by the CodeDoc app from ' + esc(REPO + ' · ' + c.path) + '. Manual edits to this content are replaced on the next update.">' + ICON.refresh + 'CodeDoc Sync Block</span>' +
        '<span class="d-faint d-small">' + esc([REPO + ' · ' + c.path, KIND_SHORT[c.kind], 'updates ' + OFTEN_SHORT[c.often]].join(' · ')) + '</span></div>' +
        (body ? '<p class="d-faint d-small cd-note">Synced content: edits made here are replaced on the next update. Change the source with the pencil icon.</p>' : '') +
        '<button type="button" class="d-btn is-compact cd-edit" data-reopen title="Edit the block settings" aria-label="Edit the sync block settings">' + ICON.pencil + 'Edit</button>';
    } else {
      var failed = !!B.error;
      inner = (body ? '<div class="cd-block-body' + (B.flash ? ' is-flash' : '') + '">' + body + sourceLine(c) + '</div>' : '') +
        (failed ? msg('warning', 'CodeDoc Sync Block: last update failed', '<p>' + esc(B.error.error) + '</p>' + (B.error.hint ? '<p>What to do: ' + esc(B.error.hint) + '</p>' : '') +
          (body ? '<p class="d-small">The content shown is from the last successful update.</p>' : '')) : '') +
        '<div class="cd-status">' +
        '<span class="cd-brand" tabindex="0" title="Kept up to date by the CodeDoc app from ' + esc(REPO + ' · ' + c.path) + '. Manual edits to this content are replaced on the next update. To change the source, edit the page, select this block and click the pencil icon (Edit).">' + ICON.refresh + 'CodeDoc Sync Block</span>' +
        '<span title="' + (failed ? 'The last update failed; the block keeps the content of the last successful update.' : 'CodeDoc keeps this block up to date from the file in the repository.') + '">' + loz(failed ? 'Update failed' : 'In sync', failed ? 'red' : 'green') + '</span>' +
        '<span class="d-faint d-small">Checked ' + esc(B.checked) + '</span>' +
        ('<button type="button" class="d-btn is-subtle is-compact cd-updnow" data-updnow' + (B.busy ? ' disabled' : '') + next(B.pushed && !B.checkedAfterPush && B.cfg.often !== 'git') +
          ' title="Reads the file from the repository now and updates this block if the content changed. No new page version is created when nothing changed.">' + ICON.refresh + 'Update now</button>') +
        '<button type="button" class="cd-linkbtn" data-manage title="Opens the CodeDoc app: all sync blocks with their status, repositories and settings.">Manage</button>' +
        '</div>' +
        (B.note ? '<p class="d-small cd-note" role="status">' + esc(B.note) + '</p>' : '');
    }
    return '<div class="d-app cd-block"><span class="d-app-tag">CodeDoc</span>' + inner + '</div>';
  }

  function renderRepoCard(S) {
    var B = S.sb, lines = chartText(B.rev).split('\n');
    var changed = B.rev ? [4, 5] : [];
    return '<aside class="cd-repo" aria-label="Sample repository (demo control)">' +
      '<div class="cd-repo-tag">Demo control · stands in for your Git repository</div>' +
      '<div class="cd-repo-head">' + ICON.git + '<b>helm/examples</b><span class="d-faint d-small">main</span></div>' +
      '<div class="d-small d-faint cd-repo-path">' + esc(CHART) + '</div>' +
      '<div class="cd-code cd-repo-code"><ol>' + lines.map(function (l, i) { return '<li' + (changed.indexOf(i) > -1 ? ' class="is-new"' : '') + '>' + esc(l) + '</li>'; }).join('') + '</ol></div>' +
      (B.rev ? '<p class="d-small cd-repo-commit">Pushed to <b>main</b>: “Release 1.17.0” · just now</p>' :
        '<button type="button" class="d-btn cd-push" data-push' + next(B.stage === 'view' && !B.pushed) + '>' + ICON.git + 'Simulate a push</button><p class="d-small d-faint">Changes appVersion to 1.17.0 and version to 0.2.0.</p>') +
      '</aside>';
  }

  function renderDialog(S) {
    var f = S.sb.dlg, c = settingsOf(f), missing = gapsOf(f), key = sigOf(c);
    var cur = f.preview && f.preview.key === key ? f.preview : null;
    function err(k) { return f.markGaps && missing.indexOf(k) > -1 ? '<p class="cd-err">' + NEEDED[k] + '</p>' : ''; }
    var sb2 = S.sb.linked && !S.sb.saved;
    var keysNext = sb2 && f.kind === 'keys' && looksYaml(f.path) && !f.offers;
    var pickNext = sb2 && f.kind === 'keys' && f.offers && !f.offers.error && !f.keyText.trim();
    var prevNext = sb2 && !keysNext && !pickNext && !cur;
    var saveNext = sb2 && !keysNext && !pickNext && !!cur && !cur.error;

    // Source
    var linkRes = f.linkMsg ? (f.linkMsg.ok ? '<p class="cd-ok">' + esc(f.linkMsg.text) + '</p>' : '<p class="cd-err">' + esc(f.linkMsg.text) + '</p>') : '<p class="d-help">Or choose repository and file below.</p>';
    var src = '<div class="cd-sec"><h4 class="cd-h4">Source</h4>' +
      '<div class="cd-field">' + fieldLabel('cd-link', 'Paste a link to the file', 'Open the file in GitHub, GitLab, Bitbucket or Azure DevOps and copy the address from the browser. CodeDoc fills in repository, branch and path. The repository must be connected in CodeDoc.') +
      '<div class="cd-row"><input class="d-input cd-grow" id="cd-link" data-fid="cd-link" type="url" value="' + esc(f.link) + '" placeholder="https://github.com/owner/repo/blob/main/charts/app/Chart.yaml" spellcheck="false">' +
      '<button type="button" class="d-btn" data-uselink' + (f.link.trim() ? '' : ' disabled') + next(!S.sb.linked) + '>Use link</button></div>' + linkRes + '</div>' +
      '<div class="cd-field">' + fieldLabel('cd-repo', 'Repository', 'Repositories connected in the CodeDoc app. CodeDoc reads the file with the access token stored there; nothing about the token is saved on this page.', true) +
      sel('cd-repo', [['', 'Choose a repository'], [REPO, 'helm/examples (GitHub)']], f.repo, ' data-dlg="repo"') + err('repo') + '</div>';
    if (f.repo) {
      src += '<div class="cd-field">' + fieldLabel('cd-find', 'Find a file', 'Type part of a file name to search the repository. The list shows up to 50 matches.') +
        sel('cd-find', [['', 'Search 15 files…']].concat(FILES.map(function (p) { return [p, p]; })), '', ' data-dlg="find"') +
        '<div class="cd-common"><span class="d-small d-faint">Common files:</span>' + COMMON.map(function (p) {
          return '<button type="button" class="d-btn is-compact ' + (f.path === p ? 'is-selected' : 'is-subtle') + '" data-common="' + esc(p) + '">' + esc(p) + '</button>';
        }).join('') + '</div></div>';
    }
    src += '<div class="cd-field">' + fieldLabel('cd-path', 'File path', 'The path inside the repository, as shown by your Git provider after the branch name. Paths are case-sensitive.', true) +
      '<input class="d-input cd-full" id="cd-path" data-fid="cd-path" data-text="path" value="' + esc(f.path) + '" placeholder="deploy/values.yaml" spellcheck="false">' +
      (err('path') || '<p class="d-help">For example charts/app/Chart.yaml, README.md or CHANGELOG.md.</p>') + '</div>' +
      '<div class="cd-field">' + fieldLabel('cd-branch', 'Branch', 'Leave empty to use the branch CodeDoc detected when the repository was connected. Enter a branch name to follow another branch, for example release/2.x.') +
      '<input class="d-input cd-full" id="cd-branch" data-fid="cd-branch" data-text="branch" value="' + esc(f.branch) + '" placeholder="' + (f.repo ? 'main (repository default)' : 'Repository default') + '" spellcheck="false"></div></div>';

    var what = '<div class="cd-sec"><h4 class="cd-h4">What to show</h4><div class="cd-radios" role="radiogroup" aria-label="What to show">' + KINDS.map(function (m) {
      return '<label class="cd-radio"><input type="radio" name="cd-mode" value="' + m[0] + '" data-kind data-fid="kind-' + m[0] + '"' + (f.kind === m[0] ? ' checked' : '') + '> ' + esc(m[1]) + '</label>';
    }).join('') + '</div></div>';

    // Field of the chosen kind
    var mf = '';
    if (f.offers && f.offers.error) mf += msg('warning', 'The file could not be read', '<p>' + esc(f.offers.error) + '</p>' + (f.offers.hint ? '<p>What to do: ' + esc(f.offers.hint) + '</p>' : ''));
    if (f.kind === 'keys') {
      var pick = '';
      if (looksYaml(f.path)) {
        if (f.offers && f.offers.keys) {
          pick = sel('cd-keypick', [['', 'Add a key (' + f.offers.keys.length + ' values in the file)…']].concat(f.offers.keys.map(function (k) { return [k[0], k[0] + ' = ' + (show(k[1]) || '""')]; })), '', ' data-keypick' + next(pickNext));
        } else if (!f.offers) {
          pick = '<button type="button" class="d-btn is-compact" data-keys' + (f.path.trim() ? '' : ' disabled') + next(keysNext) + ' title="Reads the file and lists what can be chosen from it, so you do not have to type it.">' + ICON.search + 'Show the keys of the file</button>';
        }
      }
      mf += '<div class="cd-field">' + fieldLabel('cd-paths', 'Key paths', 'A key path names a value in the file: keys separated by dots, list items by [0]. Example for a Helm chart: image.tag or dependencies[0].version.', true) + pick +
        '<textarea class="d-input cd-full cd-mono" id="cd-paths" data-fid="cd-paths" data-text="keyText" rows="3" placeholder="image.tag&#10;App version = appVersion" spellcheck="false">' + esc(f.keyText) + '</textarea>' +
        (err('keyText') || '<p class="d-help">' + esc(KIND_HINT.keys) + '</p>') + '</div>';
    } else if (f.kind === 'md') {
      var hpick = '';
      if (looksMd(f.path)) {
        if (f.offers && f.offers.headings) hpick = sel('cd-headpick', [['', 'Choose a heading (' + f.offers.headings.length + ' in the file)…']].concat(f.offers.headings.map(function (h) { return [h.text, new Array(h.depth).join('  ') + h.text]; })), '', ' data-headpick');
        else if (!f.offers) hpick = '<button type="button" class="d-btn is-compact" data-keys>' + ICON.search + 'Show the headings of the file</button>';
      }
      mf += '<div class="cd-field">' + fieldLabel('cd-heading', 'Heading', 'If no heading matches exactly, the first heading that starts with this text is used.', true) + hpick +
        '<input class="d-input cd-full" id="cd-heading" data-fid="cd-heading" data-text="head" value="' + esc(f.head) + '" placeholder="Installation">' + (err('head') || '<p class="d-help">' + esc(KIND_HINT.md) + '</p>') + '</div>';
    } else if (f.kind === 'snip') {
      mf += '<div class="cd-field">' + fieldLabel('cd-snippet', 'Snippet name', 'The name after codedoc:start in the file. Letters, numbers, dot, dash and underscore.', true) +
        (f.offers ? '<p class="d-small d-faint">The file has no snippet markers yet.</p>' : '<button type="button" class="d-btn is-compact" data-keys' + (f.path.trim() ? '' : ' disabled') + '>' + ICON.search + 'Show the snippets of the file</button>') +
        '<input class="d-input cd-full cd-mono" id="cd-snippet" data-fid="cd-snippet" data-text="snipName" value="' + esc(f.snipName) + '" placeholder="install">' + (err('snipName') || '<p class="d-help">' + esc(KIND_HINT.snip) + '</p>') + '</div>';
    } else if (f.kind === 'span') {
      mf += '<div class="cd-field">' + fieldLabel('cd-lines', 'Line range', 'Line numbers start at 1. The block keeps showing the same line numbers, even if lines are added above them.', true) +
        '<input class="d-input cd-full" id="cd-lines" data-fid="cd-lines" data-text="spanText" value="' + esc(f.spanText) + '" placeholder="10-25">' + (err('spanText') || '<p class="d-help">' + esc(KIND_HINT.span) + '</p>') + '</div>';
    } else if (f.kind === 're') {
      mf += '<div class="cd-field">' + fieldLabel('cd-pattern', 'Regular expression', 'A JavaScript regular expression, checked line by line (^ and $ match line starts and ends). Maximum 200 characters.', true) +
        '<input class="d-input cd-full cd-mono" id="cd-pattern" data-fid="cd-pattern" data-text="expr" value="' + esc(f.expr) + '" placeholder="^FROM\\s+(\\S+)" spellcheck="false">' + (err('expr') || '<p class="d-help">' + esc(KIND_HINT.re) + '</p>') + '</div>';
    } else {
      mf += '<p class="d-help">' + esc(KIND_HINT[f.kind]) + '</p>';
    }
    if (['md', 'log', 'whole', 'snip'].indexOf(f.kind) > -1 && (looksMd(f.path) || f.kind === 'log')) {
      mf += '<label class="cd-check"><input type="checkbox" data-shift' + (f.shift ? ' checked' : '') + '> Make headings one level smaller (a # heading from the file becomes a level-2 heading on the page)</label>';
    }
    if (f.kind === 'keys' || f.kind === 're') {
      mf += '<label class="cd-check is-off" title="The version check is not part of this demo. The documentation explains it."><input type="checkbox" disabled> Compare with the latest release: show the newest version next to it and whether it is up to date</label>';
    }

    var upd = '<div class="cd-sec"><h4 class="cd-h4">Update</h4><div class="cd-field">' +
      fieldLabel('cd-update', 'How often', 'How CodeDoc keeps the block current. Each real change creates one new page version; when nothing changed, the page is not touched.', true) +
      sel('cd-update', HOW_OFTEN, f.often, ' data-dlg="often"') + '<p class="d-help">' + esc(OFTEN_HINT[f.often]) + '</p></div></div>';

    var prev = '<div class="cd-sec"><div class="cd-row"><h4 class="cd-h4" style="margin:0">Preview</h4>' +
      '<button type="button" class="d-btn" data-preview' + next(prevNext) + ' title="Reads the file now and shows exactly what the block will display. Nothing is saved.">' + ICON.refresh + 'Show preview</button></div>' +
      (cur && cur.html ? '<div class="cd-preview">' + cur.html + sourceLine(c) + '</div>' : '') +
      (cur && cur.error ? msg('warning', 'The preview failed', '<p>' + esc(cur.error) + '</p>' + (cur.hint ? '<p>What to do: ' + esc(cur.hint) + '</p>' : '')) : '') +
      (!cur && f.preview ? '<p class="d-small d-faint">The settings changed since the last preview. Click "Show preview" to see the new result.</p>' : '') + '</div>';

    var actions = (f.markGaps && missing.length ? '<p class="cd-err">Fill in the fields marked above to save.</p>' : '') +
      '<div class="cd-actions"><button type="button" class="d-btn is-subtle" data-cancel title="Closes the settings without saving. A new block is not inserted.">Cancel</button>' +
      (cur && cur.error ? '<button type="button" class="d-btn cd-warnbtn" data-saveanyway title="Saves the settings although the preview failed. The block shows the problem on the page until the file can be read.">Save anyway</button>' : '') +
      '<button type="button" class="d-btn is-primary" data-save' + next(saveNext) + ' title="Checks the settings with a preview, then saves them and puts the content into the block. Publish the page to start the automatic updates.">Save</button></div>';

    return '<div class="d-app cd-dlg" role="dialog" aria-label="CodeDoc Sync Block settings"><span class="d-app-tag">CodeDoc</span>' +
      '<div class="cd-dlg-head"><h3 class="d-h1" style="margin:0">CodeDoc Sync Block</h3><button type="button" class="d-icon-btn" data-cancel aria-label="Close">' + ICON.close + '</button></div>' +
      '<p class="cd-dlg-intro">Shows a value, table, section or code from a file in your Git repository on this page and keeps it up to date. The content becomes normal page text, so Confluence search, exports and the page history include it.</p>' +
      '<div class="cd-dlg-cols"><div>' + src + what + '</div><div><div class="cd-sec">' + mf + '</div>' + upd + prev + actions + '</div></div></div>';
  }

  // Link → repository, branch, path (GitHub links of the sample repository)
  function sampleLink(address) {
    var fixedLinks = new Map(FILES.map(function (path) {
      return ['https://github.com/' + REPO + '/blob/main/' + path, path];
    }));
    var pasted = address.trim();
    if (fixedLinks.has(pasted)) return { repo: REPO, branch: '', path: fixedLinks.get(pasted) };
    if (!pasted.startsWith('https://') && !pasted.startsWith('http://')) return sampleProblem('This is not a web address. Copy the link from the address bar while the file is open in your Git provider.');
    if (pasted === 'https://github.com/helm/examples') return sampleProblem('This GitHub link does not point to a file. Open the file on GitHub and copy the address (it contains /blob/).');
    return demoAnswerMissing(pasted, SAMPLE_LINK);
  }

  function setupSync(api) {
    var S = function () { return api.state(); };
    function F() { return S().sb.dlg; }
    function pickFile(p) { var f = F(); f.path = p; f.kind = sampleMode(p); f.offers = null; }
    function makePreview() {
      var f = F(), c = settingsOf(f), r = samplePreview(c, S().sb.rev);
      f.preview = Object.assign({ html: null, error: null, hint: null }, r, { key: sigOf(c) });
      return f.preview;
    }
    function submit(withContent) {
      var B = S().sb, f = F(), c = settingsOf(f);
      B.cfg = c;
      B.content = withContent && f.preview && f.preview.html ? { html: f.preview.html } : null;
      B.stage = 'editor';
      B.saved = true;
      api.update();
      api.toast('Saved. Publish the page to start the updates.');
    }
    api.on('click', '[data-slash]', function () { S().sb.stage = S().sb.stage === 'menu' ? 'edit' : 'menu'; api.update(); var b = api.el('[data-insert]'); if (b) b.focus(); });
    api.on('click', '[data-insert]', function () {
      var B = S().sb; B.stage = 'dialog';
      if (!B.dlg) B.dlg = blankDialog();
      api.update();
      var b = api.el('[data-uselink]'); if (b) b.focus({ preventScroll: true });
    });
    api.on('input', '#cd-link', function (el) { F().link = el.value; var b = api.el('[data-uselink]'); if (b) b.disabled = !el.value.trim(); });
    api.on('input', '[data-text]', function (el) { F()[el.dataset.text] = el.value; if (el.dataset.text === 'path') F().offers = null; });
    api.on('click', '[data-uselink]', function () {
      var f = F(), r = sampleLink(f.link);
      if (r.error) f.linkMsg = { ok: false, text: r.error };
      else {
        f.repo = r.repo; f.branch = r.branch; pickFile(r.path);
        f.linkMsg = { ok: true, text: 'Found ' + r.path + ' in ' + r.repo + (r.branch ? ' (branch ' + r.branch + ')' : '') + '. Choose below what to show from it.' };
        S().sb.linked = true;
      }
      api.update();
    });
    api.on('change', '[data-dlg]', function (el) {
      var f = F(), k = el.dataset.dlg;
      if (k === 'repo') { f.repo = el.value; f.offers = null; }
      if (k === 'find' && el.value) pickFile(el.value);
      if (k === 'often') f.often = el.value;
      api.update();
    });
    api.on('click', '[data-common]', function (el) { pickFile(el.dataset.common); api.update(); });
    api.on('change', '[data-kind]', function (el) { F().kind = el.value; F().offers = null; api.update(); });
    api.on('change', '[data-shift]', function (el) { F().shift = el.checked; api.update(); });
    api.on('click', '[data-keys]', function () {
      var f = F(), src = CONTENT[f.path];
      if (!f.repo || !f.path.trim()) return;
      if (!FILES.includes(f.path)) f.offers = fileProblem(f.path, f.branch);
      else if (!src) f.offers = { error: 'Sample data: this demo has no content for ' + f.path + '.' };
      else if (f.kind === 'keys') f.offers = src.kind === 'yaml' ? { keys: sampleKeys(f.path, S().sb.rev) } : yamlProblem();
      else if (f.kind === 'md') f.offers = { headings: f.path === 'README.md' ? README_HEADINGS : [] };
      else f.offers = { snippets: [] };
      api.update();
      var p = api.el('#cd-keypick, #cd-headpick'); if (p) p.focus();
    });
    api.on('change', '[data-keypick]', function (el) {
      var f = F(), lines = f.keyText.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (el.value && !lines.some(function (l) { return l === el.value || l.replace(/^[^=]*=\s*/, '') === el.value; })) lines.push(el.value);
      f.keyText = lines.join('\n');
      api.update();
    });
    api.on('change', '[data-headpick]', function (el) { if (el.value) F().head = el.value; api.update(); });
    api.on('click', '[data-preview]', function () {
      var f = F();
      if (gapsOf(f).length) { f.markGaps = true; api.update(); return; }
      makePreview(); api.update();
    });
    api.on('click', '[data-save]', function () {
      var f = F();
      if (gapsOf(f).length) { f.markGaps = true; api.update(); return; }
      var key = sigOf(settingsOf(f));
      var p = f.preview && f.preview.key === key ? f.preview : makePreview();
      if (p.html) submit(true); else api.update();
    });
    api.on('click', '[data-saveanyway]', function () { submit(false); });
    api.on('click', '[data-cancel]', function () {
      var B = S().sb; B.stage = B.cfg ? 'editor' : 'edit'; api.update();
    });
    api.on('click', '[data-reopen]', function () {
      var B = S().sb; B.stage = 'dialog'; api.update();
    });
    api.on('click', '[data-publish]', function () {
      var B = S().sb;
      B.stage = 'view';
      var r = samplePreview(B.cfg, B.rev);
      if (r.html) { B.content = { html: r.html }; B.error = null; } else B.error = r;
      B.checked = 'just now'; B.note = null;
      api.update();
      api.toast('Page published. CodeDoc keeps the block up to date.');
    });
    api.on('click', '[data-push]', function () {
      var B = S().sb, S0 = S();
      if (B.stage !== 'view') { api.toast(B.stage === 'editor' ? 'Publish the page first: the block syncs once it is published.' : 'Add the block and publish the page first.'); return; }
      B.rev = 1; B.pushed = true;
      if (B.cfg.often === 'git') {
        B.note = null; api.update();
        api.toast('Push received by the CodeDoc webhook');
        later(S0, function () { applyUpdate(api, true); }, 1400);
      } else {
        B.note = null; api.update();
        api.toast('Pushed. The block updates ' + OFTEN_SHORT[B.cfg.often] + ', or now with Update now.');
      }
    });
    api.on('click', '[data-updnow]', function () {
      var B = S().sb, S0 = S();
      B.busy = true; B.note = 'Update started: CodeDoc is reading the file…';
      api.update();
      later(S0, function () { applyUpdate(api, false); }, 1400);
    });
    api.on('click', '[data-manage]', function () { S().app.top = 'sync'; api.go('app', true); });
  }
  function applyUpdate(api, byPush) {
    var S = api.state(), B = S.sb, r = samplePreview(B.cfg, B.rev), before = B.content ? B.content.html : null;
    B.busy = false; B.checked = 'just now';
    if (B.pushed) B.checkedAfterPush = true;
    if (r.error) { B.error = r; B.note = null; }
    else {
      B.error = null;
      if (r.html !== before) { B.content = { html: r.html }; B.flash = true; B.note = byPush ? null : 'The block was updated.'; }
      else B.note = 'Checked just now: the file content has not changed.';
    }
    refresh('sync');
    B.flash = false;
    if (api.tab() === 'sync') api.toast(r.error ? 'The update failed' : r.html !== before ? 'Block updated: one new page version' : 'No change, no new page version');
  }

  // ============================================================
  // Tab 2 · AI page (precomputed sample page, no AI involved)
  // ============================================================
  var STYLES = [
    ['dev', '👨‍💻', 'Developer Documentation', 'Technical details with code examples, architecture, and configuration reference.'],
    ['deep', '📚', 'Comprehensive Technical', 'Full technical deep-dive with every module, dependency, and edge case.'],
    ['mgmt', '📊', 'Management Overview', 'High-level overview for business stakeholders.'],
    ['cust', '🤝', 'Customer Documentation', 'Professional docs for external stakeholders. No internal details.'],
    ['audit', '🔒', 'Compliance & Audit', 'Security controls, data handling, and compliance mappings.'],
    ['onboard', '🎓', 'Onboarding Guide', 'Step-by-step for new team members.'],
    ['quick', '⚡', 'Quick Reference', 'Minimal docs with just the essentials.'],
    ['ownstyle', '✏️', 'Custom', 'Define your own documentation style with your own instructions.']
  ];
  function style(id) { return STYLES.filter(function (s) { return s[0] === id; })[0] || STYLES[0]; }
  var LANGS = [['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español'], ['it', 'Italiano'], ['pt', 'Português'], ['ja', '日本語'], ['zh', '中文'], ['ko', '한국어'], ['other', 'Other language…']];
  var LENGTHS = [[8192, 'Short', 'about 5–7 pages'], [16384, 'Standard', 'about 10–15 pages, recommended'], [32768, 'Long', 'about 20–30 pages']];
  var SPACES = [['', 'Choose a space'], ['ENG', 'Engineering (ENG)'], ['PLAT', 'Platform (PLAT)'], ['ONB', 'Onboarding (ONB)']];
  var PARENTS = { ENG: ['Services', 'Runbooks'], PLAT: ['Clusters', 'Charts'], ONB: ['Week 1'] };
  var RUN_RULES = [['byhand', 'Manually (Run button)'], ['onpush', 'On every push (webhook)'], ['timed', 'On a schedule']];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Sample repositories with fixed numbers: code files, files in total, input tokens
  var AI_REPOS = [
    { id: 'tf', name: 'acme-docs/terraform-project', branch: 'main', code: 38, total: 52, tokens: 41200 },
    { id: 'ex', name: 'expressjs/express', branch: 'master', code: 168, total: 203, tokens: 96400 },
    { id: 'go', name: 'GoogleCloudPlatform/golang-samples', branch: 'main', code: 2140, total: 3310, tokens: 5000000, oversized: true, folder: { code: 4, total: 6, tokens: 2100 } },
    { id: 'helm', name: 'helm/examples', branch: 'main', code: 15, total: 15, tokens: 6860 }
  ];
  // Most credits one run of helm/examples can take, per page length (sample values)
  var CREDITS = { bal: { 8192: '1.4', 16384: '2.7', 32768: '5.1' }, fst: { 8192: '0.5', 16384: '0.9', 32768: '1.7' } };
  var HELM_FILES = ['README.md', 'charts/hello-world/Chart.yaml', 'charts/hello-world/values.yaml', 'charts/hello-world/README.md', 'charts/hello-world/templates/deployment.yaml',
    'charts/hello-world/templates/service.yaml', 'charts/hello-world/templates/serviceaccount.yaml', 'charts/hello-world/templates/_helpers.tpl', 'charts/hello-world/templates/NOTES.txt',
    'charts/hello-world/.helmignore', 'ct.yaml', '.github/workflows/lint-test.yaml', 'CODEOWNERS', '.gitignore', 'LICENSE'];
  var HELM_TOKENS = [610, 70, 420, 380, 980, 340, 310, 1240, 520, 120, 90, 760, 30, 40, 630];

  // The sample page per writing style (fixed text about the hello-world chart)
  var PAGES = {
    'dev': [
      ['Overview', '<p>hello-world is a minimal Helm chart that runs an nginx web server on Kubernetes. Chart version <code>0.1.0</code>, app version <code>1.16.0</code>.</p>'],
      ['What\'s inside', '<table class="cd-table"><thead><tr><th>Part</th><th>Role</th></tr></thead><tbody><tr><td>Helm (chart API v2)</td><td>Packaging and release</td></tr><tr><td>Kubernetes Deployment</td><td>Runs the nginx pods</td></tr><tr><td>Kubernetes Service</td><td>ClusterIP on port 80</td></tr></tbody></table>'],
      ['Installation', '<pre class="cd-pre">helm install hello-world ./charts/hello-world</pre>'],
      ['Configuration', '<table class="cd-table"><thead><tr><th>Value</th><th>Default</th></tr></thead><tbody><tr><td><code>replicaCount</code></td><td>1</td></tr><tr><td><code>image.repository</code></td><td>nginx</td></tr><tr><td><code>service.type</code></td><td>ClusterIP</td></tr><tr><td><code>service.port</code></td><td>80</td></tr></tbody></table>'],
      ['When something goes wrong', '<p>A pod that stays <em>Pending</em> usually waits for cluster resources: check <code>kubectl describe pod</code>.</p>']
    ],
    'deep': [
      ['How it fits together', '<p>One Deployment with a single container, exposed by a Service. Names and labels come from helpers in <code>_helpers.tpl</code>.</p>'],
      ['The template files', '<p><code>deployment.yaml</code>, <code>service.yaml</code> and <code>serviceaccount.yaml</code> render from <code>values.yaml</code>; <code>NOTES.txt</code> prints the next steps after an install.</p>'],
      ['Checks on every pull request', '<p>A GitHub workflow lints and installs the chart with chart-testing (<code>ct.yaml</code>) on every pull request.</p>'],
      ['What it does not do', '<p>No ingress and no persistence: the chart is meant for learning, not for production traffic.</p>']
    ],
    'mgmt': [
      ['What it is', '<p>A small, ready-made package that starts a web server in a Kubernetes cluster with one command.</p>'],
      ['What it gives the team', '<p>Repeatable installs, one configuration file, updates by changing a version number.</p>'],
      ['What to watch out for', '<p>Example code: it has no monitoring or scaling rules, so it should not carry customer traffic as it is.</p>'],
      ['Next step', '<p>Use it as the template for new service charts and add monitoring before the first production use.</p>']
    ],
    'cust': [
      ['What you get', '<p>Deploys a web server with a single command and a small set of settings.</p>'],
      ['First install', '<pre class="cd-pre">helm install hello-world ./charts/hello-world</pre>'],
      ['Connecting it', '<p>Expose the service with your own ingress or load balancer; the chart opens port 80 inside the cluster.</p>']
    ],
    'audit': [
      ['How the pod is protected', '<p>The pod runs with its own service account. No secrets are part of the chart.</p>'],
      ['What data it holds', '<p>The service stores no data; it serves static content only.</p>'],
      ['Who can change it', '<p>Who can install or change the release follows your Kubernetes RBAC rules.</p>'],
      ['Risks and measures', '<table class="cd-table"><thead><tr><th>Risk</th><th>Measure</th></tr></thead><tbody><tr><td>Outdated image</td><td>Track the version with a CodeDoc sync block</td></tr><tr><td>No resource limits</td><td>Set limits in <code>values.yaml</code></td></tr></tbody></table>']
    ],
    onboard: [
      ['Your first day', '<p>Install <code>kubectl</code> and Helm, then connect to the development cluster.</p>'],
      ['Words you\'ll hear', '<p>A <em>chart</em> is the package, a <em>release</em> is one installation of it, <em>values</em> are its settings.</p>'],
      ['Day to day', '<p>Change a value, run <code>helm upgrade hello-world ./charts/hello-world</code>, check the pods.</p>'],
      ['Easy to get wrong', '<p>Editing the templates instead of <code>values.yaml</code>; forgetting the namespace.</p>']
    ],
    'quick': [
      ['Built with', '<p>Helm chart API v2 · Kubernetes · nginx</p>'],
      ['Commands', '<pre class="cd-pre">helm install hello-world ./charts/hello-world\nhelm upgrade hello-world ./charts/hello-world\nhelm uninstall hello-world</pre>'],
      ['Files', '<p><code>Chart.yaml</code> · <code>values.yaml</code> · <code>templates/</code></p>'],
      ['Settings that matter', '<p><code>replicaCount: 1</code>, <code>service.port: 80</code></p>']
    ],
    ownstyle: [
      ['Your page', '<p>A custom style follows your own instructions: the sections, their order and the tone are what you asked for.</p>'],
      ['Example section', '<p>For example the public settings of the chart, with one command per setting.</p>']
    ]
  };

  function emptyEditor(act, job) {
    var f = { act: act || 'new', step: 0, touched: false, errors: [], name: 'hello-world — Developer guide', repos: [], branch: {}, folder: {}, fileMode: 'auto', showFiles: false,
      style: 'dev', instr: '', lang: 'en', langText: '', length: 16384, space: '', parent: '', review: false, when: 'byhand', freq: 'd', hour: 2, dow: 1, dom: 1,
      firstRunNow: true, editId: null };
    if (job) {
      Object.keys(job.f).forEach(function (k) { f[k] = JSON.parse(JSON.stringify(job.f[k])); });
      f.act = act; f.step = 0; f.errors = []; f.touched = false;
      if (act === 'copy') f.name = job.f.name + ' (copy)';
      else f.editId = job.id;
    }
    return f;
  }
  function repoById(id) { return AI_REPOS.filter(function (r) { return r.id === id; })[0]; }
  function analysis(f) {
    var code = 0, total = 0, tokens = 0, oversized = false;
    f.repos.forEach(function (id) {
      var r = repoById(id), folder = (f.folder[id] || '').trim();
      var n = r.oversized && folder ? r.folder : r;
      if (r.oversized && !folder) oversized = true;
      code += n.code; total += n.total; tokens += n.tokens;
    });
    var read, sub, used = tokens;
    if (f.fileMode === 'fixed') { var c = Math.min(code, 50); read = fmt(c) + ' files'; sub = 'exactly your list'; used = code > 50 ? Math.round(tokens * 50 / code / 100) * 100 : tokens; }
    else if (code <= 30) { read = fmt(code) + ' file' + (code === 1 ? '' : 's'); sub = 'all code files'; }
    else { read = 'up to ' + fmt(Math.min(50, code)); sub = 'chosen by your AI provider on each run'; used = Math.round(tokens * Math.min(50, code) / code / 100) * 100; }
    return { code: code, total: total, tokens: used, ratio: used / 120000, read: read, sub: sub, oversized: oversized };
  }
  function whoWrites(S) {
    var samples = { bal: { atlassian: true, name: 'Atlassian AI', model: 'Balanced' },
      fst: { atlassian: true, name: 'Atlassian AI', model: 'Fast' },
      custom: { atlassian: false, name: 'Google AI (Gemini)', model: 'gemini-2.5-flash' } };
    return samples[S.app.ed === 'adv' && S.app.writer === 'atl' ? S.app.speed : 'custom'];
  }
  function whatsMissing(form) {
    var custom = form.style === 'ownstyle';
    var checks = [
      [[!form.name.trim(), 'Enter a name for the page.'], [form.repos.length === 0, 'Choose at least one repository.']],
      [[custom && !form.instr.trim(), 'Write the instructions for the custom style.'],
        [custom && form.instr.length > 2000, 'The custom instructions are longer than 2,000 characters.'],
        [form.lang === 'other' && !form.langText.trim(), 'Enter the language.']],
      [[!form.space, 'Choose the Confluence space.']]
    ];
    return (checks[form.step] || []).filter(function (row) { return row[0]; }).map(function (row) { return row[1]; });
  }
  function conflictOf(S, f) {
    if (!f.space) return false;
    return S.ai.jobs.some(function (j) { return j.id !== f.editId && j.f.space === f.space && j.f.name.trim().toLowerCase() === f.name.trim().toLowerCase(); });
  }
  function triggerText(f) {
    if (f.when === 'byhand') return 'only when someone clicks Run';
    if (f.when === 'onpush') return 'on every push to the branch';
    return (f.freq === 'd' ? 'daily' : f.freq === 'w' ? 'weekly on ' + DAYS[f.dow] : 'monthly on day ' + f.dom) + ', from ' + String(f.hour).padStart(2, '0') + ':00 UTC';
  }
  function updatesPill(f) {
    if (f.when === 'byhand') return pill('Manually', 'grey');
    if (f.when === 'onpush') return pill('On push', 'purple');
    var t = f.freq === 'd' ? 'Daily' : f.freq === 'w' ? DAYS[f.dow].slice(0, 3) : f.dom + '.';
    return pill('Schedule', 'yellow') + '<div class="d-small d-faint">' + t + ' ~' + String(f.hour).padStart(2, '0') + ':00 UTC</div>';
  }
  var RUN = {
    pub: ['Published', 'green'], pubrev: ['Published', 'green'], inrev: ['In review', 'yellow'], disc: ['Discarded', 'grey'],
    undone: ['Undone', 'yellow'], fail: ['Failed', 'red'], run: ['Running', 'blue'], wait: ['Queued', 'yellow']
  };
  function runPill(st) { var r = RUN[st] || [st, 'grey']; return pill(r[0], r[1]); }
  var STAGES = ['Loading', 'Fetching', 'Analyzing', 'Generating', 'Publishing'];
  var STAGE_TEXT = ['Reading the settings of the AI page', 'Reading the files from helm/examples', 'Ordering the files: entry points, configuration and READMEs first', 'Writing the page', 'Publishing to Confluence'];

  function renderAi(S) {
    var A = S.ai, ai = whoWrites(S);
    var ctx = '<div class="d-context"><span>Apps</span><span class="d-sep">/</span><b>CodeDoc</b><span class="d-sep">·</span><span>AI pages</span><span class="d-faint" style="margin-left:auto">AI: ' + esc(ai.name) + '</span></div>';
    if (A.editor) return ctx + '<div class="cd-pad">' + renderEditor(S) + '</div>';
    return ctx + '<div class="cd-ai"><div class="d-app cd-ai-main"><span class="d-app-tag">CodeDoc</span>' + renderAiList(S) + '</div>' + renderAiPage(S) + '</div>';
  }

  function renderAiList(S) {
    var A = S.ai, ai = whoWrites(S);
    var head = '<div class="cd-ph"><h3 class="d-h2" style="margin:0">AI pages</h3><button type="button" class="d-btn is-primary" data-new' + next(!A.created) +
      ' title="Choose repositories, writing style, target page and when to update.">' + ICON.plus + 'New AI page</button></div>' +
      '<p class="d-sub cd-ph-text">Your AI provider writes whole documentation pages from your code (architecture, APIs, onboarding) and CodeDoc keeps them up to date. Optional: sync blocks work without AI.</p>';
    var tabs = '<div class="cd-subtabs" role="group" aria-label="AI pages">' + [['pages', 'Pages'], ['runs', 'Runs'], ['styles', 'Writing styles']].map(function (t) {
      return '<button type="button" class="cd-subtab' + (A.sub === t[0] ? ' is-on' : '') + '" data-aisub="' + t[0] + '" aria-pressed="' + (A.sub === t[0]) + '">' + t[1] + '</button>';
    }).join('') + '</div>';
    var body = '';
    if (A.sub === 'pages') {
      var running = A.jobs.filter(function (j) { return j.status === 'run' || j.status === 'wait'; });
      var anyRunning = running.length > 0;
      body += running.map(function (j) {
        return '<div class="cd-running"><div class="cd-row cd-spread"><span class="cd-row"><span class="cd-spin" aria-hidden="true"></span><b>' + esc(j.f.name) + '</b></span>' +
          '<button type="button" class="d-btn is-compact cd-dangerbtn" data-cancelrun="' + j.id + '">Cancel</button></div>' +
          '<div class="cd-stages">' + STAGES.map(function (s, i) {
            return '<span class="d-loz is-' + (i < A.stage ? 'green' : i === A.stage ? 'blue' : 'grey') + '">' + (i < A.stage ? '✓ ' : '') + s + '</span>';
          }).join('') + '</div><p class="d-small d-faint" role="status">' + esc(STAGE_TEXT[A.stage] || '') + (A.stage === 3 ? ' (' + A.shown + ' of ' + PAGES[j.f.style].length + ' sections)' : '') + '</p>' +
          '<p class="d-small d-faint cd-note">In CodeDoc this progress shows under Runs.</p></div>';
      }).join('');
      body += '<div class="d-table-wrap"><table class="d-table cd-jobs"><thead><tr><th>AI page</th><th>Updates</th><th class="d-hide-sm">Style</th><th class="d-hide-sm">Space</th><th>Status</th><th class="d-hide-sm">Last Run</th><th><span class="cd-sr">Actions</span></th></tr></thead><tbody>' +
        A.jobs.map(function (j) {
          var st = j.status, sty = style(j.f.style), repos = j.f.repos.map(function (id) { return repoById(id); });
          var busy = st === 'run' || st === 'wait';
          var actions = '<div class="cd-acts"><button type="button" class="d-btn is-compact" data-run="' + j.id + '"' + (anyRunning ? ' disabled' : '') + next(j.mine && !st && !anyRunning) +
            ' title="Writes the page now with your AI provider. Depending on the settings, it is published directly or waits for review as a draft.">' + (busy ? 'Running' : 'Run') + '</button>' +
            (busy ? '' : '<button type="button" class="d-btn is-compact" data-edit="' + j.id + '" title="Change repositories, files, style, target page and updates of this AI page.">Edit</button>' +
              '<button type="button" class="d-btn is-compact is-subtle" data-copy="' + j.id + '" title="Creates a new AI page with the same settings, for example for another folder or space.">Copy</button>' +
              '<button type="button" class="d-btn is-compact is-subtle" data-del="' + j.id + '" title="Deletes the AI page settings. Pages it already wrote stay in Confluence.">Delete</button>') + '</div>';
          if (st === 'inrev') {
            actions += '<div class="cd-acts cd-draft"><span class="d-small d-faint">Draft:</span><button type="button" class="cd-linkbtn" data-opendraft="' + j.id + '">Open draft</button>' +
              '<button type="button" class="d-btn is-primary is-compact" data-pubdraft="' + j.id + '"' + next(j.mine) + ' title="' + (j.published ? 'Replaces the content of the published page with the draft. The previous version stays in the page history, and “Undo last run” can bring it back.' : 'Publishes the draft as the page (removes “[DRAFT]” from the title).') + '">Publish</button>' +
              '<button type="button" class="d-btn is-subtle is-compact" data-discard="' + j.id + '" title="' + (j.published ? 'Rejects the draft. The published page stays exactly as it is.' : 'Rejects the draft. Nothing is published.') + '">Discard</button></div>';
          }
          if (st === 'pub' && j.versionBefore) {
            actions += '<div class="cd-acts"><button type="button" class="d-btn is-subtle is-compact" data-undo="' + j.id + '" title="Brings back version ' + j.versionBefore + ' of the page, the one before the last AI run. Works as long as nobody changed the page since that run.">Undo last run</button></div>';
          }
          return '<tr' + (A.flash === j.id ? ' class="is-flash"' : '') + '><td><b>' + esc(j.f.name) + '</b><div class="d-small d-faint">' + repos.length + ' ' + (repos.length === 1 ? 'repository' : 'repositories') + ' · ' + esc(repos.map(function (r) { return j.f.branch[r.id] || r.branch; }).join(', ')) + '</div></td>' +
            '<td>' + updatesPill(j.f) + '</td><td class="d-hide-sm d-small">' + sty[1] + ' ' + esc(sty[2]) + '</td><td class="d-hide-sm d-small">' + esc(spaceLabel(j.f.space)) + '</td>' +
            '<td>' + (st ? runPill(st) : '<span class="d-small d-faint">Never run</span>') + '</td><td class="d-hide-sm d-small d-faint">' + esc(j.ranAt || '-') + '</td><td>' + actions + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      if (!A.jobs.length) body += '<p class="d-faint">No AI pages yet.</p>';
    } else if (A.sub === 'runs') {
      var recent = A.runs;
      var cnt = function (fn) { return recent.filter(fn).length; };
      body += '<div class="cd-ph"><div><h4 class="d-h3" style="margin:0">Run history</h4><p class="d-small d-faint" style="margin:2px 0 0">Every run of every AI page, newest first: when it ran, what happened to the page and what the AI read.</p></div></div>' +
        '<div class="cd-tiles cd-tiles-4">' + [['Runs in the last 30 days', recent.length], ['Published', cnt(function (r) { return r.status === 'pub' || r.status === 'pubrev'; })],
          ['In review', cnt(function (r) { return r.status === 'inrev'; })], ['Failed', cnt(function (r) { return r.status === 'fail'; })]].map(function (t) {
          return '<div class="cd-tile"><span class="d-small d-faint">' + t[0] + '</span><b class="cd-num">' + t[1] + '</b></div>';
        }).join('') + '</div>' +
        '<div class="d-table-wrap"><table class="d-table"><thead><tr><th>When</th><th>AI page</th><th>Result</th><th class="d-hide-sm">AI</th><th class="d-hide-sm">Files read</th><th class="d-hide-sm">Tokens</th></tr></thead><tbody>' +
        recent.map(function (r) {
          return '<tr><td class="d-small">' + esc(r.when) + '</td><td><b>' + esc(r.name) + '</b></td><td>' + runPill(r.status) + '</td><td class="d-hide-sm d-small">' + esc(r.model) + '</td><td class="d-hide-sm d-small">' + esc(r.files) + '</td><td class="d-hide-sm d-small">' + esc(r.tokens) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      body += '<div class="cd-ph"><div><h4 class="d-h3" style="margin:0">Writing styles</h4><p class="d-small d-faint" style="margin:2px 0 0">Saved styles fill in style, language, filters and length of a new AI page at once.</p></div>' +
        '<button type="button" class="d-btn is-compact" data-newstyle>' + ICON.plus + 'New style</button></div>' +
        '<div class="d-table-wrap"><table class="d-table"><thead><tr><th>Name</th><th>Base style</th><th class="d-hide-sm">Language</th></tr></thead><tbody>' +
        '<tr><td><b>API Reference — Backend Team</b></td><td class="d-small">👨‍💻 Developer Documentation</td><td class="d-hide-sm d-small">English</td></tr></tbody></table></div>';
    }
    return head + tabs + body;
  }
  function spaceLabel(k) { return ({ ENG: 'Engineering', PLAT: 'Platform', ONB: 'Onboarding' })[k] || '-'; }

  function renderAiPage(S) {
    var A = S.ai, j = A.jobs.filter(function (x) { return x.id === A.pageOf; })[0];
    if (!j || !j.page) {
      return '<aside class="cd-page cd-aipage is-empty"><p class="d-faint">The Confluence page appears here while CodeDoc writes it.</p></aside>';
    }
    var P = j.page, sections = PAGES[j.f.style], n = P.shown;
    var ai = P.ai;
    var draft = P.state === 'draft', gone = P.state === 'disc';
    var title = (draft ? '[DRAFT] ' : '') + j.f.name;
    var lang = j.f.lang === 'other' ? (j.f.langText || 'your language') : LANGS.filter(function (l) { return l[0] === j.f.lang; })[0][1];
    if (gone) {
      return '<aside class="cd-page cd-aipage"><div class="cd-crumb">' + esc(spaceLabel(j.f.space)) + ' / Trash</div>' +
        msg('info', 'Draft discarded', '<p>The draft “' + esc(title) + '” is in the space trash. ' + (j.published ? 'The published page stays exactly as it is.' : 'Nothing was published.') + '</p>') + '</aside>';
    }
    return '<aside class="cd-page cd-aipage' + (A.flashPage ? ' is-flash' : '') + '" aria-label="Confluence page written by CodeDoc" aria-live="polite">' +
      '<div class="cd-crumb">' + esc(spaceLabel(j.f.space)) + (j.f.parent ? ' / ' + esc(j.f.parent) : '') + '</div>' +
      '<div class="d-app cd-aipage-app"><span class="d-app-tag">CodeDoc</span>' +
      '<h3 class="cd-page-title">' + esc(title) + '</h3>' +
      '<div class="cd-info"><b>CodeDoc</b> · Generated: Oct 8, 2026, 09:14 UTC · Model: ' + esc(ai.atlassian ? 'Atlassian AI / ' + ai.model : ai.name + ' / ' + ai.model) + ' · Repositories: ' + esc(j.f.repos.map(function (id) { return repoById(id).name; }).join(', ')) + ' · Writing style: ' + esc(style(j.f.style)[2]) + '</div>' +
      (j.f.lang !== 'en' ? '<p class="d-small d-faint cd-note">Sample page in English. In your Confluence the page is written in ' + esc(lang) + '.</p>' : '') +
      sections.slice(0, n).map(function (s, i) { return '<section class="cd-gen' + (i === n - 1 && P.writing ? ' is-new' : '') + '"><h4 class="cd-page-h">' + esc(s[0]) + '</h4>' + s[1] + '</section>'; }).join('') +
      (P.writing ? '<p class="cd-typing" aria-label="CodeDoc is writing"><i></i><i></i><i></i></p>' : '') +
      (!P.writing ? '<details class="cd-expand"><summary>Generation Info</summary><p class="d-small"><em>Generated by CodeDoc · Oct 8, 2026, 09:14 UTC · ' + esc(P.files) + ' source files analyzed · Model: ' + esc(ai.atlassian ? 'Atlassian AI (' + ai.model + ')' : ai.model) + ' · Method: ' + esc(P.method) + '</em></p></details>' : '') +
      '</div></aside>';
  }

  function renderEditor(S) {
    var f = S.ai.editor, ai = whoWrites(S), STEPS = [['Source', 'Which code the page is written from'], ['Content', 'What the page covers, and for whom'], ['Target page', 'Where the page goes, and whether someone reviews it'], ['Updates', 'When the page is written again']];
    var title = f.act === 'edit' ? 'Edit AI page: ' + f.name : f.act === 'copy' ? 'Copy AI page' : 'New AI page';
    var conflict = conflictOf(S, f);
    var tracker = '<ol class="cd-tracker" aria-label="Steps of the AI page editor">' + STEPS.map(function (s, i) {
      return '<li class="' + (i < f.step ? 'is-done' : i === f.step ? 'is-on' : '') + '"' + (i === f.step ? ' aria-current="step"' : '') + '><span></span>' + (i + 1) + '. ' + s[0] + '</li>';
    }).join('') + '</ol>';
    var goto = f.act !== 'new' ? '<div class="cd-row cd-wrap"><span class="d-small d-faint">Go to step:</span>' + STEPS.map(function (s, i) {
      return '<button type="button" class="d-btn is-compact ' + (i === f.step ? 'is-selected' : 'is-subtle') + '" data-gostep="' + i + '">' + (i + 1) + '. ' + s[0] + '</button>';
    }).join('') + '</div>' : '';
    var err = f.errors.length ? msg('error', '', '<p>' + esc(f.errors.join(' ')) + '</p>') : '';
    var body = '';
    var a2 = !S.ai.reached;

    if (f.step === 0) {
      var an = f.repos.length ? analysis(f) : null;
      var helmOnly = f.repos.length === 1 && f.repos[0] === 'helm';
      var credits = ai.atlassian && helmOnly ? ' · up to ' + CREDITS[S.app.speed][f.length] + ' credits per run' : '';
      body += '<div class="cd-stepsec"><div class="cd-stephead"><span class="cd-badge">1</span><b>Name the page</b></div><p class="d-small d-faint">The name is also the title of the Confluence page. Page titles must be unique within a space.</p>' +
        fieldLabel('ai-name', 'Page name', 'Also the title of the Confluence page. Page titles must be unique within a space.', true) +
        '<input class="d-input cd-full" id="ai-name" data-fid="ai-name" data-aitext="name" value="' + esc(f.name) + '" placeholder="e.g. Payments API — Developer guide"></div>';
      body += '<div class="cd-stepsec"><div class="cd-stephead"><span class="cd-badge">2</span><b>Choose the repositories</b></div><p class="d-small d-faint">One page can combine up to 2 repositories, for example a service and its client library. Repositories are connected in the tab Repositories.</p>' +
        '<div class="cd-lbl"><span class="cd-lbltext">Repositories (' + f.repos.length + '/2) *</span>' + q('One page can combine up to 2 repositories.', 'About Repositories') + '</div>' +
        '<div class="cd-checks">' + AI_REPOS.map(function (r) {
          var on = f.repos.indexOf(r.id) > -1, off = !on && f.repos.length >= 2;
          return '<label class="cd-check' + (off ? ' is-off' : '') + '"><input type="checkbox" data-airepo="' + r.id + '" data-fid="airepo-' + r.id + '"' + (on ? ' checked' : '') + (off ? ' disabled' : '') + next(a2 && r.id === 'helm' && !f.repos.length) + '> ' + esc(r.name + ' · GitHub · ' + r.branch) + '</label>';
        }).join('') + '</div>' +
        f.repos.map(function (id) {
          var r = repoById(id);
          return '<div class="cd-repoopts"><b class="d-small">' + esc(r.name) + ' · GitHub</b><div class="cd-row cd-wrap">' +
            '<div>' + fieldLabel('ai-br-' + id, 'Branch', 'Leave empty for the repository\'s default branch.') + '<input class="d-input" id="ai-br-' + id + '" data-fid="ai-br-' + id + '" data-aibranch="' + id + '" value="' + esc(f.branch[id] || '') + '" placeholder="' + esc(r.branch) + ' (default)"></div>' +
            '<div>' + fieldLabel('ai-fo-' + id, 'Folder (optional)', 'Only this folder is read, for example services/payments. Empty = the whole repository.') + '<input class="d-input" id="ai-fo-' + id + '" data-fid="ai-fo-' + id + '" data-aifolder="' + id + '" value="' + esc(f.folder[id] || '') + '" placeholder="e.g. services/payments"></div>' +
            '</div></div>';
        }).join('') + '</div>';
      body += '<div class="cd-stepsec"><div class="cd-stephead"><span class="cd-badge">3</span><b>Check the files the AI reads</b></div><p class="d-small d-faint">CodeDoc reads the code files of the repositories and folders above. Check the numbers; for a large repository, choose a folder.</p>';
      if (!an) body += '<p class="d-small d-faint">Choose a repository above; CodeDoc then shows which of its files the AI reads.</p>';
      else {
        body += '<div class="cd-files"><div class="cd-tiles">' +
          '<div class="cd-tile"><span class="d-small d-faint">Code files found</span><b>' + fmt(an.code) + '</b><span class="d-small d-faint">' + fmt(an.total) + ' files in total</span></div>' +
          '<div class="cd-tile"><span class="d-small d-faint">Read on each run</span><b>' + esc(an.read) + '</b><span class="d-small d-faint">' + esc(an.sub) + '</span></div>' +
          '<div class="cd-tile"><span class="d-small d-faint">Input for the AI</span><b>~' + fmt(an.tokens) + ' tokens</b>' + D.bar(Math.min(100, an.ratio * 100), 'blue') + '<span class="d-small d-faint">' + Math.round(an.ratio * 100) + ' % of the 120,000-token limit' + credits + '</span></div></div>';
        if (an.oversized) {
          body += msg('error', 'Too large for one page', '<p>This scope is too large for one documentation page: ' + fmt(an.code) + ' code files. CodeDoc writes one page from at most 50 files (about 120k tokens) and can pre-select them from at most 1,500 files. Narrow the scope first.</p><p>• Enter a folder above, for example run/helloworld (one module or service per AI page).</p><p>• Or keep single facts such as versions current with a sync block.</p>');
        } else {
          body += '<div class="cd-field"><span class="cd-lbltext">How CodeDoc picks the files</span><div class="cd-radios">' +
            '<label class="cd-radio"><input type="radio" name="ai-fm" value="auto" data-aifm data-fid="aifm-auto"' + (f.fileMode === 'auto' ? ' checked' : '') + '> Automatically (recommended)</label>' +
            '<label class="cd-radio"><input type="radio" name="ai-fm" value="fixed" data-aifm data-fid="aifm-fixed"' + (f.fileMode === 'fixed' ? ' checked' : '') + '> From my file list</label></div>' +
            '<p class="d-help">' + (f.fileMode === 'fixed' ? 'Each run reads exactly the files you tick. New files in the repository are not added on their own.' :
              an.code <= 30 ? 'All ' + fmt(an.code) + ' code files are read. When the folder grows beyond 30 code files, your AI provider picks the most relevant ones on each run, so new files are included.' :
                'Your AI provider picks the most relevant files (up to ' + fmt(Math.min(50, an.code)) + ') on each run, so new files are included. That costs one small extra AI call per run.') + '</p></div>';
          if (helmOnly) {
            body += '<button type="button" class="d-btn is-subtle is-compact" data-showfiles>' + (f.showFiles ? 'Hide the file list' : (f.fileMode === 'fixed' ? 'Choose files' : 'Show the files') + ' (15)') + '</button>';
            if (f.showFiles) body += '<ul class="cd-filelist">' + HELM_FILES.map(function (p, i) { return '<li' + (i < 3 ? ' class="is-first"' : '') + '>' + esc(p) + ' · ~' + fmt(HELM_TOKENS[i]) + ' tokens</li>'; }).join('') + '</ul><p class="d-small d-faint">Entry points, configuration and READMEs come first; they are read before other files.</p>';
          }
        }
        body += '<p class="d-small d-faint">Lock files, build output, images and dependencies are left out automatically.</p></div>';
      }
      body += '</div>';
    } else if (f.step === 1) {
      var st = style(f.style);
      body += '<div class="cd-field">' + fieldLabel('ai-saved', 'Start from a saved style (optional)', 'Your saved writing styles (tab Writing styles) fill in style, language, filters and length at once.') +
        sel('ai-saved', [['', 'Choose a saved writing style…'], ['api', '👨‍💻 API Reference — Backend Team']], '', ' data-aisaved') + '</div>' +
        '<div class="cd-field">' + fieldLabel('ai-style', 'Writing style', 'Who the page is for. The style decides structure, depth and tone of the page.') +
        sel('ai-style', STYLES.map(function (s) { return [s[0], s[1] + ' ' + s[2]]; }), f.style, ' data-aisel="style"') + '<p class="d-help">' + esc(st[3]) + '</p></div>';
      if (f.style === 'ownstyle') {
        body += '<div class="cd-field">' + fieldLabel('ai-custom', 'Instructions', 'What the page should cover and how. For example: “Explain the public REST endpoints with one curl example each; skip internals.”', true) +
          '<textarea class="d-input cd-full" id="ai-custom" data-fid="ai-custom" data-aitext="instr" rows="4" placeholder="Describe the page you want…">' + esc(f.instr) + '</textarea><p class="d-small d-faint" data-live="count">' + f.instr.length + ' / 2000</p></div>';
      }
      body += '<div class="cd-field">' + fieldLabel('ai-lang', 'Language', 'The language the page is written in. Code and identifiers stay as they are.') + sel('ai-lang', LANGS, f.lang, ' data-aisel="lang"') +
        (f.lang === 'other' ? '<input class="d-input cd-full" style="margin-top:6px" id="ai-langc" data-fid="ai-langc" data-aitext="langText" value="' + esc(f.langText) + '" placeholder="e.g. Dutch, Polish, Turkish" aria-label="Other language">' : '') + '</div>' +
        '<div class="cd-field"><div class="cd-lbl"><span class="cd-lbltext">Maximum page length</span>' + q('An upper limit, not a target: the AI stops when the page is complete. Choose a longer option if pages end abruptly.', 'About Maximum page length') + '</div><div class="cd-radios">' +
        LENGTHS.map(function (l) { return '<label class="cd-radio"><input type="radio" name="ai-len" value="' + l[0] + '" data-ailen data-fid="ailen-' + l[0] + '"' + (f.length === l[0] ? ' checked' : '') + '> ' + l[1] + ' — ' + l[2] + '</label>'; }).join('') + '</div></div>';
    } else if (f.step === 2) {
      body += '<div class="cd-field">' + fieldLabel('ai-space', 'Space', 'The space the page is created in. Type at least two letters to search.', true) + sel('ai-space', SPACES, f.space, ' data-aisel="space"' + next(!S.ai.targetDone && !f.space)) + '</div>';
      if (f.space) {
        body += '<div class="cd-field">' + fieldLabel('ai-parent', 'Parent page (optional)', 'The page is created below this page. Empty = at the top level of the space.') +
          sel('ai-parent', [['', '— Root (no parent) —']].concat((PARENTS[f.space] || []).map(function (p) { return [p, p]; })), f.parent, ' data-aisel="parent"') + '</div>';
      }
      body += '<div class="cd-box"><label class="cd-check"><input type="checkbox" data-aireview data-fid="ai-review"' + (f.review ? ' checked' : '') + next(!S.ai.targetDone && f.space && !f.review) + '> Review each run before it is published</label>' +
        '<p class="d-small d-faint">' + (f.review ? 'Each run writes a draft page “[DRAFT] ' + esc(f.name.trim() || 'page name') + '” in the same place. The published page changes only when a Job Operator publishes the draft in CodeDoc; “Discard” leaves it as it is. The draft is a normal page: everyone who can see the space can see it.' :
          'Each run updates the page directly. If a run turns out wrong, “Undo last run” in the AI pages list brings back the previous version; Confluence also keeps every version in the page history.') + '</p></div>';
      if (conflict) body += msg('warning', 'A page with this name already exists', '<p>There is already a page "' + esc(f.name) + '" in this space. Runs would fail with a title conflict. Rename the AI page, or save anyway if you will rename or move the other page.</p>');
    } else {
      body += '<div class="cd-field">' + fieldLabel('ai-trigger', 'Update the page', 'When the page is written again. Every run calls your AI provider, so frequent runs cost more.') + sel('ai-trigger', RUN_RULES, f.when, ' data-aisel="when"') + '</div>';
      if (f.when === 'onpush') body += '<p class="d-small">Add this address as a webhook in your repository (push events). Each push to the branch rewrites the page.</p><input class="d-input cd-full" readonly value="https://your-site-webhook.example/x1/sample-address" aria-label="Webhook address (sample)">';
      if (f.when === 'timed') {
        body += '<div class="cd-row cd-wrap cd-sched"><div><label class="cd-lbltext" for="ai-freq">Frequency</label>' + sel('ai-freq', [['d', 'Daily'], ['w', 'Weekly'], ['m', 'Monthly']], f.freq, ' data-aisel="freq"') + '</div>' +
          (f.freq === 'w' ? '<div><label class="cd-lbltext" for="ai-dow">Day</label>' + sel('ai-dow', DAYS.map(function (d, i) { return [i, d]; }), f.dow, ' data-aisel="dow"') + '</div>' : '') +
          (f.freq === 'm' ? '<div><label class="cd-lbltext" for="ai-dom">Day of month</label>' + sel('ai-dom', Array.apply(null, Array(28)).map(function (x, i) { return [i + 1, String(i + 1)]; }), f.dom, ' data-aisel="dom"') + '</div>' : '') +
          '<div>' + fieldLabel('ai-hour', 'Earliest time', 'Forge checks schedules once an hour, so the run starts within about an hour after this time.') + sel('ai-hour', Array.apply(null, Array(24)).map(function (x, i) { return [i, String(i).padStart(2, '0') + ':00 UTC']; }), f.hour, ' data-aisel="hour"') + '</div></div>';
      }
      if (f.act !== 'edit' && f.when !== 'byhand') body += '<label class="cd-check"><input type="checkbox" data-aiinit' + (f.firstRunNow ? ' checked' : '') + '> Write the page once right after saving</label>';
      var langLabel = f.lang === 'other' ? (f.langText || 'your language') : LANGS.filter(function (l) { return l[0] === f.lang; })[0][1];
      var lenLabel = LENGTHS.filter(function (l) { return l[0] === f.length; })[0][1].toLowerCase();
      body += '<div class="cd-box is-sunken"><b>What CodeDoc will do</b><ul class="cd-list">' +
        '<li>Read ' + esc(f.repos.map(function (id) { var r = repoById(id); return r.name + ' (' + (f.branch[id] || r.branch) + ')'; }).join(' and ') || 'the chosen repositories') + ': ' + (f.fileMode === 'fixed' ? 'the files from your list' : 'the files picked automatically') + '.</li>' +
        '<li>Let your AI provider write “' + esc(f.name.trim() || 'the page') + '” as ' + esc(style(f.style)[2]) + ' in ' + esc(langLabel) + ', ' + lenLabel + ' length.</li>' +
        '<li>' + (f.review ? 'Save it as a draft for review' : 'Publish it') + ' in the space “' + esc(spaceLabel(f.space)) + '”' + (f.parent ? ' below “' + esc(f.parent) + '”' : '') + '.</li>' +
        '<li>Write it again ' + esc(triggerText(f)) + '.</li></ul></div>' +
        msg('info', '', '<p class="d-small">AI pages use your AI provider with your key; costs depend on model and repository size. Set a spending limit in your provider account. Sync blocks never call an AI provider.</p>');
    }

    var last = f.step === 3;
    var saveLabel = conflict ? 'Save anyway' : f.act === 'edit' ? 'Save changes' : 'Create AI page';
    var foot = '<div class="cd-actions"><button type="button" class="d-btn is-subtle" data-aicancel>Cancel</button>' +
      (f.step > 0 ? '<button type="button" class="d-btn" data-aiback>Back</button>' : '') +
      (!last ? '<button type="button" class="d-btn ' + (f.act === 'edit' ? '' : 'is-primary') + '" data-ainext' + next(f.step === 0 ? a2 && f.repos.length > 0 : f.step === 1 ? !S.ai.targetDone : f.step === 2 ? S.ai.targetDone || (f.space && f.review) : false) + '>Next: ' + STEPS[f.step + 1][0] + '</button>' : '') +
      (last || f.act === 'edit' ? '<button type="button" class="d-btn ' + (conflict ? 'cd-warnbtn' : 'is-primary') + '" data-aisave' + next(last && f.act !== 'edit') + ' title="' + (f.act === 'edit' ? 'Saves the changes. The page itself changes with the next run.' : 'Saves the AI page. Run it from the list, or let the chosen update rule run it.') + '">' + saveLabel + '</button>' : '') + '</div>';

    return '<div class="d-app cd-dlg cd-editor" role="dialog" aria-label="' + esc(title) + '"><span class="d-app-tag">CodeDoc</span>' +
      '<div class="cd-dlg-head"><h3 class="d-h1" style="margin:0">' + esc(title) + '</h3><button type="button" class="d-icon-btn" data-aicancel aria-label="Close">' + ICON.close + '</button></div>' +
      '<p class="cd-dlg-intro">CodeDoc reads the files you choose, your AI provider writes the page, and CodeDoc publishes it to Confluence: directly or as a draft for review.</p>' +
      tracker + '<h4 class="d-h2 cd-steptitle">Step ' + (f.step + 1) + ' of 4: ' + STEPS[f.step][1] + '</h4>' + goto + err + '<div class="cd-stepbody">' + body + '</div>' + foot + '</div>';
  }

  function setupAi(api) {
    var S = function () { return api.state(); };
    function E() { return S().ai.editor; }
    api.on('click', '[data-new]', function () { S().ai.editor = emptyEditor('new'); api.update(); });
    api.on('click', '[data-aisub]', function (el) { S().ai.sub = el.dataset.aisub; api.update(); });
    api.on('input', '[data-aitext]', function (el) {
      E()[el.dataset.aitext] = el.value;
      if (el.dataset.aitext === 'instr') { var c = api.el('[data-live="count"]'); if (c) c.textContent = el.value.length + ' / 2000'; }
    });
    api.on('input', '[data-aibranch]', function (el) { E().branch[el.dataset.aibranch] = el.value; });
    var folderTimer = null;
    api.on('input', '[data-aifolder]', function (el) {
      E().folder[el.dataset.aifolder] = el.value;
      clearTimeout(folderTimer);
      var S0 = S(), fid = el.getAttribute('data-fid');
      folderTimer = setTimeout(function () {
        if (S() !== S0 || !E() || document.activeElement !== el) return;
        api.update();
        var again = api.el('[data-fid="' + fid + '"]');
        if (again && again.setSelectionRange) { var n = again.value.length; again.setSelectionRange(n, n); }
      }, 700);
    });
    api.on('change', '[data-airepo]', function (el) {
      var f = E(), id = el.dataset.airepo, i = f.repos.indexOf(id);
      if (el.checked && i === -1 && f.repos.length < 2) f.repos.push(id);
      if (!el.checked && i > -1) f.repos.splice(i, 1);
      f.errors = [];
      api.update();
    });
    api.on('change', '[data-aifm]', function (el) { E().fileMode = el.value; api.update(); });
    api.on('click', '[data-showfiles]', function () { E().showFiles = !E().showFiles; api.update(); });
    api.on('change', '[data-aisel]', function (el) {
      var f = E(), k = el.dataset.aisel, v = el.value;
      f[k] = ['hour', 'dow', 'dom'].indexOf(k) > -1 ? +v : v;
      if (k === 'space') { f.parent = ''; checkTarget(); }
      f.errors = [];
      api.update();
    });
    api.on('change', '[data-aisaved]', function (el) {
      if (el.value) { var f = E(); f.style = 'dev'; f.lang = 'en'; f.length = 16384; api.update(); api.toast('Style, language and length filled in from the saved style'); }
    });
    api.on('change', '[data-ailen]', function (el) { E().length = +el.value; api.update(); });
    api.on('change', '[data-aireview]', function (el) { E().review = el.checked; checkTarget(); api.update(); });
    api.on('change', '[data-aiinit]', function (el) { E().firstRunNow = el.checked; });
    function checkTarget() { var f = E(); if (f.space && f.review) S().ai.targetDone = true; }
    api.on('click', '[data-ainext]', function () {
      var f = E(), e = whatsMissing(f);
      if (e.length) { f.errors = e; f.touched = true; api.update(); return; }
      f.errors = []; f.step++;
      if (f.step >= 1) S().ai.reached = true;
      if (f.step === 3 && f.space) checkTarget();
      api.update();
    });
    api.on('click', '[data-aiback]', function () { var f = E(); f.errors = []; f.step = Math.max(0, f.step - 1); api.update(); });
    api.on('click', '[data-gostep]', function (el) { var f = E(); f.errors = []; f.step = +el.dataset.gostep; api.update(); });
    api.on('click', '[data-aicancel]', function () { S().ai.editor = null; api.update(); });
    api.on('click', '[data-aisave]', function () {
      var f = E(), A = S().ai;
      for (var s = 0; s < 4; s++) {
        var keep = f.step; f.step = s; var e = whatsMissing(f); f.step = keep;
        if (e.length) { f.errors = e; f.step = s; api.update(); return; }
      }
      var data = JSON.parse(JSON.stringify(f));
      delete data.act; delete data.step; delete data.errors; delete data.touched; delete data.editId;
      var job;
      if (f.act === 'edit') {
        job = A.jobs.filter(function (j) { return j.id === f.editId; })[0];
        job.f = data;
        api.toast('Changes saved. The page changes with the next run.');
      } else {
        job = { id: 'j' + (++A.seq), f: data, status: null, ranAt: null, mine: true };
        A.jobs.unshift(job);
        A.created = true;
        api.toast('AI page “' + f.name.trim() + '” created');
      }
      A.editor = null; A.sub = 'pages'; A.flash = job.id;
      if (f.act !== 'edit' && data.when !== 'byhand' && data.firstRunNow) startRun(api, job);
      api.update();
      A.flash = null;
    });
    api.on('click', '[data-run]', function (el) {
      var job = S().ai.jobs.filter(function (j) { return j.id === el.dataset.run; })[0];
      if (job) startRun(api, job);
    });
    api.on('click', '[data-cancelrun]', function (el) {
      var A = S().ai, job = A.jobs.filter(function (j) { return j.id === el.dataset.cancelrun; })[0];
      if (!job) return;
      A.runToken++; job.status = job.statusBefore || null; job.page = job.pageBefore || null; A.pageOf = job.page ? job.id : A.pageOf;
      api.update(); api.toast('Run cancelled');
    });
    api.on('click', '[data-pubdraft]', function (el) {
      var A = S().ai, job = A.jobs.filter(function (j) { return j.id === el.dataset.pubdraft; })[0];
      job.status = 'pubrev'; job.page.state = 'published'; job.published = true; A.pageOf = job.id; A.flashPage = true;
      A.runs[0].status = 'pubrev';
      if (job.mine) A.reviewed = true;
      api.update(); A.flashPage = false;
      api.toast('Draft of “' + job.f.name + '” published.');
    });
    api.on('click', '[data-discard]', function (el) {
      var A = S().ai, job = A.jobs.filter(function (j) { return j.id === el.dataset.discard; })[0];
      job.status = 'disc'; job.page.state = 'disc'; A.pageOf = job.id; A.runs[0].status = 'disc';
      if (job.mine) A.reviewed = true;
      api.update(); api.toast('Draft discarded. ' + (job.published ? 'The published page stays as it is.' : 'Nothing was published.'));
    });
    api.on('click', '[data-opendraft]', function (el) {
      var A = S().ai; A.pageOf = el.dataset.opendraft; A.flashPage = true; api.update(); A.flashPage = false;
      var p = api.el('.cd-aipage'); if (p && p.scrollIntoView) p.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    api.on('click', '[data-undo]', function (el) {
      var A = S().ai, job = A.jobs.filter(function (j) { return j.id === el.dataset.undo; })[0];
      job.status = 'undone'; var v = job.versionBefore; job.versionBefore = null;
      api.update(); api.toast('Version ' + v + ' of the page is back. The AI version stays in the page history.');
    });
    api.on('click', '[data-edit]', function (el) { var j = S().ai.jobs.filter(function (x) { return x.id === el.dataset.edit; })[0]; S().ai.editor = emptyEditor('edit', j); api.update(); });
    api.on('click', '[data-copy]', function (el) { var j = S().ai.jobs.filter(function (x) { return x.id === el.dataset.copy; })[0]; S().ai.editor = emptyEditor('copy', j); api.update(); });
    api.on('click', '[data-del]', function (el) {
      var A = S().ai; A.jobs = A.jobs.filter(function (j) { return j.id !== el.dataset.del; });
      if (A.pageOf === el.dataset.del) A.pageOf = null;
      api.update(); api.toast('AI page deleted. Pages it already wrote stay in Confluence.');
    });
    api.on('click', '[data-newstyle]', function () { api.toast('Admins create saved styles here: name, style, language, filters and length'); });
  }

  function startRun(api, job) {
    var S = api.state(), A = S.ai, S0 = S, token = ++A.runToken, ai = whoWrites(S);
    job.statusBefore = job.status; job.pageBefore = job.page;
    job.status = 'run'; A.stage = 0; A.shown = 0; A.pageOf = job.id;
    var helmOnly = job.f.repos.length === 1 && job.f.repos[0] === 'helm';
    var an = analysis(job.f);
    job.page = { shown: 0, writing: true, state: job.f.review ? 'draft' : 'published', ai: ai,
      files: helmOnly ? '15 of 15' : (an.code > 50 ? '50 of ' + fmt(an.code) : fmt(an.code) + ' of ' + fmt(an.code)),
      method: job.f.fileMode === 'fixed' ? 'Locked selection' : an.code > 30 ? 'AI-selected files' : 'All files' };
    if (job.f.review) job.page.state = 'draft';
    api.update();
    var sections = PAGES[job.f.style].length;
    var t = 0;
    function step(fn, ms) { t += ms; later(S0, function () { if (A.runToken !== token) return; fn(); refresh('ai'); }, t); }
    step(function () { A.stage = 1; }, 700);
    step(function () { A.stage = 2; }, 800);
    step(function () { A.stage = 3; }, 700);
    for (var i = 1; i <= sections; i++) (function (n) { step(function () { A.shown = n; job.page.shown = n; }, 650); })(i);
    step(function () { A.stage = 4; job.page.writing = false; }, 500);
    step(function () {
      var review = job.f.review;
      if (!review && job.published) job.versionBefore = (job.version || 1);
      job.version = (job.version || 0) + 1;
      job.status = review ? 'inrev' : 'pub';
      if (!review) { job.published = true; if (job.mine) A.reviewed = true; }
      job.ranAt = 'Oct 8, 2026, 09:14 AM';
      A.runs.unshift({ when: 'Oct 8, 2026, 09:14 AM', name: job.f.name, status: job.status, model: ai.atlassian ? 'Atlassian AI · ' + ai.model : ai.model, files: job.page.files, tokens: helmOnly ? '6,860 / 3,940' : '—' });
      A.flash = job.id;
      if (api.tab() === 'ai') api.toast(review ? 'Draft ready for review' : 'Page published');
    }, 700);
    step(function () { A.flash = null; }, 50);
  }

  // ============================================================
  // Tab 3 · Overview & settings
  // ============================================================
  var BLOCKS = [
    { page: 'hello-world — Service Runbook', source: 'helm/examples · charts/hello-world/Chart.yaml (main)', what: 'Value(s) from YAML/JSON', upd: 'Daily', ok: true, checked: '5 h ago' },
    { page: 'hello-world — Service Runbook', source: 'helm/examples · charts/hello-world/values.yaml (main)', what: 'Value(s) from YAML/JSON', upd: 'On every push', ok: true, checked: '55 min ago' },
    { page: 'hello-world — Service Runbook', source: 'GoogleCloudPlatform/golang-samples · run/helloworld/main.go (main)', what: 'Code snippet', upd: 'Weekly', ok: true, checked: '29 h ago' },
    { page: 'hello-world — Images and dependencies', source: 'expressjs/express · package.json (master)', what: 'Value(s) from YAML/JSON', upd: 'Daily', ok: true, checked: '2 min ago' },
    { page: 'Release notes', source: 'olivierlacan/keep-a-changelog · CHANGELOG.md (main)', what: 'Latest changelog entry', upd: 'Weekly', ok: true, checked: '29 h ago' },
    { page: 'Payments — Deployment', source: 'acme-docs/payments-service · deploy/values.yaml (main)', what: 'Value(s) from YAML/JSON', upd: 'Daily', ok: false, checked: '3 h ago',
      error: 'Could not read deploy/values.yaml on branch main: the file or the branch does not exist (HTTP 404).',
      hint: 'Check the file path and the branch in the block settings. Paths are case-sensitive; copy the path from your Git provider (the part after the branch name).' }
  ];
  var RECENT = [
    ['hello-world Helm Chart — Developer Guide', 'Oct 3, 2026, 02:27 PM'], ['hello-world Helm Chart — Quick Reference', 'Oct 3, 2026, 02:26 PM'],
    ['Cloud Run Hello World — Onboarding Guide', 'Oct 3, 2026, 02:25 PM'], ['Cloud Run Hello World — Compliance & Audit', 'Oct 3, 2026, 02:25 PM', 'review'], ['Keep a Changelog — Management Overview', 'Oct 3, 2026, 02:24 PM']
  ];
  var CONNECTIONS = [
    ['GitHub', 'GitHub', 'acme-docs', 'Added Mar 30, 2026 · https://github.com · 4 repositories', false],
    ['GitLab', 'gitlab.example.com', 'docs-reader', 'Added Sep 2, 2026 · https://gitlab.example.com · 1 repository', true],
    ['Bitbucket', 'Bitbucket access token', 'Bitbucket access token', 'Added Aug 19, 2026 · 1 repository', false],
    ['Azure DevOps', 'Azure DevOps', 'fabrikam', 'Added Jul 7, 2026 · https://dev.azure.com/fabrikam · 1 repository', false]
  ];
  var GIT_TYPES = [
    ['', 'Choose GitHub, GitLab, Bitbucket, Azure DevOps or your own server'], ['gh', 'GitHub'], ['ghe', 'GitHub Enterprise (own server or ghe.com)'],
    ['gl', 'GitLab'], ['glsm', 'GitLab self-managed'], ['bb', 'Bitbucket Cloud'], ['az', 'Azure DevOps']
  ];
  var GIT_NOTE = {
    gh: ['Create a fine-grained token with read access to "Contents" for the repositories CodeDoc should read. A classic token with the "repo" scope works too.', 'github_pat_… or ghp_…'],
    gl: ['Create a personal, group or project access token with the scopes read_api and read_repository.', 'glpat-…'],
    ghe: ['On your server: Settings → Developer settings → Personal access tokens. A fine-grained token with read access to "Contents", or a classic token with the "repo" scope. The same for ghe.com.', 'github_pat_… or ghp_…'],
    glsm: ['On your server: User settings → Access tokens (or a group or project access token) with the scopes read_api and read_repository.', 'glpat-…'],
    bb: ['Create a repository access token: in Bitbucket open the repository → Repository settings → Access tokens, with the permission "Repositories: Read". With Bitbucket Premium, one project or workspace access token covers several repositories. Personal API tokens and app passwords are not accepted.', 'ATCTT…'],
    az: ['Create a personal access token with the scope "Code (Read)" and enter your organization address below.', 'Your personal access token']
  };

  function renderApp(S) {
    var P = S.app, ai = whoWrites(S);
    var ctx = '<div class="d-context cd-ctx cd-ctx-wrap"><span>Apps</span><span class="d-sep">/</span><b>CodeDoc</b>' +
      '<span class="cd-demo-switch" role="group" aria-label="Demo: show the edition"><span class="d-small">Demo: edition</span>' +
      ['std', 'adv'].map(function (e) { return '<button type="button" class="cd-seg' + (P.ed === e ? ' is-on' : '') + '" data-edition="' + e + '" aria-pressed="' + (P.ed === e) + '">' + (e === 'std' ? 'Standard' : 'Advanced') + '</button>'; }).join('') + '</span></div>';
    var head = '<div class="cd-apphead"><div><div class="cd-apptitle">CodeDoc</div><div class="d-sub">Confluence pages that stay in sync with your code</div></div>' +
      '<div class="cd-row"><span title="AI pages are written with ' + esc(ai.name) + '. Change it in Settings → Connections.">' + loz('AI: ' + ai.name, 'green') + '</span>' + loz('Admin', 'blue') + '</div></div>';
    var tabs = '<div class="cd-tabs" role="group" aria-label="CodeDoc">' + [['overview', 'Overview'], ['sync', 'Sync blocks'], ['ai', 'AI pages'], ['repos', 'Repositories'], ['settings', 'Settings']].map(function (t) {
      return '<button type="button" class="cd-tab' + (P.top === t[0] ? ' is-on' : '') + '" data-top="' + t[0] + '" aria-pressed="' + (P.top === t[0]) + '"' + next(topNext(P) === t[0]) + '>' + t[1] + '</button>';
    }).join('') + '</div>';
    var view = { sync: appSync, ai: appAi, repos: appRepos, settings: settingsView, overview: appOverview };
    var body = (view[P.top] || appOverview)(S);
    return ctx + '<div class="d-app cd-app"><span class="d-app-tag">CodeDoc</span>' + head + tabs + '<div class="cd-appbody">' + body + '</div></div>';
  }

  // Which top tab the current guided step points at (none when the step's control is on screen)
  function topNext(P) {
    var F = P.flags;
    if (!F.filtered) return P.top === 'overview' || P.top === 'sync' ? null : 'sync';
    if (!(F.quick && F.secret)) return P.top === 'settings' ? null : 'settings';
    return null;
  }
  function stat(label, value, sub, help) {
    return '<div class="cd-stat"><div class="cd-lbl"><span class="d-small d-faint">' + esc(label) + '</span>' + q(help, 'About ' + label) + '</div><b class="cd-big">' + esc(String(value)) + '</b><span class="d-small d-faint">' + esc(sub) + '</span></div>';
  }
  function appOverview(S) {
    var P = S.app, ai = whoWrites(S), drafts = P.drafts;
    var failing = BLOCKS.filter(function (b) { return !b.ok; }).length;
    var aiSub = drafts ? drafts + ' draft to review' : ai.atlassian ? 'Atlassian AI · ' + (P.ed === 'adv' ? '23.4 of 100 credits' : '') : 'model gemini-2.5-flash';
    var att = '';
    if (failing) att += msg('warning', failing + ' sync block needs attention', '<p>' + failing + ' failed to update</p><button type="button" class="d-btn is-compact" data-top="sync"' + next(!P.flags.filtered) + '>Open sync blocks</button>');
    if (drafts) att += msg('discovery', '1 AI draft waits for review', '<p>Cloud Run Hello World — Compliance &amp; Audit</p><button type="button" class="d-btn is-compact" data-top="ai">Review drafts</button>');
    return '<h4 class="d-h2">At a glance</h4><div class="cd-stats">' +
      stat('Sync blocks', BLOCKS.length, (BLOCKS.length - failing) + ' in sync' + (failing ? ' · ' + failing + ' need attention' : ''), 'Blocks on Confluence pages that CodeDoc keeps up to date from files in your repositories.') +
      stat('Last sync change', '68 min ago', 'when a block last changed a page', 'CodeDoc creates a page version only when the file content changed.') +
      stat('AI pages', 4, aiSub, ai.atlassian ? 'Documentation pages Atlassian AI writes from your code (included in CodeDoc Advanced, with a monthly allowance of credits). Optional.' : 'Documentation pages your AI provider writes from your code. Optional.') +
      stat('Repositories', 5, 'helm/examples, expressjs/express, …', 'Repositories CodeDoc may read with your access tokens.') + '</div>' +
      '<div class="cd-two">' + (att ? '<div><h4 class="d-h2">Needs attention</h4>' + att + '</div>' : '') +
      '<div><div class="cd-ph"><h4 class="d-h2" style="margin:0">Recent AI runs</h4><button type="button" class="d-btn is-subtle" data-goai>' + ICON.plus + 'New AI page</button></div>' +
      '<div class="d-table-wrap"><table class="d-table"><thead><tr><th>AI page</th><th>Result</th><th class="d-hide-sm">Model</th><th class="d-hide-sm">When</th></tr></thead><tbody>' +
      RECENT.map(function (r) { return '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + (r[2] === 'review' ? pill('In review', 'yellow') : pill('Published', 'green')) + '</td><td class="d-hide-sm d-small">gemini-2.5-flash</td><td class="d-hide-sm d-small d-faint">' + esc(r[1]) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div></div>';
  }
  function appSync(S) {
    var P = S.app, list = BLOCKS.filter(function (b) { return P.filter === 'all' || (P.filter === 'attention' ? !b.ok : b.ok); });
    var bad = BLOCKS.filter(function (b) { return !b.ok; }).length;
    return '<div class="cd-ph"><h4 class="d-h2" style="margin:0">Sync blocks</h4><div class="cd-row"><button type="button" class="d-btn is-subtle is-compact" data-howto>How to add a block</button><button type="button" class="d-btn is-subtle is-compact" data-sbrefresh>' + ICON.refresh + 'Refresh</button></div></div>' +
      '<p class="d-sub cd-ph-text">Values, tables, sections and code from files in your repositories, kept up to date on Confluence pages. No AI, no token costs. The content is normal page text, so search, export and page history include it.</p>' +
      (P.howto ? msg('discovery', 'Add a sync block to a page', '<ol class="cd-list"><li>Edit a page, type / and choose “CodeDoc Sync Block”.</li><li>Paste the link to a file from GitHub, GitLab, Bitbucket or Azure DevOps, or pick repository and file.</li><li>Choose what to show: a value, a section, the latest changelog entry, a snippet or the whole file. Check the preview, save, publish.</li></ol>') : '') +
      '<div class="cd-ph"><div class="cd-row"><b>' + BLOCKS.length + ' blocks</b>' + loz((BLOCKS.length - bad) + ' in sync', 'green') + (bad ? loz(bad + ' need attention', 'red') : '') + '</div>' +
      '<label class="cd-sr" for="cd-sbfilter">Filter</label>' + sel('cd-sbfilter', [['all', 'All blocks'], ['attention', 'Needs attention'], ['ok', 'In sync']], P.filter, ' data-sbfilter' + next(!P.flags.filtered)) + '</div>' +
      '<div class="d-table-wrap"><table class="d-table cd-sbtable"><thead><tr><th>Page</th><th class="d-hide-sm">Source</th><th class="d-hide-sm">Shows</th><th class="d-hide-sm">Updates</th><th>Status</th><th class="d-hide-sm">Last checked</th><th><span class="cd-sr">Actions</span></th></tr></thead><tbody>' +
      list.map(function (b, i) {
        return '<tr><td><span class="cd-fakelink">' + esc(b.page) + '</span></td><td class="d-hide-sm d-small">' + esc(b.source) + '</td><td class="d-hide-sm d-small">' + esc(b.what) + '</td><td class="d-hide-sm d-small">' + esc(b.upd) + '</td>' +
          '<td>' + loz(b.ok ? 'In sync' : 'Update failed', b.ok ? 'green' : 'red') + (b.error ? '<div class="d-small cd-errtext">' + esc(b.error) + '</div><div class="d-small d-faint">What to do: ' + esc(b.hint) + '</div>' : '') + '</td>' +
          '<td class="d-hide-sm d-small">' + esc(b.checked) + '</td><td><div class="cd-acts"><button type="button" class="d-btn is-subtle is-compact" data-sbnow>Update now</button><button type="button" class="d-btn is-subtle is-compact" data-sbremove>Remove</button></div></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function appAi(S) {
    var P = S.app;
    var rows = [
      ['Cloud Run Hello World — Compliance & Audit', 'Schedule', '🔒 Compliance & Audit', 'Engineering', P.drafts ? 'inrev' : P.draftResult],
      ['hello-world Helm Chart — Developer Guide', 'On push', '👨‍💻 Developer Documentation', 'Engineering', 'pub'],
      ['hello-world Helm Chart — Quick Reference', 'Manually', '⚡ Quick Reference', 'Platform', 'pub'],
      ['Keep a Changelog — Management Overview', 'Manually', '📊 Management Overview', 'Engineering', 'pub']
    ];
    return '<div class="cd-ph"><h4 class="d-h2" style="margin:0">AI pages</h4><button type="button" class="d-btn is-primary is-compact" data-goai>' + ICON.plus + 'New AI page</button></div>' +
      '<p class="d-sub cd-ph-text">The full editor is in the second tab of this demo, “AI page”.</p>' +
      '<div class="d-table-wrap"><table class="d-table"><thead><tr><th>AI page</th><th>Updates</th><th class="d-hide-sm">Style</th><th class="d-hide-sm">Space</th><th>Status</th></tr></thead><tbody>' +
      rows.map(function (r, i) {
        return '<tr><td><b>' + esc(r[0]) + '</b>' + (i === 0 && P.drafts ? '<div class="cd-acts cd-draft"><span class="d-small d-faint">Draft:</span><button type="button" class="d-btn is-primary is-compact" data-apppub>Publish</button><button type="button" class="d-btn is-subtle is-compact" data-appdisc>Discard</button></div>' : '') + '</td>' +
          '<td>' + pill(r[1], r[1] === 'Manually' ? 'grey' : r[1] === 'On push' ? 'purple' : 'yellow') + '</td><td class="d-hide-sm d-small">' + esc(r[2]) + '</td><td class="d-hide-sm d-small">' + esc(r[3]) + '</td><td>' + runPill(r[4]) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function appRepos() {
    var R = [['helm/examples', 'main', 'GitHub', 'Mar 30, 2026'], ['expressjs/express', 'master', 'GitHub', 'Mar 30, 2026'], ['GoogleCloudPlatform/golang-samples', 'main', 'GitHub', 'Apr 2, 2026'],
      ['olivierlacan/keep-a-changelog', 'main', 'GitHub', 'Apr 2, 2026'], ['acme-docs/payments-service', 'main', 'GitLab', 'Jun 12, 2026']];
    return '<div class="cd-ph"><h4 class="d-h2" style="margin:0">Repositories</h4><div class="cd-row"><button type="button" class="d-btn is-compact" data-browse title="Lists the repositories your Git connection can read, so you can add several with one click.">Browse repositories</button><button type="button" class="d-btn is-compact" data-byaddr>Add by address</button></div></div>' +
      '<p class="d-sub cd-ph-text">The repositories CodeDoc may read, with the token of their Git connection. Sync blocks and AI pages can only use these.</p>' +
      '<div class="d-table-wrap"><table class="d-table"><thead><tr><th>Repository</th><th>Branch</th><th>Provider</th><th class="d-hide-sm">Added</th></tr></thead><tbody>' +
      R.map(function (r) { return '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + loz(r[1], 'grey') + '</td><td><span class="d-loz cd-loz-purple">' + esc(r[2]) + '</span></td><td class="d-hide-sm d-small d-faint">' + esc(r[3]) + '</td></tr>'; }).join('') +
      '</tbody></table></div>';
  }
  function settingsView(S) {
    var P = S.app;
    var tabs = '<div class="cd-subtabs" role="group" aria-label="Settings">' + [['connections', 'Connections'], ['webhook', 'Webhook'], ['limits', 'AI limits'], ['permissions', 'Permissions'], ['privacy', 'Privacy & help']].map(function (t) {
      return '<button type="button" class="cd-subtab' + (P.set === t[0] ? ' is-on' : '') + '" data-set="' + t[0] + '" aria-pressed="' + (P.set === t[0]) + '"' + next((t[0] === 'webhook' && P.flags.quick && !P.flags.secret && P.set !== 'webhook') ||
        (t[0] === 'connections' && P.flags.filtered && !P.flags.quick && P.set !== 'connections')) + '>' + t[1] + '</button>';
    }).join('') + '</div>';
    var body = '';
    if (P.set === 'connections') body = setConnections(S);
    else if (P.set === 'webhook') body = setWebhook(S);
    else if (P.set === 'limits') {
      body = '<div class="cd-card"><h5 class="d-h3">AI page limits</h5><p class="d-small d-faint">How much code one AI page may read. Higher values cover larger codebases, but runs take longer, cost more and may time out. Sync blocks are not affected.</p>' +
        '<div class="cd-field"><label class="cd-lbltext" for="cd-maxfiles">Maximum files per AI page</label><input class="d-input" id="cd-maxfiles" type="number" min="5" max="200" value="50"><p class="d-help">Default: 50 (range: 5–200). Larger folders are narrowed to the most relevant files.</p></div>' +
        '<div class="cd-field"><label class="cd-lbltext" for="cd-budget">Input token budget</label><input class="d-input" id="cd-budget" type="number" min="30000" max="500000" step="1000" value="120000"><p class="d-help">Total token budget for all file content sent to the AI. Default: 120,000 (range: 30,000–500,000). Files beyond this budget are skipped.</p></div>' +
        '<label class="cd-check"><input type="checkbox"> Advanced: exact page length in tokens</label><p class="d-help">Off (recommended): the AI page editor offers Short, Standard and Long. On: it shows the exact number of output tokens instead.</p>' +
        '<button type="button" class="d-btn is-primary" data-savelimits>Save limits</button></div>';
    } else if (P.set === 'permissions') {
      body = '<div class="cd-card"><h5 class="d-h3">Permissions</h5>' + msg('info', '', '<p class="d-small">Confluence administrators are always CodeDoc admins. Give other people access by adding their Confluence groups here; manage group members in Confluence administration.</p>') +
        [['Administrator Groups', 'docs-admins'], ['Job Operator Groups', 'docs-operators']].map(function (g) {
          return '<div class="cd-field"><b class="d-small">' + g[0] + '</b><div class="cd-row cd-wrap"><span class="d-loz is-blue">Group</span><span>' + g[1] + '</span></div></div>';
        }).join('') + '</div>';
    } else {
      body = '<div class="cd-card"><h5 class="d-h3">Privacy &amp; help</h5><p class="d-small">Sync blocks read files with your access token and send nothing to an AI provider. AI pages send the chosen files to Atlassian AI or to your own AI provider. There is no CodeDoc server in between.</p><p class="d-small d-faint">User guide · Sync blocks · Setup guide · Privacy policy · Terms of service</p></div>';
    }
    return '<h4 class="d-h2" style="margin:0 0 4px">Settings</h4><p class="d-sub cd-ph-text">Connections to your Git provider and AI provider, webhooks, AI limits, who may use CodeDoc, privacy and help.</p>' + tabs + body;
  }
  function setConnections(S) {
    var P = S.app, adv = P.ed === 'adv';
    var git = '<div class="cd-card"><div class="cd-ph"><div><h5 class="d-h3" style="margin:0">Git connections</h5><p class="d-small d-faint" style="margin:2px 0 0">Read-only access tokens for GitHub, GitLab, Bitbucket and Azure DevOps, and for your own GitHub Enterprise or GitLab server. Several accounts are possible.</p></div>' +
      (P.addConn ? '' : '<button type="button" class="d-btn is-compact" data-addconn>' + ICON.plus + 'Add connection</button>') + '</div>';
    if (P.addConn) git += gitForm(S);
    git += CONNECTIONS.map(function (c) {
      return '<div class="cd-conn"><div><div class="cd-row cd-wrap"><span class="d-loz cd-loz-purple">' + esc(c[0]) + '</span>' + (c[4] ? '<span class="d-loz cd-loz-purple" title="Your own server. A site admin allowed CodeDoc to reach it; the approval is listed in Atlassian Administration → Connected apps → CodeDoc → Data management.">Own server</span>' : '') +
        '<b>' + esc(c[1]) + '</b>' + (c[1] !== c[2] ? '<span class="d-small d-faint">(' + esc(c[2]) + ')</span>' : '') + '</div><div class="d-small d-faint">' + esc(c[3]) + '</div></div>' +
        '<button type="button" class="d-btn is-subtle is-compact" data-connremove title="Deletes the stored token. Repositories of this connection are removed from CodeDoc.">Remove</button></div>';
    }).join('') + '</div>';

    var src = P.writer, quality = P.speed;
    var ai = '<div class="cd-card"><div class="cd-row cd-wrap"><h5 class="d-h3" style="margin:0">AI for AI pages</h5>' + loz(adv && src === 'atl' ? 'Atlassian AI' : 'Google AI (Gemini)', 'green') +
      '<span class="d-loz ' + (adv ? 'cd-loz-purple' : 'is-grey') + '">' + (adv ? 'Advanced edition' : 'Standard edition') + '</span></div>' +
      '<p class="d-small d-faint">Optional: only AI pages use AI. Sync blocks never call an AI provider.</p>';
    if (adv) {
      ai += '<div class="cd-box is-sunken"><div class="cd-radios" role="radiogroup" aria-label="Who writes the AI pages">' +
        '<label class="cd-radio"><input type="radio" name="cd-src" value="atl" data-src data-fid="src-atl"' + (src === 'atl' ? ' checked' : '') + '> Atlassian AI, included in CodeDoc Advanced: Claude models on Atlassian\'s platform, no own key</label>' +
        '<label class="cd-radio"><input type="radio" name="cd-src" value="byok" data-src data-fid="src-own"' + (src === 'byok' ? ' checked' : '') + '> Your own AI provider: Google AI (Gemini) (gemini-2.5-flash)</label></div>';
      if (src === 'atl') {
        ai += '<div class="cd-field">' + fieldLabel('cd-quality', 'Model', 'Balanced writes the most thorough pages. Fast finishes quicker and uses about a third of the credits. CodeDoc picks the newest available model of the chosen family; choosing the files of large repositories always uses the fast model.') +
          sel('cd-quality', [['bal', 'Balanced: Claude Sonnet (recommended)'], ['fst', 'Fast: Claude Haiku (about a third of the credits)']], quality, ' data-quality' + next(!P.flags.quick)) + '</div>';
      }
      ai += '<div class="cd-meter"><div class="cd-row"><b>' + (src === 'atl' ? 'AI allowance this month' : 'AI allowance') + '</b>' +
        q('Atlassian AI is included in CodeDoc Advanced. A run uses credits for the code it reads and the page it writes: a typical page 2–5 credits, with the fast model about a third. Before a run starts, CodeDoc checks that its largest possible use still fits; when the allowance is used up, AI pages wait for the next month or use your own AI provider. CodeDoc credits are separate from Rovo credits: nothing is taken from your Atlassian AI or Rovo allowance.', 'About the AI allowance') + '</div>' +
        D.bar(23.4, 'blue') + '<p class="d-small">23.4 of 100 credits used · 76.6 left · resets on November 1</p>' +
        (src === 'atl' ? '<p class="d-small d-faint">9 AI runs this month · 412,880 tokens read, 61,240 written</p>' : '') + '</div></div>';
    } else {
      ai += '<div class="cd-box is-sunken"><p class="d-small" style="margin:0">No AI key at hand? CodeDoc Advanced includes Atlassian AI: Claude models on Atlassian\'s platform, with a monthly allowance. <button type="button" class="cd-linkbtn" data-edition="adv">Compare editions</button></p></div>';
    }
    ai += '<div class="cd-field"><div class="cd-row"><b>Your own AI provider</b>' + q('CodeDoc calls Anthropic, OpenAI or Google Gemini directly with your key: your contract, your data terms, your costs. There is no CodeDoc server in between.', 'About your own AI provider') + '</div>' +
      fieldLabel('cd-model', 'Model', 'Every text model of your provider, newest first, with recommended models at the top. Type to search.') +
      '<div class="cd-row cd-wrap">' + sel('cd-model', [['g25f', 'Gemini 2.5 Flash · gemini-2.5-flash'], ['gpl', 'Gemini Pro Latest · gemini-pro-latest']], 'g25f') +
      '<button type="button" class="d-btn is-subtle is-compact" data-refreshmodels>' + ICON.refresh + 'Refresh list</button></div>' +
      '<div class="cd-row cd-wrap" style="margin-top:8px"><button type="button" class="d-btn is-compact" data-changekey>Change provider or key</button><button type="button" class="d-btn is-subtle is-compact" data-removekey title="' + (adv ? 'Removes the stored AI key. AI pages continue with Atlassian AI.' : 'Removes the stored AI key. Sync blocks keep working; AI pages stay as they are and run again once a provider is connected.') + '">' + (adv ? 'Remove own key' : 'Turn AI off') + '</button></div>' +
      (adv && src === 'atl' ? msg('info', '', '<p class="d-small">Your own provider stays connected but is not used while Atlassian AI is selected.</p>') : '') + '</div></div>';
    return git + ai;
  }
  function gitForm(S) {
    var g = S.app.addConn, t = g.type, self = t === 'ghe' || t === 'glsm', note = GIT_NOTE[t];
    var f = '<div class="cd-box is-sunken cd-gitform"><div class="cd-field">' + fieldLabel('cd-gittype', 'Git provider', 'Where your repositories live. You can connect more providers or accounts later in Settings.', true) + sel('cd-gittype', GIT_TYPES, t, ' data-gittype') + '</div>';
    if (self) {
      f += '<div class="cd-field">' + fieldLabel('cd-server', 'Server address', 'The address you open your server with in the browser, for example https://github.example.com or https://gitlab.example.com (with a path if GitLab runs under one, like https://example.com/gitlab). For GitHub Enterprise Cloud with data residency: https://YOUR-NAME.ghe.com.', true) +
        '<input class="d-input cd-full" id="cd-server" data-fid="cd-server" placeholder="' + (t === 'ghe' ? 'https://github.example.com' : 'https://gitlab.example.com') + '"' + (g.allowed ? ' disabled value="https://gitlab.example.com"' : '') + '>' +
        '<p class="d-help">CodeDoc runs on Atlassian\'s cloud, so the server must be reachable from the internet over HTTPS with a valid certificate. Behind a firewall, allow Atlassian\'s outgoing IP addresses.</p></div>' +
        (g.allowed ? msg('success', '', '<p class="d-small">CodeDoc may connect to this server. Admins see and can remove this approval in Atlassian Administration → Connected apps → CodeDoc → Data management.</p>') :
          '<div class="cd-row cd-wrap"><button type="button" class="d-btn is-primary is-compact" data-allowserver title="Atlassian asks a site admin to confirm that CodeDoc may send requests to this address. Without this approval Forge blocks every request to it.">Allow access to the server</button><span class="d-small d-faint">Step 1 of 2: needs a site admin.</span></div>');
    }
    if (t && (!self || g.allowed)) {
      f += '<p class="d-small d-faint">' + esc(note[0]) + '</p>' +
        '<div class="cd-field">' + fieldLabel('cd-token', 'Access token', 'CodeDoc stores the token encrypted in your Confluence site (Forge secret storage) and uses it only to read files. It is never shown again and never written to a page.', true) +
        '<input class="d-input cd-full" id="cd-token" type="password" autocomplete="off" placeholder="' + esc(note[1]) + '"></div>' +
        (t === 'az' ? '<div class="cd-field">' + fieldLabel('cd-org', 'Organization URL', 'The address of your Azure DevOps organization.', true) + '<input class="d-input cd-full" id="cd-org" placeholder="https://dev.azure.com/your-org"></div>' : '') +
        '<div class="cd-field">' + fieldLabel('cd-label', 'Display name (optional)', 'A name that tells several connections apart, for example Work GitHub.') + '<input class="d-input cd-full" id="cd-label" placeholder="e.g. Platform team GitHub"></div>';
    }
    if (g.note) f += msg('info', '', '<p class="d-small">' + esc(g.note) + '</p>');
    f += '<div class="cd-row"><button type="button" class="d-btn is-primary is-compact" data-connect' + (t && (!self || g.allowed) ? '' : ' disabled') + ' title="Checks the token with your Git provider and saves it if it works.">Connect</button><button type="button" class="d-btn is-subtle is-compact" data-connclose>Cancel</button></div></div>';
    return f;
  }
  function setWebhook(S) {
    var P = S.app, has = P.secret;
    return '<div class="cd-card"><h5 class="d-h3">Webhook</h5><p class="d-small">Sync blocks set to "On every push" and AI pages set to "On every push" update when your Git provider calls this address. Add it as a webhook in each repository (push events). Without a webhook, choose a daily or weekly update.</p>' +
      '<div class="cd-field"><label class="cd-lbltext" for="cd-hookurl">Webhook URL</label><input class="d-input cd-full" id="cd-hookurl" readonly value="https://your-site-webhook.example/x1/sample-address"><p class="d-help">Sample address. Your site has its own.</p></div></div>' +
      '<div class="cd-card"><div class="cd-row"><h5 class="d-h3" style="margin:0">Webhook secret</h5>' + loz(has ? 'Protected' : 'Not protected', has ? 'green' : 'yellow') + '</div>' +
      '<p class="d-small">With a secret, CodeDoc accepts a webhook call only when it carries the secret, so nobody else can start updates or AI page runs (which use your AI budget) by calling the address.</p>' +
      (!has ? msg('warning', 'The webhook is not protected', '<p class="d-small">Create a secret and add it to each webhook that calls CodeDoc. Webhooks you set up before keep working until you create the secret; after that, CodeDoc rejects calls without it.</p>') : '') +
      (has && P.showSecret ? '<div class="cd-field"><label class="cd-lbltext" for="cd-secret">Secret</label><input class="d-input cd-full cd-mono" id="cd-secret" readonly value="' + esc(P.secretValue) + '"><p class="d-help">GitHub and GitHub Enterprise: webhook → Secret. GitLab: webhook → Secret token. Bitbucket: webhook → Secret. Azure DevOps: service hook → Basic authentication, any user name, the secret as the password.</p></div>' : '') +
      (P.confirm ? '<div class="cd-row cd-wrap"><span class="d-small cd-errtext">' + (P.confirm === 'replace' ? 'Replace the secret? Webhooks with the old secret are rejected until you add the new one.' : 'Remove the secret? CodeDoc then accepts webhook calls without a secret again.') + '</span>' +
        '<button type="button" class="d-btn is-compact cd-dangerbtn" data-secretyes>Yes</button><button type="button" class="d-btn is-subtle is-compact" data-secretno>No</button></div>' :
        '<div class="cd-row cd-wrap">' + (!has ? '<button type="button" class="d-btn is-primary" data-secret="create"' + next(!P.flags.secret) + ' title="Creates a random secret. Copy it into each webhook; from then on CodeDoc rejects webhook calls without it.">Create secret</button>' : '') +
        (has && !P.showSecret ? '<button type="button" class="d-btn is-compact" data-secret="show">Show secret</button>' : '') +
        (has ? '<button type="button" class="d-btn is-subtle is-compact" data-secret="replace">Replace secret</button><button type="button" class="d-btn is-subtle is-compact" data-secret="remove">Remove secret</button>' : '') + '</div>') + '</div>';
  }

  function newSecret() {
    var c = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 40; i++) s += c.charAt(Math.floor(Math.random() * c.length));
    return s;
  }
  function setupApp(api) {
    var S = function () { return api.state(); };
    api.on('click', '[data-top]', function (el) { S().app.top = el.dataset.top; api.update(); });
    api.on('click', '[data-set]', function (el) { S().app.set = el.dataset.set; api.update(); });
    api.on('click', '[data-edition]', function (el) {
      var P = S().app; P.ed = el.dataset.edition; if (P.ed === 'adv' && !P.writer) P.writer = 'atl';
      if (el.classList.contains('cd-linkbtn')) { P.top = 'settings'; P.set = 'connections'; }
      api.update(); api.toast('Showing CodeDoc ' + (P.ed === 'adv' ? 'Advanced' : 'Standard'));
    });
    api.on('change', '[data-sbfilter]', function (el) { var P = S().app; P.filter = el.value; if (el.value === 'attention') P.flags.filtered = true; api.update(); });
    api.on('click', '[data-howto]', function () { S().app.howto = !S().app.howto; api.update(); });
    api.on('click', '[data-sbrefresh]', function () { api.toast('Status of all sync blocks loaded'); });
    api.on('click', '[data-sbnow]', function () { api.toast('Update started. Click Refresh in a few seconds to see the result.'); });
    api.on('click', '[data-sbremove]', function () { api.toast('In the app you confirm first: the content stays on the page as normal text'); });
    api.on('click', '[data-goai]', function () { var A = S().ai; if (!A.editor) A.editor = emptyEditor('new'); api.go('ai', true); });
    api.on('click', '[data-apppub]', function () { var P = S().app; P.drafts = 0; P.draftResult = 'pubrev'; api.update(); api.toast('Draft of “Cloud Run Hello World — Compliance & Audit” published.'); });
    api.on('click', '[data-appdisc]', function () { var P = S().app; P.drafts = 0; P.draftResult = 'disc'; api.update(); api.toast('Draft discarded. The published page stays as it is.'); });
    api.on('click', '[data-browse]', function () { api.toast('Lists the repositories of your Git account (up to 100) to add with one click'); });
    api.on('click', '[data-byaddr]', function () { api.toast('Paste a repository address; CodeDoc detects the default branch'); });
    api.on('change', '[data-src]', function (el) { S().app.writer = el.value; api.update(); api.toast(el.value === 'atl' ? 'AI pages now use Atlassian AI.' : 'AI pages now use Google AI (Gemini).'); });
    api.on('change', '[data-quality]', function (el) {
      var P = S().app; P.speed = el.value; if (el.value === 'fst') P.flags.quick = true;
      api.update(); api.toast('Atlassian AI now uses the ' + (el.value === 'fst' ? 'fast' : 'balanced') + ' model.');
    });
    api.on('click', '[data-refreshmodels]', function () { api.toast('Model list loaded from your provider'); });
    api.on('click', '[data-changekey]', function () { api.toast('In the app: choose the provider, paste the key, CodeDoc checks it'); });
    api.on('click', '[data-removekey]', function () { api.toast('In the app you confirm first; sync blocks keep working'); });
    api.on('click', '[data-connremove]', function () { api.toast('In the app you confirm first; the last connection cannot be removed'); });
    api.on('click', '[data-addconn]', function () { S().app.addConn = { type: '', allowed: false, note: null }; api.update(); var s = api.el('#cd-gittype'); if (s) s.focus(); });
    api.on('change', '[data-gittype]', function (el) { var g = S().app.addConn; g.type = el.value; g.allowed = false; g.note = null; api.update(); });
    api.on('click', '[data-allowserver]', function () { var g = S().app.addConn; g.allowed = true; api.update(); api.toast('A site admin confirmed the Atlassian dialog (simulated)'); });
    api.on('click', '[data-connect]', function () { S().app.addConn.note = 'Demo: no token is checked or stored here. In your Confluence, CodeDoc checks the token with the Git provider and names the account it is connected as.'; api.update(); });
    api.on('click', '[data-connclose]', function () { S().app.addConn = null; api.update(); });
    api.on('click', '[data-savelimits]', function () { api.toast('AI page limits saved.'); });
    api.on('click', '[data-secret]', function (el) {
      var P = S().app, a = el.dataset.secret;
      if (a === 'create') { P.secret = true; P.showSecret = true; P.secretValue = newSecret(); P.flags.secret = true; api.toast('Secret created. Add it to each webhook.'); }
      if (a === 'show') P.showSecret = true;
      if (a === 'replace' || a === 'remove') P.confirm = a;
      api.update();
    });
    api.on('click', '[data-secretyes]', function () {
      var P = S().app;
      if (P.confirm === 'replace') { P.secretValue = newSecret(); P.showSecret = true; api.toast('New secret created. Every webhook needs it now.'); }
      else { P.secret = false; P.showSecret = false; api.toast('Secret removed.'); }
      P.confirm = null; api.update();
    });
    api.on('click', '[data-secretno]', function () { S().app.confirm = null; api.update(); });
  }

  // ============================================================
  // Mount
  // ============================================================
  function initialState() {
    return {
      sb: { stage: 'edit', dlg: null, cfg: null, content: null, error: null, rev: 0, linked: false, saved: false, pushed: false, checkedAfterPush: false, busy: false, checked: 'just now', note: null, flash: false },
      ai: {
        editor: null, sub: 'pages', seq: 1, runToken: 0, stage: 0, shown: 0, pageOf: null, flash: null, flashPage: false, reached: false, targetDone: false, created: false, reviewed: false,
        jobs: [{ id: 'j1', mine: false, status: 'pub', ranAt: 'Oct 3, 2026, 02:25 PM', published: true, versionBefore: 3, version: 4,
          f: { name: 'Cloud Run Hello World — Onboarding Guide', repos: ['go'], branch: {}, folder: { go: 'run/helloworld' }, fileMode: 'auto', showFiles: false, style: 'onboard', instr: '', lang: 'en', langText: '', length: 16384, space: 'ENG', parent: 'Services', review: false, when: 'byhand', freq: 'd', hour: 2, dow: 1, dom: 1, firstRunNow: true } }],
        runs: [
          { when: 'Oct 3, 2026, 02:27 PM', name: 'hello-world Helm Chart — Developer Guide', status: 'pub', model: 'gemini-2.5-flash', files: '15 of 15', tokens: '6,860 / 4,120' },
          { when: 'Oct 3, 2026, 02:25 PM', name: 'Cloud Run Hello World — Onboarding Guide', status: 'pub', model: 'gemini-2.5-flash', files: '4 of 4', tokens: '2,100 / 3,310' },
          { when: 'Oct 2, 2026, 11:02 AM', name: 'Keep a Changelog — Management Overview', status: 'disc', model: 'gemini-2.5-flash', files: '3 of 3', tokens: '5,240 / 1,980' }
        ]
      },
      app: { top: 'overview', set: 'connections', ed: 'adv', writer: 'atl', speed: 'bal', filter: 'all', howto: false, drafts: 1, draftResult: 'inrev',
        secret: false, showSecret: false, secretValue: '', confirm: null, addConn: null, flags: { filtered: false, quick: false, secret: false } }
    };
  }

  API = D.mount(root, {
    id: 'cd',
    title: 'CodeDoc',
    tabs: [
      { id: 'sync', label: 'Sync block' },
      { id: 'ai', label: 'AI page' },
      { id: 'app', label: 'Overview & settings' }
    ],
    initialState: initialState,
    render: function (tab, S) { return ({ ai: renderAi, app: renderApp, sync: renderSync }[tab] || renderSync)(S); },
    steps: {
      sync: [
        { text: 'type <strong>/</strong> on the page, choose <strong>CodeDoc Sync Block</strong> and click <strong>Use link</strong> (the link to a Chart.yaml is already pasted).', target: '[data-next]', done: function (S) { return S.sb.linked; } },
        { text: 'click <strong>Show the keys of the file</strong>, add <strong>appVersion</strong>, then <strong>Show preview</strong> and <strong>Save</strong>.', target: '[data-next]', done: function (S) { return S.sb.saved; } },
        { text: '<strong>Publish</strong> the page, click <strong>Simulate a push</strong> (appVersion 1.17.0), then <strong>Update now</strong> on the block.', target: '[data-next]', done: function (S) { return S.sb.checkedAfterPush; } }
      ],
      ai: [
        { text: 'click <strong>New AI page</strong>, tick <strong>helm/examples</strong> and go on with <strong>Next: Content</strong>.', target: '[data-next]', done: function (S) { return S.ai.reached; } },
        { text: 'pick a <strong>Writing style</strong>, go to <strong>Target page</strong>, choose a <strong>Space</strong> and tick <strong>Review each run before it is published</strong>.', target: '[data-next]', done: function (S) { return S.ai.targetDone || S.ai.created; } },
        { text: 'go to <strong>Updates</strong>, click <strong>Create AI page</strong> and then <strong>Run</strong> (writing takes about 7 seconds). When the draft is ready, <strong>Publish</strong> it.', target: '[data-next]', done: function (S) { return S.ai.reviewed; } }
      ],
      app: [
        { text: 'in <strong>Needs attention</strong>, click <strong>Open sync blocks</strong> and filter by <strong>Needs attention</strong>.', target: '[data-next]', done: function (S) { return S.app.flags.filtered; } },
        { text: 'open <strong>Settings</strong> and switch the Atlassian AI model to <strong>Fast</strong>. The demo switch at the top shows the Standard edition.', target: '[data-next]', done: function (S) { return S.app.flags.quick; } },
        { text: 'open <strong>Webhook</strong> and click <strong>Create secret</strong>, so only your Git provider can start updates.', target: '[data-next]', done: function (S) { return S.app.flags.secret; } }
      ]
    },
    doneText: {
      sync: '<strong>That’s a sync block.</strong> The content is normal page text, and CodeDoc writes a new page version only when the file changed.',
      ai: '<strong>That’s an AI page.</strong> CodeDoc read the files, the AI wrote the page, and with review on, nothing goes live before Publish.',
      app: '<strong>One place for everything.</strong> In your Confluence only CodeDoc admins change settings; Job Operators can see them.'
    },
    setup: function (api) {
      API = api;
      setupSync(api);
      setupAi(api);
      setupApp(api);
    }
  });
})();
