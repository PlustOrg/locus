#!/usr/bin/env ts-node
import { writeFileSync } from 'fs';
import path from 'path';
import { generateFromDefaultSpec } from '../src/parser/tokenGen';

const outPath = path.join(__dirname, '../src/parser/tokens.ts');
const content = generateFromDefaultSpec();
writeFileSync(outPath, content);
console.log('[tokens] regenerated src/parser/tokens.ts');
