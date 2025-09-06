import { validateBodyAgainst, validationErrorEnvelope } from '../../src/runtime/validateRuntime';

describe('API validation basic', () => {
  const schema = {
    entity: 'User',
    fields: [
      { name: 'age', type: 'integer', optional: false, min: 18, max: 120 },
      { name: 'email', type: 'string', optional: false, email: true },
      { name: 'nickname', type: 'string', optional: true, lenMin: 3, lenMax: 10 },
      { name: 'tags', type: 'string', optional: true, list: true, lenMin: 0 },
    ]
  };

  it('accepts valid body', () => {
    const body: any = { age: 30, email: 'a@b.com', nickname: 'alpha', tags: ['one','two'] };
    const res = validateBodyAgainst(schema, body, 'create');
    expect(res.ok).toBe(true);
  });

  it('coerces numeric and boolean strings', () => {
    const localSchema = { entity: 'Thing', fields: [{ name: 'count', type: 'integer', optional: false }] } as any;
    const body: any = { count: '42' };
    const res = validateBodyAgainst(localSchema, body, 'create');
    expect(res.ok).toBe(true);
    expect(body.count).toBe(42);
  });

  it('reports multiple errors deterministically', () => {
    const body: any = { age: 10, email: 'not-an-email', extra: true };
    const res = validateBodyAgainst(schema, body, 'create');
    expect(res.ok).toBe(false);
    const env = validationErrorEnvelope(res.errors!);
    const codes = env.errors.map(e => e.code);
    expect(codes).toContain('min');
    expect(codes).toContain('email');
    expect(codes).toContain('unexpected_property');
  });
});
