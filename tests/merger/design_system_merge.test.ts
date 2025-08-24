import { parseLocus } from '../../src/parser';
import { mergeAsts } from '../../src/parser/merger';

describe('Design system merge', () => {
  test('merges multiple sections across files', () => {
  const a = parseLocus('design_system { colors { light { primary: #fff } } }','a');
  const b = parseLocus('design_system { spacing { sm: 4 md: 8 } }','b');
  const c = parseLocus('design_system { colors { dark { primary: "black" } } radii { round: 8 } }','c');
    const unified = mergeAsts([a,b,c]);
    expect(Object.keys(unified.designSystem!.colors!)).toEqual(['light','dark']);
    expect(Object.keys(unified.designSystem!.spacing!)).toEqual(['sm','md']);
    expect(Object.keys(unified.designSystem!.radii!)).toEqual(['round']);
  });
});
