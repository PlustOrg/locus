import { generateReactPage } from '../../src/generator/react';

describe('React page duplicate imports', () => {
  test('component used multiple times only imports once', () => {
    const page: any = { name: 'Home', state: [], ui: 'ui { <div><Hero /><Hero /><Hero /></div> }' };
    const code = generateReactPage(page, ['Hero']);
    const lines = code.split(/\n/).filter(l => /import Hero from/.test(l));
    expect(lines.length).toBe(1);
  });
});
