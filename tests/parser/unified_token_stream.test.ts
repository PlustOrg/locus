import { parseLocus } from '../../src/parser';

describe('unified token stream', () => {
  test('parses mixed constructs (entity + component + workflow) in one file', () => {
    const src = `database { entity User { id: Integer name: String } }
component C { ui { <div/> } }
workflow W { trigger { t } steps { run act() } }`;
    const ast: any = parseLocus(src, 'mixed.locus');
    expect(ast.entities?.some((e:any)=>e.name==='User')).toBe(true);
    expect(ast.components?.some((c:any)=>c.name==='C')).toBe(true);
    expect(ast.workflows?.some((w:any)=>w.name==='W')).toBe(true);
  });
});
