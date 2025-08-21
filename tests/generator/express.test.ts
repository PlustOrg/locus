import { generateExpressApi } from '../../src/generator/express';

describe('Express API generation', () => {
  test('generates CRUD routes for basic entities', () => {
    const entities = [
      { name: 'Customer', fields: [], relations: [] },
      { name: 'Order', fields: [], relations: [] },
    ];
    const files = generateExpressApi(entities as any);
  expect(files['routes/customer.ts']).toContain("router.get('/customer', async");
  expect(files['routes/order.ts']).toContain("router.get('/order', async");
    expect(files['routes/customer.ts']).toContain('prisma.customer.findMany');
  });
});
