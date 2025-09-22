import crypto from 'crypto';
import { LocusCstParser } from '../../src/parser/locusCstParser';
import { AllTokens } from '../../src/parser/tokens';
import { loadTokenSpec } from '../../src/parser/tokenGen';
import path from 'path';

function computeHash(): { hash: string; ruleNames: string[]; tokenNames: string[]; tokenCategoryNames: string[] } {
  const parser = new LocusCstParser();
  // Chevrotain exposes productions via getGAstProductions()
  const productionsCache: Record<string, any> = (parser as any).gastProductionsCache || (parser as any).productionsCache || {};
  const ruleNames: string[] = Object.keys(productionsCache).sort();
  const tokenNames: string[] = AllTokens.map(t => (t as any).name as string).sort();
  const spec = loadTokenSpec(path.join(__dirname,'../../src/parser/token-spec.json'));
  const tokenCategoryNames = spec.categories.map(c => c.name).sort();
  const h = crypto.createHash('sha256');
  // Rule signature checksum: name:length of alternatives (coarse but stable) - placeholder using rule name length only for now
  const ruleSig = ruleNames.map(r => [r, r.length]);
  h.update(JSON.stringify({ ruleNames, tokenNames, tokenCategoryNames, ruleSig }));
  return { hash: h.digest('hex'), ruleNames, tokenNames, tokenCategoryNames };
}

test('grammar rule & token name hash stable', () => {
  const { hash, ruleNames, tokenNames, tokenCategoryNames } = computeHash();
  expect(ruleNames.length).toBeGreaterThan(50); // sanity
  expect(tokenNames.length).toBeGreaterThan(50);
  expect(tokenCategoryNames.length).toBeGreaterThan(5);
  expect(hash).toMatch(/^[a-f0-9]{64}$/);
  // Baseline hash – update ONLY on intentional grammar/token change.
  // Updated after removal of legacy style:override rule (styleBlock)
  expect(hash).toBe('6005abde5029f5efb58089f894787875baf349337520947637304133aa97bd74');
});
