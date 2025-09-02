import { parseLocus } from '../../src/parser';

describe('component inferred params', () => {
  test('infers param from UI expr', () => {
    const ast = parseLocus('component C { ui { <div>{title}</div> } }','t');
    const comp = (ast as any).components[0];
    expect(comp.inferredParams).toContain('title');
  });
});
