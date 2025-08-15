import { generateExpressApi } from '../../src/generator/express';

describe('Express API generation - CRUD', () => {
  test('generates CRUD handlers for entities', () => {
    const entities = [
      { name: 'Customer', fields: [], relations: [] },
    ];
    const files = generateExpressApi(entities as any);
    const route = files['routes/customer.ts'];
    expect(route).toContain("router.get('/customer')");
    expect(route).toContain("router.get('/customer/:id')");
    expect(route).toContain("router.post('/customer')");
    expect(route).toContain("router.put('/customer/:id')");
    expect(route).toContain("router.delete('/customer/:id')");
    expect(route).toContain('prisma.customer.findMany');
    expect(route).toContain('prisma.customer.findUnique');
    expect(route).toContain('prisma.customer.create');
    expect(route).toContain('prisma.customer.update');
    expect(route).toContain('prisma.customer.delete');
  });
});
