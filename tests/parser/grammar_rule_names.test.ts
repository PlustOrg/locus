import crypto from 'crypto';
import { LocusCstParser } from '../../src/parser/databaseParser';
import { AllTokens } from '../../src/parser/tokens';

function computeHash(): { hash: string; ruleNames: string[]; tokenNames: string[] } {
  const parser = new LocusCstParser();
  // Chevrotain exposes productions via getGAstProductions()
  const productionsCache: Record<string, any> = (parser as any).gastProductionsCache || (parser as any).productionsCache || {};
  const ruleNames: string[] = Object.keys(productionsCache).sort();
  const tokenNames: string[] = AllTokens.map(t => (t as any).name as string).sort();
  const h = crypto.createHash('sha256');
  h.update(JSON.stringify({ ruleNames, tokenNames }));
  return { hash: h.digest('hex'), ruleNames, tokenNames };
}

test('grammar rule & token name hash stable', () => {
  const { hash, ruleNames, tokenNames } = computeHash();
  expect(ruleNames.length).toBeGreaterThan(50); // sanity
  expect(tokenNames.length).toBeGreaterThan(50);
  expect(hash).toMatch(/^[a-f0-9]{64}$/);
  // Baseline hash – update ONLY on intentional grammar/token change.
  expect(hash).toBe('a7c07a4d1040dd12ae8500d0c16d4130fe42c49367ca78d4351e64df352779e8');
});
