import { mergeAsts } from '../../src/parser/merger';

describe('Merge duplicate errors include location', () => {
  test('entity duplicate includes file and line/column when available', () => {
    const a: any = { databases: [{ entities: [{ name: 'User', fields: [], relations: [], nameLoc: { line: 2, column: 10 } }] }], designSystems: [], pages: [], components: [], stores: [], sourceFile: 'a.locus' };
    const b: any = { databases: [{ entities: [{ name: 'User', fields: [], relations: [], nameLoc: { line: 3, column: 5 } }] }], designSystems: [], pages: [], components: [], stores: [], sourceFile: 'b.locus' };
    try {
      mergeAsts([a, b]);
      throw new Error('expected duplicate error');
    } catch (e: any) {
      expect(e.filePath === 'a.locus' || e.filePath === 'b.locus').toBe(true);
      expect(typeof e.line).toBe('number');
      expect(typeof e.column).toBe('number');
    }
  });
});
