import { generateReactPage } from '../../src/generator/react';

describe('React generator renders from UI AST when available', () => {
  test('renders loop and events from uiAst', () => {
    const page: any = {
      name: 'Catalog',
      state: [{ name: 'items', default: '[]' }],
      actions: [{ name: 'add', params: [], body: '' }],
      uiAst: {
        type: 'element', tag: 'div', attrs: {}, children: [
          { type: 'element', tag: 'Button', attrs: { onClick: { kind: 'expr', value: 'add' }}, children: [{ type: 'text', value: 'Add' }]},
          { type: 'forEach', item: 'item', iterable: 'items', template: { type: 'element', tag: 'Item', attrs: {}, children: [] } }
        ]
      }
    };
    const out = generateReactPage(page);
    expect(out).toContain('onClick={add}');
    expect(out).toContain('items.map((item, index) =>');
    expect(out).toContain('<Item');
  });
});
