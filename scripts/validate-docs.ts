#!/usr/bin/env ts-node
/**
 * Docs validation script.
 *
 * This script is responsible for ensuring the quality and consistency of the documentation.
 * It performs the following checks:
 * 1. Validates relative markdown links to ensure they are not broken.
 * 2. Extracts and parses Locus code snippets to ensure they are valid.
 * 3. Generates a hash of all Locus code snippets and compares it with a stored baseline to detect changes.
 * 4. Validates CLI flags mentioned in the documentation against the ones defined in the CLI.
 * 5. Ensures that there are no parse errors for snippets that are not explicitly marked as unimplemented.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { parseLocus } from '../src/parser';
import { validateLinks, LinkIssue } from './validate-docs/links';
import { validateSnippets, SnippetResult, SemanticIssue } from './validate-docs/snippets';
import { generateSnippetHash } from './validate-docs/hash';
import { validateCliFlags } from './validate-docs/flags';

const ROOT = resolve(__dirname, '..');
const DOCS_DIR = join(ROOT, 'docs');
const HASH_FILE = join(DOCS_DIR, '.snippets.hash');
const UPDATE_HASH = process.argv.includes('--update-hash');
const CHECKLIST = join(ROOT, 'planning', 'docs-validation-checklist.md');

/**
 * Recursively walks a directory and returns an array of file paths.
 * @param dir - The directory to walk.
 * @returns An array of file paths.
 */
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) return walk(p);
    return [p];
  });
}

const mdFiles = walk(DOCS_DIR).filter(f => f.endsWith('.md'));

const allSnippets: SnippetResult[] = [];
const allLinkIssues: LinkIssue[] = [];
const allSemanticIssues: SemanticIssue[] = [];

for (const file of mdFiles) {
  const { snippets, semanticIssues } = validateSnippets(file, ROOT);
  const linkIssues = validateLinks(file, ROOT);

  allSnippets.push(...snippets);
  allSemanticIssues.push(...semanticIssues);
  allLinkIssues.push(...linkIssues);
}

// Generate a hash of the snippets to detect changes.
const newHash = generateSnippetHash(allSnippets);

if (UPDATE_HASH) {
  writeFileSync(HASH_FILE, newHash + '\n');
  console.log('Updated snippet hash:', newHash);
  process.exit(0);
}

let baselineHash: string | undefined;
if (existsSync(HASH_FILE)) {
  baselineHash = readFileSync(HASH_FILE, 'utf8').trim();
}

const failingSnippets = allSnippets.filter(s => !s.ok);

// Validate negative tests (code that is expected to fail).
const negativeTests = [
  {
    label: 'unsupported optional belongs_to',
    code: 'database { entity X { p: belongs_to Y (optional) } entity Y { } }',
  },
];
const negativeResults = negativeTests.map(nt => {
  try {
    parseLocus(nt.code, `neg:${nt.label}`);
    return { label: nt.label, ok: false, error: 'DID_NOT_FAIL' };
  } catch (e: any) {
    return { label: nt.label, ok: true };
  }
});
const negativeFailures = negativeResults.filter(r => !r.ok);

// Validate CLI flags.
const { extraDocFlags, undocumentedCliFlags } = validateCliFlags(mdFiles, ROOT);

const report: any = {
  summary: {
    totalSnippets: allSnippets.length,
    failedSnippets: failingSnippets.length,
    linkIssues: allLinkIssues.length,
    hashMatch: baselineHash ? baselineHash === newHash : true,
    semanticIssues: allSemanticIssues.length,
    negativeFailures: negativeFailures.length,
    extraDocFlags: extraDocFlags.length,
    undocumentedCliFlags: undocumentedCliFlags.length,
  },
  failingSnippets,
  linkIssues: allLinkIssues,
  semanticIssues: allSemanticIssues,
  negativeResults,
  newHash,
  baselineHash,
  extraDocFlags,
  undocumentedCliFlags,
};

// Check for unimplemented features.
if (existsSync(CHECKLIST)) {
  const checklistContent = readFileSync(CHECKLIST, 'utf8');
  const unimplementedSection = /## Unimplemented[\s\S]*?(?:##|$)/.exec(checklistContent);
  if (unimplementedSection) {
    const lines = unimplementedSection[0].split(/\n/).filter(l => /- \[/.test(l));
    report.summary['unimplementedCount'] = lines.length;
  }
}

const hasErrors =
  failingSnippets.length ||
  allLinkIssues.length ||
  allSemanticIssues.length ||
  negativeFailures.length ||
  (baselineHash && baselineHash !== newHash) ||
  extraDocFlags.length ||
  undocumentedCliFlags.length;

if (hasErrors) {
  console.error('DOCS VALIDATION FAILED');
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('Docs validation passed.');
console.log(JSON.stringify(report, null, 2));
