#!/usr/bin/env ts-node
// Simple workflow step fuzz generator for Phase 2 testing
import { parseLocus } from '../src/parser';
import { mergeAsts } from '../src/parser/merger';
import { validateUnifiedAst } from '../src/validator/validate';

const STEP_TEMPLATES = [
  'run act()',
  'delay',
  'http_request { url: "https://example.com" }',
  'forEach item in items { run act() }',
  'branch { condition: { true } run act() else run act() }'
];

function randomWorkflow(): string {
  const n = 1 + Math.floor(Math.random()*5);
  const steps: string[] = [];
  for (let i=0;i<n;i++) steps.push(STEP_TEMPLATES[Math.floor(Math.random()*STEP_TEMPLATES.length)]);
  return `page P { action act() {} }\nworkflow W { trigger { on create(Order) } steps { ${steps.join('\n  ')} } }`;
}

for (let i=0;i<25;i++) {
  const src = randomWorkflow();
  try {
    const ast = mergeAsts([parseLocus(src,'fuzz.locus')]);
    validateUnifiedAst(ast as any);
  } catch (e:any) {
    console.error('Fuzz case failed', e.message);
    process.exit(1);
  }
}
console.log('workflow fuzz passed');
