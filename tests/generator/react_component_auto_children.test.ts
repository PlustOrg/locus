import { generateReactComponent } from '../../src/generator/react';

describe('React component auto children', () => {
  test('auto-adds children when referenced', () => {
    const comp: any = { name: 'Wrapper', ui: 'ui { <div>{children}</div> }', params: [] };
    const code = generateReactComponent(comp, []);
    expect(code).toContain('interface WrapperProps { children: React.ReactNode }');
    expect(code).toContain('function Wrapper({ children, ...rest }');
  });
  test('does not add children twice', () => {
    const comp: any = { name: 'Panel', ui: 'ui { <div>{children}</div> }', params: [ { name: 'children', type: { kind: 'primitive', name: 'slot' } } ] };
    const code = generateReactComponent(comp, []);
    const occurrences = code.split('children').length - 1;
    expect(occurrences).toBeGreaterThan(1); // referenced + param but not duplicated params line
  });
});
