import { parseLocus } from '../../src/parser';
import { validateProject } from '../../src/validator/validate';

describe('default call whitelist', () => {
  test('disallowed default call errors', () => {
    const ast = parseLocus('database { entity U { id: Integer createdAt: DateTime @default(foo()) } }','d.locus');
    expect(() => validateProject(ast as any)).toThrow(/Unsupported default function 'foo'/i);
  });
  test('allowed default call passes', () => {
    const ast = parseLocus('database { entity U { id: Integer createdAt: DateTime @default(now()) } }','d.locus');
    expect(() => validateProject(ast as any)).not.toThrow();
  });
});
