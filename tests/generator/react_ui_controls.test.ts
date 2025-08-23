import { generateReactComponent } from '../../src/generator/react';

describe('React UI transformations', () => {
  test('if/elseif/else chain', () => {
    const comp: any = { name: 'Cond', ui: 'ui { <if condition={a}>{a}</if><elseif condition={b}>{b}</elseif><else>{c}</else> }', params: [] };
    const code = generateReactComponent(comp, []);
    expect(code).toMatch(/a \? \(/);
    expect(code).toContain(': b ?');
    expect(code).toContain(': (\n{c}\n)');
  });
  test('for:each list rendering', () => {
    const comp: any = { name: 'List', ui: 'ui { <li for:each={item in items}/> }', params: [] };
    const code = generateReactComponent(comp, []);
    expect(code).toMatch(/items\.map\(\(item, index\)/);
  });
  test('bind:value transforms to value+onChange', () => {
    const comp: any = { name: 'Input', state: [ { name: 'text', default: '""' } ], ui: 'ui { <input bind:value={text}/>}'};
    const code = generateReactComponent(comp, []);
    expect(code).toContain('value={text} onChange={(e) => setText(e.target.value)}');
  });
});
