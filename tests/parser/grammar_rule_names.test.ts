import crypto from 'crypto';
import { LocusCstParser } from '../../src/parser/locusCstParser';
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
  // Updated after removal of legacy style:override rule (styleBlock)
  expect(hash).toBe('988c5fa8d3520d92a1f8bff35cd74a472531db04944034d817501958565f97c4');
});
