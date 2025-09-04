#!/usr/bin/env ts-node
/*
 * Docs validation script.
 * Responsibilities:
 * 1. Extract fenced code blocks from docs/ (```locus or ``` with <!-- locus --> hint) and attempt to parse.
 * 2. Collect parse errors; allow skipping via HTML comment <!-- skip-validate --> immediately before fence.
 * 3. Validate relative markdown links exist.
 * 4. Generate deterministic hash of all locus code snippets; compare with stored baseline docs/.snippets.hash unless --update-hash.
 * 5. Ensure any parse errors for snippets NOT in Unimplemented section cause failure.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { createHash } from 'crypto';
import { parseLocus } from '../src/parser';
import { mergeAsts } from '../src/parser/merger';
import { validateUnifiedAst } from '../src/validator/validate';
import { generatePrismaSchema } from '../src/generator/prisma';
import { existsSync as _exists } from 'fs';

interface SnippetResult { file: string; index: number; ok: boolean; error?: string; code: string; }
interface LinkIssue { file: string; target: string; line: number; }

const ROOT = resolve(__dirname, '..');
const DOCS_DIR = join(ROOT, 'docs');
const HASH_FILE = join(DOCS_DIR, '.snippets.hash');
const SLUGS_FILE = join(DOCS_DIR, '.heading-slugs.json');
const UPDATE_HASH = process.argv.includes('--update-hash');
const UPDATE_SLUGS = process.argv.includes('--update-slugs');
const CHECKLIST = join(ROOT, 'planning', 'docs-validation-checklist.md');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) return walk(p);
    return [p];
  });
}

const mdFiles = walk(DOCS_DIR).filter(f => f.endsWith('.md'));

// Legacy syntax forbidden patterns (except in explicit migration guide)
const LEGACY_PATTERNS: Array<{re:RegExp; label:string}> = [
  { re: /\([ \t]*unique[ \t]*\)/g, label: 'legacy (unique) attribute' },
  { re: /\([ \t]*id[ \t]*\)/g, label: 'legacy (id) attribute' },
  { re: /\(default:\s*[^)]+\)/g, label: 'legacy (default: ...) attribute' }
];
const migrationGuideAllow = /annotations-migration\.md$/;
const legacyHits: Array<{file:string; line:number; match:string; label:string}> = [];

const fenceRe = /(^|\n)```([^\n`]*)\n([\s\S]*?)\n```/g; // simple fence matcher

const snippets: SnippetResult[] = [];
const linkIssues: LinkIssue[] = [];
const crossLinkMap: Record<string, boolean> = {};
interface HeadingInfo { slug: string; line: number; text: string; }
const fileHeadings: Record<string, HeadingInfo[]> = {};
const anchorIssues: Array<{ file: string; target: string; anchor: string; line: number }> = [];
const removedSlugIssues: Array<{ file: string; slug: string }> = [];
const semanticIssues: Array<{file:string; index:number; issue:string}> = [];

function genSlug(base: string, used: Set<string>): string {
  let s = base.toLowerCase().replace(/`+/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
  if(!s) s='section';
  let candidate = s; let i=1;
  while(used.has(candidate)) candidate = s + '-' + (i++);
  used.add(candidate); return candidate;
}

for (const file of mdFiles) {
  const rel = file.slice(ROOT.length + 1);
  const raw = readFileSync(file, 'utf8');
  // collect headings
  const linesAll = raw.split(/\n/);
  const used = new Set<string>();
  const heads: HeadingInfo[] = [];
  linesAll.forEach((ln,i)=>{ const m=/^(#{1,6})\s+(.+)$/.exec(ln); if(m){ heads.push({ slug: genSlug(m[2], used), line: i+1, text: m[2].trim() }); }});
  fileHeadings[rel] = heads;
  if (!migrationGuideAllow.test(file)) {
    const lines = raw.split(/\n/);
    lines.forEach((ln, i) => {
      for (const pat of LEGACY_PATTERNS) {
        let m:RegExpExecArray|null; pat.re.lastIndex = 0;
        while((m = pat.re.exec(ln))) {
          legacyHits.push({ file: rel, line: i+1, match: m[0], label: pat.label });
        }
      }
    });
  }
  // link validation: [text](relative)
  const linkRe = /\[[^\]]+\]\(([^):?#]+)\)/g;
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(raw))) {
    const target = lm[1];
    if (target.startsWith('http') || target.startsWith('#') || target.startsWith('mailto:')) continue;
    const base = dirname(file);
    const [pathPart, anchor] = target.split('#');
    const full = resolve(base, pathPart);
    if (!existsSync(full)) {
      const prefix = raw.slice(0, lm.index);
      const line = (prefix.match(/\n/g)?.length || 0) + 1;
      linkIssues.push({ file: rel, target, line });
    }
    else {
      crossLinkMap[target] = true;
      if(anchor){
        const relTarget = full.slice(ROOT.length + 1).replace(/\\/g,'/');
        const headsTarget = fileHeadings[relTarget];
        if(!headsTarget || !headsTarget.some(h=>h.slug===anchor)){
          const prefix = raw.slice(0, lm.index);
          const line = (prefix.match(/\n/g)?.length || 0) + 1;
          anchorIssues.push({ file: rel, target: relTarget, anchor, line });
        }
      }
    }
  }
  // snippet extraction
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = fenceRe.exec(raw)) !== null) {
    idx++;
    const info = (m[2] || '').trim();
    const code = m[3];
    const before = raw.slice(0, m.index);
    const skip = /<!--\s*skip-validate\s*-->\s*$/.test(before.split(/\n/).slice(-3).join('\n'));
    const isLocus = /(^|\b)(locus|Locus)\b/.test(info) || /<!--\s*locus\s*-->/.test(code);
    if (!isLocus) continue;
  const partial = /(^|\n)\/\/\s*snippet:\s*partial\b/.test(code);
  if (skip || partial) {
      snippets.push({ file: rel, index: idx, ok: true, code });
      continue;
    }
  let candidate = code.replace(/&copy;/g, '(c)');
    // Auto-wrap heuristics for fragment snippets:
    // 1. Starts with 'ui {' -> wrap in dummy component for parser context if missing enclosing component/page.
    const strippedLead = candidate.replace(/^\s*(\/\/.*\n|\/\*[\s\S]*?\*\/\s*)+/,'');
    if (/^\s*ui\s*{/.test(strippedLead)) {
      candidate = `component _DocExample { ${candidate} }`;
    } else if (/^\s*style:override\s*{/.test(strippedLead)) {
      candidate = `component _DocExample { ${candidate} }`;
    } else if (/^\s*</.test(strippedLead) && !/component\s+|page\s+|database\s+/.test(candidate)) {
      // Inline element(s) or usage block: if starts with < and not inside a component/page/database, wrap in a page ui block
      candidate = `page _DocExample { ui {\n${candidate}\n} }`;
    } else if (/^\s*state\s*{/.test(strippedLead)) {
      candidate = `page _DocExample { ${candidate} ui { <div/> } }`;
    } else if (/^\s*action\s+\w+\s*\(/.test(strippedLead)) {
      candidate = `page _DocExample { ${candidate} ui { <div/> } }`;
    } else if (/^\s*on\s+load\s*{/.test(strippedLead)) {
      candidate = `page _DocExample { ${candidate} ui { <div/> } }`;
    } else if (/^\s*entity\s+\w+\s*{/.test(strippedLead)) {
      candidate = `database { ${candidate} }`;
    }
    let ok = true; let error: string | undefined;
    let ast: any;
    try {
      ast = parseLocus(candidate, `${rel}#${idx}`);
    } catch (e: any) {
      ok = false; error = e.message;
    }
    snippets.push({ file: rel, index: idx, ok, error, code });
    if (ok && ast) {
      try {
        const merged = mergeAsts([ast]);
        validateUnifiedAst(merged as any);
        // If database present, check generated prisma schema contains each entity name
        if (/database\s*{/.test(candidate)) {
          const schema = generatePrismaSchema(merged.database as any);
          const names = (merged.database.entities || []).map((e:any)=>e.name);
          for (const n of names) {
            if (!new RegExp(`model\\s+${n}\\b`).test(schema)) {
              semanticIssues.push({ file: rel, index: idx, issue: `Missing model ${n} in prisma output` });
            }
          }
        }
      } catch (e:any) {
        semanticIssues.push({ file: rel, index: idx, issue: e.message });
      }
    }
  }
}

// Hash computation
const hash = createHash('sha256');
for (const s of snippets.filter(s => s.ok)) {
  hash.update(s.file + ':' + s.index + '\n');
  hash.update(s.code.replace(/\r\n/g, '\n'));
}
const digest = hash.digest('hex');

if (UPDATE_HASH) {
  writeFileSync(HASH_FILE, digest + '\n');
  console.log('Updated snippet hash:', digest);
  if(!UPDATE_SLUGS) process.exit(0);
}

if (UPDATE_SLUGS) {
  const slugMap: Record<string,string[]> = {};
  for (const f in fileHeadings) slugMap[f] = fileHeadings[f].map(h=>h.slug);
  writeFileSync(SLUGS_FILE, JSON.stringify(slugMap, null, 2) + '\n');
  console.log('Updated heading slugs baseline.');
  process.exit(0);
}

let baseline: string | undefined;
if (existsSync(HASH_FILE)) baseline = readFileSync(HASH_FILE, 'utf8').trim();

const failing = snippets.filter(s => !s.ok);
// Negative (expected-fail) tests sourced from docs commentary
const negativeTests = [
  { label: 'unsupported optional belongs_to', code: 'database { entity X { p: belongs_to Y (optional) } entity Y { } }' }
];
const negativeResults = negativeTests.map(nt => {
  try { parseLocus(nt.code, `neg:${nt.label}`); return { label: nt.label, ok: false, error: 'DID_NOT_FAIL' }; }
  catch(e:any){ return { label: nt.label, ok: true }; }
});
const negativeFailures = negativeResults.filter(r => !r.ok);

// Heading slug baseline
let baselineSlugs: Record<string,string[]> = {};
if (existsSync(SLUGS_FILE)) {
  try { baselineSlugs = JSON.parse(readFileSync(SLUGS_FILE,'utf8')); } catch { baselineSlugs = {}; }
}
// detect removed slugs (ignore additions)
for (const file in baselineSlugs) {
  const prev = new Set(baselineSlugs[file]);
  const current = new Set((fileHeadings[file]||[]).map(h=>h.slug));
  for (const s of prev) if(!current.has(s)) removedSlugIssues.push({ file, slug: s });
}

const report: any = {
  summary: {
    totalSnippets: snippets.length,
    failed: failing.length,
    linkIssues: linkIssues.length,
    hashMatch: baseline ? baseline === digest : true,
    semanticIssues: semanticIssues.length,
    anchorIssues: anchorIssues.length,
    removedSlugs: removedSlugIssues.length,
  negativeFailures: negativeFailures.length,
  legacyPatternHits: legacyHits.length
  },
  failing,
  linkIssues,
  anchorIssues,
  removedSlugIssues,
  semanticIssues,
  negativeResults,
  newHash: digest,
  baselineHash: baseline
};

// Simple unimplemented section presence check
if (_exists(CHECKLIST)) {
  const ck = readFileSync(CHECKLIST, 'utf8');
  const unimpl = /## Unimplemented[\s\S]*?(?:##|$)/.exec(ck);
  if (unimpl) {
    const lines = unimpl[0].split(/\n/).filter(l => /- \[/.test(l));
    report.summary['unimplementedCount'] = lines.length;
  }
}

// CLI flag cross-check
function collectDocFlags(): Set<string> {
  const set = new Set<string>();
  const re = /(?<!var\()--[a-zA-Z][a-zA-Z0-9-]+/g; // exclude CSS vars used in var(--token)
  for (const f of mdFiles) {
    const raw = readFileSync(f, 'utf8');
    // Ignore CSS code blocks and design system docs
    if (/design-system|theme|\.css/i.test(f)) continue;
    // Ignore code blocks containing CSS or design tokens
    const codeBlocks = raw.match(/```[a-zA-Z]*\n[\s\S]*?```/g) || [];
    for (const block of codeBlocks) {
      if (/css|design|theme|variables/i.test(block)) continue;
      let m:RegExpExecArray|null; re.lastIndex = 0;
      while((m=re.exec(block))) {
        const flag = m[0];
        // filter out obvious non-flags (long separators) or short '--x'
        if (/^--[-]+$/.test(flag)) continue;
        if (flag.length < 5) continue;
        set.add(flag);
      }
    }
    // Also scan non-code for CLI flags
    const nonCode = raw.replace(/```[a-zA-Z]*\n[\s\S]*?```/g, '');
    let m:RegExpExecArray|null; re.lastIndex = 0;
    while((m=re.exec(nonCode))) {
      const flag = m[0];
      if (/^--[-]+$/.test(flag)) continue;
      if (flag.length < 5) continue;
      set.add(flag);
    }
  }
  return set;
}
function collectCliFlags(): Set<string> {
  const idxPath = join(ROOT, 'src', 'index.ts');
  if (!existsSync(idxPath)) return new Set();
  const raw = readFileSync(idxPath, 'utf8');
  const reg = /\.option\([^)]*--([a-zA-Z0-9-]+)/g; let m:RegExpExecArray|null; const s=new Set<string>();
  while((m=reg.exec(raw))) s.add('--'+m[1]);
  return s;
}
const docFlags = collectDocFlags();
const cliFlags = collectCliFlags();
const allowDocOnly = new Set<string>([
  '--save-dev','--openapi','--emit-client-only','--no-audit','--no-fund'
]);
const allowCliOnly = new Set<string>(['--version','--cwd','--emit-js','--no-warn','--watch']);
const extraDocFlags = [...docFlags].filter(f => !cliFlags.has(f) && !allowDocOnly.has(f));
const undocumentedCliFlags = [...cliFlags].filter(f => !docFlags.has(f) && !allowCliOnly.has(f));
report.summary['extraDocFlags'] = extraDocFlags.length;
report.summary['undocumentedCliFlags'] = undocumentedCliFlags.length;
report['extraDocFlags'] = extraDocFlags;
report['undocumentedCliFlags'] = undocumentedCliFlags;
report['legacyPatternHits'] = legacyHits;

if (failing.length || linkIssues.length || semanticIssues.length || negativeFailures.length || (baseline && baseline !== digest) || extraDocFlags.length || undocumentedCliFlags.length || legacyHits.length || anchorIssues.length || removedSlugIssues.length) {
  console.error('DOCS VALIDATION FAILED');
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('Docs validation passed.');
console.log(JSON.stringify(report, null, 2));
