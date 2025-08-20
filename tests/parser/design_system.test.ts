import { parseLocus } from '../../src/parser';

describe('Parser: design_system blocks', () => {
  test('design_system with colors, typography, spacing', () => {
    const src = `
      design_system {
        colors { light { primary: "#007bff" } dark { primary: "#0a84ff" } }
        typography { fontFamily: "Inter" baseSize: "16px" weights { regular: 400 bold: 700 } }
        spacing { sm: "0.5rem" md: "1rem" }
      }
    `;
    const ast = parseLocus(src);
    expect(ast.designSystems).toHaveLength(1);
    const ds = ast.designSystems[0]!;
    expect((ds.colors?.light?.primary as any)?.value).toBe('#007bff');
    expect((ds.colors?.dark?.primary as any)?.value).toBe('#0a84ff');
    expect(ds.typography?.fontFamily).toBe('Inter');
    expect((ds.typography?.baseSize as any)?.value).toBe('16px');
    expect((ds.typography?.weights?.regular as any)?.value).toBe(400);
    expect((ds.typography?.weights?.bold as any)?.value).toBe(700);
    expect((ds.spacing?.sm as any)?.value).toBe('0.5rem');
    expect((ds.spacing?.md as any)?.value).toBe('1rem');
  });

  test('nested themes', () => {
    const src = `
      design_system {
        colors { light { primary: "#fff" } dark { primary: "#000" } }
      }
    `;
    const ast = parseLocus(src);
    const ds = ast.designSystems[0]!;
    expect((ds.colors?.light?.primary as any)?.value).toBe('#fff');
    expect((ds.colors?.dark?.primary as any)?.value).toBe('#000');
  });

  test('multiple design_system blocks', () => {
    const src = `
      design_system { spacing { lg: "1.5rem" } }
      design_system { radii { md: "0.375rem" } }
    `;
    const ast = parseLocus(src);
    expect(ast.designSystems).toHaveLength(2);
    expect((ast.designSystems[0].spacing?.lg as any)?.value).toBe('1.5rem');
    expect((ast.designSystems[1].radii?.md as any)?.value).toBe('0.375rem');
  });
});
