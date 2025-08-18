import { generateReactPage } from '../../src/generator/react';
import { generateExpressApi } from '../../src/generator/express';

describe('Generator snapshots', () => {
  test('React page snapshot', () => {
    const page: any = { name: 'Home', state: [{ name: 'greeting', default: '"Hello"' }], ui: 'ui { <div>{greeting}</div> }' };
    const out = generateReactPage(page);
    expect(out).toMatchSnapshot();
  });

  test('Express routes snapshot', () => {
    const entities: any = [{ name: 'User', fields: [], relations: [] }];
    const out = generateExpressApi(entities);
    const file = out['routes/user.ts'];
    expect(file).toMatchSnapshot();
  });
});
