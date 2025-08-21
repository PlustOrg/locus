import { generateExpressApi } from '../../src/generator/express';

test('pluralized routes', () => {
  const entities: any = [ { name: 'User', fields: [], relations: [] }, { name: 'Category', fields: [], relations: [] } ];
  const files = generateExpressApi(entities, { pluralizeRoutes: true });
  const user = files['routes/user.ts'];
  const cat = files['routes/category.ts'];
  expect(user).toContain("GET /users");
  expect(user).toContain("router.get('/users'");
  expect(cat).toContain("GET /categories");
  expect(cat).toContain("router.get('/categories'");
  const server = files['server.ts'];
  expect(server).toContain("app.use('/users'");
  expect(server).toContain("app.use('/categories'");
});
