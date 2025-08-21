import { parseLocus } from '../../src/parser';

function catchErr(src: string) {
  try {
    parseLocus(src);
  } catch (e: any) {
    return e;
  }
  throw new Error('Expected parse to fail');
}

describe('Parser error spans', () => {
  test('missing colon between name and type (Colon)', () => {
    const e = catchErr(`database { entity User { name String } }`);
    expect(String(e.message)).toMatch(/Expecting: one of these possible Token sequences:[\s\S]*Colon/);
    expect(typeof e.length).toBe('number');
    expect(e.length).toBeGreaterThanOrEqual(1);
  });

  test('missing LCurly after page name', () => {
    const e = catchErr(`page Home ui { <div/> }`);
    expect(String(e.message)).toMatch(/LCurly|\{/);
    expect(typeof e.length).toBe('number');
  });

  test('unexpected Identifier location sanity', () => {
    const e = catchErr(`database { entity { } }`);
    expect(String(e.message)).toMatch(/Identifier/);
    expect(typeof e.length).toBe('number');
  });
});
