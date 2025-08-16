import { mergeAsts, MergeError } from '../../src/parser/merger';

describe('Merging features duplicate detection', () => {
  test('throws on duplicate page names', () => {
    const files: any = [
      { pages: [{ name: 'Home' }], components: [], stores: [], databases: [], designSystems: [] },
      { pages: [{ name: 'Home' }], components: [], stores: [], databases: [], designSystems: [] }
    ];
    expect(() => mergeAsts(files)).toThrow(MergeError);
  });
  test('throws on duplicate component names', () => {
    const files: any = [
      { pages: [], components: [{ name: 'Card' }], stores: [], databases: [], designSystems: [] },
      { pages: [], components: [{ name: 'Card' }], stores: [], databases: [], designSystems: [] }
    ];
    expect(() => mergeAsts(files)).toThrow(MergeError);
  });
  test('throws on duplicate store names', () => {
    const files: any = [
      { pages: [], components: [], stores: [{ name: 'S' }], databases: [], designSystems: [] },
      { pages: [], components: [], stores: [{ name: 'S' }], databases: [], designSystems: [] }
    ];
    expect(() => mergeAsts(files)).toThrow(MergeError);
  });
});
