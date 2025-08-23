import { generateReactComponent } from '../../src/generator/react';

describe('UI AST nested conditionals inside loops', () => {
  test('forEach containing if chain', () => {
    const comp: any = { name: 'Nested', ui: 'ui { <div for:each={item in items}><if condition={item.show}>{item.value}</if><else>{item.alt}</else></div> }', params: [] };
    const code = generateReactComponent(comp, []);
    expect(code).toMatch(/items\.map/);
    expect(code).toMatch(/item\.show \? \(/);
  });
});
