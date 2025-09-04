#!/usr/bin/env ts-node
/**
 * Computes percentage of completed tasks in docs overhaul checklist for README badge.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
const file = join(__dirname, '..', 'planning', 'overhaul', 'docs-overhaul-checklist.md');
const raw = readFileSync(file, 'utf8');
const total = (raw.match(/- \[[ x]/g) || []).length;
const done = (raw.match(/- \[x\]/g) || []).length;
const pct = total ? Math.round((done/total)*100) : 0;
console.log(String(pct));