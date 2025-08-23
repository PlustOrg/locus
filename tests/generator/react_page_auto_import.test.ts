import { generateReactPage } from '../../src/generator/react';

describe('React page auto component imports', () => {
  test('imports used component', () => {
    const page: any = { name: 'Home', state: [], ui: 'ui { <div><Hero /></div> }' };
    const code = generateReactPage(page, ['Hero']);
    expect(code).toContain("import Hero from '../components/Hero'");
  });
  test('does not import self', () => {
    const page: any = { name: 'Hero', state: [], ui: 'ui { <div><Hero /></div> }' };
    const code = generateReactPage(page, ['Hero']);
    // Should not import itself
    expect(code).not.toMatch(/import Hero from/);
  });
});
