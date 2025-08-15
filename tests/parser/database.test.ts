import { parseLocus, LocusParserError } from '../../src/parser';

describe('Parser: database blocks', () => {
  test('single database block with one entity', () => {
    const src = `
      database {
        entity Customer {
          name: String
        }
      }
    `;
    expect(() => parseLocus(src)).toThrow(LocusParserError);
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
    expect(() => parseLocus(src)).toThrow(LocusParserError);
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
    expect(() => parseLocus(src)).toThrow(LocusParserError);
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
    expect(() => parseLocus(src)).toThrow(LocusParserError);
  });

  test('multiple database blocks', () => {
    const src = `
      database { entity A { x: String } }
      database { entity B { y: Integer } }
    `;
    expect(() => parseLocus(src)).toThrow(LocusParserError);
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
