import { generateReactPage } from '../../src/generator/react';

describe('React generator renders if/elseif/else from UI AST', () => {
  test('ternary chain from if/elseif/else AST siblings', () => {
    const page: any = {
      name: 'StatusPage',
      state: [{ name: 'status', default: '"loading"' }],
      uiAst: {
        type: 'element', tag: 'div', attrs: {}, children: [
          { type: 'element', tag: 'if', attrs: { condition: { kind: 'expr', value: 'status === "loading"' } }, children: [
            { type: 'element', tag: 'Spinner', attrs: {}, children: [] }
          ]},
          { type: 'element', tag: 'elseif', attrs: { condition: { kind: 'expr', value: 'status === "success"' } }, children: [
            { type: 'element', tag: 'Text', attrs: {}, children: [{ type: 'text', value: 'OK' }] }
          ]},
          { type: 'element', tag: 'else', attrs: {}, children: [
            { type: 'element', tag: 'Text', attrs: {}, children: [{ type: 'text', value: 'ERR' }] }
          ]}
        ]
      }
    };
    const out = generateReactPage(page);
    expect(out).toContain('{status === "loading" ? (');
    expect(out).toContain(': status === "success" ? (');
    expect(out).toContain(': (');
  });
});
