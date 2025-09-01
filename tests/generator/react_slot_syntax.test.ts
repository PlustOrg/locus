import { generateReactComponent } from '../../src/generator/react';

describe('React generator slot syntax', () => {
  test('renders named and default slots', () => {
    const comp: any = { name: 'Card', uiAst: { type: 'element', tag: 'div', attrs:{}, children: [
      { type: 'slot', name: 'header' },
      { type: 'slot', name: 'default' },
      { type: 'slot', name: 'footer' }
    ] }, params: [ { name: 'header', type: { kind:'primitive', name:'slot' } }, { name: 'footer', type: { kind:'primitive', name:'slot' } }, { name: 'children', type: { kind:'primitive', name:'slot' } } ] };
    const code = generateReactComponent(comp, []);
    expect(code).toContain('{header}');
    expect(code).toContain('{children}');
    expect(code).toContain('{footer}');
  });
});
