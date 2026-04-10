#!/usr/bin/env node
/**
 * build-index.js — Blog post index generator
 *
 * Run from blog/ directory (or anywhere):
 *   node blog/build-index.js
 *
 * Scans all blog/*.html files (except index.html), extracts metadata
 * from <title>, <meta name="description">, and JSON-LD, then writes
 * posts.json. The index.html fetches this JSON at runtime.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const BLOG_DIR   = path.join(__dirname);
const OUTPUT     = path.join(BLOG_DIR, 'posts.json');
const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Tag detection ──────────────────────────────────────────────────────────
// Rules are checked in order; a file can collect multiple tags.
const TAG_RULES = [
  { tag: 'priorityscoring', keywords: ['wsjf','rice ','ice ','ice scoring','priorit','backlog health','backlog grooming','board health','grooming checklist','scoring','prioritization framework'] },
  { tag: 'confluence',      keywords: ['confluence'] },
  { tag: 'enterprise',      keywords: ['enterprise','byok','compliance','security','gdpr'] },
  { tag: 'jira',            keywords: ['jira','sprint','epic','scrum','backlog','agile','safe ','pi planning'] },
  { tag: 'forge',           keywords: ['forge','atlassian marketplace','ui kit'] },
];

const TAG_LABELS = {
  jira:           'Jira',
  priorityscoring:'Priority Scoring',
  confluence:     'Confluence',
  enterprise:     'Enterprise',
  forge:          'Forge',
};

function detectTags(keywords, title, filename) {
  const haystack = [keywords, title, filename.replace(/[-_.]/g,' ')].join(' ').toLowerCase();
  const found = TAG_RULES
    .filter(rule => rule.keywords.some(kw => haystack.includes(kw)))
    .map(rule => rule.tag);
  return found.length > 0 ? found : ['forge'];
}

// ── Metadata extraction ────────────────────────────────────────────────────
function extractMeta(html) {
  // <title>
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = (titleMatch ? titleMatch[1] : 'Untitled')
    .replace(/\s*\|\s*Janek Behrens\s*$/i, '').trim();

  // <meta name="description">
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
                 || html.match(/<meta\s+content="([^"]+)"\s+name="description"/i);
  const description = descMatch ? descMatch[1] : '';

  // datePublished from JSON-LD (first occurrence)
  const dateMatch = html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '2026-01-01';

  // keywords array from JSON-LD
  const kwMatch = html.match(/"keywords"\s*:\s*\[([^\]]+)\]/);
  const keywords = kwMatch ? kwMatch[1].replace(/"/g,'').toLowerCase() : '';

  return { title, description, date, keywords };
}

function estimateReadTime(html) {
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim();
  return Math.max(4, Math.round(text.split(' ').length / 200));
}

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return MONTHS[m - 1] + ' ' + d + ', ' + y;
}

// ── Main ───────────────────────────────────────────────────────────────────
const files = fs.readdirSync(BLOG_DIR)
  .filter(f => f.endsWith('.html') && f !== 'index.html')
  .sort();

if (files.length === 0) {
  console.error('No article HTML files found in', BLOG_DIR);
  process.exit(1);
}

const posts = files.map(file => {
  const html     = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
  const { title, description, date, keywords } = extractMeta(html);
  const tags     = detectTags(keywords, title, file);
  const readTime = estimateReadTime(html);
  const label    = tags.map(t => TAG_LABELS[t] || t).join(' · ');
  const dateStr  = formatDate(date);

  return { file, title, description, date, dateStr, tags, label, readTime };
});

// Newest first
posts.sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync(OUTPUT, JSON.stringify(posts, null, 2));
console.log(`posts.json — ${posts.length} articles written`);
posts.forEach(p => console.log(`  ${p.date}  [${p.tags.join(', ')}]  ${p.file}`));
