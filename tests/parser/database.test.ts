import { parseLocus, LocusParserError } from '../../src/parser';
import { LocusFileAST } from '../../src/ast';

describe('Parser: database blocks', () => {
  test('single database block with one entity', () => {
    const src = `
      database {
        entity Customer {
          name: String
        }
      }
    `;
    const ast = parseLocus(src);
    const expected: LocusFileAST = {
      databases: [
        {
          type: 'database',
          entities: [
            {
              name: 'Customer',
              fields: [
                { name: 'name', type: { kind: 'primitive', name: 'String' }, attributes: [] },
              ],
              relations: [],
            },
          ],
        },
      ],
      designSystems: [],
      pages: [],
      components: [],
      stores: [],
    };
    expect(ast).toEqual(expected);
  });

  test('entity with all field types', () => {
    const src = `
      database {
        entity Example {
          a: String
          b: Text
          c: Integer
          d: Decimal
          e: Boolean
          f: DateTime
          g: Json
        }
      }
    `;
    const ast = parseLocus(src);
    const entity = ast.databases[0].entities[0];
    expect(entity.fields.map(f => ({ name: f.name, type: f.type }))).toEqual([
      { name: 'a', type: { kind: 'primitive', name: 'String' } },
      { name: 'b', type: { kind: 'primitive', name: 'Text' } },
      { name: 'c', type: { kind: 'primitive', name: 'Integer' } },
      { name: 'd', type: { kind: 'primitive', name: 'Decimal' } },
      { name: 'e', type: { kind: 'primitive', name: 'Boolean' } },
      { name: 'f', type: { kind: 'primitive', name: 'DateTime' } },
      { name: 'g', type: { kind: 'primitive', name: 'Json' } },
    ]);
  });

  test('entity with attributes and optional marker', () => {
    const src = `
      database {
        entity Product {
          sku: String (unique)
          description: Text
          price: Decimal (default: 0)
          imageUrl: String?
          createdAt: DateTime (default: now())
          isActive: Boolean (default: true)
          legacy: String (map: "legacy_col")
        }
      }
    `;
    const ast = parseLocus(src);
    const entity = ast.databases[0].entities[0];
    const attrKinds = entity.fields.reduce((acc, f) => {
      acc[f.name] = f.attributes.map(a => (a as any).kind);
      return acc;
    }, {} as Record<string, string[]>);
    expect(entity.fields.find(f => f.name === 'imageUrl')?.type).toEqual({ kind: 'primitive', name: 'String', optional: true });
    expect(attrKinds['sku']).toContain('unique');
    expect(attrKinds['price']).toContain('default');
    expect(attrKinds['createdAt']).toContain('default');
    expect(attrKinds['isActive']).toContain('default');
    expect(entity.fields.find(f => f.name === 'legacy')?.attributes).toEqual([{ kind: 'map', to: 'legacy_col' }]);
  });

  test('entity with relationships', () => {
    const src = `
      database {
        entity Customer {
          orders: has_many Order
        }
        entity Order {
          customer: belongs_to Customer
        }
        entity User {
          profile: has_one UserProfile
        }
        entity UserProfile {
          user: belongs_to User (unique)
        }
      }
    `;
  const ast = parseLocus(src);
  const byName = Object.fromEntries(ast.databases[0].entities.map(e => [e.name, e]));
  expect(byName['Customer'].relations[0]).toEqual({ name: 'orders', kind: 'has_many', target: 'Order', attributes: [] });
  expect(byName['Order'].relations[0]).toEqual({ name: 'customer', kind: 'belongs_to', target: 'Customer', attributes: [] });
  expect(byName['User'].relations[0]).toEqual({ name: 'profile', kind: 'has_one', target: 'UserProfile', attributes: [] });
  expect(byName['UserProfile'].relations[0]).toEqual({ name: 'user', kind: 'belongs_to', target: 'User', attributes: [{ kind: 'unique' }] });
  });

  test('multiple database blocks', () => {
    const src = `
      database { entity A { x: String } }
      database { entity B { y: Integer } }
    `;
  const ast = parseLocus(src);
  expect(ast.databases).toHaveLength(2);
  expect(ast.databases[0].entities[0].name).toBe('A');
  expect(ast.databases[1].entities[0].name).toBe('B');
  });

  test('invalid syntax throws', () => {
    const src = `
      database {
        entit Customer { // typo 'entit'
          name: String
        }
      }
    `;
    expect(() => parseLocus(src)).toThrow(LocusParserError);
  });
});
