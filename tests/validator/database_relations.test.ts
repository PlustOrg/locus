import { VError } from '../../src/errors';
import { validateUnifiedAst } from '../../src/validator/validate';

describe('Database relation validation', () => {
  test('belongs_to missing foreign key', () => {
    const ast: any = {
      designSystem: {},
      database: { entities: [ { name: 'Post', fields: [ { name: 'id' } ], relations: [ { name: 'author', kind: 'belongs_to', target: 'User', attributes: [] } ] } ] }
    };
    expect(() => validateUnifiedAst(ast)).toThrow(VError);
  });
  test('duplicate field name', () => {
  const ast: any = { designSystem: {}, database: { entities: [ { name: 'User', fields: [ { name: 'id' }, { name: 'id' } ], relations: [] } ] } };
    expect(() => validateUnifiedAst(ast)).toThrow(VError);
  });
});
