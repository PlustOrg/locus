import { generateReactComponent } from '../../src/generator/react';

describe('React component named slot auto-add', () => {
  test('auto-adds named slot ending with Slot', () => {
    const comp: any = { name: 'Card', ui: 'ui { <div>{headerSlot}{children}</div> }', params: [] };
    const warnings: string[] = [];
    const code = generateReactComponent(comp, warnings);
    expect(code).toContain('headerSlot: React.ReactNode');
    expect(warnings.some(w => w.includes("named slot param 'headerSlot'"))).toBe(true);
  });
});
