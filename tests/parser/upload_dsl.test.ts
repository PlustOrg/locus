import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';
import { validateUnifiedAst } from '../../src/validator/validate';

const good = `upload UserAvatar {\n  field avatar maxSize: 5MB mime: [image/png,image/jpeg] required\n  store strategy: local path: "uploads/avatars" naming: uuid\n}`;

test('parse upload block produces uploads array', () => {
  const ast = parseLocus(good, 'mem.locus');
  expect(ast.uploads?.length).toBe(1);
  const merged = mergeAsts([ast]);
  const res = validateUnifiedAst(merged as any);
  expect(res).toBeTruthy();
});

test('duplicate field detection', () => {
  const dup = `upload BadPolicy { field avatar mime: [image/png] field avatar mime: [image/png] }`;
  const ast = parseLocus(dup, 'dup.locus');
  const merged = mergeAsts([ast]);
  expect(() => validateUnifiedAst(merged as any)).toThrow(/duplicate field/i);
});
