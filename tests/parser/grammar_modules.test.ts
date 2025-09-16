import { parseLocus } from '../../src/parser';

function expectNoParserError(ast: any) {
  expect(ast).toBeTruthy();
}

describe('grammar feature module smoke tests', () => {
  test('design system colors + typography', () => {
    const src = `design_system { colors { light { primary: "#fff" } } typography { weights { bold: 700 } size: 14 } }`;
    const ast = parseLocus(src, 'mod.locus');
    expectNoParserError(ast);
    expect((ast as any).designSystems?.length || (ast as any).design_systems?.length).toBeGreaterThan(0);
  });

  test('database entity basic', () => {
    const src = `database { entity User { id: Integer } }`;
    const ast = parseLocus(src, 'db.locus');
    expectNoParserError(ast);
    expect(((ast as any).databases?.[0]?.entities || []).length).toBe(1);
  });

  test('page with state and ui', () => {
    const src = `page Home { state { count: Integer = 0 } ui { <div/> } }`;
    const ast = parseLocus(src, 'p.locus');
    expectNoParserError(ast);
    expect((ast as any).pages?.length).toBe(1);
  });

  test('component with ui', () => {
    const src = `component Btn { ui { <Button/> } }`;
    const ast = parseLocus(src, 'c.locus');
    expectNoParserError(ast);
    expect((ast as any).components?.length).toBe(1);
  });

  test('workflow basic trigger + steps', () => {
    const src = `workflow W { trigger { on create(User) } steps { run doThing } }`;
    const ast = parseLocus(src, 'w.locus');
    expectNoParserError(ast);
    expect((ast as any).workflows?.length).toBe(1);
  });

  test('upload block', () => {
    // Grammar: field <name> [maxSizeDecl] [maxCountDecl] mimeDecl [Required]
    const src = `upload Avatar { field image maxSize: 5MB mime: [image/png] store strategy: local }`;
    const ast = parseLocus(src, 'u.locus');
    expectNoParserError(ast);
    expect((ast as any).uploads?.length || (ast as any).uploadBlocks?.length).toBeGreaterThan(0);
  });
});
