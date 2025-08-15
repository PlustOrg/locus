import { generateReactComponent } from '../../src/generator/react';

describe('React generator - slots/children', () => {
  test('maps slot param to React.ReactNode and preserves children', () => {
    const comp = {
      name: 'Card',
      params: [ { name: 'children', type: { kind: 'primitive', name: 'slot' } } ],
      ui: 'ui { <div className="card">{children}</div> }'
    };
    const out = generateReactComponent(comp as any);
    expect(out).toContain('interface CardProps { children: React.ReactNode }');
    expect(out).toContain('{children}');
  });
});
