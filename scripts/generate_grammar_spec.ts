#!/usr/bin/env ts-node
// Generates a simplistic grammar spec by traversing Chevrotain parser instance rule names.
import { LocusCstParser } from '../src/parser/databaseParser';

const parser = new LocusCstParser();
const rules = Object.keys((parser as any).definitions || (parser as any).ruleNames || {}).concat((parser as any).ruleNames || []);
const unique = Array.from(new Set(rules)).sort();
console.log('# Locus Grammar (auto-generated)');
for (const r of unique) console.log('- ' + r);
