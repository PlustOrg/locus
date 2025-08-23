import { generateReactPage } from '../../src/generator/react';

describe('Composite React page generation', () => {
  test('state + actions + onLoad + imports + control flow', () => {
    const page: any = {
      name: 'Dashboard',
      state: [ { name: 'items', default: '[]' }, { name: 'loading', default: 'true' } ],
      actions: [ { name: 'refresh', params: [], body: '/* refresh */' } ],
      onLoad: 'refresh();',
      ui: 'ui { <div><Stats /><if condition={loading}>Loading</if><else><li for:each={i in items}>{i}</li></else></div> }'
    };
    const code = generateReactPage(page, ['Stats']);
    expect(code).toContain('useEffect');
    expect(code).toContain('function refresh(');
    expect(code).toMatch(/items\.map/);
    expect(code).toMatch(/loading \? \(/);
    expect(code).toContain("import Stats from '../components/Stats'");
  });
});
