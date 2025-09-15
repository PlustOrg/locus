/* eslint-disable @typescript-eslint/no-var-requires */
// Benchmark script attempts src import first (ts-node path). When executed by plain node ESM, fall back to dist via dynamic import.
let LocusLexer: any, DatabaseCstParser: any;
async function resolveModules() {
  try {
    // CommonJS resolution path (ts-node/register)
    ({ LocusLexer } = require('../src/parser/tokens'));
    ({ DatabaseCstParser } = require('../src/parser/databaseParser'));
  } catch {
    const t = await import('../dist/parser/tokens.js');
    const d = await import('../dist/parser/databaseParser.js');
    LocusLexer = (t as any).LocusLexer; DatabaseCstParser = (d as any).DatabaseCstParser;
  }
}
import { readFileSync } from 'fs';
import { join } from 'path';

function run(sample: string, iterations = 100) {
  const start = Date.now();
  let tokens = 0;
  for (let i = 0; i < iterations; i++) {
    const lex = LocusLexer.tokenize(sample);
    tokens += lex.tokens.length;
    const p = new DatabaseCstParser();
    p.input = lex.tokens;
    p.file();
    if (p.errors.length) throw new Error('Parser errors');
  }
  const elapsed = Date.now() - start;
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ iterations, elapsedMs: elapsed, tokens, tokensPerSec: Math.round((tokens / elapsed) * 1000) }));
}

const samplePath = process.argv[2] || join(__dirname, 'sample.locus');
const input = readFileSync(samplePath, 'utf8');
resolveModules().then(() => run(input, Number(process.argv[3]) || 100));
