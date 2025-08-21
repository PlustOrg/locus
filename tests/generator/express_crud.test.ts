import { generateExpressApi } from '../../src/generator/express';

describe('Express API generation - CRUD', () => {
  test('generates CRUD handlers for entities', () => {
    const entities = [
      { name: 'Customer', fields: [], relations: [] },
    ];
    const files = generateExpressApi(entities as any);
    const route = files['routes/customer.ts'];
  expect(route).toContain("router.get('/customer', async");
  expect(route).toContain("router.get('/customer/:id', async");
  expect(route).toContain("router.post('/customer', async");
  expect(route).toContain("router.put('/customer/:id', async");
  expect(route).toContain("router.delete('/customer/:id', async");
    expect(route).toContain('prisma.customer.findMany');
    expect(route).toContain('prisma.customer.findUnique');
    expect(route).toContain('prisma.customer.create');
    expect(route).toContain('prisma.customer.update');
    expect(route).toContain('prisma.customer.delete');
  });
});
