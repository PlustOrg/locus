#!/usr/bin/env ts-node
import { readFileSync } from 'fs';
import path from 'path';
import { generateFromDefaultSpec } from '../src/parser/tokenGen';

const expected = generateFromDefaultSpec().trim();
const existing = readFileSync(path.join(__dirname,'../src/parser/tokens.ts'),'utf8').trim();
if (expected !== existing) {
  console.error('[tokens][drift] src/parser/tokens.ts is out of date with token-spec.json. Run npm run tokens:gen');
  process.exit(1);
}
console.log('[tokens] up to date');
