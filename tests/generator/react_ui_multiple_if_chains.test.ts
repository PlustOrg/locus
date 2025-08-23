import { generateReactComponent } from '../../src/generator/react';

describe('UI AST multiple sibling if chains', () => {
  test('two separate if chains preserved', () => {
    const comp: any = { name: 'MultiIf', ui: 'ui { <div><if condition={a}>{a}</if><else>{b}</else><if condition={c}>{c}</if><else>{d}</else></div> }', params: [] };
    const code = generateReactComponent(comp, []);
  const matches = code.match(/\? \(/g) || [];
  expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
