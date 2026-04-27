import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ComplianceReport } from '../types.js';
import mappingRaw from '../rgaa/rgaa-mapping.json' assert { type: 'json' };

const mapping = mappingRaw as Array<{
  rgaa_id: string; theme: string; wcag_ref: string; description: string;
  automation_type: string; axe_rule: string | null; ai_required: boolean;
  severity: string; test_strategy: string;
}>;

function escHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function safeJson(obj: unknown): string {
  return JSON.stringify(obj).replaceAll('</', '<\\/');
}

export async function writeJsonReport(
  report: ComplianceReport,
  path = 'reports/rgaa-compliance-report.json',
) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

export async function writeHtmlReport(
  report: ComplianceReport,
  path = 'reports/rgaa-compliance-report.html',
) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buildHtmlReport(report), 'utf8');
}

// ─── HTML builder ────────────────────────────────────────────────────────────

function buildHtmlReport(report: ComplianceReport): string {
  const rJson = safeJson(report);
  const mJson = safeJson(mapping);
  const savedOv = safeJson(report.overrides ?? {});
  const pageTitle = escHtml(report.summary.url);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RGAA Report &ndash; ${pageTitle}</title>
<style>
:root{--bg:#f1f5f9;--surf:#fff;--brd:#e2e8f0;--txt:#0f172a;--mut:#64748b;--rad:8px;
  --sh:0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.05);
  --sh2:0 4px 6px -1px rgba(0,0,0,.08),0 2px 4px -2px rgba(0,0,0,.05)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--txt);font-size:14px;line-height:1.5}
a{color:#2563eb;text-decoration:none}a:hover{text-decoration:underline}
button{font-family:inherit}

/* ── header ──────────────────────────────────────────────────────────── */
.hdr{background:#0f172a;padding:18px 32px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.hdr-title{font-size:18px;font-weight:700;color:#f8fafc;letter-spacing:-.02em}
.hdr-sub{font-size:12px;color:#94a3b8;margin-top:3px;word-break:break-all}
.hdr-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
.hdr-date{font-size:12px;color:#94a3b8}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:background .15s,transform .1s}
.btn:active{transform:scale(.97)}
.btn-dl{background:#2563eb;color:#fff}.btn-dl:hover{background:#1d4ed8}

/* ── layout ──────────────────────────────────────────────────────────── */
.main{max-width:1300px;margin:0 auto;padding:24px 32px}

/* ── score section ───────────────────────────────────────────────────── */
.score-sec{display:grid;grid-template-columns:auto 1fr auto;gap:24px;background:var(--surf);border-radius:var(--rad);padding:24px;box-shadow:var(--sh);margin-bottom:20px;align-items:center}
.donut-wrap{display:flex;flex-direction:column;align-items:center;gap:6px}
.donut-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut)}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.stat-card{background:var(--bg);border-radius:6px;padding:14px 10px;text-align:center;border:2px solid transparent;cursor:pointer;transition:border-color .15s,box-shadow .15s}
.stat-card:hover{box-shadow:var(--sh2)}
.stat-card.sel{border-color:currentColor;box-shadow:var(--sh2)}
.stat-num{font-size:30px;font-weight:800;line-height:1}
.stat-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-top:4px;color:var(--mut)}
.c-fail{color:#dc2626}.c-pass{color:#16a34a}.c-manual{color:#d97706}.c-na{color:#64748b}
.risk-chip{display:inline-flex;align-items:center;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.rk-HIGH{background:#fee2e2;color:#b91c1c}.rk-MEDIUM{background:#fef3c7;color:#b45309}.rk-LOW{background:#dcfce7;color:#15803d}

/* ── coverage ────────────────────────────────────────────────────────── */
.cov{display:flex;flex-direction:column;gap:8px;min-width:190px}
.cov-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut)}
.cov-bar{background:var(--brd);border-radius:4px;height:10px;overflow:hidden;display:flex}
.cov-seg{height:100%}
.cs-axe{background:#2563eb}.cs-ai{background:#7c3aed}.cs-man{background:#94a3b8}
.leg{display:flex;flex-direction:column;gap:5px}
.leg-row{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--mut)}
.leg-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.leg-n{margin-left:auto;font-weight:700;color:var(--txt)}
.leg-divider{border-top:1px solid var(--brd);padding-top:5px;margin-top:2px}

/* ── page tabs ───────────────────────────────────────────────────────── */
.page-tabs{background:var(--surf);border-radius:var(--rad);box-shadow:var(--sh);margin-bottom:20px;overflow:hidden}
.tab-bar{display:flex;overflow-x:auto;border-bottom:1px solid var(--brd);scrollbar-width:thin}
.tab-bar::-webkit-scrollbar{height:3px}.tab-bar::-webkit-scrollbar-thumb{background:var(--brd)}
.tab{padding:11px 18px;cursor:pointer;font-size:13px;font-weight:500;color:var(--mut);border:none;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;transition:color .15s;background:none}
.tab:hover{color:var(--txt)}.tab.act{color:#2563eb;border-bottom-color:#2563eb}
.tab-sc{font-size:11px;padding:2px 7px;border-radius:10px;font-weight:700}
.tsc-h{background:#fee2e2;color:#b91c1c}.tsc-m{background:#fef3c7;color:#b45309}.tsc-l{background:#dcfce7;color:#15803d}

/* ── filter bar ──────────────────────────────────────────────────────── */
.filter-bar{background:var(--surf);border-radius:var(--rad);padding:14px 20px;box-shadow:var(--sh);margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.pills{display:flex;gap:6px;flex-wrap:wrap}
.pill{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:2px solid transparent;background:none;transition:all .15s}
.p-all{background:#f1f5f9;color:#475569;border-color:#e2e8f0}.p-all:hover,.p-all.act{background:#475569;color:#fff;border-color:#475569}
.p-fail{background:#fee2e2;color:#dc2626;border-color:#fecaca}.p-fail:hover,.p-fail.act{background:#dc2626;color:#fff}
.p-pass{background:#dcfce7;color:#16a34a;border-color:#bbf7d0}.p-pass:hover,.p-pass.act{background:#16a34a;color:#fff}
.p-man{background:#fef3c7;color:#d97706;border-color:#fde68a}.p-man:hover,.p-man.act{background:#d97706;color:#fff}
.p-na{background:#f8fafc;color:#64748b;border-color:#e2e8f0}.p-na:hover,.p-na.act{background:#64748b;color:#fff}
.search-wrap{position:relative}
.search-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--mut);pointer-events:none;font-size:13px}
.search-inp{padding:7px 12px 7px 32px;border:1px solid var(--brd);border-radius:6px;font-size:13px;width:230px;outline:none;transition:border-color .15s,box-shadow .15s}
.search-inp:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1)}

/* ── theme groups ────────────────────────────────────────────────────── */
.theme-g{background:var(--surf);border-radius:var(--rad);box-shadow:var(--sh);margin-bottom:10px;overflow:hidden}
.theme-g.hid{display:none}
.theme-hdr{padding:13px 20px;display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;transition:background .1s;border:none;background:var(--surf);width:100%;text-align:left}
.theme-hdr:hover{background:#f8fafc}
.theme-num{width:28px;height:28px;border-radius:50%;background:#e2e8f0;color:#475569;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}
.theme-name{font-weight:700;font-size:14px;flex:1}
.mini-stats{display:flex;gap:5px}
.mb{font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px}
.mb-f{background:#fee2e2;color:#dc2626}.mb-p{background:#dcfce7;color:#15803d}.mb-m{background:#fef3c7;color:#b45309}.mb-n{background:#f1f5f9;color:#64748b}
.chv{font-size:10px;color:var(--mut);transition:transform .2s;margin-left:4px}
.chv.open{transform:rotate(180deg)}
.theme-body{border-top:1px solid var(--brd)}

/* ── rule rows ───────────────────────────────────────────────────────── */
.rule-c{border-bottom:1px solid var(--brd)}.rule-c:last-child{border-bottom:none}
.rule-c.hid{display:none}
.rule-row{display:grid;grid-template-columns:52px 1fr auto auto auto auto;gap:10px;align-items:center;padding:11px 20px;transition:background .1s}
.rule-row:hover{background:#fafafa}
.rid{font-family:monospace;font-size:12px;font-weight:700;color:#2563eb;background:#eff6ff;padding:3px 7px;border-radius:4px;text-align:center;white-space:nowrap}
.rinfo{min-width:0}
.rdesc{font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rmeta{font-size:11px;color:var(--mut);margin-top:1px}
.rbadges{display:flex;gap:3px}

/* ── badges ──────────────────────────────────────────────────────────── */
.badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:10px;font-size:11px;font-weight:700;white-space:nowrap;line-height:1.4}
.bm-axe{background:#dbeafe;color:#1d4ed8}.bm-ai{background:#ede9fe;color:#6d28d9}.bm-mt{background:#f1f5f9;color:#475569}
.bs-p{background:#dcfce7;color:#15803d}.bs-f{background:#fee2e2;color:#b91c1c}.bs-m{background:#fef3c7;color:#b45309}.bs-n{background:#f1f5f9;color:#64748b}
.badge-ov{outline:2px dashed currentColor;outline-offset:1px}

/* ── override select ─────────────────────────────────────────────────── */
.ov-sel{font-size:11px;border:1px solid var(--brd);border-radius:4px;padding:3px 6px;background:var(--surf);color:var(--mut);cursor:pointer;outline:none;transition:border-color .15s}
.ov-sel:focus{border-color:#2563eb}
.ov-sel.ov-on{border-color:#d97706;color:#d97706;font-weight:700}

/* ── expand button ───────────────────────────────────────────────────── */
.xbtn{background:none;border:1px solid var(--brd);border-radius:4px;font-size:11px;color:var(--mut);cursor:pointer;padding:3px 8px;white-space:nowrap;transition:all .15s}
.xbtn:hover{background:var(--bg);border-color:#94a3b8;color:var(--txt)}
.xph{display:inline-block;width:66px}

/* ── violation details ───────────────────────────────────────────────── */
.vd{display:none;border-top:1px solid var(--brd);background:#f8fafc}
.vd.open{display:block}
.vi{padding:14px 20px 14px 72px;border-bottom:1px solid #f1f5f9}
.vi:last-child{border-bottom:none}
.vgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.vfull{grid-column:1/-1}
.vlbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);display:block;margin-bottom:3px}
.vval{font-size:12px;color:var(--txt);line-height:1.5}
.vcode{background:#1e293b;color:#e2e8f0;padding:8px 12px;border-radius:4px;font-family:monospace;font-size:11px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;margin-top:3px}
.vsel{font-family:monospace;font-size:11px;color:#6366f1;background:#f0f0ff;padding:2px 6px;border-radius:3px;display:inline-block;margin-top:3px;word-break:break-all}
.ai-bar{height:4px;border-radius:2px;background:var(--brd);width:64px;display:inline-block;vertical-align:middle;overflow:hidden;margin-left:4px}
.ai-fill{height:100%;background:#7c3aed}

/* ── empty state ─────────────────────────────────────────────────────── */
.empty{padding:48px;text-align:center;color:var(--mut)}
.empty-ico{font-size:32px;margin-bottom:10px;opacity:.35}
.empty-msg{font-size:15px;font-weight:500}

/* ── footer ──────────────────────────────────────────────────────────── */
.footer{text-align:center;padding:24px;color:var(--mut);font-size:12px;border-top:1px solid var(--brd);margin-top:4px}

/* ── toast ───────────────────────────────────────────────────────────── */
.toast{position:fixed;bottom:24px;right:24px;background:#1e293b;color:#f8fafc;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:999;opacity:0;transform:translateY(8px);transition:all .25s;pointer-events:none}
.toast.on{opacity:1;transform:none}
.scroll-top{position:fixed;bottom:80px;right:24px;background:#475569;color:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:18px;line-height:36px;cursor:pointer;box-shadow:var(--sh2);opacity:0;transition:opacity .2s;z-index:998;display:flex;align-items:center;justify-content:center}
.scroll-top.vis{opacity:1}

/* ── responsive ──────────────────────────────────────────────────────── */
@media(max-width:860px){
  .main{padding:16px}
  .score-sec{grid-template-columns:1fr}
  .donut-wrap{flex-direction:row;gap:16px}
  .stat-grid{grid-template-columns:repeat(2,1fr)}
  .cov{min-width:unset}
  .rule-row{grid-template-columns:48px 1fr;row-gap:6px}
  .rbadges,.rule-row>.badge,.ov-sel,.xbtn{grid-column:2}
  .search-inp{width:180px}
}
</style>
</head>
<body>
<div id="app"><p style="padding:60px;text-align:center;color:#94a3b8;font-size:16px">Generating report&hellip;</p></div>
<div class="toast" id="toast"></div>
<button class="scroll-top" id="scrollTop" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="Back to top">&#8679;</button>
<script>
var R = ${rJson};
var M = ${mJson};
// @@OVERRIDES_START@@
var SAVED_OV = ${savedOv};
// @@OVERRIDES_END@@
var OV = Object.assign({}, SAVED_OV);
var curPage = -1;
var activeFlt = 'ALL';
var searchQ = '';
var expandedThemes = {};
var expandedRules = {};

window.addEventListener('scroll', function() {
  var b = document.getElementById('scrollTop');
  if (b) b.classList.toggle('vis', window.scrollY > 400);
});

/* ── data helpers ─────────────────────────────────────────────────── */
function activeVs() {
  return curPage === -1 ? R.violations : (R.pages && R.pages[curPage] ? R.pages[curPage].violations : R.violations);
}
function activeScore() {
  return curPage === -1 ? R.summary.compliance_score : (R.pages && R.pages[curPage] ? R.pages[curPage].compliance_score : R.summary.compliance_score);
}
function activeRisk() {
  return curPage === -1 ? R.summary.risk : (R.pages && R.pages[curPage] ? R.pages[curPage].risk : R.summary.risk);
}
function getRuleStatus(id) {
  if (OV[id]) return OV[id];
  var vs = activeVs();
  var rule = findRule(id);
  if (!rule) return 'MANUAL';
  if (vs.some(function(v) { return v.rgaa_id === id; })) return 'FAILED';
  return rule.automation_type === 'MANUAL' ? 'MANUAL' : 'PASSED';
}
function ruleVs(id) {
  return activeVs().filter(function(v) { return v.rgaa_id === id; });
}
function findRule(id) {
  return M.find(function(r) { return r.rgaa_id === id; });
}
function computeCounts() {
  var c = { FAILED:0, PASSED:0, MANUAL:0, NA:0 };
  M.forEach(function(r) { var s = getRuleStatus(r.rgaa_id); if (c[s] !== undefined) c[s]++; });
  return c;
}
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function scoreColor(p) { return p >= 85 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626'; }

/* ── render components ────────────────────────────────────────────── */
function buildDonut(pct) {
  var r = 52, c = 2 * Math.PI * r;
  var f = Math.max(0, Math.min(1, pct / 100)) * c;
  var col = scoreColor(pct);
  var lbl = pct >= 95 ? 'COMPLIANT' : pct >= 50 ? 'PARTIAL' : 'NON-COMPLIANT';
  return '<svg viewBox="0 0 128 128" width="148" height="148" role="img" aria-label="Score ' + pct + '%">' +
    '<circle cx="64" cy="64" r="52" fill="none" stroke="#e2e8f0" stroke-width="14"/>' +
    '<circle cx="64" cy="64" r="52" fill="none" stroke="' + col + '" stroke-width="14"' +
    ' stroke-dasharray="' + f.toFixed(1) + ' ' + (c - f).toFixed(1) + '"' +
    ' stroke-linecap="round" transform="rotate(-90 64 64)"/>' +
    '<text x="64" y="57" text-anchor="middle" font-size="26" font-weight="800" fill="' + col + '" font-family="system-ui,sans-serif">' + pct + '%</text>' +
    '<text x="64" y="75" text-anchor="middle" font-size="9" fill="#64748b" font-weight="700" font-family="system-ui,sans-serif">' + lbl + '</text>' +
    '</svg>';
}

function statusBadge(id) {
  var s = getRuleStatus(id), isOv = !!OV[id];
  var vs = ruleVs(id), cnt = vs.length;
  var cls, lbl;
  if (s === 'PASSED')      { cls = 'bs-p'; lbl = '&#10003; Passed'; }
  else if (s === 'FAILED') { cls = 'bs-f'; lbl = '&#10007; Failed' + (cnt > 1 ? ' (' + cnt + ')' : ''); }
  else if (s === 'MANUAL') { cls = 'bs-m'; lbl = '&#9873; Manual'; }
  else                     { cls = 'bs-n'; lbl = '&ndash; N/A'; }
  return '<span class="badge ' + cls + (isOv ? ' badge-ov' : '') + '" id="sb-' + esc(id) + '" title="' + (isOv ? 'Manually overridden' : 'Auto-detected') + '">' + lbl + '</span>';
}

function methodBadges(rule) {
  if (rule.axe_rule && rule.ai_required)
    return '<span class="badge bm-axe" title="Tested by axe-core">axe</span><span class="badge bm-ai" title="Validated by AI">AI</span>';
  if (rule.axe_rule)   return '<span class="badge bm-axe" title="Tested by axe-core">axe</span>';
  if (rule.ai_required) return '<span class="badge bm-ai" title="Validated by AI">AI</span>';
  return '<span class="badge bm-mt" title="Manual testing required">Manual</span>';
}

function buildOvSelect(id) {
  var cur = OV[id] || '';
  return '<select class="ov-sel' + (cur ? ' ov-on' : '') + '" id="ovs-' + esc(id) + '"' +
    ' data-rid="' + esc(id) + '" onchange="setOverride(this.dataset.rid,this.value)" title="Override status">' +
    '<option value=""'            + (!cur             ? ' selected' : '') + '>Auto</option>' +
    '<option value="PASSED"'      + (cur === 'PASSED' ? ' selected' : '') + '>&#10003; Pass</option>' +
    '<option value="FAILED"'      + (cur === 'FAILED' ? ' selected' : '') + '>&#10007; Fail</option>' +
    '<option value="MANUAL"'      + (cur === 'MANUAL' ? ' selected' : '') + '>&#9873; Manual</option>' +
    '<option value="NA"'          + (cur === 'NA'     ? ' selected' : '') + '>&ndash; N/A</option>' +
    '</select>';
}

function buildViolationDetails(id) {
  var vs = ruleVs(id);
  if (!vs.length) return '';
  var isOpen = expandedRules[id];
  var html = '<div class="vd' + (isOpen ? ' open' : '') + '" id="vd-' + esc(id) + '">';
  vs.forEach(function(v) {
    var hasAi = v.ai_score !== undefined;
    html += '<div class="vi"><div class="vgrid">';
    html += '<div class="vfull"><span class="vlbl">Issue</span><div class="vval">' + esc(v.issue) + '</div>';
    if (hasAi) {
      var p = Math.round(v.ai_score * 100);
      html += '<div style="margin-top:4px"><span class="badge bm-ai">AI &nbsp;' + p + '%</span>' +
        '<span class="ai-bar"><span class="ai-fill" style="width:' + p + '%"></span></span></div>';
    }
    html += '</div>';
    html += '<div><span class="vlbl">Element</span><pre class="vcode">' + esc(v.element) + '</pre></div>';
    if (v.recommendation)
      html += '<div><span class="vlbl">Recommendation</span><div class="vval">' + esc(v.recommendation) + '</div></div>';
    if (v.selector)
      html += '<div><span class="vlbl">Selector</span><code class="vsel">' + esc(v.selector) + '</code></div>';
    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

function buildRuleRow(rule) {
  var id = rule.rgaa_id;
  var status = getRuleStatus(id);
  var hasDetails = ruleVs(id).length > 0;
  var isOpen = expandedRules[id];
  var q = searchQ;
  var matchS = !q || (id + ' ' + rule.description + ' ' + rule.theme).toLowerCase().indexOf(q) !== -1;
  var matchF = activeFlt === 'ALL' || status === activeFlt;
  var hidden = !matchS || !matchF;
  var meta = [];
  if (rule.wcag_ref) meta.push('WCAG ' + esc(rule.wcag_ref));
  meta.push(esc(rule.severity));

  var html = '<div class="rule-c' + (hidden ? ' hid' : '') + '" id="rc-' + esc(id) + '" data-status="' + status + '">';
  html += '<div class="rule-row">';
  html += '<span class="rid">' + esc(id) + '</span>';
  html += '<div class="rinfo"><div class="rdesc" title="' + esc(rule.description) + '">' + esc(rule.description) + '</div>';
  html += '<div class="rmeta">' + meta.join(' &middot; ') + '</div></div>';
  html += '<div class="rbadges">' + methodBadges(rule) + '</div>';
  html += statusBadge(id);
  html += buildOvSelect(id);
  if (hasDetails) {
    html += '<button class="xbtn" id="eb-' + esc(id) + '" data-rid="' + esc(id) + '" onclick="toggleRule(this.dataset.rid)">' +
      (isOpen ? '&#9650; Hide' : '&#9660; Details') + '</button>';
  } else {
    html += '<span class="xph"></span>';
  }
  html += '</div>';
  html += buildViolationDetails(id);
  html += '</div>';
  return html;
}

function buildSummaryCards(counts) {
  function card(cls, filter, count, label) {
    return '<div class="stat-card ' + cls + (activeFlt === filter ? ' sel' : '') +
      '" data-flt="' + filter + '" onclick="setFilter(this.dataset.flt)" title="Filter by ' + label + '">' +
      '<div class="stat-num">' + count + '</div><div class="stat-lbl">' + label + '</div></div>';
  }
  return '<div class="stat-grid" id="summary-cards">' +
    card('c-fail',   'FAILED', counts.FAILED, 'Failed') +
    card('c-pass',   'PASSED', counts.PASSED, 'Passed') +
    card('c-manual', 'MANUAL', counts.MANUAL, 'Manual') +
    card('c-na',     'NA',     counts.NA,     'N/A') +
    '</div>';
}

function buildCoverage() {
  var cov = R.coverage, total = cov.total_rules || M.length;
  var ap = Math.round((cov.automated / total) * 100);
  var sp = Math.round((cov.semi_automated / total) * 100);
  var mp = 100 - ap - sp;
  return '<div class="cov">' +
    '<div class="cov-title">Test Coverage (' + total + ' rules)</div>' +
    '<div class="cov-bar">' +
      '<div class="cov-seg cs-axe" style="width:' + ap + '%" title="axe-core: ' + cov.automated + '"></div>' +
      '<div class="cov-seg cs-ai" style="width:' + sp + '%" title="AI/semi: ' + cov.semi_automated + '"></div>' +
      '<div class="cov-seg cs-man" style="width:' + mp + '%" title="Manual: ' + cov.manual + '"></div>' +
    '</div>' +
    '<div class="leg">' +
      '<div class="leg-row"><span class="leg-dot" style="background:#2563eb"></span>axe-core automated<span class="leg-n">' + cov.automated + '</span></div>' +
      '<div class="leg-row"><span class="leg-dot" style="background:#7c3aed"></span>AI / semi-auto<span class="leg-n">' + cov.semi_automated + '</span></div>' +
      '<div class="leg-row"><span class="leg-dot" style="background:#94a3b8"></span>Manual review<span class="leg-n">' + cov.manual + '</span></div>' +
      '<div class="leg-row leg-divider" style="font-weight:700;color:var(--txt)">Total<span class="leg-n">' + total + '</span></div>' +
    '</div></div>';
}

function buildScoreSection() {
  var pct = activeScore(), risk = activeRisk();
  var counts = computeCounts();
  return '<div class="score-sec" id="score-sec">' +
    '<div class="donut-wrap">' + buildDonut(pct) +
      '<div style="text-align:center;margin-top:2px"><span class="risk-chip rk-' + risk + '">' + risk + ' risk</span></div>' +
      '<div class="donut-lbl" style="margin-top:6px">Compliance</div>' +
    '</div>' +
    buildSummaryCards(counts) +
    buildCoverage() +
    '</div>';
}

function buildPageTabs() {
  if (!R.pages || R.pages.length <= 1) return '';
  var html = '<div class="page-tabs"><div class="tab-bar">';
  var cc = R.summary.compliance_score >= 85 ? 'tsc-l' : R.summary.compliance_score >= 50 ? 'tsc-m' : 'tsc-h';
  html += '<button class="tab' + (curPage === -1 ? ' act' : '') + '" data-pg="-1" onclick="setPage(-1)">' +
    'All Pages <span class="tab-sc ' + cc + '">' + R.summary.compliance_score + '%</span></button>';
  R.pages.forEach(function(pg, i) {
    var tc = pg.compliance_score >= 85 ? 'tsc-l' : pg.compliance_score >= 50 ? 'tsc-m' : 'tsc-h';
    var u = pg.url.replace(/^https?:\\/\\//, '').slice(0, 40);
    html += '<button class="tab' + (curPage === i ? ' act' : '') + '" data-pg="' + i + '" onclick="setPage(' + i + ')">' +
      '<span style="max-width:220px;overflow:hidden;text-overflow:ellipsis" title="' + esc(pg.url) + '">' + esc(u) + '</span>' +
      '<span class="tab-sc ' + tc + '">' + pg.compliance_score + '%</span></button>';
  });
  html += '</div></div>';
  return html;
}

function buildFilterBar() {
  return '<div class="filter-bar">' +
    '<div class="pills">' +
      '<button class="pill p-all'  + (activeFlt === 'ALL'    ? ' act' : '') + '" data-flt="ALL"    onclick="setFilter(this.dataset.flt)">All (' + M.length + ')</button>' +
      '<button class="pill p-fail' + (activeFlt === 'FAILED' ? ' act' : '') + '" data-flt="FAILED" onclick="setFilter(this.dataset.flt)">&#10007; Failed</button>' +
      '<button class="pill p-pass' + (activeFlt === 'PASSED' ? ' act' : '') + '" data-flt="PASSED" onclick="setFilter(this.dataset.flt)">&#10003; Passed</button>' +
      '<button class="pill p-man'  + (activeFlt === 'MANUAL' ? ' act' : '') + '" data-flt="MANUAL" onclick="setFilter(this.dataset.flt)">&#9873; Manual</button>' +
      '<button class="pill p-na'   + (activeFlt === 'NA'     ? ' act' : '') + '" data-flt="NA"     onclick="setFilter(this.dataset.flt)">&ndash; N/A</button>' +
    '</div>' +
    '<div class="search-wrap"><span class="search-ico">&#128269;</span>' +
      '<input class="search-inp" id="search-inp" type="search" placeholder="Search rules, IDs, themes&hellip;"' +
      ' value="' + esc(searchQ) + '" oninput="handleSearch(this.value)">' +
    '</div></div>';
}

function buildThemeSection(theme, rules) {
  var counts = { FAILED:0, PASSED:0, MANUAL:0, NA:0 };
  var visible = 0;
  rules.forEach(function(rule) {
    var s = getRuleStatus(rule.rgaa_id);
    if (counts[s] !== undefined) counts[s]++;
    var q = searchQ;
    var ms = !q || (rule.rgaa_id + ' ' + rule.description + ' ' + rule.theme).toLowerCase().indexOf(q) !== -1;
    var mf = activeFlt === 'ALL' || s === activeFlt;
    if (ms && mf) visible++;
  });
  if (visible === 0) return '';

  var num = rules[0].rgaa_id.split('.')[0];
  var isOpen = expandedThemes[theme] !== false;
  var mini = '';
  if (counts.FAILED)  mini += '<span class="mb mb-f">&#10007; ' + counts.FAILED + '</span>';
  if (counts.PASSED)  mini += '<span class="mb mb-p">&#10003; ' + counts.PASSED + '</span>';
  if (counts.MANUAL)  mini += '<span class="mb mb-m">&#9873; ' + counts.MANUAL + '</span>';
  if (counts.NA)      mini += '<span class="mb mb-n">&ndash; ' + counts.NA + '</span>';

  var html = '<div class="theme-g" id="tg-' + esc(num) + '">';
  html += '<button class="theme-hdr" data-theme="' + esc(theme) + '" onclick="toggleTheme(this.dataset.theme)">';
  html += '<span class="theme-num">' + esc(num) + '</span>';
  html += '<span class="theme-name">' + esc(theme) + '</span>';
  html += '<div class="mini-stats">' + mini + '</div>';
  html += '<span class="chv' + (isOpen ? ' open' : '') + '" id="chv-' + esc(num) + '">&#9650;</span>';
  html += '</button>';
  html += '<div class="theme-body" id="tb-' + esc(num) + '"' + (isOpen ? '' : ' style="display:none"') + '>';
  rules.forEach(function(r) { html += buildRuleRow(r); });
  html += '</div></div>';
  return html;
}

function buildRulesSection() {
  var themes = {}, order = [];
  M.forEach(function(r) {
    if (!themes[r.theme]) { themes[r.theme] = []; order.push(r.theme); }
    themes[r.theme].push(r);
  });
  var html = '<div id="rules-sec">';
  var any = false;
  order.forEach(function(t) {
    var s = buildThemeSection(t, themes[t]);
    if (s) { any = true; html += s; }
  });
  if (!any) html += '<div class="empty"><div class="empty-ico">&#128269;</div><div class="empty-msg">No rules match the current filter.</div></div>';
  html += '</div>';
  return html;
}

function buildHeader() {
  var d = new Date(R.summary.scan_date).toLocaleString();
  return '<header class="hdr">' +
    '<div><div class="hdr-title">RGAA v4.1.2 Compliance Report</div>' +
    '<div class="hdr-sub"><a href="' + esc(R.summary.url) + '" target="_blank" rel="noopener">' + esc(R.summary.url) + '</a></div></div>' +
    '<div class="hdr-right">' +
      '<span class="hdr-date">Scanned ' + esc(d) + '</span>' +
      '<button class="btn btn-dl" onclick="exportReport()">&#8681; Download Report</button>' +
    '</div></header>';
}

function buildFooter() {
  var ov = Object.keys(OV).length;
  return '<footer class="footer" id="footer">RGAA v4.1.2 &mdash; ' + M.length + ' rules' +
    (ov ? ' &mdash; <strong>' + ov + ' manual override' + (ov > 1 ? 's' : '') + ' applied</strong>' : '') +
    ' &mdash; Generated ' + new Date(R.summary.scan_date).toLocaleDateString() +
    '</footer>';
}

function render() {
  document.getElementById('app').innerHTML =
    buildHeader() +
    '<div class="main">' +
      buildScoreSection() +
      buildPageTabs() +
      buildFilterBar() +
      buildRulesSection() +
      buildFooter() +
    '</div>';
}

/* ── event handlers ───────────────────────────────────────────────── */
function setPage(idx) { curPage = idx; render(); }

function setFilter(f) { activeFlt = f; render(); }

var _st;
function handleSearch(v) {
  searchQ = v.toLowerCase().trim();
  clearTimeout(_st);
  _st = setTimeout(reRules, 160);
}

function reRules() {
  var rs = document.getElementById('rules-sec');
  if (!rs) return render();
  var tmp = document.createElement('div');
  tmp.innerHTML = buildRulesSection();
  rs.replaceWith(tmp.firstChild);
  refreshCards();
}

function refreshCards() {
  var el = document.getElementById('summary-cards');
  if (el) { var tmp = document.createElement('div'); tmp.innerHTML = buildSummaryCards(computeCounts()); el.replaceWith(tmp.firstChild); }
}

function toggleTheme(theme) {
  var rule = M.find(function(r) { return r.theme === theme; });
  if (!rule) return;
  var num = rule.rgaa_id.split('.')[0];
  var body = document.getElementById('tb-' + num);
  var chv  = document.getElementById('chv-' + num);
  if (!body) return;
  var nowOpen = expandedThemes[theme] !== false;
  expandedThemes[theme] = !nowOpen;
  body.style.display = nowOpen ? 'none' : '';
  if (chv) chv.classList.toggle('open', !nowOpen);
}

function toggleRule(id) {
  expandedRules[id] = !expandedRules[id];
  var vd = document.getElementById('vd-' + id);
  var eb = document.getElementById('eb-' + id);
  if (vd) vd.classList.toggle('open', !!expandedRules[id]);
  if (eb) eb.innerHTML = expandedRules[id] ? '&#9650; Hide' : '&#9660; Details';
}

function setOverride(id, value) {
  if (value === '') delete OV[id]; else OV[id] = value;
  var newStatus = getRuleStatus(id);
  var rc  = document.getElementById('rc-' + id);
  var sb  = document.getElementById('sb-' + id);
  var sel = document.getElementById('ovs-' + id);
  if (rc) rc.setAttribute('data-status', newStatus);
  if (sb) {
    var tmp = document.createElement('span');
    tmp.innerHTML = statusBadge(id);
    sb.replaceWith(tmp.firstChild);
  }
  if (sel) sel.className = 'ov-sel' + (OV[id] ? ' ov-on' : '');
  refreshCards();
  var foot = document.getElementById('footer');
  if (foot) { var tmp2 = document.createElement('footer'); tmp2.innerHTML = buildFooter().replace('<footer class="footer" id="footer">', '').replace('</footer>', ''); foot.innerHTML = tmp2.innerHTML; }
  showToast(value ? 'Override applied: rule ' + id + ' → ' + value : 'Override cleared: rule ' + id);
}

function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(function() { t.classList.remove('on'); }, 2500);
}

function exportReport() {
  var html = '<!DOCTYPE html>' + document.documentElement.outerHTML;
  var m1 = '// @@OVERRIDES_START@@', m2 = '// @@OVERRIDES_END@@';
  var i1 = html.indexOf(m1), i2 = html.indexOf(m2);
  if (i1 !== -1 && i2 !== -1) {
    html = html.slice(0, i1 + m1.length) + ' var SAVED_OV = ' + JSON.stringify(OV) + '; ' + html.slice(i2);
  }
  var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rgaa-report-' + new Date().toISOString().slice(0, 10) + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  showToast('Downloaded with ' + Object.keys(OV).length + ' override(s)');
}

/* ── init ─────────────────────────────────────────────────────────── */
(function() {
  var failedThemes = {};
  activeVs().forEach(function(v) {
    var r = findRule(v.rgaa_id);
    if (r) failedThemes[r.theme] = true;
  });
  Object.keys(OV).forEach(function(id) {
    var r = findRule(id);
    if (r) failedThemes[r.theme] = true;
  });
  M.forEach(function(r) { expandedThemes[r.theme] = !!failedThemes[r.theme]; });
  render();
})();
</script>
</body>
</html>`;
}
