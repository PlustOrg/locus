import { PError } from '../../src/errors';

describe('Quick fix scaffold', () => {
  test('LocusError can carry quickFixes array', () => {
    const e = new PError("Unexpected token 'elsif'");
    (e as any).quickFixes = [{ title: 'Replace with elseif', replacement: 'elseif', range: { line: 1, column: 5, length: 5 } }];
    expect(Array.isArray((e as any).quickFixes)).toBe(true);
    expect((e as any).quickFixes[0].replacement).toBe('elseif');
  });
});
