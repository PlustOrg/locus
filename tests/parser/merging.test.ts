import { parseLocus } from '../../src/parser';
import { mergeAsts, MergeError } from '../../src/parser/merger';

describe('AST Merging', () => {
  test('merges entities from multiple files', () => {
    const a = parseLocus(`database { entity A { x: String } }`);
    const b = parseLocus(`database { entity B { y: Integer } }`);

    const merged = mergeAsts([a, b]);
    const names = merged.database.entities.map(e => e.name).sort();
    expect(names).toEqual(['A', 'B']);
  });

  test('merges design_system tokens from multiple files', () => {
    const a = parseLocus(`design_system { spacing { sm: "0.5rem" } }`);
    const b = parseLocus(`design_system { spacing { md: "1rem" } radii { md: "0.375rem" } }`);

    const merged = mergeAsts([a, b]);
    expect((merged.designSystem?.spacing?.sm as any)?.value).toBe('0.5rem');
    expect((merged.designSystem?.spacing?.md as any)?.value).toBe('1rem');
    expect((merged.designSystem?.radii?.md as any)?.value).toBe('0.375rem');
  });

  test('duplicate entity names throw', () => {
    const a = parseLocus(`database { entity A { x: String } }`);
    const b = parseLocus(`database { entity A { y: Integer } }`);
    expect(() => mergeAsts([a, b])).toThrow(MergeError);
  });
});
