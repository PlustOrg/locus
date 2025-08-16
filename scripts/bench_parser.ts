import { LocusLexer } from '../src/parser/tokens';
import { DatabaseCstParser } from '../src/parser/databaseParser';
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
run(input, Number(process.argv[3]) || 100);
