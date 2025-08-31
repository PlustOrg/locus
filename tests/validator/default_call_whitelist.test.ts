import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

test('rejects unsupported default function', () => {
  const src = `database { entity A { v: Integer (default: random()) } }`;
  const ast = parseLocus(src, 'mem.locus');
  const unified = mergeAsts([ast]);
  expect(() => validateUnifiedAst(unified)).toThrow(/Unsupported default function/);
});

test('allows supported default functions', () => {
  const src = `database { entity A { a: Integer (default: autoincrement()) b: String (default: uuid()) c: DateTime (default: now()) } }`;
  const ast = parseLocus(src, 'mem.locus');
  const unified = mergeAsts([ast]);
  expect(() => validateUnifiedAst(unified)).not.toThrow();
});
