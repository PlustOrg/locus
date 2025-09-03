import { readFileSync } from 'fs';
import path from 'path';
import { loadTokenSpec, generateTokensSource } from '../../src/parser/tokenGen';

test('token spec sync', () => {
  const spec = loadTokenSpec(path.join(__dirname, '../../src/parser/token-spec.json'));
  const gen = generateTokensSource(spec).trim();
  const existing = readFileSync(path.join(__dirname,'../../src/parser/tokens.ts'),'utf8').trim();
  expect(existing).toBe(gen);
});
